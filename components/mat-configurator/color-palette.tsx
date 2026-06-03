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

export function ColorPalette({
  selectedCode,
  onSelect,
  suggestedCodes = [],
}: ColorPaletteProps) {
  return (
    <div className="space-y-3">
      {suggestedCodes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Suggested Colors</span>
            <Badge variant="secondary" className="text-xs">AI Match</Badge>
          </div>
          <div className="flex gap-2">
            {suggestedCodes.map((code) => {
              const color = MAT_COLORS.find((c) => c.code === code);
              if (!color) return null;
              return (
                <Tooltip key={code}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onSelect(code)}
                      className={cn(
                        "relative w-12 h-12 rounded-lg border-2 transition-all hover:scale-105 ring-2 ring-amber-400",
                        selectedCode === code
                          ? "border-foreground shadow-lg"
                          : "border-transparent"
                      )}
                      style={{ backgroundColor: color.hex }}
                    >
                      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium text-foreground">
                        {code}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{color.name} ({code})</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <span className="text-sm font-medium text-foreground">All Colors</span>
        <ScrollArea className="h-40">
          <div className="grid grid-cols-8 gap-1.5 pr-3">
            {MAT_COLORS.map((color) => (
              <Tooltip key={color.code}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSelect(color.code)}
                    className={cn(
                      "relative w-8 h-8 rounded-md border-2 transition-all hover:scale-110",
                      selectedCode === color.code
                        ? "border-foreground shadow-md ring-2 ring-foreground/20"
                        : "border-border hover:border-muted-foreground",
                      suggestedCodes.includes(color.code) && selectedCode !== color.code
                        ? "ring-1 ring-amber-400"
                        : ""
                    )}
                    style={{ backgroundColor: color.hex }}
                  />
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
