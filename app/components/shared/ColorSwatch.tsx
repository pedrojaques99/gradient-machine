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
  size?: 'sm' | 'md' | 'lg';
}

export const ColorSwatch = ({ 
  color, 
  isSelected, 
  onClick, 
  onLongPress,
  className,
  size = 'md'
}: ColorSwatchProps) => {
  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    <TooltipContent side="top" sideOffset={5}>
      <p className="font-mono text-xs">{color}</p>
    </TooltipContent>
  ), [color]);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const iconSizes = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
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
              "group relative rounded-md transition-all",
              "hover:scale-105 hover:shadow-md",
              "border border-zinc-800/50",
              isSelected && "ring-1 ring-accent ring-offset-1 ring-offset-zinc-950",
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