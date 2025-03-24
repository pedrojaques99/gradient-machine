'use client';

import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGradient } from '@/app/contexts/GradientContext';
import { UploadButton } from '@/app/components/shared/UploadButton';
import { ColorPreview } from '@/app/components/shared/color-preview';
import { Navigation } from '@/app/components/shared/Navigation';
import { Label } from '@/app/components/ui/label';
import { Wand2 } from 'lucide-react';

export function ColorDiscovery() {
  const { state, dispatch } = useGradient();
  const [isExtracting, setIsExtracting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleInterfaceChange = useCallback(() => {
    dispatch({ type: 'SET_INTERFACE', payload: 'ecosystem' });
  }, [dispatch]);

  const handleUpload = useCallback(async (file: File) => {
    setIsExtracting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imgUrl = e.target?.result as string;
      setImagePreview(imgUrl);
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
        setIsExtracting(false);
      };
    };
    reader.readAsDataURL(file);
  }, [dispatch]);

  const handleColorSelect = useCallback((color: string) => {
    dispatch({ type: 'SET_SELECTED_COLOR', payload: color });
  }, [dispatch]);

  const handleColorChange = useCallback((color: string) => {
    if (state.selectedColor) {
      const newColors = state.extractedColors.map(c => 
        c === state.selectedColor ? color : c
      );
      dispatch({ type: 'SET_EXTRACTED_COLORS', payload: newColors });
      dispatch({ type: 'SET_SELECTED_COLOR', payload: color });
    }
  }, [dispatch, state.selectedColor, state.extractedColors]);

  return (
    <div className="min-h-screen flex bg-zinc-950 flex-col">
      <Navigation 
        title="[Colorfy]®"
        onNext={handleInterfaceChange}
      />
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="w-full max-w-3xl"
        >
          <div className="w-full relative p-6 space-y-6 rounded-lg border border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm">
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 justify-center">
                <Wand2 className="h-5 w-5 text-accent" />
                <Label className="text-lg font-medium">Extract Colors from Image</Label>
              </div>
            </motion.div>

            {!state.extractedColors.length ? (
              <motion.div 
                className="flex flex-col items-center justify-center gap-4 py-12"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="relative">
                  <UploadButton 
                    onUpload={handleUpload} 
                    hasImage={false}
                    isLoading={isExtracting}
                    title="Upload"
                    imagePreview={imagePreview || undefined}
                  />
                  <AnimatePresence>
                    {isExtracting && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm text-accent"
                      >
                        Extracting colors...
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-muted-foreground text-center"
                >
                  Drop an image to extract its color palette | BOXY©
                </motion.p>
              </motion.div>
            ) : (
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="flex flex-col items-center gap-4">
                  <UploadButton 
                    onUpload={handleUpload} 
                    hasImage={true}
                    isLoading={isExtracting}
                    title="Change Image"
                    imagePreview={imagePreview || undefined}
                  />
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-muted-foreground text-center"
                  >
                    Colors extracted! Click any color to copy or edit it.
                  </motion.p>
                </div>

                <ColorPreview
                  colors={state.extractedColors}
                  selectedColor={state.selectedColor}
                  onColorSelect={handleColorSelect}
                  onColorChange={handleColorChange}
                  defaultColor={state.selectedColor || "#1C9488"}
                  transparent
                />
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
} 