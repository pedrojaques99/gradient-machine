'use client';

import { useCallback, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGradient } from '@/app/contexts/GradientContext';
import { UploadButton } from '@/app/components/shared/UploadButton';
import { Navigation } from '@/app/components/shared/Navigation';
import { Label } from '@/app/components/ui/label';
import { Wand2, Check, ArrowRight, Paintbrush, X, RefreshCw, Pencil, AlertCircle } from 'lucide-react';
import { rgbToHex, cn } from '@/app/lib/utils';
import { Button } from '@/app/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { COLOR_ROLES, type ColorRole, type DesignSystemRoleId, getColorProperties, generateColorVariations, type ColorProperties, type ColorVariation } from '../core/color-system';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Input } from "@/app/components/ui/input";
import { ColorPicker } from '../shared/color-picker';
import { ColorHarmony } from '../shared/color-harmony';
import { ImageUploadPreview } from '@/app/components/shared/ImageUploadPreview';
import { GRADIENT_CLASSES, ACCENT_HIGHLIGHT_CLASSES, UI_SPACING, UI_CLASSES } from '@/app/lib/constants';

type DesignSystem = Partial<Record<DesignSystemRoleId, string>>;

interface ColorSwatchProps {
  color: string;
  isSelected: boolean;
  onClick: () => void;
}

const ColorSwatch = ({ color, isSelected, onClick }: ColorSwatchProps) => {
  const tooltipContent = useMemo(() => (
    <TooltipContent side="top" sideOffset={5}>
      <p className="font-mono text-xs">{color}</p>
    </TooltipContent>
  ), [color]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              "group relative p-2 w-full h-25 rounded-md transition-all",
              "hover:scale-105 hover:shadow-lg",
              isSelected && "ring-2 ring-accent ring-offset-2 ring-offset-zinc-950",
              "overflow-hidden"
            )}
            style={{ backgroundColor: color }}
            aria-label={`Color swatch: ${color}`}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              {isSelected ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-accent text-black p-1 rounded-full"
                >
                  <Check className="h-5 w-5" aria-hidden="true" />
                </motion.div>
              ) : (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 absolute inset-0 flex items-center justify-center">
                  <Paintbrush className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
              )}
            </div>
          </button>
        </TooltipTrigger>
        {tooltipContent}
      </Tooltip>
    </TooltipProvider>
  );
};

interface ColorRoleProps {
  role: ColorRole;
  assignedColor: string | null;
  isHovered: boolean;
  isSelecting: boolean;
  onHover: (isHovered: boolean) => void;
  onClick: () => void;
  onRemove: () => void;
  onColorChange: (color: string) => void;
}

