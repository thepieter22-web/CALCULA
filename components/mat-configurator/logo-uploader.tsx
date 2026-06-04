"use client";

import { useRef, useState } from "react";
import { Upload, FileImage, Loader2, Sparkles } from "lucide-react";
import { extractDominantColors, findClosestColors } from "@/lib/mat-config";
import { cn } from "@/lib/utils";

interface LogoUploaderProps {
  currentFile: File | null;
  onUpload: (file: File, dataUrl: string) => void;
  onColorSuggestionsFound: (codes: string[]) => void;
}

type RGB = { r: number; g: number; b: number };

function hexToRgb(hex: string): RGB | null {
  const clean = hex.replace("#", "").trim();

  if (clean.length !== 3 && clean.length !== 6) return null;

  const normalized =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;

  const num = parseInt(normalized, 16);
  if (Number.isNaN(num)) return null;

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function normalizeColorToRgb(color: any): RGB | null {
  if (!color) return null;

  if (typeof color === "string") {
    return hexToRgb(color);
  }

  if (
    typeof color === "object" &&
    typeof color.r === "number" &&
    typeof color.g === "number" &&
    typeof color.b === "number"
  ) {
    return { r: color.r, g: color.g, b: color.b };
  }

  if (typeof color === "object" && typeof color.hex === "string") {
    return hexToRgb(color.hex);
  }

  return null;
}

function rgbDistance(a: RGB, b: RGB) {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Merge bijna identieke kleuren samen
 * zodat anti-aliasing / zachte randen niet als extra kleur tellen
 */
function mergeSimilarColors<T>(colors: T[], threshold = 32): T[] {
  const merged: T[] = [];

  for (const color of colors) {
    const rgb = normalizeColorToRgb(color);
    if (!rgb) continue;

    const alreadyExists = merged.some((existing) => {
      const existingRgb = normalizeColorToRgb(existing);
      if (!existingRgb) return false;
      return rgbDistance(rgb, existingRgb) < threshold;
    });

    if (!alreadyExists) {
      merged.push(color);
    }
  }

  return merged;
}

function uniqueCodes(codes: string[]) {
  return [...new Set(codes)];
}

/**
 * Voor elke echte dominante kleur:
 * neem slechts de beste dichtste matkleur
 */
function getBestSuggestionPerColor(colors: any[]) {
  const results: string[] = [];

  for (const color of colors) {
    const closest = findClosestColors([color], 1);
    if (closest.length > 0) {
      results.push(closest[0].code);
    }
  }

  return uniqueCodes(results);
}

export function LogoUploader({
  currentFile,
  onUpload,
  onColorSuggestionsFound,
}: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();

    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      onUpload(file, dataUrl);

      setIsAnalyzing(true);

      try {
        const dominantColors = await extractDominantColors(dataUrl);

        if (dominantColors.length > 0) {
          // 1) merge bijna identieke tinten
          const mergedDominantColors = mergeSimilarColors(dominantColors, 32);

          // 2) toon nu tot 5 echte kleuren i.p.v. max 3
          const effectiveColors = mergedDominantColors.slice(0, 5);

          // 3) per kleur 1 beste mat-match
          const matchedCodes = getBestSuggestionPerColor(effectiveColors);

          // 4) aantal suggestions = aantal echte kleuren (max 5)
          const suggestionCount = Math.min(
            matchedCodes.length,
            effectiveColors.length,
            5
          );

          onColorSuggestionsFound(matchedCodes.slice(0, suggestionCount));
        } else {
          onColorSuggestionsFound([]);
        }
      } catch (error) {
        console.error("Color analysis failed:", error);
        onColorSuggestionsFound([]);
      } finally {
        setIsAnalyzing(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleChange}
        className="hidden"
      />

      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground hover:bg-muted/50"
        )}
      >
        <div className="flex flex-col items-center gap-2">
          <Upload className="w-8 h-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {currentFile ? "Replace logo" : "Upload your logo"}
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG or WebP (transparent PNG recommended)
            </p>
          </div>
        </div>
      </div>

      {currentFile && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
          <FileImage className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm truncate flex-1">{currentFile.name}</span>
          {isAnalyzing && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Analyzing...
            </span>
          )}
        </div>
      )}

      <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-md border border-amber-200 dark:border-amber-800">
        <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 dark:text-amber-200">
          Upload a PNG with transparent background for best results. We&apos;ll
          automatically suggest matching mat colors.
        </p>
      </div>
    </div>
  );
}
