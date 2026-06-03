"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { MAT_COLORS, type MatConfig } from "@/lib/mat-config";
import { Button } from "@/components/ui/button";
import { RotateCw, ZoomIn, ZoomOut, Move, Trash2, Crosshair } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface MatCanvasProps {
  config: MatConfig;
  onLogoUpdate: (updates: Partial<MatConfig["logo"]>) => void;
}

export function MatCanvas({ config, onLogoUpdate }: MatCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);

  // Get actual mat dimensions
  const { width: matWidth, height: matHeight } = config.size;
  const isLandscape = config.orientation === "landscape";
  const displayWidth = isLandscape ? Math.max(matWidth, matHeight) : Math.min(matWidth, matHeight);
  const displayHeight = isLandscape ? Math.min(matWidth, matHeight) : Math.max(matWidth, matHeight);

  // Border thickness in cm (visual)
  const borderThickness = config.rubberBorder ? 2 : 0;

  // Calculate canvas dimensions based on container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const maxHeight = 500;
        const aspectRatio = displayWidth / displayHeight;
        
        let width = containerWidth - 32;
        let height = width / aspectRatio;
        
        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }
        
        setCanvasSize({ width: Math.round(width), height: Math.round(height) });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [displayWidth, displayHeight]);

  // Load logo image
  useEffect(() => {
    if (config.logo.dataUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => setLogoImage(img);
      img.src = config.logo.dataUrl;
    } else {
      setLogoImage(null);
    }
  }, [config.logo.dataUrl]);

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvasSize;
    const scale = width / displayWidth;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw rubber border if enabled
    if (config.rubberBorder) {
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, width, height);
    }

    // Draw mat background
    const matColor = MAT_COLORS.find((c) => c.code === config.colorCode);
    const borderPx = borderThickness * scale;
    
    ctx.fillStyle = matColor?.hex || "#4a4a4a";
    ctx.fillRect(borderPx, borderPx, width - borderPx * 2, height - borderPx * 2);

    // Draw carpet texture
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * (width - borderPx * 2) + borderPx;
      const y = Math.random() * (height - borderPx * 2) + borderPx;
      ctx.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)";
      ctx.fillRect(x, y, 1, 2);
    }
    ctx.globalAlpha = 1;

    // Draw logo
    if (logoImage && config.logo.dataUrl) {
      const logoScale = config.logo.scale;
      const logoWidth = logoImage.width * logoScale * (scale / 5);
      const logoHeight = logoImage.height * logoScale * (scale / 5);
      
      const logoX = borderPx + (width - borderPx * 2) * config.logo.position.x - logoWidth / 2;
      const logoY = borderPx + (height - borderPx * 2) * config.logo.position.y - logoHeight / 2;

      ctx.save();
      ctx.translate(logoX + logoWidth / 2, logoY + logoHeight / 2);
      ctx.rotate((config.logo.rotation * Math.PI) / 180);
      ctx.drawImage(logoImage, -logoWidth / 2, -logoHeight / 2, logoWidth, logoHeight);
      ctx.restore();
    }

    // Draw frame indicator if in-floor placement
    if (config.placement === "frame") {
      ctx.strokeStyle = "#888";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(4, 4, width - 8, height - 8);
      ctx.setLineDash([]);
    }
  }, [canvasSize, config, logoImage, displayWidth, borderThickness]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Handle mouse events for logo dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!logoImage) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvasSize.width;
    const y = (e.clientY - rect.top) / canvasSize.height;

    setIsDragging(true);
    setDragStart({ x: x - config.logo.position.x, y: y - config.logo.position.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !logoImage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvasSize.width;
    const y = (e.clientY - rect.top) / canvasSize.height;

    const newX = Math.max(0.1, Math.min(0.9, x - dragStart.x));
    const newY = Math.max(0.1, Math.min(0.9, y - dragStart.y));

    onLogoUpdate({ position: { x: newX, y: newY } });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCenterLogo = () => {
    onLogoUpdate({ position: { x: 0.5, y: 0.5 } });
  };

  const handleDeleteLogo = () => {
    onLogoUpdate({ file: null, dataUrl: null, position: { x: 0.5, y: 0.5 }, scale: 1, rotation: 0 });
  };

  return (
    <div ref={containerRef} className="space-y-4">
      <div className="relative bg-muted rounded-lg p-4 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className={cn(
            "rounded shadow-lg cursor-crosshair",
            isDragging && "cursor-grabbing"
          )}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Canvas: {canvasSize.width} × {canvasSize.height} px</span>
        <span>Mat size: {displayWidth} × {displayHeight} cm</span>
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
                <span className="text-xs text-muted-foreground">{Math.round(config.logo.scale * 100)}%</span>
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
                <span className="text-xs text-muted-foreground">{config.logo.rotation}°</span>
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
