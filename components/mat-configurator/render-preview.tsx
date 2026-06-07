"use client";

import { useCallback, useMemo, useState } from "react";
import type { MatConfig } from "@/lib/mat-config";
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

type SceneConfig = {
  src: string;
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
  rotateDeg: number;
  skewXDeg: number;
  scaleYPct: number;
  frameMarginPx: number;
  frameColor: string;
  shadowBlur: number;
  shadowOffsetY: number;
  shadowColor: string;
};

const FRAME_SCENE: SceneConfig = {
  src: "/mockups/entrance-frame.jpg",
  leftPct: 0.416,
  topPct: 0.585,
  widthPct: 0.300,
  heightPct: 0.155,
  rotateDeg: -15,
  skewXDeg: -18,
  scaleYPct: 0.74,
  frameMarginPx: 10,
  frameColor: "#f3f3ef",
  shadowBlur: 0,
  shadowOffsetY: 0,
  shadowColor: "rgba(0,0,0,0)",
};

const FLOOR_SCENE: SceneConfig = {
  src: "/mockups/entrance-frame.jpg",
  leftPct: 0.416,
  topPct: 0.585,
  widthPct: 0.300,
  heightPct: 0.155,
  rotateDeg: -15,
  skewXDeg: -18,
  scaleYPct: 0.74,
  frameMarginPx: 0,
  frameColor: "#ffffff",
  shadowBlur: 24,
  shadowOffsetY: 18,
  shadowColor: "rgba(0,0,0,0.22)",
};

function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
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

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function RenderPreview({ config, logoImage: _logoImage }: RenderPreviewProps) {
  const [isRendering, setIsRendering] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [renderedImage, setRenderedImage] = useState<string | null>(null);

  const scene = useMemo(() => {
    return config.placement === "frame" ? FRAME_SCENE : FLOOR_SCENE;
  }, [config.placement]);

  const getMatCanvasDataUrl = useCallback(() => {
    const matCanvas = document.querySelector(
      '[data-mat-canvas="true"]'
    ) as HTMLCanvasElement | null;

    if (!matCanvas) return null;

    try {
      return matCanvas.toDataURL("image/png");
    } catch {
      return null;
    }
  }, []);

  const buildRenderImage = useCallback(async () => {
    const matDataUrl = getMatCanvasDataUrl();
    if (!matDataUrl) return null;

    const [bgImg, matImg] = await Promise.all([
      loadImage(scene.src),
      loadImage(matDataUrl),
    ]);

    const out = document.createElement("canvas");
    out.width = bgImg.naturalWidth || bgImg.width;
    out.height = bgImg.naturalHeight || bgImg.height;

    const ctx = out.getContext("2d");
    if (!ctx) return null;

    // achtergrondfoto
    ctx.drawImage(bgImg, 0, 0, out.width, out.height);

    const x = out.width * scene.leftPct;
    const y = out.height * scene.topPct;
    const w = out.width * scene.widthPct;
    const h = out.height * scene.heightPct;

    const cx = x + w / 2;
    const cy = y + h / 2;

    // frame-rand voor in-floor frame
    if (config.placement === "frame" && scene.frameMarginPx > 0) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(degToRad(scene.rotateDeg));
      ctx.transform(1, 0, Math.tan(degToRad(scene.skewXDeg)), scene.scaleYPct, 0, 0);

      ctx.fillStyle = scene.frameColor;
      ctx.fillRect(
        -w / 2 - scene.frameMarginPx,
        -h / 2 - scene.frameMarginPx,
        w + scene.frameMarginPx * 2,
        h + scene.frameMarginPx * 2
      );

      ctx.restore();
    }

    // schaduw enkel voor floor placement
    if (config.placement !== "frame") {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(degToRad(scene.rotateDeg));
      ctx.transform(1, 0, Math.tan(degToRad(scene.skewXDeg)), scene.scaleYPct, 0, 0);

      ctx.shadowColor = scene.shadowColor;
      ctx.shadowBlur = scene.shadowBlur;
      ctx.shadowOffsetY = scene.shadowOffsetY;

      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(-w / 2, -h / 2, w, h);

      ctx.restore();
    }

    // mat zelf
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(degToRad(scene.rotateDeg));
    ctx.transform(1, 0, Math.tan(degToRad(scene.skewXDeg)), scene.scaleYPct, 0, 0);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(matImg, -w / 2, -h / 2, w, h);

    ctx.restore();

    return out.toDataURL("image/png");
  }, [config.placement, getMatCanvasDataUrl, scene]);

  const generateRender = useCallback(async () => {
    try {
      setIsRendering(true);
      const image = await buildRenderImage();
      if (!image) return;
      setRenderedImage(image);
      setShowDialog(true);
    } finally {
      setIsRendering(false);
    }
  }, [buildRenderImage]);

  const handleDownloadRender = useCallback(async () => {
    try {
      setIsRendering(true);
      const image = renderedImage || (await buildRenderImage());
      if (!image) return;

      const response = await fetch(image);
      const blob = await response.blob();
      downloadBlob(blob, "entrance-render-preview.png");
    } finally {
      setIsRendering(false);
    }
  }, [buildRenderImage, renderedImage]);

  const handleExportFlat = useCallback(() => {
    const matCanvas = document.querySelector(
      '[data-mat-canvas="true"]'
    ) as HTMLCanvasElement | null;

    if (!matCanvas) return;

    const link = document.createElement("a");
    link.download = `mat-design-${config.size.width}x${config.size.height}cm.png`;
    link.href = matCanvas.toDataURL("image/png");
    link.click();
  }, [config.size.height, config.size.width]);

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
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Entrance Preview</DialogTitle>
          </DialogHeader>

          {renderedImage && (
            <div className="space-y-4">
              <img
                src={renderedImage}
                alt="Rendered entrance preview"
                className="w-full rounded-xl border shadow-lg"
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                  <span className="mr-4">
                    <strong>Type:</strong> {config.type}
                  </span>
                  <span className="mr-4">
                    <strong>Placement:</strong> {config.placement}
                  </span>
                  <span>
                    <strong>Size:</strong> {config.size.width} × {config.size.height} cm
                  </span>
                </div>

                <Button onClick={handleDownloadRender} disabled={isRendering}>
                  {isRendering ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Download Render
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
