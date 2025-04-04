'use client';

import { useSearchParams } from 'next/navigation';
import { ColorHarmony } from '@/app/components/features/color/shared/color-harmony';
import { useGradient } from '@/app/contexts/GradientContext';

export default function HarmonyPage() {
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