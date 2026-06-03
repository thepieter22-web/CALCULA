// Mat color palette (C1-C66)
export const MAT_COLORS = [
  { code: "C1", name: "Black", hex: "#1a1a1a" },
  { code: "C2", name: "Charcoal", hex: "#36454f" },
  { code: "C3", name: "Dark Gray", hex: "#4a4a4a" },
  { code: "C4", name: "Medium Gray", hex: "#6e6e6e" },
  { code: "C5", name: "Light Gray", hex: "#9e9e9e" },
  { code: "C6", name: "Silver", hex: "#c0c0c0" },
  { code: "C7", name: "White", hex: "#f5f5f5" },
  { code: "C8", name: "Navy Blue", hex: "#1e3a5f" },
  { code: "C9", name: "Royal Blue", hex: "#2b5dad" },
  { code: "C10", name: "Sky Blue", hex: "#5fa4d9" },
  { code: "C11", name: "Light Blue", hex: "#a0c4e8" },
  { code: "C12", name: "Teal", hex: "#1a7d7e" },
  { code: "C13", name: "Dark Teal", hex: "#0f5959" },
  { code: "C14", name: "Forest Green", hex: "#1c4e2c" },
  { code: "C15", name: "Kelly Green", hex: "#2e8b45" },
  { code: "C16", name: "Lime Green", hex: "#5fa534" },
  { code: "C17", name: "Light Green", hex: "#8bc34a" },
  { code: "C18", name: "Olive", hex: "#5c5c1e" },
  { code: "C19", name: "Dark Brown", hex: "#3d2314" },
  { code: "C20", name: "Chocolate", hex: "#5a3d2b" },
  { code: "C21", name: "Brown", hex: "#7d5a4f" },
  { code: "C22", name: "Tan", hex: "#c4a77d" },
  { code: "C23", name: "Beige", hex: "#d4c5a9" },
  { code: "C24", name: "Cream", hex: "#f5f5dc" },
  { code: "C25", name: "Dark Red", hex: "#6b1e23" },
  { code: "C26", name: "Burgundy", hex: "#8b2942" },
  { code: "C27", name: "Red", hex: "#c41e3a" },
  { code: "C28", name: "Bright Red", hex: "#e63946" },
  { code: "C29", name: "Coral", hex: "#e8775e" },
  { code: "C30", name: "Orange", hex: "#e87722" },
  { code: "C31", name: "Bright Orange", hex: "#f5a623" },
  { code: "C32", name: "Gold", hex: "#d4a012" },
  { code: "C33", name: "Yellow", hex: "#f5d033" },
  { code: "C34", name: "Light Yellow", hex: "#f9e785" },
  { code: "C35", name: "Magenta", hex: "#a6305d" },
  { code: "C36", name: "Pink", hex: "#d4719a" },
  { code: "C37", name: "Light Pink", hex: "#f0b4c4" },
  { code: "C38", name: "Deep Purple", hex: "#4a2354" },
  { code: "C39", name: "Purple", hex: "#6b3fa0" },
  { code: "C40", name: "Lavender", hex: "#9370db" },
  { code: "C41", name: "Slate Blue", hex: "#5a6e8a" },
  { code: "C42", name: "Steel Blue", hex: "#4a6f8a" },
  { code: "C43", name: "Mint", hex: "#7fc9b7" },
  { code: "C44", name: "Aqua", hex: "#4ec5d4" },
  { code: "C45", name: "Turquoise", hex: "#30b5a1" },
  { code: "C46", name: "Copper", hex: "#b87333" },
  { code: "C47", name: "Bronze", hex: "#8c6239" },
  { code: "C48", name: "Rust", hex: "#9e4b2b" },
  { code: "C49", name: "Terracotta", hex: "#c66b3d" },
  { code: "C50", name: "Salmon", hex: "#e09988" },
  { code: "C51", name: "Peach", hex: "#f5c4a1" },
  { code: "C52", name: "Dusty Rose", hex: "#c5a3a3" },
  { code: "C53", name: "Mauve", hex: "#9e7b91" },
  { code: "C54", name: "Plum", hex: "#614051" },
  { code: "C55", name: "Wine", hex: "#722f37" },
  { code: "C56", name: "Hunter Green", hex: "#2d4a3e" },
  { code: "C57", name: "Sage", hex: "#9caf88" },
  { code: "C58", name: "Moss", hex: "#5e6e5e" },
  { code: "C59", name: "Graphite", hex: "#383838" },
  { code: "C60", name: "Pewter", hex: "#787878" },
  { code: "C61", name: "Stone", hex: "#a89f91" },
  { code: "C62", name: "Sand", hex: "#d4c4a8" },
  { code: "C63", name: "Ivory", hex: "#eeebe3" },
  { code: "C64", name: "Camel", hex: "#c19a6b" },
  { code: "C65", name: "Coffee", hex: "#6f4e37" },
  { code: "C66", name: "Espresso", hex: "#3c2415" },
] as const;

// Standard sizes in cm
export const STANDARD_SIZES = [
  { label: "40 × 60 cm", width: 40, height: 60 },
  { label: "60 × 85 cm", width: 60, height: 85 },
  { label: "85 × 115 cm", width: 85, height: 115 },
  { label: "115 × 175 cm", width: 115, height: 175 },
] as const;

