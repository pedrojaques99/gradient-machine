'use client';

import { ColorPreview } from './color-preview';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Palette } from 'lucide-react';
import { useGradient } from '@/app/contexts/GradientContext';
import { UploadButton } from './UploadButton';
import { Label } from '@/app/components/ui/label';
import { rgbToHex } from '@/app/lib/utils';

interface ColorSidebarProps {
  colors: string[];
  selectedColor: string | null;
  onColorSelect: (color: string) => void;
  onColorChange?: (color: string, index: number) => void;
  onImageUpload?: (file: File) => void;
  hasImage?: boolean;
  isLoading?: boolean;
}

export function ColorSidebar({
  colors,
  selectedColor,
  onColorSelect,
  onColorChange,
  onImageUpload,
  hasImage,
  isLoading,
}: ColorSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { dispatch, state } = useGradient();
  const [isExtracting, setIsExtracting] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsExpanded(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleOpenStudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'SET_INTERFACE', payload: 'gradient-studio' });
  };

  const handleImageUpload = async (file: File) => {
    setIsExtracting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imgUrl = e.target?.result as string;
        const img = new Image();
        img.src = imgUrl;
        img.crossOrigin = "anonymous";
        
        img.onload = async () => {
          try {
            const ColorThief = (await import('color-thief-browser')).default;
            const colorThief = new ColorThief();
            const palette = colorThief.getPalette(img, 6);
            
            const colors = palette.map((color: [number, number, number]) => 
              rgbToHex(color[0], color[1], color[2])
            );

            dispatch({ 
              type: 'SET_DESIGN_SYSTEM', 
              payload: {
                primary: colors[0],
                secondary: colors[1],
                accent: colors[2],
                background: colors[3] || state.designSystem.background,
                text: colors[4] || state.designSystem.text
              }
            });

            dispatch({ type: 'SET_EXTRACTED_COLORS', payload: colors });

            dispatch({
              type: 'SET_COLOR_STOPS',
              payload: [
                { id: 'start', color: colors[0], position: 0 },
                { id: 'middle', color: colors[1], position: 0.5 },
                { id: 'end', color: colors[2], position: 1 }
              ]
            });
          } catch (error) {
            console.error('Failed to extract colors:', error);
          }
        };
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to process image:', error);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleColorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(true);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <motion.div
      initial={{ width: isExpanded ? '300px' : '64px' }}
      animate={{ width: isExpanded ? '300px' : '64px' }}
      transition={{ duration: 0.2 }}
      className={`fixed left-0 top-0 h-screen bg-zinc-900 border-r border-zinc-800/50 shadow-sm z-50 
        ${isMobile ? 'w-full md:w-auto' : ''}`}
    >
      <div className="relative h-full">
        <button
          onClick={handleToggle}
          className={`absolute -right-4 top-1/2 -translate-y-1/2 bg-zinc-950 rounded-full p-1 border border-zinc-800 shadow-sm hover:bg-zinc-900 transition-colors
            ${isMobile ? 'hidden' : ''}`}
        >
          {isExpanded ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        <div className="h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {isExpanded ? (
            <div className="p-4 space-y-4">
              <ColorPreview
                colors={colors}
                selectedColor={selectedColor}
                onColorSelect={onColorSelect}
                onColorChange={onColorChange}
                showVariations={true}
                singleColumn={true}
                hideToggle={true}
                transparent={true}
              />
              <div className="space-y-2">
                <button
                  onClick={handleOpenStudio}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-gradient-to-r from-zinc-800/50 via-accent/10 to-zinc-800/30 hover:from-zinc-700/50 hover:via-accent/20 hover:to-zinc-700/30 transition-all text-sm border border-zinc-700/50 group"
                >
                  <Palette className="h-4 w-4 transition-transform group-hover:scale-110" />
                  <span className="group-hover:text-accent transition-colors">Gradient Studio</span>
                </button>
                <UploadButton
                  onUpload={handleImageUpload}
                  isLoading={isExtracting}
                  hasImage={state.extractedColors.length > 0}
                  variant="sidebar"
                  title="Upload"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4">
              {colors.slice(0, 6).map((color, index) => (
                <motion.button
                  key={color + index}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="w-8 h-8 rounded-lg cursor-pointer hover:scale-110 transition-transform border border-zinc-800/50"
                  style={{ backgroundColor: color }}
                  onClick={handleColorClick}
                />
              ))}
              {colors.length > 6 && (
                <div className="w-1 h-1 rounded-full bg-zinc-600 my-1" />
              )}
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
                onClick={handleOpenStudio}
                className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-800/50 via-accent/10 to-zinc-800/30 hover:from-zinc-700/50 hover:via-accent/20 hover:to-zinc-700/30 transition-all flex items-center justify-center border border-zinc-700/50 group"
                title="Gradient Studio"
              >
                <Palette className="h-4 w-4 transition-transform group-hover:scale-110" />
              </motion.button>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={(e) => e.stopPropagation()}
              >
                <UploadButton
                  onUpload={handleImageUpload}
                  isLoading={isExtracting}
                  hasImage={state.extractedColors.length > 0}
                  variant="sidebar"
                  collapsed={true}
                  title="Upload"
                />
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}