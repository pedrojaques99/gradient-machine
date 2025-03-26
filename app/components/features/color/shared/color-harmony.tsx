'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { UI_CLASSES, UI_SPACING } from '@/app/lib/constants';
import { ColorPicker } from './color-picker';
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Input } from "@/app/components/ui/input";
import { Pencil } from 'lucide-react';

interface ColorHarmonyProps {
  baseColor: string;
  onSelect: (color: string) => void;
  onColorChange?: (color: string) => void;
  className?: string;
}

type HarmonyType = 'complementary' | 'analogous' | 'triadic' | 'split-complementary' | 'tetradic' | 'monochromatic';

interface HarmonyColors {
  type: HarmonyType;
  colors: string[];
  labels: string[];
  description: string;
  moodTags: string[];
  psychologicalImpact: string;
  usageTips: string[];
}

function getHarmonyColors(baseColor: string): HarmonyColors[] {
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
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
    h *= 360;
  }

  const complementary = {
    type: 'complementary' as HarmonyType,
    colors: [
      baseColor,
      hslToHex({ h: (h + 180) % 360, s: s * 100, l: l * 100 })
    ],
    labels: ['Base', 'Complementary'],
    description: 'Maximum contrast and stability. Creates a vibrant look when used at full saturation.',
    moodTags: ['Dynamic', 'Energetic', 'Balanced'],
    psychologicalImpact: 'Creates a sense of balance and energy, often used to draw attention and create visual interest.',
    usageTips: [
      'Use for call-to-action buttons',
      'Create visual hierarchy',
      'Highlight important elements'
    ]
  };

  const analogous = {
    type: 'analogous' as HarmonyType,
    colors: [
      hslToHex({ h: (h - 30 + 360) % 360, s: s * 100, l: l * 100 }),
      baseColor,
      hslToHex({ h: (h + 30) % 360, s: s * 100, l: l * 100 })
    ],
    labels: ['Harmonious Left', 'Base', 'Harmonious Right'],
    description: 'Natural, comfortable harmony that creates a serene and unified look.',
    moodTags: ['Peaceful', 'Cohesive', 'Flowing'],
    psychologicalImpact: 'Promotes a sense of calm and harmony, perfect for creating a soothing atmosphere.',
    usageTips: [
      'Background gradients',
      'Content sections',
      'Navigation elements'
    ]
  };

  const triadic = {
    type: 'triadic' as HarmonyType,
    colors: [
      baseColor,
      hslToHex({ h: (h + 120) % 360, s: s * 100, l: l * 100 }),
      hslToHex({ h: (h + 240) % 360, s: s * 100, l: l * 100 })
    ],
    labels: ['Base', 'Triadic 1', 'Triadic 2'],
    description: 'Vibrant and balanced, offering strong visual contrast while retaining harmony.',
    moodTags: ['Playful', 'Balanced', 'Vibrant'],
    psychologicalImpact: 'Creates a sense of excitement and creativity, ideal for dynamic and engaging designs.',
    usageTips: [
      'Brand colors',
      'Feature highlights',
      'Interactive elements'
    ]
  };

  const splitComplementary = {
    type: 'split-complementary' as HarmonyType,
    colors: [
      baseColor,
      hslToHex({ h: (h + 150) % 360, s: s * 100, l: l * 100 }),
      hslToHex({ h: (h + 210) % 360, s: s * 100, l: l * 100 })
    ],
    labels: ['Base', 'Split 1', 'Split 2'],
    description: 'High contrast but less tension than complementary. Sophisticated and balanced.',
    moodTags: ['Sophisticated', 'Refined', 'Dynamic'],
    psychologicalImpact: 'Offers a more subtle contrast than complementary colors while maintaining visual interest.',
    usageTips: [
      'Accent colors',
      'Secondary elements',
      'Content blocks'
    ]
  };

  const tetradic = {
    type: 'tetradic' as HarmonyType,
    colors: [
      baseColor,
      hslToHex({ h: (h + 90) % 360, s: s * 100, l: l * 100 }),
      hslToHex({ h: (h + 180) % 360, s: s * 100, l: l * 100 }),
      hslToHex({ h: (h + 270) % 360, s: s * 100, l: l * 100 })
    ],
    labels: ['Base', 'Tetradic 1', 'Tetradic 2', 'Tetradic 3'],
    description: 'Rich and complex harmony offering many possibilities for variation.',
    moodTags: ['Complex', 'Bold', 'Versatile'],
    psychologicalImpact: 'Creates a sophisticated and professional look, perfect for complex designs.',
    usageTips: [
      'Dashboard layouts',
      'Data visualization',
      'Complex interfaces'
    ]
  };

  const monochromatic = {
    type: 'monochromatic' as HarmonyType,
    colors: [
      hslToHex({ h, s: s * 100, l: Math.max(20, l * 100 - 30) }),
      baseColor,
      hslToHex({ h, s: s * 100, l: Math.min(90, l * 100 + 30) })
    ],
    labels: ['Darker', 'Base', 'Lighter'],
    description: 'Subtle and sophisticated using variations in lightness and saturation.',
    moodTags: ['Subtle', 'Elegant', 'Unified'],
    psychologicalImpact: 'Creates a sense of sophistication and elegance, ideal for minimalist designs.',
    usageTips: [
      'Text hierarchy',
      'Background variations',
      'Subtle gradients'
    ]
  };

  return [complementary, analogous, triadic, splitComplementary, tetradic, monochromatic];
}

