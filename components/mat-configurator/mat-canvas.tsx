"use client";

import { useRef, useEffect, useState, useCallback } from "react";
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
  // Maakt kleuren iets realistischer / minder digitaal
  return mixHex(mixHex(color, "#6f6f6f", 0.08), "#000000", 0.04);
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
  offCtx.drawImage(image, 0, 0, offscreen.width, offscreen.height);

  return ctx.createPattern(offscreen, "repeat");
}

function getRenderedLogoSize(
  image: HTMLImageElement,
  scale: number,
  innerWidth: number,
  innerHeight: number
) {
  const aspect = image.width / image.height;
  const baseSize = Math.min(innerWidth, innerHeight) * 0.36 * scale;

  let width: number;
  let height: number;

  if (aspect >= 1) {
    width = baseSize;
    height = baseSize / aspect;
  } else {
    height = baseSize;
    width = baseSize * aspect;
  }

  const maxWidth = innerWidth * 0.9;
  const maxHeight = innerHeight * 0.9;

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

export function MatCanvas({ config, onLogoUpdate }: MatCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [textures, setTextures] = useState<TextureSet>({
    base: null,
    soft: null,
    noise: null,
  });

  // Actual mat dimensions
  const { width: matWidth, height: matHeight } = config.size;
  const isLandscape = config.orientation === "landscape";

  const displayWidth = isLandscape
    ? Math.max(matWidth, matHeight)
    : Math.min(matWidth, matHeight);

  const displayHeight = isLandscape
    ? Math.min(matWidth, matHeight)
    : Math.max(matWidth, matHeight);

  const borderThickness = config.rubberBorder ? 2 : 0;

  // Canvas responsive sizing
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.clientWidth;
      const maxHeight = 500;
      const aspectRatio = displayWidth / displayHeight;

      let width = containerWidth - 32;
      let height = width / aspectRatio;

      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }

      setCanvasSize({
        width: Math.max(280, Math.round(width)),
        height: Math.max(180, Math.round(height)),
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [displayWidth, displayHeight]);

  // Load logo
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

  // Load textures
  useEffect(() => {
    let mounted = true;

    Promise.all([
      loadImage(TEXTURES.base).catch(() => null),
      loadImage(TEXTURES.soft).catch(() => null),
      loadImage(TEXTURES.noise).catch(() => null),
    ]).then(([base, soft, noise]) => {
      if (!mounted) return;
      setTextures({
        base,
        soft,
        noise,
      });
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

    const { width, height } = canvasSize;
    const scale = width / displayWidth;

    const borderPx = borderThickness * scale;
    const outerRadius = Math.max(8, Math.min(width, height) * 0.018);
    const innerRadius = Math.max(6, outerRadius - 2);

    const outerX = 0;
    const outerY = 0;
    const outerW = width;
    const outerH = height;

    const innerX = borderPx;
    const innerY = borderPx;
    const innerW = width - borderPx * 2;
    const innerH = height - borderPx * 2;

    const selectedColor =
      MAT_COLORS.find((c) => c.code === config.colorCode)?.hex || "#4a4a4a";

    const baseColor = muteHex(selectedColor);
    const topColor = lightenHex(baseColor, 0.08);
    const bottomColor = darkenHex(baseColor, 0.12);

    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;

    // -----------------------------
    // OUTER SHADOWS / DEPTH
    // -----------------------------
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.22)";
    ctx.shadowBlur = Math.max(18, Math.min(width, height) * 0.05);
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = Math.max(8, Math.min(width, height) * 0.024);
    ctx.fillStyle = "rgba(0,0,0,0.10)";
    roundedRectPath(ctx, outerX + 2, outerY + 2, outerW - 4, outerH - 4, outerRadius);
    ctx.fill();
    ctx.restore();

    // Soft ambient shadow
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.10)";
    ctx.shadowBlur = Math.max(26, Math.min(width, height) * 0.08);
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = Math.max(4, Math.min(width, height) * 0.012);
    ctx.fillStyle = "rgba(0,0,0,0.03)";
    roundedRectPath(ctx, outerX + 6, outerY + 6, outerW - 12, outerH - 12, outerRadius);
    ctx.fill();
    ctx.restore();

    // -----------------------------
    // RUBBER BORDER / OUTER MAT BODY
    // -----------------------------
    if (config.rubberBorder) {
      const rubberGradient = ctx.createLinearGradient(0, 0, 0, height);
      rubberGradient.addColorStop(0, "#2c2c2c");
      rubberGradient.addColorStop(0.45, "#171717");
      rubberGradient.addColorStop(1, "#111111");

      ctx.save();
      roundedRectPath(ctx, outerX, outerY, outerW, outerH, outerRadius);
      ctx.fillStyle = rubberGradient;
      ctx.fill();

      // Subtle border texture
      if (textures.noise) {
        const noisePattern = createScaledPattern(ctx, textures.noise, 0.45);
        if (noisePattern) {
          ctx.globalAlpha = 0.10;
          ctx.fillStyle = noisePattern;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      // Outer edge highlight
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1.2;
      roundedRectPath(ctx, outerX + 0.5, outerY + 0.5, outerW - 1, outerH - 1, outerRadius);
      ctx.stroke();

      // Inner lip shadow in rubber border
      const borderShadow = ctx.createLinearGradient(0, 0, 0, height);
      borderShadow.addColorStop(0, "rgba(255,255,255,0.05)");
      borderShadow.addColorStop(0.2, "rgba(255,255,255,0.01)");
      borderShadow.addColorStop(1, "rgba(0,0,0,0.20)");
      ctx.fillStyle = borderShadow;
      ctx.fill();
      ctx.restore();
    }

    // -----------------------------
    // INNER MAT SURFACE
    // -----------------------------
    ctx.save();
    roundedRectPath(ctx, innerX, innerY, innerW, innerH, innerRadius);
    ctx.clip();

    // Base vertical tonal variation
    const matGradient = ctx.createLinearGradient(innerX, innerY, innerX, innerY + innerH);
    matGradient.addColorStop(0, topColor);
    matGradient.addColorStop(0.42, baseColor);
    matGradient.addColorStop(1, bottomColor);
    ctx.fillStyle = matGradient;
    ctx.fillRect(innerX, innerY, innerW, innerH);

    // Slight left/right lighting to avoid flatness
    const sideLight = ctx.createLinearGradient(innerX, innerY, innerX + innerW, innerY);
    sideLight.addColorStop(0, "rgba(255,255,255,0.045)");
    sideLight.addColorStop(0.35, "rgba(255,255,255,0.01)");
    sideLight.addColorStop(0.65, "rgba(0,0,0,0.00)");
    sideLight.addColorStop(1, "rgba(0,0,0,0.06)");
    ctx.fillStyle = sideLight;
    ctx.fillRect(innerX, innerY, innerW, innerH);

    // Main textile texture
    if (textures.base) {
      const pattern = createScaledPattern(ctx, textures.base, 0.48);
      if (pattern) {
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = pattern;
        ctx.fillRect(innerX, innerY, innerW, innerH);
        ctx.globalAlpha = 1;
      }
    }

    // Softer secondary textile layer
    if (textures.soft) {
      const pattern = createScaledPattern(ctx, textures.soft, 0.55);
      if (pattern) {
        ctx.globalAlpha = 0.13;
        ctx.fillStyle = pattern;
        ctx.fillRect(innerX, innerY, innerW, innerH);
        ctx.globalAlpha = 1;
      }
    }

    // Fine grain / noise
    if (textures.noise) {
      const pattern = createScaledPattern(ctx, textures.noise, 0.42);
      if (pattern) {
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = pattern;
        ctx.fillRect(innerX, innerY, innerW, innerH);
        ctx.globalAlpha = 1;
      }
    }

    // Soft top sheen / directional pile feel
    const pileGradient = ctx.createLinearGradient(innerX, innerY, innerX, innerY + innerH);
    pileGradient.addColorStop(0, "rgba(255,255,255,0.04)");
    pileGradient.addColorStop(0.18, "rgba(255,255,255,0.015)");
    pileGradient.addColorStop(0.5, "rgba(0,0,0,0.00)");
    pileGradient.addColorStop(1, "rgba(0,0,0,0.06)");
    ctx.fillStyle = pileGradient;
    ctx.fillRect(innerX, innerY, innerW, innerH);

    // -----------------------------
    // LOGO RENDERING
    // -----------------------------
    if (logoImage && config.logo.dataUrl) {
      const { width: logoWidth, height: logoHeight } = getRenderedLogoSize(
        logoImage,
        config.logo.scale,
        innerW,
        innerH
      );

      const logoCenterX = innerX + innerW * config.logo.position.x;
      const logoCenterY = innerY + innerH * config.logo.position.y;

      ctx.save();
      ctx.translate(logoCenterX, logoCenterY);
      ctx.rotate((config.logo.rotation * Math.PI) / 180);

      // Soft grounding shadow under logo
      ctx.shadowColor = "rgba(0,0,0,0.10)";
      ctx.shadowBlur = Math.max(4, Math.min(logoWidth, logoHeight) * 0.06);
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = Math.max(2, Math.min(logoWidth, logoHeight) * 0.03);

      ctx.globalAlpha = 0.97;
      ctx.filter = "contrast(1.02) saturate(0.96)";
      ctx.drawImage(
        logoImage,
        -logoWidth / 2,
        -logoHeight / 2,
        logoWidth,
        logoHeight
      );

      ctx.filter = "none";
      ctx.globalAlpha = 1;
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Very subtle noise over the logo so it feels less pasted-on
      if (textures.noise) {
        ctx.globalAlpha = 0.05;
        const logoNoisePattern = createScaledPattern(ctx, textures.noise, 0.3);
        if (logoNoisePattern) {
          ctx.fillStyle = logoNoisePattern;
          ctx.fillRect(-logoWidth / 2, -logoHeight / 2, logoWidth, logoHeight);
        }
        ctx.globalAlpha = 1;
      }

      ctx.restore();
    }

    ctx.restore();

    // -----------------------------
    // INNER SHADOWS / EDGE DEPTH
    // -----------------------------
    ctx.save();
    roundedRectPath(ctx, innerX, innerY, innerW, innerH, innerRadius);
    ctx.clip();

    const edgeSize = Math.max(10, Math.min(innerW, innerH) * 0.04);

    // Top inner highlight
    const topEdge = ctx.createLinearGradient(0, innerY, 0, innerY + edgeSize);
    topEdge.addColorStop(0, "rgba(255,255,255,0.06)");
    topEdge.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = topEdge;
    ctx.fillRect(innerX, innerY, innerW, edgeSize);

    // Bottom inner shadow
    const bottomEdge = ctx.createLinearGradient(0, innerY + innerH - edgeSize, 0, innerY + innerH);
    bottomEdge.addColorStop(0, "rgba(0,0,0,0)");
    bottomEdge.addColorStop(1, "rgba(0,0,0,0.12)");
    ctx.fillStyle = bottomEdge;
    ctx.fillRect(innerX, innerY + innerH - edgeSize, innerW, edgeSize);

    // Left inner highlight
    const leftEdge = ctx.createLinearGradient(innerX, 0, innerX + edgeSize, 0);
    leftEdge.addColorStop(0, "rgba(255,255,255,0.03)");
    leftEdge.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = leftEdge;
    ctx.fillRect(innerX, innerY, edgeSize, innerH);

    // Right inner shadow
    const rightEdge = ctx.createLinearGradient(innerX + innerW - edgeSize, 0, innerX + innerW, 0);
    rightEdge.addColorStop(0, "rgba(0,0,0,0)");
    rightEdge.addColorStop(1, "rgba(0,0,0,0.08)");
    ctx.fillStyle = rightEdge;
    ctx.fillRect(innerX + innerW - edgeSize, innerY, edgeSize, innerH);

    ctx.restore();

    // Soft top-edge outline for crisp premium finish
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    roundedRectPath(ctx, innerX + 0.5, innerY + 0.5, innerW - 1, innerH - 1, innerRadius);
    ctx.stroke();
    ctx.restore();

    // Frame indicator if in-floor placement
    if (config.placement === "frame") {
      ctx.save();
      ctx.strokeStyle = "rgba(110,110,110,0.85)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      roundedRectPath(ctx, 4, 4, width - 8, height - 8, outerRadius);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }, [canvasSize, config, logoImage, textures, displayWidth, borderThickness]);

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

    const scale = canvasSize.width / displayWidth;
    const borderPx = borderThickness * scale;

    const innerX = borderPx;
    const innerY = borderPx;
    const innerW = canvasSize.width - borderPx * 2;
    const innerH = canvasSize.height - borderPx * 2;

    const relX = (localX - innerX) / innerW;
    const relY = (localY - innerY) / innerH;

    if (relX < 0 || relX > 1 || relY < 0 || relY > 1) return;

    const { width: logoWidth, height: logoHeight } = getRenderedLogoSize(
      logoImage,
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

    const scale = canvasSize.width / displayWidth;
    const borderPx = borderThickness * scale;

    const innerX = borderPx;
    const innerY = borderPx;
    const innerW = canvasSize.width - borderPx * 2;
    const innerH = canvasSize.height - borderPx * 2;

    const relX = (localX - innerX) / innerW;
    const relY = (localY - innerY) / innerH;

    const { width: logoWidth, height: logoHeight } = getRenderedLogoSize(
      logoImage,
      config.logo.scale,
      innerW,
      innerH
    );

    const halfNormW = (logoWidth / innerW) / 2;
    const halfNormH = (logoHeight / innerH) / 2;

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
    onLogoUpdate({
      position: { x: 0.5, y: 0.5 },
    });
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
      <div className="relative rounded-lg p-4 flex items-center justify-center bg-[#f3f1ed]">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className={cn(
            "cursor-crosshair",
            isDragging && "cursor-grabbing"
          )}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Canvas: {canvasSize.width} × {canvasSize.height} px
        </span>
        <span>
          Mat size: {displayWidth} × {displayHeight} cm
        </span>
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
