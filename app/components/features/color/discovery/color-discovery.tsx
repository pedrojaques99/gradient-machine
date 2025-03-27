'use client';

import { useCallback, useState, useMemo, useEffect, useRef } from 'react';
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
import { ColorSwatch } from '@/app/components/shared/ColorSwatch';

type DesignSystem = Partial<Record<DesignSystemRoleId, string>>;

interface ColorSwatchProps {
  color: string;
  isSelected: boolean;
  onClick: () => void;
  onLongPress?: () => void;
}

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
  role: currentRole, 
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
          {currentRole.name}
        </div>
        <div className="text-xs text-muted-foreground">{currentRole.description}</div>
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
  const [showHarmony, setShowHarmony] = useState(false);

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
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Color Analysis</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHarmony(!showHarmony)}
            className="text-xs text-muted-foreground hover:text-accent"
          >
            {showHarmony ? 'Hide Harmony' : 'Show Harmony'}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="font-mono text-sm">{color}</span>
        </div>
      </div>

      {showHarmony && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4"
        >
          <h4 className="text-sm font-medium">Color Harmony</h4>
          <ColorHarmony
            baseColor={color}
            onSelect={(harmonicColor) => {
              dispatch({
                type: 'SET_EXTRACTED_COLORS',
                payload: [...state.extractedColors, harmonicColor]
              });
              setShowHarmony(false);
            }}
          />
        </motion.div>
      )}
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

// Update the FocusModeIndicator component
const FocusModeIndicator = ({ 
  selectedColor, 
  selectedRole, 
  onCancel 
}: { 
  selectedColor: string | null;
  selectedRole: DesignSystemRoleId | null;
  onCancel: () => void;
}) => {
  if (!selectedColor && !selectedRole) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2",
        "bg-zinc-900/95 backdrop-blur-sm",
        "px-6 py-3 rounded-xl",
        "border-2 border-accent/50",
        "shadow-lg shadow-accent/10",
        "z-50",
        "flex items-center gap-4"
      )}
    >
      <div className="flex items-center gap-3">
        {selectedColor && (
          <div className="flex items-center gap-2">
            <div 
              className="w-5 h-5 rounded-full ring-2 ring-accent/30"
              style={{ backgroundColor: selectedColor }}
            />
            <span className="text-sm font-medium text-accent">Cor selecionada</span>
          </div>
        )}
        {selectedColor && selectedRole && (
          <ArrowRight className="h-4 w-4 text-accent/50" />
        )}
        {selectedRole && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium capitalize text-accent">{selectedRole}</span>
            <span className="text-xs text-accent/50">função</span>
          </div>
        )}
      </div>
      <button
        onClick={onCancel}
        className="ml-4 p-1.5 hover:bg-accent/10 rounded-lg transition-colors"
      >
        <X className="h-4 w-4 text-accent/70" />
      </button>
    </motion.div>
  );
};

