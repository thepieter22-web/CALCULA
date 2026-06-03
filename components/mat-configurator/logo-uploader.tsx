"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileImage, Loader2, Sparkles } from "lucide-react";
import { extractDominantColors, findClosestColors, MAT_COLORS } from "@/lib/mat-config";
import { cn } from "@/lib/utils";

interface LogoUploaderProps {
  currentFile: File | null;
  onUpload: (file: File, dataUrl: string) => void;
  onColorSuggestionsFound: (codes: string[]) => void;
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

      // Analyze colors
      setIsAnalyzing(true);
      try {
        const dominantColors = await extractDominantColors(dataUrl);
        if (dominantColors.length > 0) {
          const suggestions = findClosestColors(dominantColors, 3);
          onColorSuggestionsFound(suggestions.map((c) => c.code));
        }
      } catch (error) {
        console.error("Color analysis failed:", error);
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
          Upload a PNG with transparent background for best results. We&apos;ll automatically suggest matching mat colors.
        </p>
      </div>
    </div>
  );
}
