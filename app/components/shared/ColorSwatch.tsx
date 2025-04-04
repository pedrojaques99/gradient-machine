'use client';

import { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, Paintbrush } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";

export interface ColorSwatchProps {
  color: string;
  isSelected: boolean;
  onClick: () => void;
  onLongPress?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showHex?: boolean;
}

export const ColorSwatch = ({ 
  color, 
  isSelected, 
  onClick, 
  onLongPress,
  className,
  size = 'md',
  showHex = false
}: ColorSwatchProps) => {
  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hexToRgb = (hex: string): string => {
    try {
      const cleanHex = hex.replace('#', '');
      
      const r = parseInt(cleanHex.substring(0, 2), 16);
      const g = parseInt(cleanHex.substring(2, 4), 16);
      const b = parseInt(cleanHex.substring(4, 6), 16);
      
      return `rgb(${r}, ${g}, ${b})`;
    } catch (error) {
      console.error('Error converting hex to RGB:', error);
      return 'rgb(0, 0, 0)';
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (onLongPress) {
      longPressTimeout.current = setTimeout(() => {
        setIsLongPressing(true);
        onLongPress();
      }, 500);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
    if (!isLongPressing) {
      onClick();
    }
    setIsLongPressing(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
  };

  const tooltipContent = useMemo(() => (
    <TooltipContent side="top" sideOffset={5} className="space-y-1">
      <div className="flex items-center gap-2">
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <p className="font-mono text-xs">{color}</p>
      </div>
      <p className="font-mono text-xs text-muted-foreground">{hexToRgb(color)}</p>
    </TooltipContent>
  ), [color]);

  const sizeClasses = {
    sm: 'w-6 h-6 sm:w-8 sm:h-8',
    md: 'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12',
    lg: 'w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16',
    xl: 'w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20'
  };

  const iconSizes = {
    sm: 'h-2 w-2 sm:h-3 sm:w-3',
    md: 'h-3 w-3 sm:h-4 sm:w-4',
    lg: 'h-4 w-4 sm:h-5 sm:w-5',
    xl: 'h-5 w-5 sm:h-6 sm:w-6'
  };

  const ringOffsets = {
    sm: 'ring-offset-1',
    md: 'ring-offset-1 sm:ring-offset-2',
    lg: 'ring-offset-2 sm:ring-offset-3',
    xl: 'ring-offset-2 sm:ring-offset-4'
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
            className={cn(
              "group relative rounded-md transition-all duration-200",
              "hover:scale-105 hover:shadow-lg active:scale-95",
              "border border-zinc-800/50",
              isSelected && "ring-1 ring-accent",
              ringOffsets[size],
              "ring-offset-zinc-950",
              "overflow-hidden",
              isLongPressing && "scale-95",
              sizeClasses[size],
              className
            )}
            style={{ backgroundColor: color }}
            aria-label={`Color swatch: ${color}`}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              {isSelected ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-accent/90 text-black p-0.5 rounded-full"
                >
                  <Check className={iconSizes[size]} aria-hidden="true" />
                </motion.div>
              ) : (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 absolute inset-0 flex items-center justify-center">
                  <Paintbrush className={cn(iconSizes[size], "text-white")} aria-hidden="true" />
                </div>
              )}
            </div>
          </button>
        </TooltipTrigger>
        {tooltipContent}
      </Tooltip>
    </TooltipProvider>
  );
}; 