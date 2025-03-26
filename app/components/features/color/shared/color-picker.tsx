'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { X, Link2, Pipette } from 'lucide-react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { cn } from '@/app/lib/utils';
import { useGradient } from '@/app/contexts/GradientContext';

interface ColorPickerProps {
  color?: string;
  onChange?: (color: string) => void;
  onClose?: () => void;
  className?: string;
  compact?: boolean;
}

export function ColorPicker({ 
  color = '#1C9488', 
  onChange, 
  onClose,
  className,
  compact = false
}: ColorPickerProps) {
  const [showEyeDropper, setShowEyeDropper] = useState(false);
  const { state } = useGradient();

  const handleChange = useCallback((newColor: string) => {
    onChange?.(newColor);
  }, [onChange]);

  const handleEyeDropper = useCallback(async () => {
    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      onChange?.(result.sRGBHex);
    } catch (e) {
      console.log('EyeDropper not supported');
    }
  }, [onChange]);

  return (
    <div 
      className={cn(
        "relative color-picker bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg",
        compact ? "w-[240px]" : "w-full",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Main Color Area */}
      <div className="p-3 space-y-3">
        {/* Color Preview and Input */}
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-md border border-zinc-700/50"
            style={{ backgroundColor: color }}
          />
          <div className="flex-1">
            <div className="relative">
              <HexColorInput
                color={color}
                onChange={handleChange}
                prefixed
                className={cn(
                  "w-full h-7 bg-zinc-800/50 border-zinc-700/50 rounded-md px-2",
                  "font-mono text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                )}
              />
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md hover:bg-zinc-800"
            onClick={handleEyeDropper}
          >
            <Pipette className="h-4 w-4" />
          </Button>
        </div>

        {/* Color Picker */}
        <div className="relative">
          <HexColorPicker 
            color={color} 
            onChange={handleChange}
            className="w-full !h-[160px]"
          />
          <div 
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)'
            }}
          />
        </div>
      </div>

      {/* Quick Colors */}
      <div className="border-t border-zinc-800 p-2">
        <div className="grid grid-cols-8 gap-1">
          {state.extractedColors.slice(0, 8).map((presetColor: string) => (
            <button
              key={presetColor}
              className={cn(
                "w-full aspect-square rounded-sm border border-zinc-700/50",
                "hover:scale-110 transition-transform",
                color === presetColor && "ring-1 ring-accent"
              )}
              style={{ backgroundColor: presetColor }}
              onClick={() => handleChange(presetColor)}
            />
          ))}
        </div>
      </div>

      {onClose && !compact && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-2 top-2 h-6 w-6 rounded-full bg-zinc-800/50 hover:bg-zinc-700/50"
          onClick={onClose}
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Close color picker</span>
        </Button>
      )}
    </div>
  );
}
