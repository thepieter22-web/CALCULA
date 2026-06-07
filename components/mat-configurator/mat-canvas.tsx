"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { MAT_COLORS, type MatConfig } from "@/lib/mat-config";
import { Button } from "@/components/ui/button";
import { RotateCw, ZoomIn, Move, Trash2, Crosshair } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface MatCanvasProps {
  config: MatConfig;
  onLogoUpdate: (updates: Partial<MatConfig["logo"]>) => void;
}

type TextureSet = {
  base: HTMLImageElement | null;
  soft: HTMLImageElement | null;
  noise: HTMLImageElement | null;
};

type CanvasLayout = {
  frameThickness: number;
  borderPx: number;
  canvasOuterRadius: number;
  matOuterRadius: number;
  innerRadius: number;
  outerX: number;
  outerY: number;
  outerW: number;
  outerH: number;
  innerX: number;
  innerY: number;
  innerW: number;
  innerH: number;
};

const TEXTURES = {
  base: "/textures/mat-base.png",
  soft: "/textures/mat-soft.png",
  noise: "/textures/noise.png",
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const normalized =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;

  const bigint = parseInt(normalized, 16);

  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

function mixHex(colorA: string, colorB: string, amount: number) {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);

  return rgbToHex(
    a.r + (b.r - a.r) * amount,
    a.g + (b.g - a.g) * amount,
    a.b + (b.b - a.b) * amount
  );
}

function darkenHex(color: string, amount = 0.12) {
  return mixHex(color, "#000000", amount);
}

function lightenHex(color: string, amount = 0.12) {
  return mixHex(color, "#ffffff", amount);
}

function muteHex(color: string) {
  return mixHex(mixHex(color, "#707070", 0.06), "#000000", 0.03);
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function createScaledPattern(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  scale = 1
) {
  const offscreen = document.createElement("canvas");
  offscreen.width = Math.max(8, Math.round(image.width * scale));
  offscreen.height = Math.max(8, Math.round(image.height * scale));

  const offCtx = offscreen.getContext("2d");
  if (!offCtx) return null;

  offCtx.imageSmoothingEnabled = true;
  offCtx.imageSmoothingQuality = "high";
  offCtx.drawImage(image, 0, 0, offscreen.width, offscreen.height);

  return ctx.createPattern(offscreen, "repeat");
}

function getRenderedLogoSize(
  image: HTMLImageElement | HTMLCanvasElement,
  scale: number,
  innerWidth: number,
  innerHeight: number
) {
  const aspect = image.width / image.height;
  const baseSize = Math.min(innerWidth, innerHeight) * 0.42 * scale;

  let width: number;
  let height: number;

  if (aspect >= 1) {
    width = baseSize;
    height = baseSize / aspect;
  } else {
    height = baseSize;
    width = baseSize * aspect;
  }

  const maxWidth = innerWidth * 0.88;
  const maxHeight = innerHeight * 0.88;

  if (width > maxWidth) {
    const ratio = maxWidth / width;
    width *= ratio;
    height *= ratio;
  }

  if (height > maxHeight) {
    const ratio = maxHeight / height;
    width *= ratio;
    height *= ratio;
  }

  return { width, height };
}

function isNearWhite(r: number, g: number, b: number, threshold = 245) {
  return r >= threshold && g >= threshold && b >= threshold;
}

function findOpaqueBounds(
  imageData: ImageData,
  alphaThreshold = 8
): { left: number; top: number; right: number; bottom: number } | null {
  const { data, width, height } = imageData;

  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const a = data[i + 3];
      if (a > alphaThreshold) {
        if (x < left) left = x;
        if (y < top) top = y;
        if (x > right) right = x;
        if (y > bottom) bottom = y;
      }
    }
  }

  if (right === -1 || bottom === -1) return null;
  return { left, top, right, bottom };
}

