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
                        {selectedCode === code && (
                          <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-[10px] font-bold text-black shadow">
                            ✓
                          </span>
                        )}
                      </span>

                      <span className="text-xs font-medium text-foreground">
                        {code}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {color.name} ({code})
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <span className="text-sm font-medium text-foreground">All Colors</span>

        <ScrollArea className="h-48">
          <div className="grid grid-cols-8 gap-2 pr-3">
            {MAT_COLORS.map((color) => (
              <Tooltip key={color.code}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onSelect(color.code)}
                    className={cn(
                      "group relative h-10 w-10 rounded-md border-2 overflow-hidden transition-all",
                      "hover:scale-110",
                      selectedCode === color.code
                        ? "border-foreground shadow-md ring-2 ring-foreground/20"
                        : "border-border hover:border-muted-foreground",
                      suggestedCodes.includes(color.code) &&
                        selectedCode !== color.code
                        ? "ring-1 ring-amber-400"
                        : ""
                    )}
                    style={getSwatchStyle(color)}
                    aria-label={`${color.name} (${color.code})`}
                    title={`${color.name} (${color.code})`}
                  >
                    <span className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />

                    {selectedCode === color.code && (
                      <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/90 text-[9px] font-bold text-black shadow">
                        ✓
                      </span>
                    )}
                  </button>
                </TooltipTrigger>

                <TooltipContent side="top">
                  <p className="font-medium">{color.name}</p>
                  <p className="text-xs text-muted-foreground">{color.code}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
