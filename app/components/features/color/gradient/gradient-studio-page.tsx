'use client';

import { motion } from 'framer-motion';
import { GradientStudio } from '@/app/components/features/color/gradient/gradient-studio';
import { Navigation } from '@/app/components/shared/Navigation';
import { useGradient } from '@/app/contexts/GradientContext';

export function GradientStudioPage() {
  const { dispatch } = useGradient();

  const handleBack = () => {
    dispatch({ type: 'SET_INTERFACE', payload: 'ecosystem' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation 
        title="Gradient Machine"
        onBack={handleBack}
        hideNext={true}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex-1 p-6"
      >
        <div className="max-w-4xl mx-auto">
          <GradientStudio />
        </div>
      </motion.div>
    </div>
  );
} 