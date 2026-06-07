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
  shadowBlur