// Pricing configuration
export const PRICING = {
  basePrice: {
    indoor: 0.85, // per cm²
    outdoor: 1.25, // per cm²
  },
  rubberBorder: {
    percentage: 0.15, // 15% extra
  },
  logoColors: {
    included: 1,
    extraPerColor: 5.0, // EUR per extra color
  },
  quantity: {
    tiers: [
      { min: 1, max: 4, discount: 0 },
      { min: 5, max: 9, discount: 0.05 },
      { min: 10, max: 24, discount: 0.10 },
      { min: 25, max: 49, discount: 0.15 },
      { min: 50, max: Infinity, discount: 0.20 },
    ],
  },
  vat: 0.21, // 21%
  minPrice: 29.95, // minimum price per mat
} as const;

export type MatType = "indoor" | "outdoor";
export type Placement = "floor" | "frame";
export type Orientation = "landscape" | "portrait";

export interface MatConfig {
  type: MatType;
  placement: Placement;
  orientation: Orientation;
  rubberBorder: boolean;
  size: {
    width: number;
    height: number;
    isCustom: boolean;
  };
  colorCode: string;
  logo: {
    file: File | null;
    dataUrl: string | null;
    position: { x: number; y: number };
    scale: number;
    rotation: number;
  };
  quantity: number;
  logoColors: number;
}

export interface CartItem {
  type: MatType;
  placement: Placement;
  orientation: Orientation;
  size: { width: number; height: number };
  colorCode: string;
  rubberBorder: boolean;
  logoReference: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  vat: number;
  total: number;
}

// Calculate price
export function calculatePrice(config: MatConfig): {
  unitPrice: number;
  subtotal: number;
  vat: number;
  total: number;
} {
  const { type, size, rubberBorder, quantity, logoColors } = config;
  
  // Base price calculation (area in cm²)
  const area = size.width * size.height;
  let unitPrice = (area / 10000) * PRICING.basePrice[type];
  
  // Apply minimum price
  unitPrice = Math.max(unitPrice, PRICING.minPrice);
  
  // Add rubber border cost
  if (rubberBorder) {
    unitPrice *= (1 + PRICING.rubberBorder.percentage);
  }
  
  // Add extra logo colors cost
  if (logoColors > PRICING.logoColors.included) {
    unitPrice += (logoColors - PRICING.logoColors.included) * PRICING.logoColors.extraPerColor;
  }
  
  // Find quantity discount
  const tier = PRICING.quantity.tiers.find(
    t => quantity >= t.min && quantity <= t.max
  );
  const discount = tier?.discount ?? 0;
  
  // Apply discount
  unitPrice *= (1 - discount);
  
  // Calculate totals
  const subtotal = unitPrice * quantity;
  const vat = subtotal * PRICING.vat;
  const total = subtotal + vat;
  
  return {
    unitPrice: Math.round(unitPrice * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    vat: Math.round(vat * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

// Color matching helper
export function findClosestColors(
  imageColors: { r: number; g: number; b: number }[],
  count: number = 3
): typeof MAT_COLORS[number][] {
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : { r: 0, g: 0, b: 0 };
  };
  
  const colorDistance = (
    c1: { r: number; g: number; b: number },
    c2: { r: number; g: number; b: number }
  ) => {
    return Math.sqrt(
      Math.pow(c1.r - c2.r, 2) +
      Math.pow(c1.g - c2.g, 2) +
      Math.pow(c1.b - c2.b, 2)
    );
  };
  
  // Calculate average color from image colors
  const avgColor = imageColors.reduce(
    (acc, c) => ({
      r: acc.r + c.r / imageColors.length,
      g: acc.g + c.g / imageColors.length,
      b: acc.b + c.b / imageColors.length,
    }),
    { r: 0, g: 0, b: 0 }
  );
  
  // Sort mat colors by distance to average
  const sorted = [...MAT_COLORS].sort((a, b) => {
    const distA = colorDistance(avgColor, hexToRgb(a.hex));
    const distB = colorDistance(avgColor, hexToRgb(b.hex));
    return distA - distB;
  });
  
  // Return top N closest colors (excluding very similar colors)
  const result: typeof MAT_COLORS[number][] = [];
  for (const color of sorted) {
    if (result.length >= count) break;
    const rgb = hexToRgb(color.hex);
    const isTooSimilar = result.some(
      existing => colorDistance(rgb, hexToRgb(existing.hex)) < 30
    );
    if (!isTooSimilar) {
      result.push(color);
    }
  }
  
  return result;
}

// Extract dominant colors from image
export async function extractDominantColors(
  imageDataUrl: string
): Promise<{ r: number; g: number; b: number }[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve([]);
        return;
      }
      
      // Sample at smaller size for performance
      const sampleSize = 50;
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
      
      const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
      const colors: { r: number; g: number; b: number }[] = [];
      
      // Sample every 4th pixel
      for (let i = 0; i < imageData.data.length; i += 16) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        const a = imageData.data[i + 3];
        
        // Skip transparent pixels
        if (a > 128) {
          colors.push({ r, g, b });
        }
      }
      
      resolve(colors);
    };
    img.onerror = () => resolve([]);
    img.src = imageDataUrl;
  });
}