function hasLikelyWhiteBackground(image: HTMLImageElement) {
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = Math.min(32, image.width);
  sampleCanvas.height = Math.min(32, image.height);

  const ctx = sampleCanvas.getContext("2d");
  if (!ctx) return false;

  ctx.drawImage(image, 0, 0, sampleCanvas.width, sampleCanvas.height);
  const { data, width, height } = ctx.getImageData(
    0,
    0,
    sampleCanvas.width,
    sampleCanvas.height
  );

  const points: [number, number][] = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
    [Math.floor(width / 2), 0],
    [0, Math.floor(height / 2)],
    [width - 1, Math.floor(height / 2)],
    [Math.floor(width / 2), height - 1],
  ];

  let whiteHits = 0;

  for (const [x, y] of points) {
    const i = (y * width + x) * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a > 200 && isNearWhite(r, g, b, 245)) {
      whiteHits++;
    }
  }

  return whiteHits >= 5;
}

function applyCanvasNoise(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount = 6
) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 8) continue;

    const noise = (Math.random() - 0.5) * amount;
    data[i] = clamp(data[i] + noise, 0, 255);
    data[i + 1] = clamp(data[i + 1] + noise, 0, 255);
    data[i + 2] = clamp(data[i + 2] + noise, 0, 255);
  }

  ctx.putImageData(imageData, 0, 0);
}

