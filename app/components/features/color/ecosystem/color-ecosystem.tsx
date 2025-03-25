'use client';

import { motion } from 'framer-motion';
import { useGradient } from '@/app/contexts/GradientContext';
import { DesignSystem } from './design-system';
import { Navigation } from '@/app/components/shared/Navigation';
import { useState } from 'react';

export function ColorEcosystem() {
  const { state, dispatch } = useGradient();
  const [currentStep, setCurrentStep] = useState(0);

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      dispatch({ type: 'SET_INTERFACE', payload: 'discovery' });
    }
  };

  const handleOpenStudio = () => {
    dispatch({ type: 'SET_INTERFACE', payload: 'gradient-studio' });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation 
        title="System"
        onBack={handleBack}
        onNext={handleOpenStudio}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex-1 p-6 space-y-6"
      >
        <DesignSystem />
      </motion.div>
    </div>
  );
} 