function hslToHex({ h, s, l }: { h: number; s: number; l: number }): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(Math.min(k(n) - 3, 9 - k(n), 1), -1);
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`.toUpperCase();
}

export function ColorHarmony({ baseColor, onSelect, onColorChange, className }: ColorHarmonyProps) {
  const harmonyColors = React.useMemo(() => getHarmonyColors(baseColor), [baseColor]);
  const [selectedHarmony, setSelectedHarmony] = React.useState<HarmonyType | null>(null);
  const [expandedHarmony, setExpandedHarmony] = React.useState<HarmonyType | null>(null);

  return (
    <div className={cn('space-y-6', className)}>
      {harmonyColors.map((harmony) => (
        <motion.div
          key={harmony.type}
          className={cn(
            UI_CLASSES.card,
            'p-4 space-y-4 relative overflow-hidden',
            selectedHarmony === harmony.type && 'ring-2 ring-accent'
          )}
          onClick={() => setSelectedHarmony(harmony.type)}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium capitalize text-foreground">
                {harmony.type.replace('-', ' ')}
              </h3>
              <div className="flex gap-1">
                {harmony.moodTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {harmony.description}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {harmony.colors.map((color, index) => (
              <motion.div
                key={`${harmony.type}-${index}`}
                className="group relative"
                onClick={(e) => e.stopPropagation()}
              >
                <motion.button
                  className={cn(
                    'relative h-16 w-full rounded-md transition-all duration-300',
                    'hover:scale-105 active:scale-95',
                    'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
                    color === baseColor && 'ring-2 ring-accent ring-offset-2'
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => onSelect(color)}
                  whileHover={{ y: -2 }}
                >
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-md" />
                  <div className="absolute bottom-1 left-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-mono text-white/90 bg-black/40 px-1 rounded">
                      {color}
                    </span>
                  </div>
                  <span className="sr-only">{harmony.labels[index]}</span>
                </motion.button>
                {onColorChange && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 p-1 rounded-full hover:bg-black/60"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Pencil className="h-3 w-3 text-white" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <ColorPicker
                        color={color}
                        onChange={onColorChange}
                        compact
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </motion.div>
            ))}
          </div>

          {expandedHarmony === harmony.type && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-4 space-y-3 border-t border-zinc-800"
            >
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-foreground">Psychological Impact</h4>
                <p className="text-xs text-muted-foreground">{harmony.psychologicalImpact}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-foreground">Usage Tips</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {harmony.usageTips.map((tip, i) => (
                    <li key={i} className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-accent/50" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );
} 