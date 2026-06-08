"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { MatConfig } from "@/lib/mat-config";

interface MatCanvasProps {
  config: MatConfig;
  onLogoUpdate: (updates: Partial<MatConfig["logo"]>) => void;
}

type TextureSet = {
  name: string;
  image: HTMLImageElement | null;
  color: string;
};

type CanvasLayout = {
  width: number;
  height: number;
  matWidth: number;
  matHeight: number;
  matX: number;
  matY: number;
  frameThickness: number;
  innerWidth: number;
  innerHeight: number;
  logoWidth: number;
  logoHeight: number;
  logoX: number;
  logoY: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hexToRgb(hex: string) {
  const bigint = parseInt(hex.slice(1), 16);
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

function straightRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x, y + height);
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

  if (aspect > 1) {
    width = baseSize;
    height = baseSize / aspect;
  } else {
    height = baseSize;
    width = baseSize * aspect;
  }

  return { width, height };
}

function isNearWhite(r: number, g: number, b: number, threshold = 245) {
  return r >= threshold && g >= threshold && b >= threshold;
}

function findOpaqueBounds(imageData: ImageData) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  let minX = width,
    maxX = 0,
    minY = height,
    maxY = 0;

  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 128) {
      const pixelIndex = i / 4;
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);

      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }

  return minX <= maxX && minY <= maxY ? { minX, maxX, minY, maxY } : null;
}

function hasLikelyWhiteBackground(image: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.min(image.width, 100);
  canvas.height = Math.min(image.height, 100);

  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const sampleSize = Math.min(100, data.length / 4);
  let whiteCount = 0;

  for (let i = 0; i < sampleSize; i++) {
    const idx = Math.floor(Math.random() * (data.length / 4)) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];

    if (a > 128 && isNearWhite(r, g, b)) {
      whiteCount++;
    }
  }

  return whiteCount / sampleSize > 0.3;
}

