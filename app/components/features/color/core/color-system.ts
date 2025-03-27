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

// Add cache management
const MAX_CACHE_SIZE = 1000;
const colorCache = new Map<string, ColorProperties>();

export function clearColorCache() {
  colorCache.clear();
}

export function invalidateColorCache(color: string) {
  colorCache.delete(color);
}

export function getColorProperties(color: string): ColorProperties | null {
  try {
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

    // Manage cache size
    if (colorCache.size >= MAX_CACHE_SIZE) {
      const firstKey = colorCache.keys().next().value;
      if (firstKey) {
        colorCache.delete(firstKey);
      }
    }

    // Cache the result
    colorCache.set(color, properties);
    return properties;
  } catch (error) {
    console.error('Error calculating color properties:', error);
    return null;
  }
}

// Improve role assignment with validation
export function assignColorRole(color: string, usedRoles: Set<string> = new Set()): { roleId: DesignSystemRoleId | null; reason?: string } {
  const properties = getColorProperties(color);
  if (!properties) {
    return { roleId: null, reason: 'Invalid color properties' };
  }

  const availableRoles = COLOR_ROLES.filter(role => !usedRoles.has(role.id));
  if (availableRoles.length === 0) {
    return { roleId: null, reason: 'No available roles' };
  }

  for (const role of availableRoles) {
    const { brightness, saturation, contrast } = properties;
    const { criteria } = role;

    const matchesBrightness = !criteria.brightness || 
      (brightness >= criteria.brightness[0] && brightness <= criteria.brightness[1]);
    const matchesSaturation = !criteria.saturation || 
      (saturation >= criteria.saturation[0] && saturation <= criteria.saturation[1]);
    const matchesContrast = !criteria.contrast || 
      (contrast >= criteria.contrast[0] && contrast <= criteria.contrast[1]);

    if (matchesBrightness && matchesSaturation && matchesContrast) {
      return { roleId: role.id };
    }
  }

  return { 
    roleId: null, 
    reason: 'Color does not match any role criteria' 
  };
}

// Improve color validation
export function validateColor(color: string): { isValid: boolean; reason?: string } {
  if (!color) {
    return { isValid: false, reason: 'Color is required' };
  }

  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return { isValid: false, reason: 'Invalid color format. Use hex format (e.g., #FF0000)' };
  }

  const properties = getColorProperties(color);
  if (!properties) {
    return { isValid: false, reason: 'Invalid color properties' };
  }

  return { isValid: true };
}

// Add color role validation with feedback
export function validateColorForRole(color: string, roleId: DesignSystemRoleId): { isValid: boolean; reason?: string } {
  const role = COLOR_ROLES.find(r => r.id === roleId);
  if (!role) {
    return { isValid: false, reason: 'Invalid role' };
  }

  const properties = getColorProperties(color);
  if (!properties) {
    return { isValid: false, reason: 'Invalid color properties' };
  }

  const { brightness, saturation, contrast } = properties;
  const { criteria } = role;

  const matchesBrightness = !criteria.brightness || 
    (brightness >= criteria.brightness[0] && brightness <= criteria.brightness[1]);
  const matchesSaturation = !criteria.saturation || 
    (saturation >= criteria.saturation[0] && saturation <= criteria.saturation[1]);
  const matchesContrast = !criteria.contrast || 
    (contrast >= criteria.contrast[0] && contrast <= criteria.contrast[1]);

  if (!matchesBrightness) {
    return { 
      isValid: false, 
      reason: `Brightness (${brightness.toFixed(2)}) outside range [${criteria.brightness![0]}, ${criteria.brightness![1]}]` 
    };
  }

  if (!matchesSaturation) {
    return { 
      isValid: false, 
      reason: `Saturation (${saturation.toFixed(2)}) outside range [${criteria.saturation![0]}, ${criteria.saturation![1]}]` 
    };
  }

  if (!matchesContrast) {
    return { 
      isValid: false, 
      reason: `Contrast (${contrast.toFixed(2)}) outside range [${criteria.contrast![0]}, ${criteria.contrast![1]}]` 
    };
  }

  return { isValid: true };
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
    name: "Primária",
    description: "Cor principal da marca",
    example: "Botões, links e ações principais",
    criteria: {
      brightness: [0.3, 0.7],
      saturation: [0.5, 1],
      contrast: [0.6, 1]
    }
  },
  {
    id: 'secondary',
    name: "Secundária",
    description: "Cor de suporte",
    example: "Botões secundários, bordas e acentos",
    criteria: {
      brightness: [0.2, 0.6],
      saturation: [0.3, 0.8],
      contrast: [0.4, 0.8]
    }
  },
  {
    id: 'accent',
    name: "Destaque",
    description: "Cor de destaque",
    example: "Destaques, badges e elementos especiais",
    criteria: {
      brightness: [0.4, 0.8],
      saturation: [0.6, 1],
      contrast: [0.5, 0.9]
    }
  },
  {
    id: 'background',
    name: "Background",
    description: "Cor de fundo",
    example: "Background, cartões e fundos",
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