"use client";

import { useState } from "react";
import { MAT_COLORS, type MatConfig } from "@/lib/mat-config";
import { Button } from "@/components/ui/button";
import { Download, Eye, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RenderPreviewProps {
  config: MatConfig;
  logoImage: HTMLImageElement | null;
}

export function RenderPreview({ config, logoImage }: RenderPreviewProps) {
  const [isRendering, setIsRendering] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [renderedImage, setRenderedImage] = useState<string | null>(null);

  // Draw realistic carpet texture
  const drawCarpetTexture = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    baseColor: string
  ) => {
    // Fill base color
    ctx.fillStyle = baseColor;
    ctx.fillRect(x, y, width, height);

    // Parse base color to create variations
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 1;
    tempCanvas.height = 1;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.fillStyle = baseColor;
    tempCtx.fillRect(0, 0, 1, 1);
    const baseData = tempCtx.getImageData(0, 0, 1, 1).data;
    const r = baseData[0], g = baseData[1], b = baseData[2];

    // Create carpet fiber texture with noise
    const fiberCount = Math.floor((width * height) / 8);
    
    for (let i = 0; i < fiberCount; i++) {
      const fx = x + Math.random() * width;
      const fy = y + Math.random() * height;
      
      // Random variation for each fiber
      const variation = (Math.random() - 0.5) * 40;
      const fiberR = Math.max(0, Math.min(255, r + variation));
      const fiberG = Math.max(0, Math.min(255, g + variation));
      const fiberB = Math.max(0, Math.min(255, b + variation));
      
      ctx.fillStyle = `rgba(${fiberR}, ${fiberG}, ${fiberB}, ${0.6 + Math.random() * 0.4})`;
      
      // Draw short fiber lines
      const fiberLength = 1 + Math.random() * 3;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.4; // Mostly vertical
      ctx.fillRect(fx, fy, 1, fiberLength);
    }

    // Add subtle noise overlay for texture
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < width * height / 20; i++) {
      const nx = x + Math.random() * width;
      const ny = y + Math.random() * height;
      ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
      ctx.fillRect(nx, ny, 1, 1);
    }
    ctx.globalAlpha = 1;
  };

  // Draw entrance scene background
  const drawEntranceScene = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Sky/ceiling gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.3);
    skyGradient.addColorStop(0, '#e8f4fc');
    skyGradient.addColorStop(1, '#d4e8f5');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height * 0.35);

    // Glass wall/window area
    ctx.fillStyle = '#c5dced';
    ctx.fillRect(0, 0, width, height * 0.55);

    // Glass reflections
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(width * 0.02, height * 0.05, width * 0.15, height * 0.45);
    ctx.fillRect(width * 0.2, height * 0.05, width * 0.08, height * 0.45);
    ctx.fillRect(width * 0.75, height * 0.05, width * 0.12, height * 0.45);

    // Door frame
    ctx.fillStyle = '#2a3a4a';
    ctx.fillRect(width * 0.35, 0, width * 0.04, height * 0.55);
    ctx.fillRect(width * 0.61, 0, width * 0.04, height * 0.55);
    
    // Interior visible through glass
    ctx.fillStyle = '#f0f4f8';
    ctx.fillRect(width * 0.39, height * 0.05, width * 0.22, height * 0.45);

    // Plant on left
    drawPlant(ctx, width * 0.08, height * 0.35, width * 0.12);

    // Floor - checkered marble pattern
    const floorY = height * 0.55;
    const floorHeight = height * 0.45;
    
    // Floor base
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(0, floorY, width, floorHeight);

    // Checkered tiles with perspective
    const tileSize = width * 0.08;
    const perspectiveFactor = 0.7;
    
    for (let row = 0; row < 8; row++) {
      const rowY = floorY + row * tileSize * perspectiveFactor * (1 - row * 0.05);
      const rowHeight = tileSize * perspectiveFactor * (1 - row * 0.08);
      
      for (let col = 0; col < 15; col++) {
        const colX = col * tileSize - tileSize * 2;
        const isLight = (row + col) % 2 === 0;
        
        ctx.fillStyle = isLight ? '#f5f5f5' : '#1a1a2e';
        ctx.fillRect(colX, rowY, tileSize - 1, rowHeight - 1);
        
        // Tile shine
        if (isLight) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.fillRect(colX + 2, rowY + 2, tileSize * 0.3, rowHeight * 0.2);
        }
      }
    }

    // Floor reflection/shine
    const floorShine = ctx.createLinearGradient(0, floorY, 0, height);
    floorShine.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    floorShine.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = floorShine;
    ctx.fillRect(0, floorY, width, floorHeight);
  };

  // Draw a simple plant
  const drawPlant = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    // Pot
    ctx.fillStyle = '#8b6914';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x + size * 0.85, y + size * 0.4);
    ctx.lineTo(x + size * 0.15, y + size * 0.4);
    ctx.closePath();
    ctx.fill();

    // Plant leaves
    ctx.fillStyle = '#2d5a27';
    const leafCount = 8;
    for (let i = 0; i < leafCount; i++) {
      const angle = (i / leafCount) * Math.PI - Math.PI / 2;
      const leafLength = size * (0.8 + Math.random() * 0.4);
      const leafWidth = size * 0.15;
      
      ctx.save();
      ctx.translate(x + size / 2, y - size * 0.1);
      ctx.rotate(angle * 0.6);
      
      ctx.beginPath();
      ctx.ellipse(0, -leafLength / 2, leafWidth, leafLength / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  const generateRender = async () => {
    setIsRendering(true);

    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      setIsRendering(false);
      return;
    }

    // Draw entrance scene background
    drawEntranceScene(ctx, canvas.width, canvas.height);

    // Calculate mat dimensions
    const { width: matWidth, height: matHeight } = config.size;
    const isLandscape = config.orientation === "landscape";
    const displayWidth = isLandscape ? Math.max(matWidth, matHeight) : Math.min(matWidth, matHeight);
    const displayHeight = isLandscape ? Math.min(matWidth, matHeight) : Math.max(matWidth, matHeight);

    // Scale and position mat with perspective
    const baseScale = Math.min(500 / displayWidth, 300 / displayHeight);
    const scaledWidth = displayWidth * baseScale;
    const scaledHeight = displayHeight * baseScale * 0.6; // Perspective compression

    // Position mat on floor
    const matX = (canvas.width - scaledWidth) / 2;
    const matY = canvas.height * 0.55 + 20; // Just below the glass wall line

    // Draw mat shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.filter = 'blur(15px)';
    ctx.fillRect(matX + 10, matY + scaledHeight - 5, scaledWidth, 25);
    ctx.restore();

    // Apply perspective transform for mat
    ctx.save();

    // Draw rubber border if enabled
    const borderThickness = config.rubberBorder ? 6 : 0;
    if (config.rubberBorder) {
      ctx.fillStyle = "#1a1a1a";
      // Draw border with slight perspective
      ctx.beginPath();
      ctx.moveTo(matX - 5, matY - 3);
      ctx.lineTo(matX + scaledWidth + 5, matY - 3);
      ctx.lineTo(matX + scaledWidth + 8, matY + scaledHeight + 3);
      ctx.lineTo(matX - 8, matY + scaledHeight + 3);
      ctx.closePath();
      ctx.fill();
    }

    // Get mat color
    const matColor = MAT_COLORS.find((c) => c.code === config.colorCode);
    const colorHex = matColor?.hex || "#c4a35a";

    // Draw mat inner area with carpet texture
    const innerX = matX + borderThickness;
    const innerY = matY + borderThickness * 0.6;
    const innerWidth = scaledWidth - borderThickness * 2;
    const innerHeight = scaledHeight - borderThickness * 1.2;

    // Draw carpet texture
    drawCarpetTexture(ctx, innerX, innerY, innerWidth, innerHeight, colorHex);

    // Draw logo if present
    if (logoImage && config.logo.dataUrl) {
      const logoScale = config.logo.scale;
      // Adjust logo scale for perspective view
      const logoWidth = logoImage.width * logoScale * (baseScale / 6);
      const logoHeight = logoImage.height * logoScale * (baseScale / 6) * 0.6; // Perspective

      const logoX = innerX + innerWidth * config.logo.position.x - logoWidth / 2;
      const logoY = innerY + innerHeight * config.logo.position.y - logoHeight / 2;

      ctx.save();
      ctx.translate(logoX + logoWidth / 2, logoY + logoHeight / 2);
      ctx.rotate((config.logo.rotation * Math.PI) / 180);
      
      // Draw logo with slight transparency to blend with carpet
      ctx.globalAlpha = 0.95;
      ctx.drawImage(logoImage, -logoWidth / 2, -logoHeight / 2, logoWidth, logoHeight);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    ctx.restore();

    // Add overall lighting effect
    const lightGradient = ctx.createRadialGradient(
      canvas.width * 0.3,
      canvas.height * 0.2,
      0,
      canvas.width * 0.5,
      canvas.height * 0.5,
      canvas.width * 0.8
    );
    lightGradient.addColorStop(0, "rgba(255, 255, 255, 0.05)");
    lightGradient.addColorStop(1, "rgba(0, 0, 0, 0.03)");
    ctx.fillStyle = lightGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/png");
    setRenderedImage(dataUrl);
    setShowDialog(true);
    setIsRendering(false);
  };

  const handleExportFlat = () => {
    const canvas = document.createElement("canvas");
    const { width: matWidth, height: matHeight } = config.size;
    const isLandscape = config.orientation === "landscape";
    const displayWidth = isLandscape ? Math.max(matWidth, matHeight) : Math.min(matWidth, matHeight);
    const displayHeight = isLandscape ? Math.min(matWidth, matHeight) : Math.max(matWidth, matHeight);

    // Export at higher resolution (10 pixels per cm)
    const scale = 10;
    canvas.width = displayWidth * scale;
    canvas.height = displayHeight * scale;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const borderThickness = config.rubberBorder ? 2 * scale : 0;

    // Draw rubber border
    if (config.rubberBorder) {
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw mat with carpet texture
    const matColor = MAT_COLORS.find((c) => c.code === config.colorCode);
    const colorHex = matColor?.hex || "#c4a35a";
    
    drawCarpetTexture(
      ctx,
      borderThickness,
      borderThickness,
      canvas.width - borderThickness * 2,
      canvas.height - borderThickness * 2,
      colorHex
    );

    // Draw logo
    if (logoImage && config.logo.dataUrl) {
      const logoScale = config.logo.scale;
      const logoWidth = logoImage.width * logoScale * (scale / 5);
      const logoHeight = logoImage.height * logoScale * (scale / 5);

      const innerWidth = canvas.width - borderThickness * 2;
      const innerHeight = canvas.height - borderThickness * 2;
      const logoX = borderThickness + innerWidth * config.logo.position.x - logoWidth / 2;
      const logoY = borderThickness + innerHeight * config.logo.position.y - logoHeight / 2;

      ctx.save();
      ctx.translate(logoX + logoWidth / 2, logoY + logoHeight / 2);
      ctx.rotate((config.logo.rotation * Math.PI) / 180);
      ctx.drawImage(logoImage, -logoWidth / 2, -logoHeight / 2, logoWidth, logoHeight);
      ctx.restore();
    }

    // Download
    const link = document.createElement("a");
    link.download = `mat-design-${displayWidth}x${displayHeight}cm.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleDownloadRender = () => {
    if (!renderedImage) return;
    const link = document.createElement("a");
    link.download = "mat-render-preview.png";
    link.href = renderedImage;
    link.click();
  };

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleExportFlat} className="flex-1">
          <Download className="w-4 h-4 mr-2" />
          Export PNG
        </Button>
        <Button onClick={generateRender} disabled={isRendering} className="flex-1">
          {isRendering ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Eye className="w-4 h-4 mr-2" />
          )}
          Render Preview
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Entrance Preview</DialogTitle>
          </DialogHeader>
          {renderedImage && (
            <div className="space-y-4">
              <img
                src={renderedImage}
                alt="Rendered mat preview in entrance"
                className="w-full rounded-lg shadow-lg"
              />
              <Button onClick={handleDownloadRender} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download Render
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
