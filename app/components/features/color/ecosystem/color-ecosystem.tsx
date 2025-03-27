'use client';

import { motion } from 'framer-motion';
import { useGradient } from '@/app/contexts/GradientContext';
import { DesignSystem } from './design-system';
import { Navigation } from '@/app/components/shared/Navigation';
import { useState, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/app/lib/utils';

// Add toast utility
const showToast = (message: string, type: 'warning' | 'success' | 'error' = 'warning') => {
  const el = document.createElement('div');
  el.className = cn(
    'fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2',
    type === 'warning' && 'bg-yellow-500/90 text-white',
    type === 'success' && 'bg-accent/90 text-white',
    type === 'error' && 'bg-red-500/90 text-white'
  );
  
  const content = document.createElement('div');
  content.className = 'flex items-center gap-2';
  
  if (type === 'warning') {
    const icon = document.createElement('div');
    icon.innerHTML = '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>';
    content.appendChild(icon);
  }
  
  const text = document.createElement('span');
  text.textContent = message;
  content.appendChild(text);
  
  el.appendChild(content);
  document.body.appendChild(el);
  
  setTimeout(() => {
    el.classList.add('animate-out', 'fade-out', 'slide-out-to-top-2');
    setTimeout(() => el.remove(), 150);
  }, 3000);
};

const ColorLimitIndicator = ({ current, max }: { current: number; max: number }) => {
  const remaining = max - current;
  const isLimitReached = current >= max;

  return (
    <div className={cn(
      "flex items-center gap-2 text-xs font-medium",
      isLimitReached ? "text-red-400" : "text-muted-foreground"
    )}>
      {isLimitReached && <AlertCircle className="h-3 w-3" />}
      <span>{remaining === 0 ? "Color limit reached" : `${remaining} colors remaining`}</span>
    </div>
  );
};

export function ColorEcosystem() {
  const { state, dispatch } = useGradient();
  const [currentStep, setCurrentStep] = useState(0);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      dispatch({ type: 'SET_INTERFACE', payload: 'discovery' });
    }
  }, [currentStep, dispatch]);

  const handleOpenStudio = useCallback(() => {
    dispatch({ type: 'SET_INTERFACE', payload: 'gradient-studio' });
  }, [dispatch]);

  const handleColorRemove = useCallback((color: string) => {
    dispatch({ type: 'REMOVE_COLOR', payload: color });
    showToast('Color removed from system', 'success');
  }, [dispatch]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation 
        title="System"
        backTo="/"
        onNext={handleOpenStudio}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex-1 p-6 space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Color System</h2>
          <ColorLimitIndicator 
            current={state.extractedColors.length} 
            max={state.maxColors} 
          />
        </div>
        <DesignSystem 
          onColorRemove={handleColorRemove}
        />
      </motion.div>
    </div>
  );
} 