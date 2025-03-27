'use client';

import { motion } from 'framer-motion';
import { DesignSystem } from '@/app/components/features/color/ecosystem/design-system';
import { Navigation } from '@/app/components/shared/Navigation';
import { useGradient } from '@/app/contexts/GradientContext';

export default function DesignSystemPage() {
  const { state, dispatch } = useGradient();

  const handleColorRemove = (color: string) => {
    dispatch({
      type: 'SET_EXTRACTED_COLORS',
      payload: state.extractedColors.filter((c: string) => c !== color)
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation 
        title="Color System"
        subtitle="Manage and organize your color palette"
        hideNext={true}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex-1 p-6"
      >
        <div className="max-w-6xl mx-auto">
          <DesignSystem onColorRemove={handleColorRemove} />
        </div>
      </motion.div>
    </div>
  );
} 