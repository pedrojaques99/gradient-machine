'use client';

import { ColorSidebar } from './ColorSidebar';
import { useGradient } from '@/app/contexts/GradientContext';
import { useCallback } from 'react';

export function PageLayout({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = useGradient();

  const handleImageUpload = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imgUrl = e.target?.result as string;
      const img = new Image();
      img.src = imgUrl;
      img.crossOrigin = "anonymous";
      
      img.onload = async () => {
        const ColorThief = (await import('color-thief-browser')).default;
        const colorThief = new ColorThief();
        const palette = colorThief.getPalette(img, 6);
        const colors = palette.map((color: [number, number, number]) => 
          `rgb(${color[0]}, ${color[1]}, ${color[2]})`
        );
        dispatch({ type: 'SET_EXTRACTED_COLORS', payload: colors });
      };
    };
    reader.readAsDataURL(file);
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-zinc-950">
      <ColorSidebar
        colors={state.colorStops.map(stop => stop.color)}
        selectedColor={state.selectedColor}
        onColorSelect={(color) => dispatch({ type: 'SET_SELECTED_COLOR', payload: color })}
        onColorChange={(color, index) => {
          const newColorStops = [...state.colorStops];
          newColorStops[index] = { ...newColorStops[index], color };
          dispatch({ type: 'SET_COLOR_STOPS', payload: newColorStops });
        }}
        onImageUpload={handleImageUpload}
        hasImage={state.extractedColors.length > 0}
      />
      <main className="pl-[60px] min-h-screen">
        {children}
      </main>
    </div>
  );
} 