const ColorRole = ({ 
  role, 
  assignedColor, 
  isHovered, 
  isSelecting,
  onHover, 
  onClick,
  onRemove,
  onColorChange
}: ColorRoleProps) => (
  <motion.div
    onClick={onClick}
    onMouseEnter={() => onHover(true)}
    onMouseLeave={() => onHover(false)}
    className={cn(
      "group flex items-center gap-3 p-2 rounded-md transition-all",
      "bg-zinc-900/50 hover:bg-zinc-800/50",
      isSelecting && "ring-2 ring-accent/50",
      isHovered && "bg-zinc-800/40",
      !isSelecting && "cursor-default",
      assignedColor && "hover:shadow-lg hover:shadow-accent/5"
    )}
    whileHover={{ scale: 1.01 }}
    animate={{ 
      y: isHovered ? -2 : 0,
      transition: { duration: 0.2 }
    }}
  >
    <div className="relative flex items-center gap-2 bg-background">
      <div 
        className={cn(
          "w-10 h-10 rounded-md transition-all",
          "border-2",
          assignedColor ? "border-transparent shadow-lg" : "border-dashed border-zinc-700/50",
          isSelecting && "ring-2 ring-accent/50"
        )}
        style={{ 
          backgroundColor: assignedColor || 'transparent',
          boxShadow: assignedColor ? `0 4px 12px ${assignedColor}15` : 'none'
        }}
      />
      {assignedColor && (
        <Popover>
          <PopoverTrigger asChild>
            <Input
              value={assignedColor}
              className="w-30 h-15 bg-zinc-900/50 border-zinc-700/50 font-mono text-xs hover:bg-zinc-500/50 border-3"
              onClick={(e) => e.stopPropagation()}
            />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-5">
            <ColorPicker
              color={assignedColor}
              onChange={onColorChange}
              compact
            />
          </PopoverContent>
        </Popover>
      )}
      {!assignedColor ? (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
          <Paintbrush className="h-10 w-10" />
        </div>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-zinc-400 hover:text-white p-1 rounded-full border-2 border-zinc-800"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
    <div className="flex-1 text-left space-y-0.5">
      <div className="text-sm font-medium flex items-center gap-2">
        {role.name}
      </div>
      <div className="text-xs text-muted-foreground">{role.description}</div>
    </div>
    {isSelecting && (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="mr-2 text-accent"
      >
        <ArrowRight className="h-7 w-7" />
      </motion.div>
    )}
  </motion.div>
);

interface ColorAnalysisProps {
  color: string | null;
}

const ColorAnalysis = ({ color }: ColorAnalysisProps) => {
  const { state, dispatch } = useGradient();

  if (!color) return null;

  const properties = getColorProperties(color);
  const variations = generateColorVariations(color);

  if (!properties) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/50 rounded-md p-4 space-y-4"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Color Analysis</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Selected:</span>
            <div className="flex items-center gap-1">
              <div 
                className="w-4 h-4 rounded-sm border border-zinc-700/50"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs font-mono">{color}</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-zinc-800/50 rounded-md p-3 space-y-1">
            <span className="text-xs text-muted-foreground">Brightness</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-zinc-700/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent"
                  style={{ width: `${properties.brightness * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono">{(properties.brightness * 100).toFixed(0)}%</span>
            </div>
          </div>
          <div className="bg-zinc-800/50 rounded-md p-3 space-y-1">
            <span className="text-xs text-muted-foreground">Saturation</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-zinc-700/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent"
                  style={{ width: `${properties.saturation * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono">{(properties.saturation * 100).toFixed(0)}%</span>
            </div>
          </div>
          <div className="bg-zinc-800/50 rounded-md p-3 space-y-1">
            <span className="text-xs text-muted-foreground">Contrast</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-zinc-700/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent"
                  style={{ width: `${properties.contrast * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono">{(properties.contrast * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Color Variations</h3>
          <span className="text-xs text-muted-foreground">Click to select</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {variations.map((variation) => (
            <TooltipProvider key={`${variation.hex}-${variation.type}`}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    className="w-full aspect-square rounded-md cursor-pointer hover:scale-105 transition-transform relative group"
                    style={{ backgroundColor: variation.hex }}
                    whileHover={{ y: -3 }}
                    onClick={() => {
                      if (!state.extractedColors.includes(variation.hex)) {
                        dispatch({ 
                          type: 'SET_EXTRACTED_COLORS', 
                          payload: [...state.extractedColors, variation.hex] 
                        });
                      }
                    }}
                  >
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-md" />
                    <div className="absolute bottom-1 left-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-mono text-white/90 bg-black/40 px-1 rounded">
                        {variation.hex}
                      </span>
                    </div>
                    <span className="sr-only">{variation.type}</span>
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-0.5">
                    <p className="capitalize text-[10px]">{variation.type}</p>
                    <p className="font-mono text-[10px]">{variation.hex}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Color Harmonies</h3>
          <span className="text-xs text-muted-foreground">Click to add to palette</span>
        </div>
        <ColorHarmony 
          baseColor={color}
          onSelect={(selectedHarmonyColor) => {
            if (!state.extractedColors.includes(selectedHarmonyColor)) {
              dispatch({ 
                type: 'SET_EXTRACTED_COLORS', 
                payload: [...state.extractedColors, selectedHarmonyColor] 
              });
            }
          }}
          onColorChange={(newColor) => {
            // Update the color in the extracted colors array
            const updatedColors = state.extractedColors.map(c => 
              c === color ? newColor : c
            );
            dispatch({ 
              type: 'SET_EXTRACTED_COLORS', 
              payload: updatedColors 
            });
          }}
          className="w-full"
        />
      </div>
    </motion.div>
  );
};

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

export function ColorDiscovery() {
  const { state, dispatch } = useGradient();
  const [isExtracting, setIsExtracting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [hoveredRole, setHoveredRole] = useState<DesignSystemRoleId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInterfaceChange = useCallback(() => {
    dispatch({ type: 'SET_INTERFACE', payload: 'ecosystem' });  
  }, [dispatch]);

  const extractColors = useCallback(async (img: HTMLImageElement, quality = 4) => {
    setIsExtracting(true);
    setError(null);
    
    try {
      // Create a temporary canvas for image processing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      // Set canvas size based on quality
      canvas.width = img.width / quality;
      canvas.height = img.height / quality;

      // Draw and scale image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // Process pixels in chunks for better performance
      const chunkSize = 1000;
      const colorMap = new Map<string, number>();
      const totalPixels = pixels.length / 4;

      for (let i = 0; i < pixels.length; i += chunkSize * 4) {
        const end = Math.min(i + chunkSize * 4, pixels.length);
        for (let j = i; j < end; j += 4) {
          const r = pixels[j];
          const g = pixels[j + 1];
          const b = pixels[j + 2];
          const a = pixels[j + 3];

          // Skip transparent pixels
          if (a < 128) continue;

          // Quantize colors to reduce unique values
          const quantizedR = Math.round(r / 8) * 8;
          const quantizedG = Math.round(g / 8) * 8;
          const quantizedB = Math.round(b / 8) * 8;
          const color = `rgb(${quantizedR},${quantizedG},${quantizedB})`;

          colorMap.set(color, (colorMap.get(color) || 0) + 1);
        }
      }

      // Convert to array and sort by frequency
      const colors = Array.from(colorMap.entries())
        .map(([color, count]) => ({
          color,
          count,
          percentage: (count / totalPixels) * 100
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(c => c.color); // Return just the color strings

      // Update state with extracted colors
      dispatch({ type: 'SET_EXTRACTED_COLORS', payload: colors });
      setImagePreview(img.src);
      
      return colors; // Return the colors array
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract colors');
      return []; // Return empty array on error
    } finally {
      setIsExtracting(false);
    }
  }, [dispatch]);

  const handleUpload = useCallback(async (file: File) => {
    setIsExtracting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imgUrl = e.target?.result as string;
        setImagePreview(imgUrl);
        
        const img = new Image();
        img.src = imgUrl;
        img.crossOrigin = "anonymous";
        
        img.onload = async () => {
          const colors = await extractColors(img);
          if (colors.length > 0) {
            dispatch({ type: 'SET_EXTRACTED_COLORS', payload: colors });
            
            // Set design system with all required colors
            dispatch({ 
              type: 'SET_DESIGN_SYSTEM', 
              payload: {
                primary: colors[0],
                secondary: colors[1],
                accent: colors[2],
                background: colors[3],
                text: state.designSystem.text || '#FFFFFF' // Keep existing text color or default to white
              }
            });
          }
        };
        
        img.onerror = () => {
          setIsExtracting(false);
          // Show error toast
          const el = document.createElement('div');
          el.className = 'fixed top-4 right-4 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2';
          el.textContent = 'Não foi possível carregar a imagem. Por favor, tente novamente.';
          document.body.appendChild(el);
          setTimeout(() => {
            el.classList.add('animate-out', 'fade-out', 'slide-out-to-top-2');
            setTimeout(() => el.remove(), 150); 
          }, 3000);
        };
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Não foi possível processar a imagem:', error);
      setIsExtracting(false);
    }
  }, [dispatch, extractColors, state.designSystem.text]);

  const handleRemoveImage = useCallback(() => {
    setImagePreview(null);
    setSelectedColor(null);
    setIsExtracting(false);
    setHoveredRole(null);
    dispatch({ type: 'SET_EXTRACTED_COLORS', payload: [] });
    // Reset design system with proper type
    const emptyDesignSystem = {
      primary: '',
      secondary: '',
      accent: '',
      background: '',
      text: ''
    };
    dispatch({ type: 'SET_DESIGN_SYSTEM', payload: emptyDesignSystem });
  }, [dispatch]);

  const handleColorSelect = useCallback((color: string) => {
    if (state.extractedColors.length >= state.maxColors && !selectedColor) {
      showToast(`Maximum ${state.maxColors} colors allowed. Remove some colors before adding more.`);
      return;
    }
    
    setSelectedColor(color === selectedColor ? null : color);
  }, [selectedColor, state.extractedColors.length, state.maxColors]);

  const handleVariationSelect = useCallback((variation: ColorVariation) => {
    if (state.extractedColors.length >= state.maxColors) {
      showToast(`Maximum ${state.maxColors} colors allowed. Remove some colors before adding more.`);
      return;
    }
    
    if (!state.extractedColors.includes(variation.hex)) {
      dispatch({ 
        type: 'SET_EXTRACTED_COLORS', 
        payload: [...state.extractedColors, variation.hex] 
      });
    }
  }, [dispatch, state.extractedColors, state.maxColors]);

  const handleHarmonySelect = useCallback((selectedHarmonyColor: string) => {
    if (state.extractedColors.length >= state.maxColors) {
      showToast(`Maximum ${state.maxColors} colors allowed. Remove some colors before adding more.`);
      return;
    }
    
    if (!state.extractedColors.includes(selectedHarmonyColor)) {
      dispatch({ 
        type: 'SET_EXTRACTED_COLORS', 
        payload: [...state.extractedColors, selectedHarmonyColor] 
      });
    }
  }, [dispatch, state.extractedColors, state.maxColors]);

  const handleRoleAssign = useCallback((roleId: DesignSystemRoleId) => {
    if (!selectedColor) return;

    dispatch({ 
      type: 'SET_DESIGN_SYSTEM', 
      payload: { ...state.designSystem, [roleId]: selectedColor }
    });
    setSelectedColor(null);

    showToast(`${roleId.charAt(0).toUpperCase() + roleId.slice(1)} color updated!`, 'success');
  }, [dispatch, selectedColor, state.designSystem]);

  const handleRemoveRole = useCallback((roleId: DesignSystemRoleId) => {
    const newDesignSystem = { ...state.designSystem };
    delete newDesignSystem[roleId];
    dispatch({ type: 'SET_DESIGN_SYSTEM', payload: newDesignSystem });
  }, [dispatch, state.designSystem]);

  const handleColorChange = useCallback((color: string, roleId: DesignSystemRoleId) => {
    dispatch({ 
      type: 'SET_DESIGN_SYSTEM', 
      payload: { ...state.designSystem, [roleId]: color }
    });
  }, [dispatch, state.designSystem]);

  // Add color limit indicator to the UI
  const ColorLimitIndicator = () => {
    const remaining = state.maxColors - state.extractedColors.length;
    const isLimitReached = state.extractedColors.length >= state.maxColors;

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

  // Memoize color variations computation
  const colorVariations = useMemo(() => {
    if (!selectedColor) return [];
    return generateColorVariations(selectedColor);
  }, [selectedColor]);

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Full Screen Gradient Background */}
      {!imagePreview && (
        <div className="fixed inset-0 -z-10 group">
          <div className={cn(
            "absolute inset-0",
            GRADIENT_CLASSES.base,
            GRADIENT_CLASSES.colors,
            GRADIENT_CLASSES.hover
          )} />
          <div className={cn(
            "absolute inset-0",
            GRADIENT_CLASSES.delayed.base,
            GRADIENT_CLASSES.delayed.colors,
            GRADIENT_CLASSES.delayed.hover
          )} />
          <div className={cn(
            "absolute inset-0",
            GRADIENT_CLASSES.moreDelayed.base,
            GRADIENT_CLASSES.moreDelayed.colors,
            GRADIENT_CLASSES.moreDelayed.hover
          )} />
          
          {/* Accent Color Highlights */}
          <div className={ACCENT_HIGHLIGHT_CLASSES.container}>
            <div className={cn(ACCENT_HIGHLIGHT_CLASSES.highlight, "top-1/3 left-1/3")} />
            <div className={cn(ACCENT_HIGHLIGHT_CLASSES.highlight, "bottom-1/3 right-1/3 delay-500")} />
          </div>
        </div>
      )}

      <Navigation title="[Colorfy]®" onNext={handleInterfaceChange} />
      
      <main className={cn(
        "flex-1 flex flex-col bg-background",
        UI_SPACING.container.gap
      )}>
        {/* Header Section */}
        <section className={cn(
          UI_SPACING.section.padding,
          UI_CLASSES.container,
          UI_SPACING.container.maxWidth,
          UI_SPACING.container.padding
        )}>
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="flex items-center gap-2 text-accent">
              <Wand2 className="h-5 w-5" />
              <h1 className="text-lg font-semibold">Extrair cores da imagem</h1>
            </div>
            <p className={UI_CLASSES.instructionText}>
              Crie paletas de cores perfeitas a partir de qualquer imagem
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className={cn(
          "flex-1",
          UI_CLASSES.container,
          UI_SPACING.container.maxWidth,
          UI_SPACING.container.padding,
          "pb-12"
        )}>
          {!state.extractedColors.length ? (
            <motion.div 
              className="max-w-md mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex flex-col items-center gap-8">
                <ImageUploadPreview
                  imagePreview={imagePreview}
                  onUpload={handleUpload}
                  onRemove={handleRemoveImage}
                  isExtracting={isExtracting}
                  size="sm"
                />
                {!imagePreview && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span className="text-muted-foreground">Supported formats:</span>
                    <span className={UI_CLASSES.highlight}>PNG, JPG, WEBP</span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              className={cn("space-y-8", UI_SPACING.section.gap)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Image Preview */}
              <div className="flex flex-col items-center">
                <ImageUploadPreview
                  imagePreview={imagePreview}
                  onUpload={handleUpload}
                  onRemove={handleRemoveImage}
                  isExtracting={isExtracting}
                  size="lg"
                />
              </div>

              {/* Color Sections */}
              <div className={cn("space-y-8", UI_SPACING.section.gap)}>
                {/* Extracted Colors */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className={UI_CLASSES.sectionTitle}>Cores extraídas</h2>
                    <ColorLimitIndicator />
                  </div>
                  <TooltipProvider>
                    <div className={cn(
                      "grid",
                      UI_SPACING.grid.cols,
                      UI_SPACING.grid.gap
                    )}>
                      {state.extractedColors.map((color, index) => (
                        <ColorSwatch
                          key={color + index}
                          color={color}
                          isSelected={selectedColor === color}
                          onClick={() => handleColorSelect(color)}
                        />
                      ))}
                    </div>
                  </TooltipProvider>
                </section>

                {/* Color Categories */}
                <section className="space-y-4">
                  <h2 className={UI_CLASSES.sectionTitle}>Categorias de cores</h2>
                  {imagePreview && (
                    <motion.div 
                      className={cn(
                        UI_CLASSES.card,
                        "p-3 inline-flex items-center gap-3 text-xs"
                      )}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <span className={UI_CLASSES.highlight}>Como configurar:</span>
                      <ol className="flex items-center gap-3">
                        <li className="flex items-center gap-2">
                          <span className="bg-accent/20 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span>
                          Click em uma cor
                        </li>
                        <ArrowRight className="h-3 w-3 opacity-50" />
                        <li className="flex items-center gap-2">
                          <span className="bg-accent/20 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span>
                          Clique em uma categoria
                        </li>
                      </ol>
                    </motion.div>
                  )}
                  <div className={cn(
                    "grid grid-cols-1 md:grid-cols-2",
                    UI_SPACING.grid.gap
                  )}>
                    {COLOR_ROLES.map((role) => (
                      <ColorRole
                        key={role.id}
                        role={role}
                        assignedColor={state.designSystem[role.id]}
                        isHovered={hoveredRole === role.id}
                        isSelecting={!!selectedColor}
                        onHover={(isHovered) => setHoveredRole(isHovered ? role.id : null)}
                        onClick={() => handleRoleAssign(role.id)}
                        onRemove={() => handleRemoveRole(role.id)}
                        onColorChange={(color) => handleColorChange(color, role.id)}
                      />
                    ))}
                  </div>
                </section>

                {/* Color Analysis */}
                {selectedColor && (
                  <section className="space-y-4">
                    <h2 className={UI_CLASSES.sectionTitle}>Análise de Cor</h2>
                    <ColorAnalysis color={selectedColor} />
                  </section>
                )}
              </div>
            </motion.div>
          )}
        </section>
      </main>
    </div>
  );
} 