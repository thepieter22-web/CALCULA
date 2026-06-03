"use client";

import { MAT_COLORS } from "@/lib/mat-config";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ColorPaletteProps {
  selectedCode: string;
  onSelect: (code: string) => void;
  suggestedCodes?: string[];
}

function getSwatchStyle(color: { hex: string; swatch?: string }) {
  return {
    backgroundColor: color.hex,
    backgroundImage: color.swatch ? `url(${color.swatch})` : undefined,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };
}

export function ColorPalette({
  selectedCode,
  onSelect,
  suggestedCodes = [],
}: ColorPaletteProps) {
  return (
    <div className="space-y-4">
      {suggestedCodes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              Suggested Colors
            </span>
            <Badge variant="secondary" className="text-xs">
              AI Match
            </Badge>
          </div>

          <div className="flex flex-wrap gap-3 pb-1">
            {suggestedCodes.map((code) => {
              const color = MAT_COLORS.find((c) => c.code === code);
              if (!color) return null;

              return (
                <Tooltip key={code}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onSelect(code)}
                      className={cn(
                        "group relative flex flex-col items-center gap-1",
                        "transition-transform hover:scale-[1.03]"
                      )}
                    >
                      <span
                        className={cn(
                          "relative h-12 w-12 rounded-lg border-2 overflow-hidden shadow-sm transition-all",
                          "ring-2 ring-amber-400",
                          selectedCode === code
                            ? "border-foreground shadow-lg"
                            : "border-transparent"
                        )}
                        style={getSwatchStyle(color)}
                      >
                        <span className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
