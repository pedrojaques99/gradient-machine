'use client';

import { useCallback, useState, useMemo, useEffect } from 'react';
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
import { COLOR_ROLES, type ColorRole, type DesignSystemRoleId, getColorProperties, generateColorVariations, type ColorProperties, type ColorVariation, validateColor } from '../core/color-system';
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

export const ColorSwatch = ({ color, isSelected, onClick }: ColorSwatchProps) => {
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
              "group relative w-12 h-12 rounded-md transition-all",
              "hover:scale-105 hover:shadow-md",
              "border border-zinc-800/50",
              isSelected && "ring-1 ring-accent ring-offset-1 ring-offset-zinc-950",
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
                  className="bg-accent/90 text-black p-0.5 rounded-full"
                >
                  <Check className="h-3 w-3" aria-hidden="true" />
                </motion.div>
              ) : (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 absolute inset-0 flex items-center justify-center">
                  <Paintbrush className="h-3 w-3 text-white" aria-hidden="true" />
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
}: ColorRoleProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(assignedColor || '');

  // Update input value when color changes
  useEffect(() => {
    setInputValue(assignedColor || '');
  }, [assignedColor]);

  // Handle hex input changes
  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.trim();
    value = value.replace(/[^0-9A-Fa-f]/g, '');
    if (!value.startsWith('#')) {
      value = '#' + value;
    }
    value = value.slice(0, 7);
    setInputValue(value);
    
    if (value.length === 7 && validateColor(value)) {
      onColorChange(value);
    }
  };

  return (
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
      <div className="relative flex items-center gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <div 
              className={cn(
                "w-10 h-10 rounded-md transition-all cursor-pointer",
                "border-2",
                assignedColor ? "border-transparent shadow-lg" : "border-dashed border-zinc-700/50",
                isSelecting && "ring-2 ring-accent/50"
              )}
              style={{ 
                backgroundColor: assignedColor || 'transparent',
                boxShadow: assignedColor ? `0 4px 12px ${assignedColor}15` : 'none'
              }}
            />
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-0 border-zinc-800" 
            sideOffset={5}
            onInteractOutside={(e) => {
              e.preventDefault();
              setIsOpen(false);
            }}
          >
            <ColorPicker
              color={assignedColor || '#000000'}
              onChange={(newColor) => {
                onColorChange(newColor);
                setInputValue(newColor);
              }}
              compact
            />
          </PopoverContent>
        </Popover>

        {assignedColor && (
          <Input
            value={inputValue}
            onChange={handleHexInputChange}
            onBlur={() => {
              if (!validateColor(inputValue)) {
                setInputValue(assignedColor);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            className="w-30 h-8 bg-zinc-900/50 border-zinc-700/50 font-mono text-xs hover:bg-zinc-800/50"
            onClick={(e) => e.stopPropagation()}
          />
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
};

interface ColorAnalysisProps {
  color: string;
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
      exit={{ opacity: 0, y: 20 }}
      className="space-y-6 p-4 bg-zinc-900/50 rounded-lg backdrop-blur-sm"
    >
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Color Analysis</h3>
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="font-mono text-sm">{color}</span>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium">Color Harmony</h4>
        <ColorHarmony
          baseColor={color}
          onSelect={(harmonicColor) => {
            dispatch({
              type: 'SET_EXTRACTED_COLORS',
              payload: [...state.extractedColors, harmonicColor]
            });
          }}
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

  // Group colors by role (same logic as ColorSidebar)
  const roleColors = useMemo(() => {
    const grouped: Record<DesignSystemRoleId, string[]> = {
      primary: [],
      secondary: [],
      accent: [],
      background: []
    };

    state.extractedColors.forEach(color => {
      const roleId = Object.entries(state.designSystem)
        .find(([_, value]) => value === color)?.[0] as DesignSystemRoleId;
      if (roleId && grouped[roleId]) {
        grouped[roleId].push(color);
      }
    });

    return grouped;
  }, [state.extractedColors, state.designSystem]);

  // Handle color selection for analysis only
  const handleColorSelect = useCallback((color: string) => {
    // Only use local state for color analysis
    setSelectedColor(color === selectedColor ? null : color);
  }, [selectedColor]);

  // Handle role assignment
  const handleRoleAssign = useCallback((roleId: DesignSystemRoleId) => {
    if (!selectedColor) return;

    // Check if color is already assigned to another role
    const currentRole = Object.entries(state.designSystem)
      .find(([_, value]) => value === selectedColor)?.[0];

    if (currentRole && currentRole !== roleId) {
      showToast(`This color is already assigned to ${currentRole}. Please choose a different color.`, 'warning');
      return;
    }

    // Update design system and clear selection
    dispatch({ 
      type: 'SET_DESIGN_SYSTEM', 
      payload: { ...state.designSystem, [roleId]: selectedColor }
    });
    setSelectedColor(null);

    showToast(`${roleId.charAt(0).toUpperCase() + roleId.slice(1)} color updated!`, 'success');
  }, [dispatch, selectedColor, state.designSystem]);

  // Handle color change
  const handleColorChange = useCallback((color: string, roleId: DesignSystemRoleId) => {
    if (!validateColor(color)) return;

    dispatch({ 
      type: 'SET_DESIGN_SYSTEM', 
      payload: { ...state.designSystem, [roleId]: color }
    });

    // Update gradient stops if color is used in gradient
    const colorIndex = state.colorStops.findIndex(stop => stop.color === color);
    if (colorIndex !== -1) {
      const newColorStops = state.colorStops.map((stop, i) => 
        i === colorIndex ? { ...stop, color } : stop
      );
      dispatch({ type: 'SET_COLOR_STOPS', payload: newColorStops });
    }
  }, [dispatch, state.designSystem, state.colorStops]);

  // Handle color removal (sync with sidebar)
  const handleColorRemove = useCallback((roleId: DesignSystemRoleId) => {
    const newDesignSystem = { ...state.designSystem };
    delete newDesignSystem[roleId];
    dispatch({ type: 'SET_DESIGN_SYSTEM', payload: newDesignSystem });
  }, [dispatch, state.designSystem]);

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

  // Handle image upload without automatic role assignment
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
          }
        };
        
        img.onerror = () => {
          setIsExtracting(false);
          showToast('Failed to load image. Please try again.', 'error');
        };
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to process image:', error);
      setIsExtracting(false);
    }
  }, [dispatch, extractColors]);

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

  // Handle variation selection with the same logic
  const handleVariationSelect = useCallback((variation: ColorVariation) => {
    // Don't add if color already exists
    if (state.extractedColors.includes(variation.hex)) {
      return;
    }
    
    if (state.extractedColors.length >= state.maxColors) {
      showToast(`Maximum ${state.maxColors} colors allowed. Remove some colors before adding more.`);
      return;
    }
    
    dispatch({ 
      type: 'SET_EXTRACTED_COLORS', 
      payload: [...state.extractedColors, variation.hex] 
    });
  }, [dispatch, state.extractedColors, state.maxColors]);

  // Handle harmony selection with the same logic
  const handleHarmonySelect = useCallback((harmonicColor: string) => {
    // Don't add if color already exists
    if (state.extractedColors.includes(harmonicColor)) {
      return;
    }
    
    if (state.extractedColors.length >= state.maxColors) {
      showToast(`Maximum ${state.maxColors} colors allowed. Remove some colors before adding more.`);
      return;
    }
    
    dispatch({ 
      type: 'SET_EXTRACTED_COLORS', 
      payload: [...state.extractedColors, harmonicColor] 
    });
  }, [dispatch, state.extractedColors, state.maxColors]);

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
      {/* Gradient Background */}
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
        {/* Step 1: Image Upload */}
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

        {/* Main Content Area */}
        <section className={cn(
          "flex-1",
          UI_CLASSES.container,
          UI_SPACING.container.maxWidth,
          UI_SPACING.container.padding,
          "pb-12"
        )}>
          {!state.extractedColors.length ? (
            // Step 1: Initial Upload State
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
            // Steps 2 & 3: Color Management
            <motion.div
              className={cn("space-y-8", UI_SPACING.section.gap)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Step 2: Image Preview & Extracted Colors */}
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Image Preview */}
                <div className="w-full md:w-1/2">
                  <ImageUploadPreview
                    imagePreview={imagePreview}
                    onUpload={handleUpload}
                    onRemove={handleRemoveImage}
                    isExtracting={isExtracting}
                    size="lg"
                  />
                </div>

                {/* Extracted Colors Grid */}
                <div className="w-full space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className={UI_CLASSES.sectionTitle}>Cores extraídas</h2>
                    <ColorLimitIndicator />
                  </div>
                  <div className="grid grid-cols-10 gap-2">
                    {state.extractedColors.map((color, index) => (
                      <ColorSwatch
                        key={color + index}
                        color={color}
                        isSelected={selectedColor === color}
                        onClick={() => handleColorSelect(color)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 3: Color Role Configuration */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className={UI_CLASSES.sectionTitle}>Configurar funções das cores</h2>
                  <motion.div 
                    className={cn(
                      UI_CLASSES.card,
                      "p-2 inline-flex items-center gap-2 text-xs"
                    )}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <span className={UI_CLASSES.highlight}>Como configurar:</span>
                    <ol className="flex items-center gap-3">
                      <li className="flex items-center gap-2">
                        <span className="bg-accent/20 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span>
                        Selecione uma cor
                      </li>
                      <ArrowRight className="h-3 w-3 opacity-50" />
                      <li className="flex items-center gap-2">
                        <span className="bg-accent/20 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span>
                        Atribua uma função
                      </li>
                    </ol>
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {COLOR_ROLES.map((role) => (
                    <ColorRole
                      key={role.id}
                      role={role}
                      assignedColor={state.designSystem[role.id]}
                      isHovered={hoveredRole === role.id}
                      isSelecting={!!selectedColor}
                      onHover={(isHovered) => setHoveredRole(isHovered ? role.id : null)}
                      onClick={() => handleRoleAssign(role.id)}
                      onRemove={() => handleColorRemove(role.id)}
                      onColorChange={(color) => handleColorChange(color, role.id)}
                    />
                  ))}
                </div>
              </section>

              {/* Color Analysis (shown when a color is selected) */}
              {selectedColor && (
                <section className="space-y-4">
                  <h2 className={UI_CLASSES.sectionTitle}>Análise de Cor</h2>
                  <ColorAnalysis color={selectedColor} />
                </section>
              )}
            </motion.div>
          )}
        </section>
      </main>
    </div>
  );
} 