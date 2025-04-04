'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { UI_CLASSES, UI_SPACING, GRADIENT_CLASSES, ACCENT_HIGHLIGHT_CLASSES } from '@/app/lib/constants';
import { ColorPicker } from './color-picker';
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Input } from "@/app/components/ui/input";
import { Pencil, ArrowLeft } from 'lucide-react';
import { Navigation } from '@/app/components/shared/Navigation';
import { useRouter } from 'next/navigation';
import { ColorSwatch } from '@/app/components/shared/ColorSwatch';
import { useGradient } from '@/app/contexts/GradientContext';

interface ColorHarmonyProps {
  baseColor?: string;
  onSelect?: (color: string) => void;
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

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

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

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function getHarmonyColors(baseColor: string): HarmonyColors[] {
  const rgb = hexToRgb(baseColor);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const { h, s, l } = hsl;

  // Adjust saturation and lightness for better harmony
  const adjustedS = Math.min(100, s + 10);
  const adjustedL = Math.min(90, Math.max(20, l));

  const complementary = {
    type: 'complementary' as HarmonyType,
    colors: [
      baseColor,
      hslToHex((h + 180) % 360, adjustedS, adjustedL)
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
      hslToHex((h - 30 + 360) % 360, adjustedS, adjustedL),
      baseColor,
      hslToHex((h + 30) % 360, adjustedS, adjustedL)
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
      hslToHex((h + 120) % 360, adjustedS, adjustedL),
      hslToHex((h + 240) % 360, adjustedS, adjustedL)
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
      hslToHex((h + 150) % 360, adjustedS, adjustedL),
      hslToHex((h + 210) % 360, adjustedS, adjustedL)
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
      hslToHex((h + 90) % 360, adjustedS, adjustedL),
      hslToHex((h + 180) % 360, adjustedS, adjustedL),
      hslToHex((h + 270) % 360, adjustedS, adjustedL)
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
      hslToHex(h, s, Math.max(20, l - 30)),
      baseColor,
      hslToHex(h, s, Math.min(90, l + 30))
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

export function ColorHarmony({ baseColor = '#6366F1', onSelect, onColorChange, className }: ColorHarmonyProps) {
  const router = useRouter();
  const { state, dispatch } = useGradient();
  const harmonyColors = React.useMemo(() => getHarmonyColors(baseColor), [baseColor]);
  const [expandedHarmony, setExpandedHarmony] = React.useState<HarmonyType | null>(null);

  const handleColorSelect = (color: string) => {
    if (state.extractedColors.includes(color)) {
      // If color already exists, do nothing
      return;
    }
    
    if (state.extractedColors.length >= state.maxColors) {
      // Show toast or handle max colors reached
      return;
    }
    
    dispatch({ 
      type: 'SET_EXTRACTED_COLORS', 
      payload: [...state.extractedColors, color] 
    });
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Gradient Background */}
      <div className="fixed inset-0 -z-10 group">
        <div className={cn(
          "absolute inset-0",
          GRADIENT_CLASSES.base,
          GRADIENT_CLASSES.colors,
          GRADIENT_CLASSES.hover
        )} />
        <div className={cn(
          "absolute inset-0",
          GRADIENT_CLASSES.delayed.base,
          GRADIENT_CLASSES.delayed.colors,
          GRADIENT_CLASSES.delayed.hover
        )} />
        <div className={cn(
          "absolute inset-0",
          GRADIENT_CLASSES.moreDelayed.base,
          GRADIENT_CLASSES.moreDelayed.colors,
          GRADIENT_CLASSES.moreDelayed.hover
        )} />
        
        {/* Accent Color Highlights */}
        <div className={ACCENT_HIGHLIGHT_CLASSES.container}>
          <div className={cn(ACCENT_HIGHLIGHT_CLASSES.highlight, "top-1/3 left-1/3")} />
          <div className={cn(ACCENT_HIGHLIGHT_CLASSES.highlight, "bottom-1/3 right-1/3 delay-500")} />
        </div>
      </div>

      <Navigation 
        title="Harmonias de Cor"
        backTo="/"
      />

      <main className={cn(
        "flex-1 flex flex-col",
        UI_SPACING.container.gap,
        "px-4 sm:px-6 md:px-8 pb-12"
      )}>
        <div className={cn(
          "w-full max-w-7xl mx-auto",
          UI_SPACING.section.padding,
          UI_CLASSES.container,
          className
        )}>
          {/* Base Color Display */}
          <div className="mb-8 space-y-4">
            <h2 className={UI_CLASSES.sectionTitle}>Cor Base</h2>
            <div className="flex items-center gap-4">
              <ColorSwatch
                color={baseColor}
                isSelected={state.extractedColors.includes(baseColor)}
                onClick={() => handleColorSelect(baseColor)}
                size="lg"
              />
              <div className="space-y-1">
                <span className="text-sm font-medium text-zinc-200">Cor selecionada</span>
                <div className="font-mono text-sm text-accent">{baseColor}</div>
              </div>
            </div>
          </div>

          {/* Harmony Cards */}
          <div className="space-y-6">
            {harmonyColors.map((harmony) => (
              <motion.div
                key={harmony.type}
                className={cn(
                  UI_CLASSES.card,
                  'p-4 space-y-4 relative overflow-hidden'
                )}
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
                    <div
                      key={`${harmony.type}-${index}`}
                      className="group relative"
                    >
                      <ColorSwatch
                        color={color}
                        isSelected={state.extractedColors.includes(color)}
                        onClick={() => handleColorSelect(color)}
                        size="lg"
                      />
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
                    </div>
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
        </div>
      </main>
    </div>
  );
} 