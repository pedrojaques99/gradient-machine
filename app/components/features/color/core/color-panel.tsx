'use client';

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import styles from './color-panel.module.css';

// Types
export interface ColorPanelProps {
  colors?: string[];
  selectedColor?: string | null;
  defaultColor?: string;
  onColorSelect?: (color: string) => void;
  onColorChange?: (color: string) => void;
  showPreview?: boolean;
  showColorPicker?: boolean;
  showColorList?: boolean;
  isPopover?: boolean;
  onClose?: () => void;
}

type HSL = {
  h: number;
  s: number;
  l: number;
};

type HEX = {
  hex: string;
};

type Color = HSL & HEX;

// Utility functions
function hslToHex({ h, s, l }: HSL): string {
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

  return `${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hexToHsl({ hex }: HEX): HSL {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex.split("").map((char) => char + char).join("");
  }
  while (hex.length < 6) {
    hex += "0";
  }

  let r = parseInt(hex.slice(0, 2), 16) || 0;
  let g = parseInt(hex.slice(2, 4), 16) || 0;
  let b = parseInt(hex.slice(4, 6), 16) || 0;

  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s: number;
  let l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
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

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function sanitizeHex(val: string): string {
  const sanitized = val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return sanitized.length > 6 ? sanitized.slice(0, 6) : sanitized;
}

// Components
const HashtagIcon = React.memo((props: React.ComponentPropsWithoutRef<"svg">) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path
        fillRule="evenodd"
        d="M11.097 1.515a.75.75 0 0 1 .589.882L10.666 7.5h4.47l1.079-5.397a.75.75 0 1 1 1.47.294L16.665 7.5h3.585a.75.75 0 0 1 0 1.5h-3.885l-1.2 6h3.585a.75.75 0 0 1 0 1.5h-3.885l-1.08 5.397a.75.75 0 1 1-1.47-.294l1.02-5.103h-4.47l-1.08 5.397a.75.75 0 1 1-1.47-.294l1.02-5.103H3.75a.75.75 0 0 1 0-1.5h3.885l1.2-6H5.25a.75.75 0 0 1 0-1.5h3.885l1.08-5.397a.75.75 0 0 1 .882-.588ZM10.365 9l-1.2 6h4.47l1.2-6h-4.47Z"
        clipRule="evenodd"
      />
    </svg>
  );
});

HashtagIcon.displayName = 'HashtagIcon';

const DraggableColorCanvas = React.memo(({
  h,
  s,
  l,
  handleChange,
}: HSL & {
  handleChange: (e: Partial<Color>) => void;
}) => {
  const [dragging, setDragging] = useState(false);
  const colorAreaRef = useRef<HTMLDivElement>(null);

  const calculateSaturationAndLightness = useCallback(
    (clientX: number, clientY: number) => {
      if (!colorAreaRef.current) return;
      const rect = colorAreaRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const xClamped = Math.max(0, Math.min(x, rect.width));
      const yClamped = Math.max(0, Math.min(y, rect.height));
      const newSaturation = Math.round((xClamped / rect.width) * 100);
      const newLightness = 100 - Math.round((yClamped / rect.height) * 100);
      handleChange({ s: newSaturation, l: newLightness });
    },
    [handleChange],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      calculateSaturationAndLightness(e.clientX, e.clientY);
    },
    [calculateSaturationAndLightness],
  );

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
    calculateSaturationAndLightness(e.clientX, e.clientY);
  }, [calculateSaturationAndLightness]);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) {
        calculateSaturationAndLightness(touch.clientX, touch.clientY);
      }
    },
    [calculateSaturationAndLightness],
  );

  const handleTouchEnd = useCallback(() => {
    setDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (touch) {
      setDragging(true);
      calculateSaturationAndLightness(touch.clientX, touch.clientY);
    }
  }, [calculateSaturationAndLightness]);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [dragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return (
    <div
      ref={colorAreaRef}
      className="h-48 w-full touch-auto overscroll-none rounded-xl border border-zinc-200 dark:touch-auto dark:border-zinc-700"
      style={{
        background: `linear-gradient(to top, #000, transparent, #fff), linear-gradient(to left, hsl(${h}, 100%, 50%), #bbb)`,
        position: "relative",
        cursor: "crosshair",
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
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

export function ColorPanel({
  colors = [],
  selectedColor = null,
  defaultColor = "#1C9488",
  onColorSelect,
  onColorChange,
  showPreview = true,
  showColorPicker = true,
  showColorList = true,
  isPopover = false,
  onClose,
}: ColorPanelProps) {
  const [color, setColor] = useState<Color>(() => ({
    ...hexToHsl({ hex: defaultColor }),
    hex: defaultColor
  }));

  const [hexInput, setHexInput] = useState(defaultColor.replace("#", ""));

  useEffect(() => {
    const newColor = {
      ...hexToHsl({ hex: defaultColor }),
      hex: defaultColor
    };
    setColor(newColor);
    setHexInput(defaultColor.replace("#", ""));
  }, [defaultColor]);

  const handleChange = useCallback((newColor: Partial<Color>) => {
    const updatedColor = { ...color, ...newColor };
    setColor(updatedColor);
    
    if (onColorChange) {
      const hexColor = `#${hslToHex(updatedColor)}`;
      onColorChange(hexColor);
      setHexInput(hexColor.replace("#", ""));
    }
  }, [color, onColorChange]);

  const handleHexChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const sanitized = sanitizeHex(value);
    setHexInput(sanitized);

    if (sanitized.length === 6) {
      const hexColor = `#${sanitized}`;
      try {
        const hslColor = hexToHsl({ hex: hexColor });
        handleChange({ ...hslColor, hex: hexColor });
      } catch (error) {
        console.warn('Invalid hex color:', hexColor);
      }
    }
  }, [handleChange]);

  const handleHueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newHue = parseInt(e.target.value);
    handleChange({ h: newHue });
  }, [handleChange]);

  const hueGradient = useMemo(() => {
    const stops = [];
    for (let i = 0; i <= 360; i += 60) {
      stops.push(`hsl(${i}, 100%, 50%)`);
    }
    return `linear-gradient(to right, ${stops.join(', ')})`;
  }, []);

  return (
    <div className="space-y-6">
      {showColorPicker && (
        <div className="space-y-4">
          <DraggableColorCanvas
            h={color.h}
            s={color.s}
            l={color.l}
            handleChange={handleChange}
          />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <HashtagIcon className="h-4 w-4 text-zinc-500" />
              <input
                type="text"
                className="w-full rounded-md border border-zinc-200 bg-transparent px-2 py-1 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:focus:border-zinc-500"
                value={hexInput}
                onChange={handleHexChange}
                maxLength={6}
                placeholder="000000"
              />
            </div>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="360"
                value={color.h}
                onChange={handleHueChange}
                className={`${styles['color-hue-slider']} h-2 w-full cursor-pointer appearance-none rounded-lg`}
                style={{
                  background: hueGradient
                }}
              />
              <div 
                className="absolute top-1/2 -tranzinc-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-sm pointer-events-none"
                style={{
                  left: `${(color.h / 360) * 100}%`,
                  backgroundColor: `hsl(${color.h}, 100%, 50%)`,
                  transform: 'tranzinc(-50%, -50%)'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {showColorList && colors.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {colors.map((color, index) => (
            <motion.button
              key={color + index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`aspect-square rounded-lg overflow-hidden ring-2 ring-offset-2 ring-offset-background ${
                selectedColor === color ? 'ring-primary' : 'ring-transparent'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => onColorSelect?.(color)}
            />
          ))}
        </div>
      )}

      {showPreview && (
        <div className="p-4 rounded-lg" style={{ backgroundColor: `#${hslToHex(color)}` }}>
          <div className="text-center text-sm">
            Current Color: #{hslToHex(color)}
          </div>
        </div>
      )}
    </div>
  );
} 