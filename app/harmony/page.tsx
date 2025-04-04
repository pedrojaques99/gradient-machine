'use client';

import { useSearchParams } from 'next/navigation';
import { ColorHarmony } from '@/app/components/features/color/shared/color-harmony';
import { useGradient } from '@/app/contexts/GradientContext';
import { Suspense } from 'react';

export default function HarmonyPage() {
  return (
    <Suspense fallback={<div className="w-full h-screen flex items-center justify-center">Loading...</div>}>
      <HarmonyContent />
    </Suspense>
  );
}

function HarmonyContent() {
  const searchParams = useSearchParams();
  const { dispatch } = useGradient();
  const color = searchParams.get('color') || '#6366F1';

  const handleColorSelect = (selectedColor: string) => {
    dispatch({ 
      type: 'SET_EXTRACTED_COLORS', 
      payload: [selectedColor] 
    });
  };

  return (
    <ColorHarmony
      baseColor={color}
      onSelect={handleColorSelect}
    />
  );
} 