function applyCanvasNoise(ctx: CanvasRenderingContext2D) {
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      const noise = (Math.random() - 0.5) * 4;
      data[i] = clamp(data[i] + noise, 0, 255);
      data[i + 1] = clamp(data[i + 1] + noise, 0, 255);
      data[i + 2] = clamp(data[i + 2] + noise, 0, 255);
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function softenPureWhites(ctx: CanvasRenderingContext2D) {
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (
      a > 200 &&
      isNearWhite(r, g, b, 250) &&
      (r > 250 || g > 250 || b > 250)
    ) {
      data[i] = clamp(data[i] - 3, 0, 255);
      data[i + 1] = clamp(data[i + 1] - 3, 0, 255);
      data[i + 2] = clamp(data[i + 2] - 3, 0, 255);
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function createPreparedLogoCanvas(image: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  canvas.width = image.width;
  canvas.height = image.height;

  ctx.drawImage(image, 0, 0);
  applyCanvasNoise(ctx);
  softenPureWhites(ctx);

  return canvas;
}

function createPrintedLogoCanvas(
  sourceImage: HTMLImageElement,
  logoPrepared: HTMLCanvasElement,
  scale: number,
  innerWidth: number,
  innerHeight: number,
  centerColor: string
) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  const logoSize = getRenderedLogoSize(sourceImage, scale, innerWidth, innerHeight);

  canvas.width = Math.ceil(logoSize.width);
  canvas.height = Math.ceil(logoSize.height);

  const x = (canvas.width - logoSize.width) / 2;
  const y = (canvas.height - logoSize.height) / 2;

  ctx.fillStyle = centerColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(logoPrepared, x, y, logoSize.width, logoSize.height);

  return canvas;
}

function getFrameThickness(
  type: MatConfig["type"],
  placement: MatConfig["placement"]
) {
  if (placement === "floor") return 0;
  if (type === "outdoor") return 15;
  return 12;
}

function getCanvasLayout(params: {
  width: number;
  height: number;
  type: MatConfig["type"];
  placement: MatConfig["placement"];
}): CanvasLayout {
  const frameThickness = getFrameThickness(params.type, params.placement);

  const matWidth = params.width - frameThickness * 2;
  const matHeight = params.height - frameThickness * 2;

  return {
    width: params.width,
    height: params.height,
    matWidth,
    matHeight,
    matX: frameThickness,
    matY: frameThickness,
    frameThickness,
    innerWidth: matWidth - 30,
    innerHeight: matHeight - 30,
    logoWidth: 0,
    logoHeight: 0,
    logoX: 0,
    logoY: 0,
  };
}

export function MatCanvas({ config, onLogoUpdate }: MatCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const layout = useMemo(
    () =>
      getCanvasLayout({
        width: config.size.width * 4,
        height: config.size.height * 4,
        type: config.type,
        placement: config.placement,
      }),
    [config.size.width, config.size.height, config.type, config.placement]
  );

  const updateSize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  };

  useMemo(() => {
    updateSize();
  }, [layout.width, layout.height]);

  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width / layout.width;
    const scaleY = canvas.height / layout.height;

    ctx.save();
    ctx.scale(scaleX, scaleY);

    ctx.fillStyle = config.colors.frame;
    straightRectPath(
      ctx,
      0,
      0,
      layout.frameThickness,
      layout.height
    );
    ctx.fill();

    straightRectPath(
      ctx,
      layout.width - layout.frameThickness,
      0,
      layout.frameThickness,
      layout.height
    );
    ctx.fill();

    straightRectPath(
      ctx,
      0,
      0,
      layout.width,
      layout.frameThickness
    );
    ctx.fill();

    straightRectPath(
      ctx,
      0,
      layout.height - layout.frameThickness,
      layout.width,
      layout.frameThickness
    );
    ctx.fill();

    ctx.fillStyle = config.colors.mat;
    straightRectPath(
      ctx,
      layout.matX,
      layout.matY,
      layout.matWidth,
      layout.matHeight
    );
    ctx.fill();

    if (config.logo.image && config.logo.scale > 0) {
      const logoImage = new Image();
      logoImage.src = config.logo.image;

      try {
        await new Promise<void>((resolve) => {
          logoImage.onload = () => resolve();
          setTimeout(resolve, 2000);
        });

        const preparedLogo = createPreparedLogoCanvas(logoImage);
        if (!preparedLogo) {
          ctx.restore();
          return;
        }

        const printedLogo = createPrintedLogoCanvas(
          logoImage,
          preparedLogo,
          config.logo.scale,
          layout.innerWidth,
          layout.innerHeight,
          config.colors.matBg
        );

        if (!printedLogo) {
          ctx.restore();
          return;
        }

        const logoSize = getRenderedLogoSize(
          logoImage,
          config.logo.scale,
          layout.innerWidth,
          layout.innerHeight
        );

        const innerStartX = layout.matX + 15;
        const innerStartY = layout.matY + 15;

        const logoX =
          innerStartX +
          config.logo.position.x * (layout.innerWidth - logoSize.width);
        const logoY =
          innerStartY +
          config.logo.position.y * (layout.innerHeight - logoSize.height);

        ctx.drawImage(printedLogo, logoX, logoY, logoSize.width, logoSize.height);
      } catch (error) {
        console.error("Error rendering logo:", error);
      }
    }

    ctx.restore();
  }, [config, layout]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!config.logo.image || config.logo.scale <= 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const innerStartX = layout.matX + 15;
    const innerStartY = layout.matY + 15;

    dragOffsetRef.current = {
      x: x - (innerStartX + config.logo.position.x * (layout.innerWidth - 50)) / layout.width,
      y: y - (innerStartY + config.logo.position.y * (layout.innerHeight - 50)) / layout.height,
    };

    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !config.logo.image || config.logo.scale <= 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const innerStartX = layout.matX + 15;
    const innerStartY = layout.matY + 15;

    const newX = clamp(
      x - dragOffsetRef.current.x - innerStartX / layout.width,
      0,
      1
    );
    const newY = clamp(
      y - dragOffsetRef.current.y - innerStartY / layout.height,
      0,
      1
    );

    onLogoUpdate({ position: { x: newX, y: newY } });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCenterLogo = () => {
    onLogoUpdate({ position: { x: 0.5, y: 0.5 } });
  };

  const handleDeleteLogo = () => {
    onLogoUpdate({ image: null, scale: 0 });
  };

  useEffect(() => {
    render();
  }, [render]);

  useEffect(() => {
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <canvas
        ref={canvasRef}
        data-mat-canvas="true"
        className="w-full border rounded-lg shadow-md cursor-move bg-white"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ aspectRatio: `${config.size.width} / ${config.size.height}` }}
      />

      <div className="flex gap-2">
        <button
          onClick={handleCenterLogo}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Center Logo
        </button>
        <button
          onClick={handleDeleteLogo}
          className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Delete Logo
        </button>
      </div>
    </div>
  );
}

function useCallback(
  callback: (...args: any[]) => any,
  deps: any[]
): (...args: any[]) => any {
  return useCallback(callback, deps);
}

function useEffect(effect: () => void | (() => void), deps?: any[]): void {
  // Placeholder for useEffect
}