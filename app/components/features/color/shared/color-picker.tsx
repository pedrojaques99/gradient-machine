'use client';

import React, { useCallback, useMemo } from 'react';
import { Button } from '@/app/components/ui/button';
import { X } from 'lucide-react';
import { SketchPicker } from 'react-color';
import { cn } from '@/app/lib/utils';

interface ColorPickerProps {
  color?: string;
  onChange?: (color: string) => void;
  onClose?: () => void;
  className?: string;
}

export function ColorPicker({ 
  color = '#1C9488', 
  onChange, 
  onClose,
  className 
}: ColorPickerProps) {
  const handleChange = useCallback((color: any) => {
    onChange?.(color.hex);
  }, [onChange]);

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const pickerStyles = useMemo(() => ({
    default: {
      picker: {
        background: 'var(--background)',
        border: '1px solid var(--border)',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        width: '100% !important',
      },
      saturation: {
        borderRadius: '0.375rem',
      },
      hue: {
        borderRadius: '0.375rem',
      },
      body: {
        padding: '0.75rem',
      }
    }
  }), []);

  return (
    <div className={cn(
      "relative w-full max-w-[300px]",
      className
    )}>
      <SketchPicker 
        color={color}
        onChange={handleChange}
        styles={pickerStyles}
        disableAlpha
        presetColors={[]}
      />
      {onClose && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-background shadow-sm hover:bg-accent"
          onClick={handleClose}
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Close color picker</span>
        </Button>
      )}
    </div>
  );
}