export function ColorDiscovery() {
  const { state, dispatch } = useGradient();
  const [isExtracting, setIsExtracting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [hoveredRole, setHoveredRole] = useState<DesignSystemRoleId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<DesignSystemRoleId | null>(null);
  const [focusedRole, setFocusedRole] = useState<DesignSystemRoleId | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [showHarmony, setShowHarmony] = useState(false);

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

  // Move handleRoleAssign before handleColorSelect and handleRoleSelect
  const handleRoleAssign = useCallback((roleId: DesignSystemRoleId, color: string) => {
    if (!color) return;

    // Check if color is already assigned to another role
    const existingRole = Object.entries(state.designSystem)
      .find(([_, value]) => value === color)?.[0];

    if (existingRole && existingRole !== roleId) {
      showToast(`This color is already assigned to ${existingRole}. Please choose a different color.`, 'warning');
      return;
    }

    // Update design system
    dispatch({ 
      type: 'SET_DESIGN_SYSTEM', 
      payload: { ...state.designSystem, [roleId]: color }
    });
    setSelectedColor(null);
    setSelectedRole(null);
    setFocusedRole(null);

    showToast(`${roleId.charAt(0).toUpperCase() + roleId.slice(1)} color updated!`, 'success');
  }, [dispatch, state.designSystem]);

  // Add cancel handler
  const handleCancel = useCallback(() => {
    setSelectedColor(null);
    setSelectedRole(null);
    setFocusedRole(null);
    setSelectionError(null);
  }, []);

  // Update handleColorSelect to handle double-click
  const handleColorSelect = useCallback((color: string) => {
    setIsSelecting(true);
    setSelectionError(null);

    // If clicking the same color that's already selected, exit focus mode
    if (selectedColor === color) {
      handleCancel();
      return;
    }

    // If a role is already selected, assign the color to that role
    if (selectedRole) {
      handleRoleAssign(selectedRole, color);
      setIsSelecting(false);
      return;
    }

    // Otherwise, just select the color without showing harmony
    setSelectedColor(color);
    setFocusedRole(null);
    setShowHarmony(false);
  }, [selectedColor, selectedRole, handleRoleAssign, handleCancel]);

  // Update handleRoleSelect to handle double-click
  const handleRoleSelect = useCallback((roleId: DesignSystemRoleId) => {
    setIsSelecting(true);
    setSelectionError(null);

    // If clicking the same role that's already selected, exit focus mode
    if (selectedRole === roleId) {
      handleCancel();
      return;
    }

    // If a color is already selected, assign it to this role
    if (selectedColor) {
      handleRoleAssign(roleId, selectedColor);
      setIsSelecting(false);
      return;
    }

    // Otherwise, enter focus mode for color selection
    setSelectedRole(roleId);
    setFocusedRole(roleId);
  }, [selectedColor, selectedRole, handleRoleAssign, handleCancel]);

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

      // Enhanced color quantization
      const quantizeColor = (r: number, g: number, b: number) => {
        // Use perceptually uniform quantization
        const quantizedR = Math.round(r / 16) * 16;
        const quantizedG = Math.round(g / 16) * 16;
        const quantizedB = Math.round(b / 16) * 16;
        return `rgb(${quantizedR},${quantizedG},${quantizedB})`;
      };

      // Calculate perceptual color distance
      const colorDistance = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) => {
        // Convert to LAB color space for better perceptual distance
        const lab1 = rgbToLab(r1, g1, b1);
        const lab2 = rgbToLab(r2, g2, b2);
        
        // Calculate Delta E (CIE 2000)
        return deltaE(lab1, lab2);
      };

      // Process pixels with enhanced clustering
      for (let i = 0; i < pixels.length; i += chunkSize * 4) {
        const end = Math.min(i + chunkSize * 4, pixels.length);
        for (let j = i; j < end; j += 4) {
          const r = pixels[j];
          const g = pixels[j + 1];
          const b = pixels[j + 2];
          const a = pixels[j + 3];

          // Skip transparent pixels
          if (a < 128) continue;

          // Quantize color
          const color = quantizeColor(r, g, b);

          // Check if similar color exists
          let foundSimilar = false;
          for (const [existingColor, count] of colorMap.entries()) {
            const [er, eg, eb] = existingColor.match(/\d+/g)!.map(Number);
            if (colorDistance(r, g, b, er, eg, eb) < 10) {
              colorMap.set(existingColor, count + 1);
              foundSimilar = true;
              break;
            }
          }

          if (!foundSimilar) {
            colorMap.set(color, (colorMap.get(color) || 0) + 1);
          }
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
        .slice(0, 20) // Extract more colors initially
        .map(c => c.color);

      // Update state with extracted colors
      dispatch({ type: 'SET_EXTRACTED_COLORS', payload: colors });
      setImagePreview(img.src);
      
      return colors;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract colors');
      return [];
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

  // Helper functions for color space conversion
  function rgbToLab(r: number, g: number, b: number) {
    // Convert RGB to XYZ
    r = r / 255;
    g = g / 255;
    b = b / 255;

    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    r = r * 100;
    g = g * 100;
    b = b * 100;

    let x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
    let y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
    let z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;

    // Convert XYZ to LAB
    x = x / 95.047;
    y = y / 100.000;
    z = z / 108.883;

    x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
    y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
    z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;

    return {
      l: (116 * y) - 16,
      a: 500 * (x - y),
      b: 200 * (y - z)
    };
  }

  function deltaE(lab1: { l: number; a: number; b: number }, lab2: { l: number; a: number; b: number }) {
    // Simplified Delta E calculation (CIE 2000)
    const deltaL = lab1.l - lab2.l;
    const deltaA = lab1.a - lab2.a;
    const deltaB = lab1.b - lab2.b;

    return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Add FocusModeIndicator */}
      <FocusModeIndicator
        selectedColor={selectedColor}
        selectedRole={selectedRole}
        onCancel={handleCancel}
      />

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
                  </div>
                  <div className="grid grid-cols-8 gap-2">
                    {state.extractedColors.map((color, index) => (
                      <ColorSwatch
                        key={color + index}
                        color={color}
                        isSelected={selectedColor === color}
                        onClick={() => handleColorSelect(color)}
                        size='lg'
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

                {/* Role Sections */}
                {COLOR_ROLES.map((currentRole) => (
                  <div 
                    key={currentRole.id} 
                    className="space-y-3"
                    onFocus={() => setFocusedRole(currentRole.id)}
                    onBlur={() => setFocusedRole(null)}
                  >
                    <motion.div
                      className={cn(
                        "group relative overflow-hidden rounded-xl",
                        "bg-zinc-900/50 hover:bg-zinc-800/50",
                        "border border-zinc-800/50",
                        "transition-all duration-200",
                        selectedRole === currentRole.id && "border-accent/50 bg-accent/5",
                        focusedRole === currentRole.id && "border-accent/30 bg-accent/5",
                        "hover:border-accent/30 hover:bg-accent/5",
                        "cursor-pointer"
                      )}
                      onClick={() => handleRoleSelect(currentRole.id)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      {/* Background highlight effect */}
                      <motion.div
                        className={cn(
                          "absolute inset-0 bg-accent/5 opacity-0",
                          "transition-opacity duration-200",
                          "group-hover:opacity-100",
                          (selectedRole === currentRole.id || focusedRole === currentRole.id) && "opacity-100"
                        )}
                      />

                      {/* Content */}
                      <div className="relative p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Role icon */}
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center",
                              "bg-zinc-800/50 group-hover:bg-accent/10",
                              "transition-colors duration-200",
                              (selectedRole === currentRole.id || focusedRole === currentRole.id) && "bg-accent/10"
                            )}>
                              {state.designSystem[currentRole.id] ? (
                                <div 
                                  className="w-5 h-5 rounded-full ring-2 ring-accent/30"
                                  style={{ backgroundColor: state.designSystem[currentRole.id] }}
                                />
                              ) : (
                                <Paintbrush className={cn(
                                  "w-5 h-5",
                                  "text-zinc-400 group-hover:text-accent",
                                  "transition-colors duration-200",
                                  (selectedRole === currentRole.id || focusedRole === currentRole.id) && "text-accent"
                                )} />
                              )}
                            </div>

                            {/* Role info */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-sm font-medium capitalize",
                                  "text-zinc-200 group-hover:text-accent",
                                  "transition-colors duration-200",
                                  (selectedRole === currentRole.id || focusedRole === currentRole.id) && "text-accent"
                                )}>
                                  {currentRole.name}
                                </span>
                                {selectedRole === currentRole.id && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-2 h-2 rounded-full bg-accent"
                                  />
                                )}
                              </div>
                              <p className="text-xs text-zinc-400 group-hover:text-zinc-300">
                                {currentRole.description}
                              </p>
                            </div>
                          </div>

                          {/* Status indicators and color thumbnails */}
                          <div className="flex items-center gap-3">
                            {/* Color thumbnails */}
                            {state.designSystem[currentRole.id] && (
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-6 h-6 rounded-lg ring-2 ring-accent/30"
                                  style={{ backgroundColor: state.designSystem[currentRole.id] }}
                                />
                                <span className="text-xs font-mono text-accent/70">
                                  {state.designSystem[currentRole.id]}
                                </span>
                              </div>
                            )}
                            
                            {/* Status messages */}
                            <div className="flex items-center gap-2">
                              {focusedRole === currentRole.id && (
                                <motion.div
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="flex items-center gap-1.5 text-xs text-white/70"
                                >
                                  <span>Selecione uma cor</span>
                                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                                </motion.div>
                              )}
                              {selectedColor && selectedRole === currentRole.id && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="text-xs text-accent/70"
                                >
                                  Clique para confirmar
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                ))}
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