export interface MatColorOption {
  code: string;
  name: string;
  hex: string;
  swatch: string;
}

// Mat color palette (C1-C66)
export const MAT_COLORS: readonly MatColorOption[] = [
  { code: "C1",  name: "Black",         hex: "#1a1a1a", swatch: "/swatches/swatch_01_r1c1.webp" },
  { code: "C2",  name: "Charcoal",      hex: "#36454f", swatch: "/swatches/swatch_02_r1c2.webp" },
  { code: "C3",  name: "Dark Gray",     hex: "#4a4a4a", swatch: "/swatches/swatch_03_r1c3.webp" },
  { code: "C4",  name: "Medium Gray",   hex: "#6e6e6e", swatch: "/swatches/swatch_04_r1c4.webp" },
  { code: "C5",  name: "Light Gray",    hex: "#9e9e9e", swatch: "/swatches/swatch_05_r1c5.webp" },
  { code: "C6",  name: "Silver",        hex: "#c0c0c0", swatch: "/swatches/swatch_06_r1c6.webp" },
  { code: "C7",  name: "White",         hex: "#f5f5f5", swatch: "/swatches/swatch_07_r1c7.webp" },
  { code: "C8",  name: "Navy Blue",     hex: "#1e3a5f", swatch: "/swatches/swatch_08_r1c8.webp" },

  { code: "C9",  name: "Royal Blue",    hex: "#2b5dad", swatch: "/swatches/swatch_09_r2c1.webp" },
  { code: "C10", name: "Sky Blue",      hex: "#5fa4d9", swatch: "/swatches/swatch_10_r2c2.webp" },
  { code: "C11", name: "Light Blue",    hex: "#a0c4e8", swatch: "/swatches/swatch_11_r2c3.webp" },
  { code: "C12", name: "Teal",          hex: "#1a7d7e", swatch: "/swatches/swatch_12_r2c4.webp" },
  { code: "C13", name: "Dark Teal",     hex: "#0f5959", swatch: "/swatches/swatch_13_r2c5.webp" },
  { code: "C14", name: "Forest Green",  hex: "#1c4e2c", swatch: "/swatches/swatch_14_r2c6.webp" },
  { code: "C15", name: "Kelly Green",   hex: "#2e8b45", swatch: "/swatches/swatch_15_r2c7.webp" },
  { code: "C16", name: "Lime Green",    hex: "#5fa534", swatch: "/swatches/swatch_16_r2c8.webp" },

  { code: "C17", name: "Light Green",   hex: "#8bc34a", swatch: "/swatches/swatch_17_r3c1.webp" },
  { code: "C18", name: "Olive",         hex: "#5c5c1e", swatch: "/swatches/swatch_18_r3c2.webp" },
  { code: "C19", name: "Dark Brown",    hex: "#3d2314", swatch: "/swatches/swatch_19_r3c3.webp" },
  { code: "C20", name: "Chocolate",     hex: "#5a3d2b", swatch: "/swatches/swatch_20_r3c4.webp" },
  { code: "C21", name: "Brown",         hex: "#7d5a4f", swatch: "/swatches/swatch_21_r3c5.webp" },
  { code: "C22", name: "Tan",           hex: "#c4a77d", swatch: "/swatches/swatch_22_r3c6.webp" },
  { code: "C23", name: "Beige",         hex: "#d4c5a9", swatch: "/swatches/swatch_23_r3c7.webp" },
  { code: "C24", name: "Cream",         hex: "#f5f5dc", swatch: "/swatches/swatch_24_r3c8.webp" },

  { code: "C25", name: "Dark Red",      hex: "#6b1e23", swatch: "/swatches/swatch_25_r4c1.webp" },
  { code: "C26", name: "Burgundy",      hex: "#8b2942", swatch: "/swatches/swatch_26_r4c2.webp" },
  { code: "C27", name: "Red",           hex: "#c41e3a", swatch: "/swatches/swatch_27_r4c3.webp" },
  { code: "C28", name: "Bright Red",    hex: "#e63946", swatch: "/swatches/swatch_28_r4c4.webp" },
  { code: "C29", name: "Coral",         hex: "#e8775e", swatch: "/swatches/swatch_29_r4c5.webp" },
  { code: "C30", name: "Orange",        hex: "#e87722", swatch: "/swatches/swatch_30_r4c6.webp" },
  { code: "C31", name: "Bright Orange", hex: "#f5a623", swatch: "/swatches/swatch_31_r4c7.webp" },
  { code: "C32", name: "Gold",          hex: "#d4a012", swatch: "/swatches/swatch_32_r4c8.webp" },

  { code: "C33", name: "Yellow",        hex: "#f5d033", swatch: "/swatches/swatch_33_r5c1.webp" },
  { code: "C34", name: "Light Yellow",  hex: "#f9e785", swatch: "/swatches/swatch_34_r5c2.webp" },
  { code: "C35", name: "Magenta",       hex: "#a6305d", swatch: "/swatches/swatch_35_r5c3.webp" },
  { code: "C36", name: "Pink",          hex: "#d4719a", swatch: "/swatches/swatch_36_r5c4.webp" },
  { code: "C37", name: "Light Pink",    hex: "#f0b4c4", swatch: "/swatches/swatch_37_r5c5.webp" },
  { code: "C38", name: "Deep Purple",   hex: "#4a2354", swatch: "/swatches/swatch_38_r5c6.webp" },
  { code: "C39", name: "Purple",        hex: "#6b3fa0", swatch: "/swatches/swatch_39_r5c7.webp" },
  { code: "C40", name: "Lavender",      hex: "#9370db", swatch: "/swatches/swatch_40_r5c8.webp" },

  { code: "C41", name: "Slate Blue",    hex: "#5a6e8a", swatch: "/swatches/swatch_41_r6c1.webp" },
  { code: "C42", name: "Steel Blue",    hex: "#4a6f8a", swatch: "/swatches/swatch_42_r6c2.webp" },
  { code: "C43", name: "Mint",          hex: "#7fc9b7", swatch: "/swatches/swatch_43_r6c3.webp" },
  { code: "C44", name: "Aqua",          hex: "#4ec5d4", swatch: "/swatches/swatch_44_r6c4.webp" },
  { code: "C45", name: "Turquoise",     hex: "#30b5a1", swatch: "/swatches/swatch_45_r6c5.webp" },
  { code: "C46", name: "Copper",        hex: "#b87333", swatch: "/swatches/swatch_46_r6c6.webp" },
  { code: "C47", name: "Bronze",        hex: "#8c6239", swatch: "/swatches/swatch_47_r6c7.webp" },
  { code: "C48", name: "Rust",          hex: "#9e4b2b", swatch: "/swatches/swatch_48_r6c8.webp" },

  { code: "C49", name: "Terracotta",    hex: "#c66b3d", swatch: "/swatches/swatch_49_r7c1.webp" },
  { code: "C50", name: "Salmon",        hex: "#e09988", swatch: "/swatches/swatch_50_r7c2.webp" },
  { code: "C51", name: "Peach",         hex: "#f5c4a1", swatch: "/swatches/swatch_51_r7c3.webp" },
  { code: "C52", name: "Dusty Rose",    hex: "#c5a3a3", swatch: "/swatches/swatch_52_r7c4.webp" },
  { code: "C53", name: "Mauve",         hex: "#9e7b91", swatch: "/swatches/swatch_53_r7c5.webp" },
  { code: "C54", name: "Plum",          hex: "#614051", swatch: "/swatches/swatch_54_r7c6.webp" },
  { code: "C55", name: "Wine",          hex: "#722f37", swatch: "/swatches/swatch_55_r7c7.webp" },
  { code: "C56", name: "Hunter Green",  hex: "#2d4a3e", swatch: "/swatches/swatch_56_r7c8.webp" },

  { code: "C57", name: "Sage",          hex: "#9caf88", swatch: "/swatches/swatch_57_r8c1.webp" },
  { code: "C58", name: "Moss",          hex: "#5e6e5e", swatch: "/swatches/swatch_58_r8c2.webp" },
  { code: "C59", name: "Graphite",      hex: "#383838", swatch: "/swatches/swatch_59_r8c3.webp" },
  { code: "C60", name: "Pewter",        hex: "#787878", swatch: "/swatches/swatch_60_r8c4.webp" },
  { code: "C61", name: "Stone",         hex: "#a89f91", swatch: "/swatches/swatch_61_r8c5.webp" },
  { code: "C62", name: "Sand",          hex: "#d4c4a8", swatch: "/swatches/swatch_62_r8c6.webp" },
  { code: "C63", name: "Ivory",         hex: "#eeebe3", swatch: "/swatches/swatch_63_r8c7.webp" },
  { code: "C64", name: "Camel",         hex: "#c19a6b", swatch: "/swatches/swatch_64_r8c8.webp" },

  { code: "C65", name: "Coffee",        hex: "#6f4e37", swatch: "/swatches/swatch_65_r9c1.webp" },
  { code: "C66", name: "Espresso",      hex: "#3c2415", swatch: "/swatches/swatch_66_r9c2.webp" },
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
    indoor: 0.85, // per m²-equivalent pricing factor based on original project logic
    outdoor: 1.25,
  },
  rubberBorder: {
    percentage: 0.15,
  },
  logoColors: {
    included: 1,
    extraPerColor: 5.0,
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
  vat: 0.21,
  minPrice: 29.95,
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

  // Base price calculation
  const area = size.width * size.height;
  let unitPrice = (area / 10000) * PRICING.basePrice[type];

  // Apply minimum price
  unitPrice = Math.max(unitPrice, PRICING.minPrice);

  // Add rubber border cost
  if (rubberBorder) {
    unitPrice *= 1 + PRICING.rubberBorder.percentage;
  }

  // Add extra logo colors cost
  if (logoColors > PRICING.logoColors.included) {
    unitPrice +=
      (logoColors - PRICING.logoColors.included) *
      PRICING.logoColors.extraPerColor;
  }

  // Find quantity discount
  const tier = PRICING.quantity.tiers.find(
    (t) => quantity >= t.min && quantity <= t.max
  );
  const discount = tier?.discount ?? 0;

  // Apply discount
  unitPrice *= 1 - discount;

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
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
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

  if (imageColors.length === 0) return [];

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
      (existing) => colorDistance(rgb, hexToRgb(existing.hex)) < 30
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
