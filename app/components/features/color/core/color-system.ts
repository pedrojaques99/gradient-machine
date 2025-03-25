import { hexToRgb, rgbToHex } from '@/app/lib/utils';

export interface ColorProperties {
  brightness: number;
  saturation: number;
  contrast: number;
  hex: string;
  rgb: { r: number; g: number; b: number };
}

export type DesignSystemRoleId = 'primary' | 'secondary' | 'accent' | 'background';

export interface ColorRole {
  id: DesignSystemRoleId;
  name: string;
  description: string;
  example: string;
  criteria: {
    brightness?: [number, number];
    saturation?: [number, number];
    contrast?: [number, number];
  };
}

export interface ColorInfo {
  color: string;
  role: DesignSystemRoleId | null;
  properties: ColorProperties | null;
  index: number;
}

// Add memoization for color calculations
const colorCache = new Map<string, ColorProperties>();

export function getColorProperties(color: string): ColorProperties | null {
  // Check cache first
  if (colorCache.has(color)) {
    return colorCache.get(color)!;
  }

  const rgb = hexToRgb(color);
  if (!rgb) return null;

  const { r, g, b } = rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const s = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
  const c = (max - min) / 255;

  const properties = {
    brightness: l / 255,
    saturation: s,
    contrast: c,
    hex: color,
    rgb
  };

  // Cache the result
  colorCache.set(color, properties);
  return properties;
}

export function assignColorRole(color: string, usedRoles: Set<string> = new Set()): DesignSystemRoleId | null {
  const properties = getColorProperties(color);
  if (!properties) return null;

  for (const role of COLOR_ROLES) {
    if (usedRoles.has(role.id)) continue;

    const { brightness, saturation, contrast } = properties;
    const { criteria } = role;

    const matchesBrightness = !criteria.brightness || 
      (brightness >= criteria.brightness[0] && brightness <= criteria.brightness[1]);
    const matchesSaturation = !criteria.saturation || 
      (saturation >= criteria.saturation[0] && saturation <= criteria.saturation[1]);
    const matchesContrast = !criteria.contrast || 
      (contrast >= criteria.contrast[0] && contrast <= criteria.contrast[1]);

    if (matchesBrightness && matchesSaturation && matchesContrast) {
      return role.id;
    }
  }

  return null;
}

export function validateColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

// Add type safety for color variations
export type ColorVariationType = 'lighter' | 'darker' | 'saturated' | 'desaturated' | 'original';

export interface ColorVariation {
  hex: string;
  type: ColorVariationType;
  properties: ColorProperties;
}

export const COLOR_ROLES: ColorRole[] = [
  {
    id: 'primary',
    name: "Primary",
    description: "Main brand color",
    example: "Buttons, links, and primary actions",
    criteria: {
      brightness: [0.3, 0.7],
      saturation: [0.5, 1],
      contrast: [0.6, 1]
    }
  },
  {
    id: 'secondary',
    name: "Secondary",
    description: "Supporting color",
    example: "Secondary buttons, borders, and accents",
    criteria: {
      brightness: [0.2, 0.6],
      saturation: [0.3, 0.8],
      contrast: [0.4, 0.8]
    }
  },
  {
    id: 'accent',
    name: "Accent",
    description: "Highlight color",
    example: "Highlights, badges, and special elements",
    criteria: {
      brightness: [0.4, 0.8],
      saturation: [0.6, 1],
      contrast: [0.5, 0.9]
    }
  },
  {
    id: 'background',
    name: "Background",
    description: "Base color",
    example: "Page background, cards, and containers",
    criteria: {
      brightness: [0, 0.3],
      saturation: [0, 0.3],
      contrast: [0, 0.4]
    }
  }
];

// Add validation for color role criteria
export function validateColorRoleCriteria(criteria: ColorRole['criteria']): boolean {
  const validateRange = (range?: [number, number]) => {
    if (!range) return true;
    return range[0] >= 0 && range[1] <= 1 && range[0] <= range[1];
  };

  return (
    validateRange(criteria.brightness) &&
    validateRange(criteria.saturation) &&
    validateRange(criteria.contrast)
  );
}

// Add color role validation
export function validateColorRole(role: ColorRole): boolean {
  return (
    typeof role.id === 'string' &&
    typeof role.name === 'string' &&
    typeof role.description === 'string' &&
    typeof role.example === 'string' &&
    validateColorRoleCriteria(role.criteria)
  );
}

// Validate all color roles on initialization
COLOR_ROLES.forEach(role => {
  if (!validateColorRole(role)) {
    console.error(`Invalid color role configuration: ${role.id}`);
  }
});

export function generateColorVariations(color: string): ColorVariation[] {
  const rgb = hexToRgb(color);
  if (!rgb) return [];

  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const variations: ColorVariation[] = [];

  // Original color
  const originalProps = getColorProperties(color);
  if (originalProps) {
    variations.push({
      hex: color,
      type: 'original',
      properties: originalProps
    });
  }

  // Generate variations
  const steps = [
    { l: l + 0.1, s, type: 'lighter' },
    { l: l - 0.1, s, type: 'darker' },
    { l, s: Math.min(1, s + 0.1), type: 'saturated' },
    { l, s: Math.max(0, s - 0.1), type: 'desaturated' }
  ] as const;

  steps.forEach(({ l: newL, s: newS, type }) => {
    const { r, g, b } = hslToRgb(h, newS, newL);
    const hex = rgbToHex(r, g, b);
    const props = getColorProperties(hex);
    if (props) {
      variations.push({
        hex,
        type,
        properties: props
      });
    }
  });

  return variations;
}

// Helper functions for color conversions
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    
    h /= 6;
  }

  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  let r: number;
  let g: number;
  let b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
} 