import { cn } from '@/app/lib/utils';
import { X, ArrowRight, Copy, Check, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ColorSelectionPopupProps {
  selectedColor: string | null;
  selectedRole?: string | null;
  onCancel: () => void;
  className?: string;
}

export function ColorSelectionPopup({
  selectedColor,
  selectedRole,
  onCancel,
  className
}: ColorSelectionPopupProps) {
  const router = useRouter();
  const [copiedHex, setCopiedHex] = useState(false);
  const [copiedRgb, setCopiedRgb] = useState(false);
  const [copiedHsl, setCopiedHsl] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onCancel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onCancel]);

  if (!selectedColor && !selectedRole) return null;

  // Parse RGB from string like "rgb(160,160,144)"
  const parseRgb = (color: string) => {
    try {
      const matches = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (matches) {
        const [_, r, g, b] = matches;
        return {
          r: parseInt(r, 10),
          g: parseInt(g, 10),
          b: parseInt(b, 10)
        };
      }
      return null;
    } catch (error) {
      console.error('Error parsing RGB:', error);
      return null;
    }
  };

  // Convert RGB to HEX
  const rgbToHex = (r: number, g: number, b: number) => {
    const toHex = (n: number) => {
      const hex = n.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const rgbValue = (() => {
    try {
      if (selectedColor?.startsWith('rgb')) {
        const rgb = parseRgb(selectedColor);
        if (rgb) {
          return { ...rgb, string: selectedColor };
        }
      }
      // Fallback
      return { r: 0, g: 0, b: 0, string: 'rgb(0, 0, 0)' };
    } catch (error) {
      console.error('Error handling RGB:', error);
      return { r: 0, g: 0, b: 0, string: 'rgb(0, 0, 0)' };
    }
  })();

  const hexValue = (() => {
    try {
      if (selectedColor?.startsWith('rgb')) {
        const rgb = parseRgb(selectedColor);
        if (rgb) {
          return rgbToHex(rgb.r, rgb.g, rgb.b);
        }
      }
      return '#000000';
    } catch (error) {
      console.error('Error converting to HEX:', error);
      return '#000000';
    }
  })();

  const hslValue = (() => {
    try {
      const { r, g, b } = rgbValue;
      const r1 = r / 255;
      const g1 = g / 255;
      const b1 = b / 255;
      const max = Math.max(r1, g1, b1);
      const min = Math.min(r1, g1, b1);
      let h = 0, s = 0, l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
          case r1:
            h = (g1 - b1) / d + (g1 < b1 ? 6 : 0);
            break;
          case g1:
            h = (b1 - r1) / d + 2;
            break;
          case b1:
            h = (r1 - g1) / d + 4;
            break;
        }
        h /= 6;
      }

      const hDeg = Math.round(h * 360);
      const sPct = Math.round(s * 100);
      const lPct = Math.round(l * 100);

      return `hsl(${hDeg}deg, ${sPct}%, ${lPct}%)`;
    } catch (error) {
      console.error('Error converting to HSL:', error);
      return 'hsl(0deg, 0%, 0%)';
    }
  })();

  const handleCopy = (value: string, type: 'hex' | 'rgb' | 'hsl') => {
    navigator.clipboard.writeText(value);
    switch (type) {
      case 'hex':
        setCopiedHex(true);
        setTimeout(() => setCopiedHex(false), 2000);
        break;
      case 'rgb':
        setCopiedRgb(true);
        setTimeout(() => setCopiedRgb(false), 2000);
        break;
      case 'hsl':
        setCopiedHsl(true);
        setTimeout(() => setCopiedHsl(false), 2000);
        break;
    }
  };

  const CopyButton = ({ value, type, copied }: { value: string, type: 'hex' | 'rgb' | 'hsl', copied: boolean }) => (
    <button
      onClick={() => handleCopy(value, type)}
      className={cn(
        "group flex items-center gap-2 w-full",
        "px-2 py-1.5 rounded-lg",
        "font-mono text-xs",
        "hover:bg-accent/10 hover:text-accent",
        "transition-all duration-200",
        "border border-transparent",
        "hover:border-accent/20",
        type === 'hex' ? 'text-zinc-200' : 'text-zinc-400'
      )}
    >
      <div className="flex items-center gap-1.5 flex-1">
        <span className="uppercase text-[10px] font-medium text-zinc-500">{type}</span>
        <span>{value}</span>
      </div>
      <div className="flex items-center gap-1">
        <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        <AnimatePresence>
          {copied && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-accent"
            >
              <Check className="h-3 w-3" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </button>
  );

  const handleNavigateToHarmony = () => {
    if (selectedColor) {
      router.push(`/harmony?color=${encodeURIComponent(selectedColor)}`);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={popupRef}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          "fixed top-14 left-60 -translate-x-1/2",
          "bg-background/90 backdrop-blur-md",
          "p-4",
          "rounded-2xl",
          "border border-zinc-800/90",
          "shadow-[1px_32px_8px_rgba(1,1,1,0.9)]",
          "after:absolute after:inset-0 after:rounded-2xl after:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]",
          "z-50",
          className
        )}
      >
        <div className="relative z-10 flex items-start gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {selectedColor && (
                <div 
                  className="w-6 h-6 rounded-lg ring-2 ring-accent/30"
                  style={{ backgroundColor: selectedColor }}
                />
              )}
              <span className="text-sm font-medium text-accent">Cor selecionada</span>
            </div>

            {selectedColor && (
              <div className="flex flex-col gap-1 min-w-[240px]">
                <CopyButton value={hexValue} type="hex" copied={copiedHex} />
                <CopyButton value={rgbValue.string} type="rgb" copied={copiedRgb} />
                <CopyButton value={hslValue} type="hsl" copied={copiedHsl} />
              </div>
            )}

            {selectedRole && (
              <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/50">
                <span className="text-sm font-medium capitalize text-zinc-200">{selectedRole}</span>
                <span className="text-xs text-zinc-600">função</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {selectedColor && (
              <button
                onClick={handleNavigateToHarmony}
                className="p-2 hover:bg-accent/10 rounded-lg transition-colors group"
                title="Ver Harmonias de Cor"
              >
                <Palette className="h-4 w-4 text-accent/70 group-hover:text-accent" />
              </button>
            )}
            <button
              onClick={onCancel}
              className="p-2 hover:bg-accent/10 rounded-lg transition-colors group"
              title="Fechar"
            >
              <X className="h-4 w-4 text-accent/70 group-hover:text-accent" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
} 