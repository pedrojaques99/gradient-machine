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
  onRoleAssign
}: { 
  color: string; 
  index: number; 
  onRemove: (color: string) => void;
  onSelect: (color: string) => void;
  onUpdate: (color: string, index: number) => void;
  onRoleAssign: (roleId: DesignSystemRoleId, color: string) => void;
}) => {
  const { state } = useGradient();
  const isSelected = state.selectedColor === color;
  const roleId = Object.entries(state.designSystem)
    .find(([_, value]) => value === color)?.[0] as DesignSystemRoleId;

  const tooltipContent = useMemo(() => (
    <TooltipContent 
      side="right" 
      sideOffset={5}
      className="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
    >
      <p className="text-xs">Click to select color</p>
    </TooltipContent>
  ), []);

  return (
    <motion.div
      className={cn(
        "group flex items-center gap-2 p-2 rounded-lg transition-all",
        "bg-zinc-900/50 hover:bg-zinc-800/50",
        isSelected && "ring-1 ring-accent"
      )}
    >
      <Popover>
        <PopoverTrigger asChild>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="w-10 h-10 rounded-lg shadow-sm transition-transform hover:scale-105 border border-zinc-800/50"
                  style={{ backgroundColor: color }}
                  onClick={() => onSelect(color)}
                  aria-label={`Color ${index + 1}: ${color}`}
                />
              </TooltipTrigger>
              {tooltipContent}
            </Tooltip>
          </TooltipProvider>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-zinc-800">
          <ColorPicker
            color={color}
            onChange={(newColor) => onUpdate(newColor, index)}
            compact
          />
        </PopoverContent>
      </Popover>

      <div className="flex-1 space-y-2">
        <Input
          value={color}
          onChange={(e) => onUpdate(e.target.value, index)}
          className="h-7 bg-zinc-900/50 border-zinc-700/50 font-mono text-xs"
        />
        <Select
          value={roleId || ''}
          onValueChange={(role) => {
            if (!validateColor(color)) return;
            onRoleAssign(role as DesignSystemRoleId, color);
          }}
        >
          <SelectTrigger className="h-7 text-xs bg-zinc-900/50 border-zinc-700/50">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {COLOR_ROLES.map((role) => (
              <SelectItem key={role.id} value={role.id} className="text-xs">
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
  }, [handleClickOutside]); // Only depend on handleClickOutside

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

  // Optimize role assignment
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
          text: state.designSystem.text || '#FFFFFF' // Keep existing text color or default to white
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
      initial={{ width: isExpanded ? '300px' : '64px' }}
      animate={{ width: isExpanded ? '300px' : '64px' }}
      transition={{ duration: 0.2 }}
      className={cn(
        "fixed left-0 top-0 h-screen bg-zinc-900 border-r border-zinc-800/50 shadow-sm z-50",
        isMobile && "w-full md:w-auto"
      )}
    >
      <div className="relative h-full flex flex-col">
        <button
          onClick={handleToggle}
          className={cn(
            "absolute -right-4 top-1/2 -translate-y-1/2 bg-zinc-950 rounded-full p-1 border border-zinc-800 shadow-sm hover:bg-zinc-900 transition-colors",
            isMobile && "hidden"
          )}
        >
          {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          <AnimatePresence mode="wait">
            {isExpanded ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-4 space-y-4"
              >
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-muted-foreground px-1">Colors</h3>
                      <ColorLimitIndicator 
                        current={colors.length} 
                        max={state.maxColors} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      {colors.map((color, index) => (
                        <ColorItem
                          key={color}
                          color={color}
                          index={index}
                          onRemove={handleColorRemove}
                          onSelect={(color) => handleColorClick(null, color)}
                          onUpdate={handleColorChange}
                          onRoleAssign={handleRoleAssign}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({ type: 'SET_INTERFACE', payload: 'gradient-studio' });
                    }}
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
              </motion.div>
            ) : (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center gap-3 py-4"
              >
              {colors.slice(0, 6).map((color, index) => (
                <motion.button
                  key={color + index}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="w-8 h-8 rounded-lg cursor-pointer hover:scale-110 transition-transform border border-zinc-800/50"
                  style={{ backgroundColor: color }}
                  onClick={(e) => handleColorClick(e, color)}
                />
              ))}
              {colors.length > 6 && (
                <div className="w-1 h-1 rounded-full bg-zinc-600 my-1" />
              )}
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: 'SET_INTERFACE', payload: 'gradient-studio' });
                  }}
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}