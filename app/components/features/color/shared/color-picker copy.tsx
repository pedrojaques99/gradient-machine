'use client';

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import styles from './color-picker.module.css';
import { ColorPresets } from './color-presets';
import { ColorHarmony } from './color-harmony';
import { Button } from '@/app/components/ui/button';
import { X } from 'lucide-react';

// Simple class name merging function
function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}

// Types
export interface ColorPickerProps {
  default_value?: string;
  onChange?: (color: string) => void;
  showPresets?: boolean;
  isCompact?: boolean;
  onClose?: () => void;
}

type ColorFormat = 'hex' | 'rgb' | 'hsl';

interface Color {
  h: number;
  s: number;
  l: number;
  r: number;
  g: number;
  b: number;
  hex: string;
}

// Utility functions
function sanitizeHex(val: string): string {
  return val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
}

function hexToColor(hex: string): Color {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex.split("").map(char => char + char).join("");
  }
  hex = sanitizeHex(hex);

  const r = parseInt(hex.slice(0, 2), 16) || 0;
  const g = parseInt(hex.slice(2, 4), 16) || 0;
  const b = parseInt(hex.slice(4, 6), 16) || 0;

  // Convert to HSL
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s: number;
  let l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
      case gNorm: h = (bNorm - rNorm) / d + 2; break;
      case bNorm: h = (rNorm - gNorm) / d + 4; break;
    }
    h /= 6;
    h *= 360;
  } else {
    s = 0;
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
    r,
    g,
    b,
    hex: `#${hex}`
  };
}

function colorToHex(color: Color): string {
  const { h, s, l } = color;
  const sNorm = s / 100;
  const lNorm = l / 100;

  const k = (n: number) => (n + h / 30) % 12;
  const a = sNorm * Math.min(lNorm, 1 - lNorm);
  const f = (n: number) => lNorm - a * Math.max(Math.min(k(n) - 3, 9 - k(n), 1), -1);

  const r = Math.round(255 * f(0));
  const g = Math.round(255 * f(8));
  const b = Math.round(255 * f(4));

  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

// Components
const HashtagIcon = React.memo((props: React.ComponentPropsWithoutRef<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M11.097 1.515a.75.75 0 0 1 .589.882L10.666 7.5h4.47l1.079-5.397a.75.75 0 1 1 1.47.294L16.665 7.5h3.585a.75.75 0 0 1 0 1.5h-3.885l-1.2 6h3.585a.75.75 0 0 1 0 1.5h-3.885l-1.08 5.397a.75.75 0 1 1-1.47-.294l1.02-5.103h-4.47l-1.08 5.397a.75.75 0 1 1-1.47-.294l1.02-5.103H3.75a.75.75 0 0 1 0-1.5h3.885l1.2-6H5.25a.75.75 0 0 1 0-1.5h3.885l1.08-5.397a.75.75 0 0 1 .882-.588ZM10.365 9l-1.2 6h4.47l1.2-6h-4.47Z"
      clipRule="evenodd"
    />
  </svg>
));

HashtagIcon.displayName = 'HashtagIcon';

const DraggableColorCanvas = React.memo(({
  h,
  s,
  l,
  handleChange,
}: Pick<Color, 'h' | 's' | 'l'> & {
  handleChange: (e: Partial<Color>) => void;
}) => {
  const [dragging, setDragging] = useState(false);
  const colorAreaRef = useRef<HTMLDivElement>(null);

  const calculateSaturationAndLightness = useCallback(
    (clientX: number, clientY: number) => {
      if (!colorAreaRef.current) return;
      const rect = colorAreaRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
      handleChange({
        s: Math.round((x / rect.width) * 100),
        l: 100 - Math.round((y / rect.height) * 100)
      });
    },
    [handleChange],
  );

  const handlePointerEvent = useCallback((e: React.PointerEvent | PointerEvent) => {
    if (e.type === 'pointerdown') {
      setDragging(true);
    } else if (e.type === 'pointerup' || e.type === 'pointercancel') {
      setDragging(false);
    }
    if (dragging || e.type === 'pointerdown') {
      calculateSaturationAndLightness(e.clientX, e.clientY);
    }
  }, [dragging, calculateSaturationAndLightness]);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('pointermove', handlePointerEvent);
      window.addEventListener('pointerup', handlePointerEvent);
      window.addEventListener('pointercancel', handlePointerEvent);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerEvent);
      window.removeEventListener('pointerup', handlePointerEvent);
      window.removeEventListener('pointercancel', handlePointerEvent);
    };
  }, [dragging, handlePointerEvent]);

  return (
    <div
      ref={colorAreaRef}
      className="h-48 w-full touch-auto overscroll-none rounded-xl border border-zinc-200 dark:touch-auto dark:border-zinc-700"
      style={{
        background: `linear-gradient(to top, #000, transparent, #fff), linear-gradient(to left, hsl(${h}, 100%, 50%), #bbb)`,
        position: "relative",
        cursor: "crosshair",
      }}
      onPointerDown={handlePointerEvent}
      role="button"
      aria-label="Color selection area"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          const delta = e.key === 'ArrowLeft' ? -1 : 1;
          handleChange({ s: Math.max(0, Math.min(100, s + delta)) });
        }
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          const delta = e.key === 'ArrowUp' ? 1 : -1;
          handleChange({ l: Math.max(0, Math.min(100, l + delta)) });
        }
      }}
    >
      <motion.div
        className="color-selector border-4 border-white ring-1 ring-zinc-200 dark:border-zinc-900 dark:ring-zinc-700"
        style={{
          position: "absolute",
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          background: `hsl(${h}, ${s}%, ${l}%)`,
          transform: "tranzinc(-50%, -50%)",
          left: `${s}%`,
          top: `${100 - l}%`,
          cursor: dragging ? "grabbing" : "grab",
        }}
        animate={{
          scale: dragging ? 1.2 : 1,
          boxShadow: dragging ? "0 0 0 2px rgba(var(--primary), 0.5)" : "none",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      />
    </div>
  );
});

