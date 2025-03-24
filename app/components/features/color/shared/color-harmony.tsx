'use client';

import React from 'react';
import { motion } from 'framer-motion';

// Simple class name merging function
function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}

interface ColorHarmonyProps {
  baseColor: string;
  onSelect: (color: string) => void;
  className?: string;
}

type HarmonyType = 'complementary' | 'analogous' | 'triadic';

interface HarmonyColors {
  type: HarmonyType;
  colors: string[];
  labels: string[];
}

function getHarmonyColors(baseColor: string): HarmonyColors[] {
  // Convert hex to HSL
  const hex = baseColor.replace(/^#/, "");
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

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
    h *= 360;
  }

  // Generate harmony colors
  const complementary = {
    type: 'complementary' as HarmonyType,
    colors: [
      baseColor,
      hslToHex({ h: (h + 180) % 360, s: s * 100, l: l * 100 })
    ],
    labels: ['Base', 'Complementary']
  };

  const analogous = {
    type: 'analogous' as HarmonyType,
    colors: [
      hslToHex({ h: (h - 30 + 360) % 360, s: s * 100, l: l * 100 }),
      baseColor,
      hslToHex({ h: (h + 30) % 360, s: s * 100, l: l * 100 })
    ],
    labels: ['Analogous 1', 'Base', 'Analogous 2']
  };

  const triadic = {
    type: 'triadic' as HarmonyType,
    colors: [
      baseColor,
      hslToHex({ h: (h + 120) % 360, s: s * 100, l: l * 100 }),
      hslToHex({ h: (h + 240) % 360, s: s * 100, l: l * 100 })
    ],
    labels: ['Base', 'Triadic 1', 'Triadic 2']
  };

  return [complementary, analogous, triadic];
}

function hslToHex({ h, s, l }: { h: number; s: number; l: number }): string {
  s /= 100;
  l /= 100;

  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(Math.min(k(n) - 3, 9 - k(n), 1), -1);
  let r = Math.round(255 * f(0));
  let g = Math.round(255 * f(8));
  let b = Math.round(255 * f(4));

  const toHex = (x: number) => {
    const hex = x.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function ColorHarmony({ baseColor, onSelect, className }: ColorHarmonyProps) {
  const harmonyColors = React.useMemo(() => getHarmonyColors(baseColor), [baseColor]);

  return (
    <div className={cn('space-y-4', className)}>
      {harmonyColors.map((harmony) => (
        <div key={harmony.type} className="space-y-2">
          <label className="text-sm font-medium capitalize text-zinc-700 dark:text-zinc-300">
            {harmony.type} Colors
          </label>
          <div className="grid grid-cols-3 gap-2">
            {harmony.colors.map((color, index) => (
              <motion.button
                key={`${harmony.type}-${index}`}
                className={cn(
                  'relative h-12 w-full rounded-lg border-2 transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  'hover:scale-105 active:scale-95',
                  color === baseColor
                    ? 'border-primary ring-2 ring-primary ring-offset-2'
                    : 'border-transparent hover:border-primary/50'
                )}
                style={{ backgroundColor: color }}
                onClick={() => onSelect(color)}
                aria-label={`Select ${harmony.labels[index]} color`}
                title={`${harmony.labels[index]}: ${color}`}
              >
                <span className="sr-only">{harmony.labels[index]}</span>
              </motion.button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 