'use client';

import { ColorPreview } from './color-preview';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Palette, X, AlertCircle } from 'lucide-react';
import { useGradient } from '@/app/contexts/GradientContext';
import { UploadButton } from './UploadButton';
import { rgbToHex, cn } from '@/app/lib/utils';
import { validateColor, COLOR_ROLES, type ColorRole, type DesignSystemRoleId } from '../features/color/core/color-system';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Input } from '../ui/input';
import { ColorPicker } from '../features/color/shared/color-picker';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface ColorSidebarProps {
  colors: string[];
  selectedColor: string | null;
  onColorSelect: (color: string) => void;
  onColorChange?: (color: string, index: number) => void;
  onImageUpload?: (file: File) => void;
  hasImage?: boolean;
  isLoading?: boolean;
}

// Extract color extraction logic to a shared utility
async function extractColorsFromImage(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
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
          const palette = colorThief.getPalette(img, 4); // Extract only 4 colors
          
          const colors = palette.slice(0, 4).map((color: [number, number, number]) => 
            rgbToHex(color[0], color[1], color[2])
          );

          // Fill with defaults if needed
          while (colors.length < 4) {
            colors.push('#000000');
          }

          resolve(colors);
        } catch (error) {
          reject(error);
        }
      };
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const ColorLimitIndicator = ({ current, max }: { current: number; max: number }) => {
  const remaining = max - current;
  const isLimitReached = current >= max;

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

const ColorItem = ({ 
  color, 
  index, 
  onRemove, 
  onSelect, 
  onUpdate,
  roleId
}: { 
  color: string; 
  index: number; 
  onRemove: (color: string) => void;
  onSelect: (color: string) => void;
  onUpdate: (color: string, index: number) => void;
  roleId: DesignSystemRoleId;
}) => {
  const { state } = useGradient();
  const isSelected = state.selectedColor === color;
  const [inputValue, setInputValue] = useState(color);
  const [isOpen, setIsOpen] = useState(false);

  // Update input value when color prop changes
  useEffect(() => {
    setInputValue(color);
  }, [color]);

  // Handle hex input changes
  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.trim();
    
    // Remove any non-hex characters
    value = value.replace(/[^0-9A-Fa-f]/g, '');
    
    // Add # if not present
    if (!value.startsWith('#')) {
      value = '#' + value;
    }
    
    // Limit to 7 characters (#RRGGBB)
    value = value.slice(0, 7);
    
    setInputValue(value);
    
    // Only update if we have a valid hex color
    if (value.length === 7 && validateColor(value)) {
      onUpdate(value, index);
    }
  };

  // Handle hex input blur
  const handleHexInputBlur = () => {
    if (!validateColor(inputValue)) {
      setInputValue(color); // Reset to original color if invalid
    }
  };

  // Handle hex input keydown
  const handleHexInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <motion.div
      className={cn(
        "group flex items-center gap-2 p-2 rounded-lg transition-all",
        "bg-zinc-900/50 hover:bg-zinc-800/50",
        isSelected && "ring-1 ring-accent"
      )}
    >
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            className="w-8 h-8 md:w-10 md:h-10 rounded-lg shadow-sm transition-transform hover:scale-105 border border-zinc-800/50"
            style={{ backgroundColor: color }}
            onClick={() => setIsOpen(true)}
            aria-label={`${roleId} color: ${color}`}
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
            color={color}
            onChange={(newColor) => {
              onUpdate(newColor, index);
              setInputValue(newColor);
            }}
            compact
          />
        </PopoverContent>
      </Popover>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Input
            value={inputValue}
            onChange={handleHexInputChange}
            onBlur={handleHexInputBlur}
            onKeyDown={handleHexInputKeyDown}
            className={cn(
              "h-7 bg-zinc-900/50 border-zinc-700/50 font-mono text-xs flex-1",
              !validateColor(inputValue) && "border-red-500/50 focus:border-red-500"
            )}
            placeholder="#000000"
          />
        </div>
      </div>

      <button
        onClick={() => onRemove(color)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-800 rounded-lg"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
};

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
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isInteractingWithPopover, setIsInteractingWithPopover] = useState(false);
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  // Group colors by role
  const roleColors = useMemo(() => {
    const grouped: Record<DesignSystemRoleId, string[]> = {
      primary: [],
      secondary: [],
      accent: [],
      background: []
    };

    colors.forEach(color => {
      const roleId = Object.entries(state.designSystem)
        .find(([_, value]) => value === color)?.[0] as DesignSystemRoleId;
      if (roleId && grouped[roleId]) {
        grouped[roleId].push(color);
      }
    });

    return grouped;
  }, [colors, state.designSystem]);

  // Optimize click handling
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (!sidebarRef.current || !isExpanded) return;

    const popovers = document.querySelectorAll('[role="dialog"]');
    const isClickInPopover = Array.from(popovers).some(popover => popover.contains(e.target as Node));
    const isOutsideSidebar = !sidebarRef.current.contains(e.target as Node);
    
    if (isOutsideSidebar && !isClickInPopover && !isInteractingWithPopover) {
      setIsExpanded(false);
    }
  }, [isExpanded, isInteractingWithPopover]);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      if (isMobileView) {
        setIsExpanded(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  // Optimize color change handler
  const handleColorChange = useCallback((color: string, index: number) => {
    if (!validateColor(color)) return;

    const roleId = Object.entries(state.designSystem).find(([_, value]) => value === colors[index])?.[0] as DesignSystemRoleId;
    
    // Update design system if color is assigned to a role
    if (roleId) {
      dispatch({
        type: 'SET_DESIGN_SYSTEM',
        payload: { ...state.designSystem, [roleId]: color }
      });
    }

    // Update gradient stops if within range
    if (index < state.colorStops.length) {
      const newColorStops = state.colorStops.map((stop, i) => 
        i === index ? { ...stop, color } : stop
      );
      dispatch({ type: 'SET_COLOR_STOPS', payload: newColorStops });
    }

    onColorChange?.(color, index);
  }, [dispatch, state.designSystem, state.colorStops, colors, onColorChange]);

  // Simplify color selection
  const handleColorClick = useCallback((e: React.MouseEvent | null, color: string) => {
    if (e) e.stopPropagation();
    if (!validateColor(color)) return;
    
    setIsExpanded(true);
    onColorSelect?.(color);
    dispatch({ type: 'SET_SELECTED_COLOR', payload: color });
  }, [dispatch, onColorSelect]);

  // Handle role assignment
  const handleRoleAssign = useCallback((roleId: DesignSystemRoleId, color: string) => {
    if (!validateColor(color)) return;

    dispatch({ 
      type: 'SET_DESIGN_SYSTEM', 
      payload: { ...state.designSystem, [roleId]: color }
    });

    // Show success toast
    const el = document.createElement('div');
    el.className = 'fixed top-4 right-4 bg-accent/90 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2';
    el.textContent = `${roleId.charAt(0).toUpperCase() + roleId.slice(1)} color updated!`;
    document.body.appendChild(el);
    setTimeout(() => {
      el.classList.add('animate-out', 'fade-out', 'slide-out-to-top-2');
      setTimeout(() => el.remove(), 150);
    }, 2000);
  }, [dispatch, state.designSystem]);

  // Handle color hover for tooltips
  const handleColorHover = useCallback((color: string | null) => {
    setHoveredColor(color);
  }, []);

  // Handle popover state
  const handlePopoverOpenChange = useCallback((open: boolean) => {
    setIsInteractingWithPopover(open);
  }, []);

  // Handle color extraction from image
  const handleImageUpload = async (file: File) => {
    setIsExtracting(true);
    try {
      const colors = await extractColorsFromImage(file);

      // Update design system with exactly 4 colors
      dispatch({ 
        type: 'SET_DESIGN_SYSTEM', 
        payload: {
          primary: colors[0],
          secondary: colors[1],
          accent: colors[2],
          background: colors[3],
          text: state.designSystem.text || '#FFFFFF'
        }
      });

      dispatch({ type: 'SET_EXTRACTED_COLORS', payload: colors });
      
      // Update gradient stops with first 3 colors
      dispatch({
        type: 'SET_COLOR_STOPS',
        payload: [
          { id: 'start', color: colors[0], position: 0 },
          { id: 'middle', color: colors[1], position: 0.5 },
          { id: 'end', color: colors[2], position: 1 }
        ]
      });
    } catch (error) {
      console.error('Failed to process image:', error);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleColorRemove = useCallback((color: string) => {
    dispatch({ type: 'REMOVE_COLOR', payload: color });
  }, [dispatch]);

  return (
    <motion.div
      ref={sidebarRef}
      initial={false}
      animate={{
        width: isExpanded ? (isMobile ? '100%' : '300px') : (isMobile ? '0' : '60px'),
        opacity: isExpanded ? 1 : 0.8,
      }}
      transition={{ duration: 0.2 }}
      className={cn(
        "fixed md:relative z-50 md:z-auto",
        "bg-zinc-950/95 backdrop-blur-sm md:bg-zinc-950/50",
        "border-r border-zinc-800/50",
        "h-screen md:h-auto",
        "flex flex-col",
        isExpanded ? "w-full md:w-[300px]" : "w-[60px]"
      )}
    >
      <div className="flex items-center justify-between p-2 border-b border-zinc-800/50">
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-2"
            >
              <Palette className="h-5 w-5" />
              <span className="text-sm font-medium">Color Palette</span>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={handleToggle}
          className="p-2 hover:bg-zinc-800/50 rounded-lg transition-colors"
        >
          {isExpanded ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {COLOR_ROLES.map((role) => (
                <div key={role.id} className="space-y-2">
                  <div className="flex items-center justify-between border-b border-zinc-800/10 pb-1">
                    <span className="text-xs font-medium text-muted-foreground capitalize">
                      {role.name}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {roleColors[role.id].map((color, index) => (
                      <ColorItem
                        key={`${role.id}-${index}`}
                        color={color}
                        index={index}
                        onRemove={handleColorRemove}
                        onSelect={onColorSelect}
                        onUpdate={handleColorChange}
                        roleId={role.id}
                      />
                    ))}
                  </div>
                </div>
              ))}

              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Upload Image</span>
                <UploadButton
                  onUpload={handleImageUpload}
                  isLoading={isExtracting}
                  className="w-full"
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2 py-4"
            >
              {COLOR_ROLES.map((role) => (
                roleColors[role.id].map((color, index) => (
                  <TooltipProvider key={`${role.id}-${index}`}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.button
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            "w-8 h-8 rounded-full cursor-pointer transition-all",
                            "border border-zinc-800/50",
                            "hover:scale-110 hover:border-accent/50",
                            selectedColor === color && "ring-2 ring-accent"
                          )}
                          style={{ backgroundColor: color }}
                          onClick={(e) => handleColorClick(e, color)}
                          onMouseEnter={() => handleColorHover(color)}
                          onMouseLeave={() => handleColorHover(null)}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={5}>
                        <p className="text-xs capitalize">{role.name}: {color}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))
              ))}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <UploadButton
                        onUpload={handleImageUpload}
                        isLoading={isExtracting}
                        className="w-8 h-8 rounded-full"
                        variant="icon"
                      />
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={5}>
                    <p className="text-xs">Upload Image</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}