function softenPureWhites(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 8) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (r > 235 && g > 235 && b > 235) {
      data[i] = 228;
      data[i + 1] = 228;
      data[i + 2] = 228;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function createPreparedLogoCanvas(image: HTMLImageElement) {
  const offscreen = document.createElement("canvas");
  offscreen.width = image.width;
  offscreen.height = image.height;

  const ctx = offscreen.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, offscreen.width, offscreen.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, 0, 0);

  const removeWhiteBg = hasLikelyWhiteBackground(image);

  const imageData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a < 8) {
      data[i + 3] = 0;
      continue;
    }

    if (removeWhiteBg && isNearWhite(r, g, b, 245)) {
      data[i + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // Wit wat zachter maken zodat het minder “stickerachtig” oogt
  softenPureWhites(ctx, offscreen.width, offscreen.height);

  const bounds = findOpaqueBounds(
    ctx.getImageData(0, 0, offscreen.width, offscreen.height),
    8
  );
  if (!bounds) return offscreen;

  const pad = 2;
  const sx = Math.max(0, bounds.left - pad);
  const sy = Math.max(0, bounds.top - pad);
  const sw = Math.min(
    offscreen.width - sx,
    bounds.right - bounds.left + 1 + pad * 2
  );
  const sh = Math.min(
    offscreen.height - sy,
    bounds.bottom - bounds.top + 1 + pad * 2
  );

  const cropped = document.createElement("canvas");
  cropped.width = sw;
  cropped.height = sh;

  const croppedCtx = cropped.getContext("2d");
  if (!croppedCtx) return offscreen;

  croppedCtx.clearRect(0, 0, sw, sh);
  croppedCtx.imageSmoothingEnabled = true;
  croppedCtx.imageSmoothingQuality = "high";
  croppedCtx.drawImage(offscreen, sx, sy, sw, sh, 0, 0, sw, sh);

  return cropped;
}

function createPrintedLogoCanvas(
  source: HTMLCanvasElement,
  textureBase: HTMLImageElement | null,
  textureSoft: HTMLImageElement | null,
  textureNoise: HTMLImageElement | null
) {
  const printed = document.createElement("canvas");
  printed.width = source.width;
  printed.height = source.height;

  const ctx = printed.getContext("2d");
  if (!ctx) return source;

  ctx.clearRect(0, 0, printed.width, printed.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // 1) Basislogo
  ctx.globalAlpha = 0.96;
  ctx.drawImage(source, 0, 0);

  // 2) Mask van enkel de echte logo-vorm
  const mask = document.createElement("canvas");
  mask.width = source.width;
  mask.height = source.height;
  const maskCtx = mask.getContext("2d");
  if (!maskCtx) return source;

  maskCtx.clearRect(0, 0, mask.width, mask.height);
  maskCtx.drawImage(source, 0, 0);

  // 3) Subtiele lichte wash binnen logo
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fillRect(0, 0, printed.width, printed.height);
  ctx.restore();

  // 4) Subtiele donkere wash binnen logo
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = "rgba(0,0,0,0.05)";
  ctx.fillRect(0, 0, printed.width, printed.height);
  ctx.restore();

  // 5) Basismattextuur - enkel binnen de logo-vorm
  if (textureBase) {
    const overlay = document.createElement("canvas");
    overlay.width = source.width;
    overlay.height = source.height;
    const overlayCtx = overlay.getContext("2d");

    if (overlayCtx) {
      const pattern = createScaledPattern(overlayCtx, textureBase, 0.24);
      if (pattern) {
        overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
        overlayCtx.fillStyle = pattern;
        overlayCtx.fillRect(0, 0, overlay.width, overlay.height);

        overlayCtx.globalCompositeOperation = "destination-in";
        overlayCtx.drawImage(mask, 0, 0);

        ctx.save();
        ctx.globalAlpha = 0.14;
        ctx.globalCompositeOperation = "multiply";
        ctx.drawImage(overlay, 0, 0);
        ctx.restore();
      }
    }
  }

  // 6) Zachte extra textuur - subtiel en enkel binnen logo
  if (textureSoft) {
    const overlay = document.createElement("canvas");
    overlay.width = source.width;
    overlay.height = source.height;
    const overlayCtx = overlay.getContext("2d");

    if (overlayCtx) {
      const pattern = createScaledPattern(overlayCtx, textureSoft, 0.28);
      if (pattern) {
        overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
        overlayCtx.fillStyle = pattern;
        overlayCtx.fillRect(0, 0, overlay.width, overlay.height);

        overlayCtx.globalCompositeOperation = "destination-in";
        overlayCtx.drawImage(mask, 0, 0);

        ctx.save();
        ctx.globalAlpha = 0.08;
        ctx.globalCompositeOperation = "multiply";
        ctx.drawImage(overlay, 0, 0);
        ctx.restore();
      }
    }
  }

  // 7) Fijne noise - enkel binnen logo
  if (textureNoise) {
    const overlay = document.createElement("canvas");
    overlay.width = source.width;
    overlay.height = source.height;
    const overlayCtx = overlay.getContext("2d");

    if (overlayCtx) {
      const pattern = createScaledPattern(overlayCtx, textureNoise, 0.16);
      if (pattern) {
        overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
        overlayCtx.fillStyle = pattern;
        overlayCtx.fillRect(0, 0, overlay.width, overlay.height);

        overlayCtx.globalCompositeOperation = "destination-in";
        overlayCtx.drawImage(mask, 0, 0);

        ctx.save();
        ctx.globalAlpha = 0.05;
        ctx.globalCompositeOperation = "multiply";
        ctx.drawImage(overlay, 0, 0);
        ctx.restore();
      }
    }
  }

  // 8) Verticale shading binnen het logo
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  const fade = ctx.createLinearGradient(0, 0, 0, printed.height);
  fade.addColorStop(0, "rgba(255,255,255,0.03)");
  fade.addColorStop(0.45, "rgba(255,255,255,0)");
  fade.addColorStop(1, "rgba(0,0,0,0.08)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, printed.width, printed.height);
  ctx.restore();

  // 9) Mini noise op effectieve logopixels
  applyCanvasNoise(ctx, printed.width, printed.height, 4);

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  return printed;
}

function getFrameThickness(
  canvasWidth: number,
  canvasHeight: number,
  isFramePlacement: boolean
) {
  return isFramePlacement
    ? clamp(Math.min(canvasWidth, canvasHeight) * 0.035, 12, 24)
    : 0;
}

function getCanvasLayout(params: {
  canvasWidth: number;
  canvasHeight: number;
  displayWidth: number;
  borderThickness: number;
  isFramePlacement: boolean;
}): CanvasLayout {
  const {
    canvasWidth,
    canvasHeight,
    displayWidth,
    borderThickness,
    isFramePlacement,
  } = params;

  const frameThickness = getFrameThickness(
    canvasWidth,
    canvasHeight,
    isFramePlacement
  );

  const matAreaWidth = canvasWidth - frameThickness * 2;
  const scale = matAreaWidth / displayWidth;
  const rawBorderPx = borderThickness * scale;

  const outerX = frameThickness;
  const outerY = frameThickness;
  const outerW = canvasWidth - frameThickness * 2;
  const outerH = canvasHeight - frameThickness * 2;

  const maxAllowedBorder = Math.min(outerW, outerH) * 0.24;
  const borderPx = clamp(rawBorderPx, 0, maxAllowedBorder);

  const innerX = outerX + borderPx;
  const innerY = outerY + borderPx;
  const innerW = outerW - borderPx * 2;
  const innerH = outerH - borderPx * 2;

  const canvasOuterRadius = isFramePlacement
    ? 0
    : Math.max(8, Math.min(canvasWidth, canvasHeight) * 0.018);

  const matOuterRadius = isFramePlacement ? 0 : Math.max(6, canvasOuterRadius - 2);
  const innerRadius = isFramePlacement ? 0 : Math.max(5, matOuterRadius - 2);

  return {
    frameThickness,
    borderPx,
    canvasOuterRadius,
    matOuterRadius,
    innerRadius,
    outerX,
    outerY,
    outerW,
    outerH,
    innerX,
    innerY,
    innerW,
    innerH,
  };
}

export function MatCanvas({ config, onLogoUpdate }: MatCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });
  const [pixelRatio, setPixelRatio] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [textures, setTextures] = useState<TextureSet>({
    base: null,
    soft: null,
    noise: null,
  });

  const { width: matWidth, height: matHeight } = config.size;
  const isLandscape = config.orientation === "landscape";
  const isFramePlacement = config.placement === "frame";

  const displayWidth = isLandscape
    ? Math.max(matWidth, matHeight)
    : Math.min(matWidth, matHeight);

  const displayHeight = isLandscape
    ? Math.min(matWidth, matHeight)
    : Math.max(matWidth, matHeight);

  const borderThickness = config.rubberBorder ? 2 : 0;

  const selectedMatColor = useMemo(() => {
    return MAT_COLORS.find((c) => c.code === config.colorCode)?.hex || "#4a4a4a";
  }, [config.colorCode]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    }
  }, []);

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.clientWidth;
      const maxHeight = 500;
      const aspectRatio = displayWidth / displayHeight;

      let matWidthPx = containerWidth - 32;
      let matHeightPx = matWidthPx / aspectRatio;

      if (matHeightPx > maxHeight) {
        matHeightPx = maxHeight;
        matWidthPx = matHeightPx * aspectRatio;
      }

      const estimatedFrameThickness = isFramePlacement
        ? clamp(Math.min(matWidthPx, matHeightPx) * 0.035, 12, 24)
        : 0;

      const totalWidth = matWidthPx + estimatedFrameThickness * 2;
      const totalHeight = matHeightPx + estimatedFrameThickness * 2;

      setCanvasSize({
        width: Math.max(280, Math.round(totalWidth)),
        height: Math.max(180, Math.round(totalHeight)),
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [displayWidth, displayHeight, isFramePlacement]);

  useEffect(() => {
    let mounted = true;

    if (config.logo.dataUrl) {
      loadImage(config.logo.dataUrl)
        .then((img) => {
          if (mounted) setLogoImage(img);
        })
        .catch(() => {
          if (mounted) setLogoImage(null);
        });
    } else {
      setLogoImage(null);
    }

    return () => {
      mounted = false;
    };
  }, [config.logo.dataUrl]);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      loadImage(TEXTURES.base).catch(() => null),
      loadImage(TEXTURES.soft).catch(() => null),
      loadImage(TEXTURES.noise).catch(() => null),
    ]).then(([base, soft, noise]) => {
      if (!mounted) return;
      setTextures({ base, soft, noise });
    });

    return () => {
      mounted = false;
    };
  }, []);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvasSize.width;
    const height = canvasSize.height;

    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const layout = getCanvasLayout({
      canvasWidth: width,
      canvasHeight: height,
      displayWidth,
      borderThickness,
      isFramePlacement,
    });

    const {
      frameThickness,
      canvasOuterRadius,
      matOuterRadius,
      innerRadius,
      outerX,
      outerY,
      outerW,
      outerH,
      innerX,
      innerY,
      innerW,
      innerH,
    } = layout;

    const baseColor = muteHex(selectedMatColor);
    const topColor = lightenHex(baseColor, 0.06);
    const bottomColor = darkenHex(baseColor, 0.1);

    // Vrijliggende schaduw alleen voor gewone floor placement
    if (!isFramePlacement) {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.18)";
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 10;
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      roundedRectPath(
        ctx,
        outerX + 4,
        outerY + 4,
        outerW - 8,
        outerH - 8,
        matOuterRadius
      );
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.08)";
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = "rgba(0,0,0,0.025)";
      roundedRectPath(
        ctx,
        outerX + 10,
        outerY + 10,
        outerW - 20,
        outerH - 20,
        matOuterRadius
      );
      ctx.fill();
      ctx.restore();
    }

    // In-floor frame buiten de mat
    if (isFramePlacement) {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.14)";
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = "rgba(0,0,0,0.05)";
      roundedRectPath(ctx, 1, 1, width - 2, height - 2, canvasOuterRadius);
      ctx.fill();
      ctx.restore();

      const frameGradient = ctx.createLinearGradient(0, 0, width, height);
      frameGradient.addColorStop(0, "#f2f2f2");
      frameGradient.addColorStop(0.16, "#d6d6d6");
      frameGradient.addColorStop(0.5, "#a3a3a3");
      frameGradient.addColorStop(0.82, "#d9d9d9");
      frameGradient.addColorStop(1, "#f7f7f7");

      ctx.save();
      roundedRectPath(ctx, 0, 0, width, height, canvasOuterRadius);
      ctx.fillStyle = frameGradient;
      ctx.fill();

      if (textures.noise) {
        const metalNoise = createScaledPattern(ctx, textures.noise, 0.22);
        if (metalNoise) {
          ctx.globalAlpha = 0.04;
          ctx.fillStyle = metalNoise;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 1;
      roundedRectPath(ctx, 0.5, 0.5, width - 1, height - 1, canvasOuterRadius);
      ctx.stroke();

      ctx.strokeStyle = "rgba(90,90,90,0.45)";
      ctx.lineWidth = 1;
      roundedRectPath(ctx, 1.5, 1.5, width - 3, height - 3, canvasOuterRadius);
      ctx.stroke();
      ctx.restore();

      const recessInset = clamp(frameThickness * 0.14, 2, 4);
      const recessX = outerX - recessInset;
      const recessY = outerY - recessInset;
      const recessW = outerW + recessInset * 2;
      const recessH = outerH + recessInset * 2;

      const recessGradient = ctx.createLinearGradient(
        recessX,
        recessY,
        recessX,
        recessY + recessH
      );
      recessGradient.addColorStop(0, "rgba(55,55,55,0.34)");
      recessGradient.addColorStop(0.35, "rgba(25,25,25,0.12)");
      recessGradient.addColorStop(1, "rgba(0,0,0,0.24)");

      ctx.save();
      roundedRectPath(ctx, recessX, recessY, recessW, recessH, 0);
      ctx.fillStyle = recessGradient;
      ctx.fill();
      ctx.restore();

      ctx.save();
      roundedRectPath(
        ctx,
        recessX + 0.5,
        recessY + 0.5,
        recessW - 1,
        recessH - 1,
        0
      );
      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    // Rubber border
    if (config.rubberBorder) {
      const rubberGradient = ctx.createLinearGradient(0, outerY, 0, outerY + outerH);
      rubberGradient.addColorStop(0, "#2a2a2a");
      rubberGradient.addColorStop(0.5, "#161616");
      rubberGradient.addColorStop(1, "#101010");

      ctx.save();
      roundedRectPath(ctx, outerX, outerY, outerW, outerH, matOuterRadius);
      ctx.fillStyle = rubberGradient;
      ctx.fill();

      if (textures.noise) {
        const noisePattern = createScaledPattern(ctx, textures.noise, 0.25);
        if (noisePattern) {
          ctx.globalAlpha = 0.05;
          ctx.fillStyle = noisePattern;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      roundedRectPath(
        ctx,
        outerX + 0.5,
        outerY + 0.5,
        outerW - 1,
        outerH - 1,
        matOuterRadius
      );
      ctx.stroke();

      ctx.restore();
    }

    // Matoppervlak
    ctx.save();
    roundedRectPath(ctx, innerX, innerY, innerW, innerH, innerRadius);
    ctx.clip();

    const matGradient = ctx.createLinearGradient(innerX, innerY, innerX, innerY + innerH);
    matGradient.addColorStop(0, topColor);
    matGradient.addColorStop(0.5, baseColor);
    matGradient.addColorStop(1, bottomColor);
    ctx.fillStyle = matGradient;
    ctx.fillRect(innerX, innerY, innerW, innerH);

    const sideLight = ctx.createLinearGradient(innerX, innerY, innerX + innerW, innerY);
    sideLight.addColorStop(0, "rgba(255,255,255,0.03)");
    sideLight.addColorStop(0.4, "rgba(255,255,255,0.01)");
    sideLight.addColorStop(1, "rgba(0,0,0,0.04)");
    ctx.fillStyle = sideLight;
    ctx.fillRect(innerX, innerY, innerW, innerH);

    if (textures.base) {
      const pattern = createScaledPattern(ctx, textures.base, 0.35);
      if (pattern) {
        ctx.globalAlpha = 0.11;
        ctx.fillStyle = pattern;
        ctx.fillRect(innerX, innerY, innerW, innerH);
        ctx.globalAlpha = 1;
      }
    }

    if (textures.soft) {
      const pattern = createScaledPattern(ctx, textures.soft, 0.42);
      if (pattern) {
        ctx.globalAlpha = 0.07;
        ctx.fillStyle = pattern;
        ctx.fillRect(innerX, innerY, innerW, innerH);
        ctx.globalAlpha = 1;
      }
    }

    if (textures.noise) {
      const pattern = createScaledPattern(ctx, textures.noise, 0.18);
      if (pattern) {
        ctx.globalAlpha = 0.025;
        ctx.fillStyle = pattern;
        ctx.fillRect(innerX, innerY, innerW, innerH);
        ctx.globalAlpha = 1;
      }
    }

    const pileGradient = ctx.createLinearGradient(innerX, innerY, innerX, innerY + innerH);
    pileGradient.addColorStop(0, "rgba(255,255,255,0.03)");
    pileGradient.addColorStop(0.2, "rgba(255,255,255,0.01)");
    pileGradient.addColorStop(1, "rgba(0,0,0,0.05)");
    ctx.fillStyle = pileGradient;
    ctx.fillRect(innerX, innerY, innerW, innerH);

    // Logo
    if (logoImage && config.logo.dataUrl) {
      const preparedLogo = createPreparedLogoCanvas(logoImage);

      if (preparedLogo) {
        const printedLogo = createPrintedLogoCanvas(
          preparedLogo,
          textures.base,
          textures.soft,
          textures.noise
        );

        const { width: logoWidth, height: logoHeight } = getRenderedLogoSize(
          printedLogo,
          config.logo.scale,
          innerW,
          innerH
        );

        const logoCenterX = innerX + innerW * config.logo.position.x;
        const logoCenterY = innerY + innerH * config.logo.position.y;

        ctx.save();
        ctx.translate(logoCenterX, logoCenterY);
        ctx.rotate((config.logo.rotation * Math.PI) / 180);
        ctx.globalAlpha = 0.96;
        ctx.filter = "none";
        ctx.globalCompositeOperation = "source-over";
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.drawImage(
          printedLogo,
          -logoWidth / 2,
          -logoHeight / 2,
          logoWidth,
          logoHeight
        );

        ctx.restore();
      }
    }

    ctx.restore();

    // Diepte op matoppervlak
    ctx.save();
    roundedRectPath(ctx, innerX, innerY, innerW, innerH, innerRadius);
    ctx.clip();

    const edgeSize = Math.max(10, Math.min(innerW, innerH) * 0.035);

    const topEdge = ctx.createLinearGradient(0, innerY, 0, innerY + edgeSize);
    topEdge.addColorStop(0, "rgba(255,255,255,0.05)");
    topEdge.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = topEdge;
    ctx.fillRect(innerX, innerY, innerW, edgeSize);

    const bottomEdge = ctx.createLinearGradient(
      0,
      innerY + innerH - edgeSize,
      0,
      innerY + innerH
    );
    bottomEdge.addColorStop(0, "rgba(0,0,0,0)");
    bottomEdge.addColorStop(1, "rgba(0,0,0,0.10)");
    ctx.fillStyle = bottomEdge;
    ctx.fillRect(innerX, innerY + innerH - edgeSize, innerW, edgeSize);

    const rightEdge = ctx.createLinearGradient(
      innerX + innerW - edgeSize,
      0,
      innerX + innerW,
      0
    );
    rightEdge.addColorStop(0, "rgba(0,0,0,0)");
    rightEdge.addColorStop(1, "rgba(0,0,0,0.06)");
    ctx.fillStyle = rightEdge;
    ctx.fillRect(innerX + innerW - edgeSize, innerY, edgeSize, innerH);

    ctx.restore();

    // Fijne outline
    ctx.save();
    ctx.strokeStyle = isFramePlacement
      ? "rgba(255,255,255,0.02)"
      : "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    roundedRectPath(ctx, innerX + 0.5, innerY + 0.5, innerW - 1, innerH - 1, innerRadius);
    ctx.stroke();
    ctx.restore();

    // Ingezonken schaduw in frame mode
    if (isFramePlacement) {
      ctx.save();
      roundedRectPath(ctx, outerX, outerY, outerW, outerH, 0);
      ctx.clip();

      const insetShade = ctx.createLinearGradient(
        0,
        outerY,
        0,
        outerY + Math.max(12, frameThickness)
      );
      insetShade.addColorStop(0, "rgba(0,0,0,0.12)");
      insetShade.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = insetShade;
      ctx.fillRect(outerX, outerY, outerW, Math.max(12, frameThickness));

      ctx.restore();
    }
  }, [
    canvasSize,
    pixelRatio,
    displayWidth,
    borderThickness,
    selectedMatColor,
    textures,
    logoImage,
    config,
    isFramePlacement,
  ]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!logoImage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    const layout = getCanvasLayout({
      canvasWidth: canvasSize.width,
      canvasHeight: canvasSize.height,
      displayWidth,
      borderThickness,
      isFramePlacement,
    });

    const { innerX, innerY, innerW, innerH } = layout;

    const relX = (localX - innerX) / innerW;
    const relY = (localY - innerY) / innerH;

    if (relX < 0 || relX > 1 || relY < 0 || relY > 1) return;

    const preparedLogo = createPreparedLogoCanvas(logoImage);
    if (!preparedLogo) return;

    const { width: logoWidth, height: logoHeight } = getRenderedLogoSize(
      preparedLogo,
      config.logo.scale,
      innerW,
      innerH
    );

    const logoNormW = logoWidth / innerW;
    const logoNormH = logoHeight / innerH;

    const isInsideLogo =
      Math.abs(relX - config.logo.position.x) <= logoNormW / 2 &&
      Math.abs(relY - config.logo.position.y) <= logoNormH / 2;

    if (!isInsideLogo) return;

    setIsDragging(true);
    setDragStart({
      x: relX - config.logo.position.x,
      y: relY - config.logo.position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !logoImage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    const layout = getCanvasLayout({
      canvasWidth: canvasSize.width,
      canvasHeight: canvasSize.height,
      displayWidth,
      borderThickness,
      isFramePlacement,
    });

    const { innerX, innerY, innerW, innerH } = layout;

    const relX = (localX - innerX) / innerW;
    const relY = (localY - innerY) / innerH;

    const preparedLogo = createPreparedLogoCanvas(logoImage);
    if (!preparedLogo) return;

    const { width: logoWidth, height: logoHeight } = getRenderedLogoSize(
      preparedLogo,
      config.logo.scale,
      innerW,
      innerH
    );

    const halfNormW = logoWidth / innerW / 2;
    const halfNormH = logoHeight / innerH / 2;

    const newX = clamp(relX - dragStart.x, halfNormW, 1 - halfNormW);
    const newY = clamp(relY - dragStart.y, halfNormH, 1 - halfNormH);

    onLogoUpdate({
      position: { x: newX, y: newY },
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCenterLogo = () => {
    onLogoUpdate({ position: { x: 0.5, y: 0.5 } });
  };

  const handleDeleteLogo = () => {
    onLogoUpdate({
      file: null,
      dataUrl: null,
      position: { x: 0.5, y: 0.5 },
      scale: 1,
      rotation: 0,
    });
  };

  return (
    <div ref={containerRef} className="space-y-4">
    <div className="relative flex items-center justify-center">
       <canvas
  ref={canvasRef}
  data-mat-canvas="true"
  className={cn("cursor-crosshair", isDragging && "cursor-grabbing")}
  onMouseDown={handleMouseDown}
  onMouseMove={handleMouseMove}
  onMouseUp={handleMouseUp}
  onMouseLeave={handleMouseUp}
/>

      </div>

     

      {config.logo.dataUrl && (
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={handleCenterLogo}>
              <Crosshair className="w-4 h-4 mr-1" />
              Center
            </Button>
            <Button size="sm" variant="destructive" onClick={handleDeleteLogo}>
              <Trash2 className="w-4 h-4 mr-1" />
              Remove
            </Button>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-1">
                  <ZoomIn className="w-4 h-4" />
                  Scale
                </span>
                <span className="text-xs text-muted-foreground">
                  {Math.round(config.logo.scale * 100)}%
                </span>
              </div>
              <Slider
                value={[config.logo.scale * 100]}
                onValueChange={(values) => {
                  const newValue = Array.isArray(values) ? values[0] : values;
                  onLogoUpdate({ scale: newValue / 100 });
                }}
                min={10}
                max={300}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-1">
                  <RotateCw className="w-4 h-4" />
                  Rotation
                </span>
                <span className="text-xs text-muted-foreground">
                  {config.logo.rotation}°
                </span>
              </div>
              <Slider
                value={[config.logo.rotation]}
                onValueChange={(values) => {
                  const newValue = Array.isArray(values) ? values[0] : values;
                  onLogoUpdate({ rotation: newValue });
                }}
                min={0}
                max={360}
                step={5}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Move className="w-3 h-3" />
            Drag the logo on the canvas to reposition
          </p>
        </div>
      )}
    </div>
  );
}
