"use client";

import { calculatePrice, type MatConfig, PRICING } from "@/lib/mat-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calculator, Tag, Percent } from "lucide-react";

interface PriceCalculatorProps {
  config: MatConfig;
}

export function PriceCalculator({ config }: PriceCalculatorProps) {
  const pricing = calculatePrice(config);

  // Find current discount tier
  const tier = PRICING.quantity.tiers.find(
    (t) => config.quantity >= t.min && config.quantity <= t.max
  );
  const discountPercent = (tier?.discount ?? 0) * 100;

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="w-5 h-5" />
          Price Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mat type</span>
            <span className="font-medium capitalize">{config.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Size</span>
            <span className="font-medium">
              {config.size.width} × {config.size.height} cm
              {config.size.isCustom && (
                <Badge variant="secondary" className="ml-1 text-xs">Custom</Badge>
              )}
            </span>
          </div>
          {config.rubberBorder && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rubber border</span>
              <span className="font-medium text-green-600">+{PRICING.rubberBorder.percentage * 100}%</span>
            </div>
          )}
          {config.logoColors > 1 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Logo colors</span>
              <span className="font-medium">
                {config.logoColors} (+€{((config.logoColors - 1) * PRICING.logoColors.extraPerColor).toFixed(2)})
              </span>
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Unit price</span>
            <span className="font-medium">€{pricing.unitPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              Quantity
              {discountPercent > 0 && (
                <Badge variant="secondary" className="text-xs gap-0.5">
                  <Percent className="w-3 h-3" />
                  {discountPercent}% off
                </Badge>
              )}
            </span>
            <span className="font-medium">×{config.quantity}</span>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">€{pricing.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">VAT ({PRICING.vat * 100}%)</span>
            <span className="font-medium">€{pricing.vat.toFixed(2)}</span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold flex items-center gap-1">
            <Tag className="w-4 h-4" />
            Total
          </span>
          <span className="text-2xl font-bold text-primary">€{pricing.total.toFixed(2)}</span>
        </div>

        {discountPercent > 0 && (
          <p className="text-xs text-center text-muted-foreground">
            You save {discountPercent}% with quantity discount!
          </p>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Volume discounts:</strong></p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>5-9 units: 5% off</li>
            <li>10-24 units: 10% off</li>
            <li>25-49 units: 15% off</li>
            <li>50+ units: 20% off</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