DraggableColorCanvas.displayName = 'DraggableColorCanvas';

export function ColorPicker({ 
  default_value = "#1C9488", 
  onChange,
  showPresets = true,
  isCompact,
  onClose
}: ColorPickerProps) {
  const [color, setColor] = useState<Color>(() => hexToColor(default_value));
  const [hexInput, setHexInput] = useState(default_value.replace("#", ""));
  const [colorFormat, setColorFormat] = useState<ColorFormat>('hex');

  useEffect(() => {
    const newColor = hexToColor(default_value);
    setColor(newColor);
    setHexInput(newColor.hex.replace("#", ""));
  }, [default_value]);

  const handleColorChange = useCallback((newColor: Partial<Color>) => {
    const updatedColor = { ...color, ...newColor };
    if (newColor.h !== undefined || newColor.s !== undefined || newColor.l !== undefined) {
      updatedColor.hex = colorToHex(updatedColor);
      const { r, g, b } = hexToColor(updatedColor.hex);
      updatedColor.r = r;
      updatedColor.g = g;
      updatedColor.b = b;
    }
    setColor(updatedColor);
    setHexInput(updatedColor.hex.replace("#", ""));
    onChange?.(updatedColor.hex);
  }, [color, onChange]);

  const handleHexInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeHex(e.target.value);
    setHexInput(sanitized);
    if (sanitized.length === 6) {
      const newColor = hexToColor(sanitized);
      setColor(newColor);
      onChange?.(newColor.hex);
    }
  }, [onChange]);

  const handlePresetSelect = useCallback((presetColor: string) => {
    handleColorChange(hexToColor(presetColor));
  }, [handleColorChange]);

  const containerStyles = isCompact ? 'p-2' : 'space-y-6';

  return (
    <div className={containerStyles}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3 flex items-center">
            <HashtagIcon className="h-4 w-4 text-zinc-500" />
          </div>
          <input
            type="text"
            value={hexInput}
            onChange={handleHexInputChange}
            className="w-full rounded-md border border-zinc-200 bg-white px-8 py-2 text-sm text-zinc-900 placeholder-zinc-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-400"
            aria-label="Hex color input"
          />
        </div>
        <select
          value={colorFormat}
          onChange={(e) => setColorFormat(e.target.value as ColorFormat)}
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          aria-label="Color format selector"
        >
          <option value="hex">HEX</option>
          <option value="rgb">RGB</option>
          <option value="hsl">HSL</option>
        </select>
      </div>

      <DraggableColorCanvas
        h={color.h}
        s={color.s}
        l={color.l}
        handleChange={handleColorChange}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {showPresets && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Color Presets
            </label>
            <ColorPresets
              onSelect={handlePresetSelect}
              selectedColor={color.hex}
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Color Harmony
          </label>
          <ColorHarmony
            baseColor={color.hex}
            onSelect={handlePresetSelect}
          />
        </div>
      </div>

      <div className="rounded-md bg-zinc-50 p-3 text-sm text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
        {colorFormat === 'hex' && color.hex}
        {colorFormat === 'rgb' && `rgb(${color.r}, ${color.g}, ${color.b})`}
        {colorFormat === 'hsl' && `hsl(${color.h}, ${color.s}%, ${color.l}%)`}
      </div>

      {isCompact && (
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export default ColorPicker; 