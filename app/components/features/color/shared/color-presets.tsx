'use client';

import React from 'react';
import { motion } from 'framer-motion';

// Simple class name merging function
function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}

interface ColorPreset {
  name: string;
  color: string;
  category: 'primary' | 'secondary' | 'accent' | 'neutral';
}

const PRESETS: ColorPreset[] = [
  // Primary Colors
  { name: 'Primary Blue', color: '#3B82F6', category: 'primary' },
  { name: 'Primary Green', color: '#10B981', category: 'primary' },
  { name: 'Primary Red', color: '#EF4444', category: 'primary' },
  
  // Secondary Colors
  { name: 'Secondary Purple', color: '#8B5CF6', category: 'secondary' },
  { name: 'Secondary Orange', color: '#F59E0B', category: 'secondary' },
  { name: 'Secondary Pink', color: '#EC4899', category: 'secondary' },
  
  // Accent Colors
  { name: 'Accent Yellow', color: '#FBBF24', category: 'accent' },
  { name: 'Accent Teal', color: '#14B8A6', category: 'accent' },
  { name: 'Accent Indigo', color: '#6366F1', category: 'accent' },
  
  // Neutral Colors
  { name: 'Neutral zinc', color: '#6B7280', category: 'neutral' },
  { name: 'Neutral zinc', color: '#475569', category: 'neutral' },
  { name: 'Neutral Zinc', color: '#71717A', category: 'neutral' },
];

interface ColorPresetsProps {
  onSelect: (color: string) => void;
  selectedColor?: string;
  className?: string;
}

export function ColorPresets({ onSelect, selectedColor, className }: ColorPresetsProps) {
  return (
    <div className={cn('grid grid-cols-6 gap-2', className)}>
      {PRESETS.map((preset) => (
        <motion.button
          key={preset.name}
          className={cn(
            'relative h-8 w-8 rounded-full border-2 transition-all',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            'hover:scale-110 active:scale-95',
            selectedColor === preset.color
              ? 'border-primary ring-2 ring-primary ring-offset-2'
              : 'border-transparent hover:border-primary/50'
          )}
          style={{ backgroundColor: preset.color }}
          onClick={() => onSelect(preset.color)}
          aria-label={`Select ${preset.name}`}
          title={preset.name}
        >
          <span className="sr-only">{preset.name}</span>
        </motion.button>
      ))}
    </div>
  );
} 