'use client';

import { ColorPreview } from './color-preview';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Palette, X, AlertCircle, Paintbrush, Upload, Wand2, LineChart, Droplet } from 'lucide-react';
import { useGradient } from '@/app/contexts/GradientContext';
import { UploadButton } from './UploadButton';
import { rgbToHex, cn } from '@/app/lib/utils';
import { 
  validateColor, 
  validateColorForRole,
  invalidateColorCache,
  COLOR_ROLES, 
  type ColorRole, 
  type DesignSystemRoleId 
} from '../features/color/core/color-system';
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
import { ColorSwatch } from '@/app/components/shared/ColorSwatch';
import { useRouter } from 'next/navigation';

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
  const { state, dispatch } = useGradient();
  const isSelected = state.selectedColor === color;
  const [inputValue, setInputValue] = useState(color);
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInputValue(color);
    setError(null);
  }, [color]);

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.trim();
    value = value.replace(/[^0-9A-Fa-f]/g, '');
    if (!value.startsWith('#')) {
      value = '#' + value;
    }
    value = value.slice(0, 7);
    setInputValue(value);
    setError(null);
    
    if (value.length === 7 && validateColor(value)) {
      setIsUpdating(true);
      onUpdate(value, index);
      setIsUpdating(false);
    }
  };

  const handleColorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!validateColor(color)) {
      setError('Invalid color');
      return;
    }
    
    // Update global state
    dispatch({ type: 'SET_SELECTED_COLOR', payload: color });
    
    // Call parent handler
    onSelect(color);
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsRemoving(true);
      await onRemove(color);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <motion.div
      className={cn(
        "group flex items-center gap-2 p-2 rounded-lg transition-all",
        "bg-zinc-900/50 hover:bg-zinc-800/50",
        isSelected && "ring-1 ring-accent",
        isUpdating && "opacity-50",
        isRemoving && "opacity-50"
      )}
    >
          <button
            className={cn(
              "w-8 h-8 rounded-md transition-all",
              "border border-zinc-800/50",
              isSelected && "ring-1 ring-accent ring-offset-1 ring-offset-zinc-950",
              error && "border-red-500"
            )}
            style={{ backgroundColor: color }}
            onClick={handleColorClick}
            aria-label={`${roleId} color: ${color}`}
          />

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Input
            value={inputValue}
            onChange={handleHexInputChange}
            onBlur={() => {
              if (!validateColor(inputValue)) {
                setError('Invalid color');
                setInputValue(color);
              } else {
                setError(null);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            className={cn(
              "h-7 bg-zinc-900/50 border-zinc-700/50 font-mono text-xs flex-1",
              error && "border-red-500/50 focus:border-red-500"
            )}
            placeholder="#000000"
          />
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <motion.button
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  "hover:bg-zinc-800/50",
                  "text-zinc-400 hover:text-accent",
                  isOpen && "bg-accent/20 text-accent"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Droplet className="h-3.5 w-3.5" />
              </motion.button>
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
                  setIsUpdating(true);
                  onUpdate(newColor, index);
                  setInputValue(newColor);
                  setIsOpen(false);
                  setIsUpdating(false);
                }}
                compact
              />
            </PopoverContent>
          </Popover>
          {error && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertCircle className="h-3 w-3 text-red-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{error}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <motion.button
        onClick={handleRemove}
        className={cn(
          "opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-800 rounded-lg",
          isUpdating && "opacity-50",
          isRemoving && "opacity-50"
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <X className="h-3 w-3" />
      </motion.button>
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
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { dispatch, state } = useGradient();
  const [isExtracting, setIsExtracting] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isInteractingWithPopover, setIsInteractingWithPopover] = useState(false);
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [currentWidth, setCurrentWidth] = useState(400);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [currentTranslateY, setCurrentTranslateY] = useState(0);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [focusedRole, setFocusedRole] = useState<DesignSystemRoleId | null>(null);
  const [selectedRole, setSelectedRole] = useState<DesignSystemRoleId | null>(null);

  // Update role selection handler
  const handleRoleSelect = useCallback((roleId: DesignSystemRoleId) => {
    setSelectedRole(roleId);
    setFocusedRole(roleId);
  }, []);

  // Update role assignment handler
  const handleRoleAssign = useCallback(async (roleId: DesignSystemRoleId, color: string) => {
    try {
      setIsSelecting(true);
      setSelectionError(null);

      // Format color to hex if needed
      let formattedColor = color;
      if (!color.startsWith('#')) {
        formattedColor = '#' + color.replace(/[^0-9A-Fa-f]/g, '');
      }
      formattedColor = formattedColor.slice(0, 7);

      // Validate color format first
      const colorValidation = validateColor(formattedColor);
      if (!colorValidation.isValid) {
        setSelectionError(colorValidation.reason || 'Invalid color');
        return;
      }

      // Validate color for role
      const roleValidation = validateColorForRole(formattedColor, roleId);
      if (!roleValidation.isValid) {
        setSelectionError(roleValidation.reason || 'Invalid color for role');
        return;
      }

      // Check if color is already assigned to another role
      const existingRole = Object.entries(state.designSystem)
        .find(([_, value]) => value === formattedColor)?.[0];

      if (existingRole && existingRole !== roleId) {
        setSelectionError(`This color is already assigned to ${existingRole}. Please choose a different color.`);
        return;
      }

      // Update design system
      dispatch({
        type: 'SET_DESIGN_SYSTEM',
        payload: { ...state.designSystem, [roleId]: formattedColor }
      });

      // Clear selection after successful assignment
      dispatch({ type: 'SET_SELECTED_COLOR', payload: null });
      onColorSelect('');

      // Invalidate color cache for this color
      invalidateColorCache(formattedColor);

      // Show success feedback
      const el = document.createElement('div');
      el.className = 'fixed top-4 right-4 bg-accent/90 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2';
      el.textContent = `${roleId.charAt(0).toUpperCase() + roleId.slice(1)} color updated!`;
      document.body.appendChild(el);
      setTimeout(() => {
        el.classList.add('animate-out', 'fade-out', 'slide-out-to-top-2');
        setTimeout(() => el.remove(), 150);
      }, 2000);
    } catch (error) {
      setSelectionError(error instanceof Error ? error.message : 'Failed to assign color role');
    } finally {
      setIsSelecting(false);
      setSelectedRole(null);
      setFocusedRole(null);
    }
  }, [dispatch, state.designSystem, onColorSelect]);

  // Update color selection handler
  const handleColorClick = useCallback(async (e: React.MouseEvent | null, color: string) => {
    if (e) e.stopPropagation();
    
    try {
      setIsSelecting(true);
      setSelectionError(null);

      // Format color to hex if needed
      let formattedColor = color;
      if (!color.startsWith('#')) {
        formattedColor = '#' + color.replace(/[^0-9A-Fa-f]/g, '');
      }
      formattedColor = formattedColor.slice(0, 7);

      const validation = validateColor(formattedColor);
      if (!validation.isValid) {
        setSelectionError(validation.reason || 'Invalid color');
        return;
      }

      // If a role is selected, assign the color to that role
      if (selectedRole) {
        await handleRoleAssign(selectedRole, formattedColor);
      } else {
        // Otherwise, just select the color
        dispatch({ type: 'SET_SELECTED_COLOR', payload: formattedColor });
        await onColorSelect(formattedColor);
      }
    } catch (error) {
      setSelectionError(error instanceof Error ? error.message : 'Failed to select color');
    } finally {
      setIsSelecting(false);
    }
  }, [dispatch, onColorSelect, selectedRole, handleRoleAssign]);

  // Update color change handler
  const handleColorChange = useCallback((color: string, index: number) => {
    const validation = validateColor(color);
    if (!validation.isValid) {
      setSelectionError(validation.reason || 'Invalid color');
      return;
    }

    // Find the role this color belongs to
    const roleId = Object.entries(state.designSystem)
      .find(([_, value]) => value === colors[index])?.[0] as DesignSystemRoleId;
    
    if (roleId) {
      // Validate color for role
      const roleValidation = validateColorForRole(color, roleId);
      if (!roleValidation.isValid) {
        setSelectionError(roleValidation.reason || 'Invalid color for role');
        return;
      }

      // Update design system
      dispatch({
        type: 'SET_DESIGN_SYSTEM',
        payload: { ...state.designSystem, [roleId]: color }
      });

      // Update gradient stops if color is used in gradient
      const colorIndex = state.colorStops.findIndex(stop => stop.color === colors[index]);
      if (colorIndex !== -1) {
        const newColorStops = state.colorStops.map((stop, i) => 
          i === colorIndex ? { ...stop, color } : stop
        );
        dispatch({ type: 'SET_COLOR_STOPS', payload: newColorStops });
      }

      // Invalidate color cache for this color
      invalidateColorCache(color);

      // Show success feedback
      const el = document.createElement('div');
      el.className = 'fixed top-4 right-4 bg-accent/90 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2';
      el.textContent = 'Color updated successfully!';
      document.body.appendChild(el);
      setTimeout(() => {
        el.classList.add('animate-out', 'fade-out', 'slide-out-to-top-2');
        setTimeout(() => el.remove(), 150);
      }, 2000);
    }

    onColorChange?.(color, index);
  }, [dispatch, state.designSystem, state.colorStops, colors, onColorChange]);

  // Update color removal to sync with ColorDiscovery
  const handleColorRemove = useCallback((color: string) => {
    try {
      setIsSelecting(true);
      setSelectionError(null);

    // If removing the selected color, clear selection
    if (state.selectedColor === color) {
      dispatch({ type: 'SET_SELECTED_COLOR', payload: null });
      onColorSelect('');
    }

      // Find the role this color belongs to
    const roleId = Object.entries(state.designSystem)
      .find(([_, value]) => value === color)?.[0] as DesignSystemRoleId;
    
    if (roleId) {
        // Show confirmation dialog
      const role = COLOR_ROLES.find(r => r.id === roleId);
      if (!role) {
        setSelectionError('Invalid role');
        return;
      }

      const confirmed = window.confirm(
          `Remove ${color} from ${role.name} role?\n\n` +
          `This will clear the color assignment for this role.`
      );
      if (!confirmed) return;

        // Update design system
        const newDesignSystem = { ...state.designSystem };
        delete newDesignSystem[roleId];
        dispatch({ type: 'SET_DESIGN_SYSTEM', payload: newDesignSystem });

        // If this was the selected role, clear it
        if (selectedRole === roleId) {
          setSelectedRole(null);
          setFocusedRole(null);
        }

      // Show success feedback
      const el = document.createElement('div');
      el.className = 'fixed top-4 right-4 bg-accent/90 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2';
        el.textContent = `${role.name} color removed!`;
      document.body.appendChild(el);
      setTimeout(() => {
        el.classList.add('animate-out', 'fade-out', 'slide-out-to-top-2');
        setTimeout(() => el.remove(), 150);
      }, 2000);
      }

      // Remove color from extracted colors
      const newColors = state.extractedColors.filter(c => c !== color);
      dispatch({ type: 'SET_EXTRACTED_COLORS', payload: newColors });

      // Update gradient stops if needed
      const colorIndex = state.colorStops.findIndex(stop => stop.color === color);
      if (colorIndex !== -1) {
        const newColorStops = state.colorStops.filter((_, i) => i !== colorIndex);
        dispatch({ type: 'SET_COLOR_STOPS', payload: newColorStops });
      }
    } catch (error) {
      setSelectionError(error instanceof Error ? error.message : 'Failed to remove color');
    } finally {
      setIsSelecting(false);
    }
  }, [dispatch, state.designSystem, state.selectedColor, state.extractedColors, state.colorStops, onColorSelect, selectedRole]);

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

      // Update extracted colors without considering limit
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

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isExpanded) return;

    switch (e.key) {
      case 'Escape':
        setIsExpanded(false);
        break;
      case 'Tab':
        if (e.shiftKey) {
          // Handle shift+tab navigation
          const focusableElements = sidebarRef.current?.querySelectorAll(
            'button, input, [role="button"], [tabindex="0"]'
          );
          if (focusableElements) {
            const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as Element);
            if (currentIndex > 0) {
              (focusableElements[currentIndex - 1] as HTMLElement).focus();
            }
          }
        }
        break;
    }
  }, [isExpanded]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle mobile gestures
  const handleMobileGesture = useCallback((e: TouchEvent) => {
    if (!isMobile) return;

    const touch = e.touches[0];
    const startY = touch.clientY;
    const startX = touch.clientX;

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const deltaY = touch.clientY - startY;
      const deltaX = touch.clientX - startX;

      // If horizontal swipe is greater than vertical, don't handle
      if (Math.abs(deltaX) > Math.abs(deltaY)) return;

      if (deltaY > 50 && isBottomSheetOpen) {
        setIsBottomSheetOpen(false);
      } else if (deltaY < -50 && !isBottomSheetOpen) {
        setIsBottomSheetOpen(true);
      }
    };

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  }, [isMobile, isBottomSheetOpen]);

  useEffect(() => {
    if (isMobile) {
      document.addEventListener('touchstart', handleMobileGesture);
      return () => document.removeEventListener('touchstart', handleMobileGesture);
    }
  }, [isMobile, handleMobileGesture]);

  // Handle mobile color picker
  const handleMobileColorPicker = useCallback(async (color: string, roleId: DesignSystemRoleId) => {
    if (!isMobile) return;

    const picker = document.createElement('div');
    picker.className = cn(
      'fixed inset-0 z-50',
      'bg-black/50 backdrop-blur-sm',
      'flex items-center justify-center'
    );

    const content = document.createElement('div');
    content.className = cn(
      'bg-background p-4 rounded-lg',
      'w-[90%] max-w-sm',
      'shadow-xl'
    );

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between mb-4';
    header.innerHTML = `
      <h3 class="text-lg font-medium">Pick ${roleId} color</h3>
      <button class="p-2 hover:bg-zinc-800 rounded-lg">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M6 18L18 6M6 6l12 12" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    `;

    const colorPicker = document.createElement('div');
    colorPicker.className = 'w-full h-64';

    content.appendChild(header);
    content.appendChild(colorPicker);
    picker.appendChild(content);
    document.body.appendChild(picker);

    try {
      // Initialize color picker using React
      const { createRoot } = await import('react-dom/client');
      const root = createRoot(colorPicker);
      root.render(
        <ColorPicker
          color={color}
          onChange={(newColor) => {
            handleColorChange(newColor, 0);
            root.unmount();
          }}
          onClose={() => root.unmount()}
          compact={false}
        />
      );

      // Handle close button
      header.querySelector('button')?.addEventListener('click', () => {
        root.unmount();
      });

      // Handle backdrop click
      picker.addEventListener('click', (e) => {
        if (e.target === picker) {
          root.unmount();
        }
      });
    } catch (error) {
      console.error('Failed to load color picker:', error);
      picker.remove();
    }
  }, [isMobile, handleColorChange]);

  // Optimize mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      if (isMobileView) {
        setIsExpanded(false);
        setIsBottomSheetOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle mobile touch interactions
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    
    if (diff > 0) { // Dragging down
      setCurrentTranslateY(Math.min(diff, 0));
    } else { // Dragging up
      setCurrentTranslateY(Math.max(diff, -window.innerHeight));
    }
  };

  const handleTouchEnd = () => {
    if (currentTranslateY > window.innerHeight * 0.3) {
      setIsBottomSheetOpen(false);
    } else {
      setIsBottomSheetOpen(true);
      setCurrentTranslateY(0);
    }
  };

  // Optimize sidebar resizing
  const handleResizeStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const diff = e.clientX - dragStartX;
      const newWidth = Math.max(280, Math.min(600, currentWidth + diff));
      setCurrentWidth(newWidth);
      setDragStartX(e.clientX);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStartX, currentWidth]);

  // Update role colors grouping to match ColorDiscovery
  const roleColors = useMemo(() => {
    const grouped: Record<DesignSystemRoleId, string[]> = {
      primary: [],
      secondary: [],
      accent: [],
      background: []
    };

    // Use state.extractedColors instead of colors prop
    state.extractedColors.forEach(color => {
      const roleId = Object.entries(state.designSystem)
        .find(([_, value]) => value === color)?.[0] as DesignSystemRoleId;
      if (roleId && grouped[roleId]) {
        grouped[roleId].push(color);
      }
    });

    return grouped;
  }, [state.extractedColors, state.designSystem]);

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div
        ref={sidebarRef}
        initial={false}
        animate={{
          width: isExpanded ? (isMobile ? '100%' : `${currentWidth}px`) : (isMobile ? '0' : '60px'),
          opacity: isExpanded ? 1 : 0.8,
        }}
        transition={{ duration: 0.2 }}
        className={cn(
          "fixed top-0 left-0 md:sticky md:top-0",
          "z-50",
          "bg-background-secondary backdrop-blur-sm md:bg-background",
          "border-r border-zinc-800/50",
          "h-screen",
          "flex flex-col",
          isExpanded ? "w-full md:w-[400px]" : "w-[60px]",
          isMobile && "hidden"
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between h-12 px-3",
          "border-b border-zinc-800/50",
          "md:rounded-tr-xl"
        )}>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-2"
              >
                <Palette className="h-5 w-5" />
                <span className="text-sm font-medium">Paleta de cores</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={handleToggle}
            className="p-2 hover:bg-zinc-850/50 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Main Content */}
        <div className={cn(
          "flex-1 overflow-y-auto p-5 space-y-6",
          "scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
        )}>
          <AnimatePresence mode="wait">
            {isExpanded ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Role Sections */}
                {COLOR_ROLES.map((role) => (
                  <div 
                    key={role.id} 
                    className="space-y-3"
                    onFocus={() => setFocusedRole(role.id)}
                    onBlur={() => setFocusedRole(null)}
                  >
                    <div className={cn(
                      "flex items-center justify-between border-b border-zinc-800/10 pb-2",
                      "cursor-pointer",
                      selectedRole === role.id && "border-accent/50"
                    )}
                    onClick={() => handleRoleSelect(role.id)}
                    >
                      <span className={cn(
                        "text-xs font-medium capitalize",
                        selectedRole === role.id ? "text-accent" : "text-muted-foreground"
                      )}>
                        {role.name}
                      </span>
                      {selectedRole === role.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 rounded-full bg-accent"
                        />
                      )}
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
                      {!roleColors[role.id].length && (
                        <motion.button
                          className={cn(
                            "w-full group flex items-center gap-3 p-3 rounded-lg transition-all",
                            "bg-zinc-900/30 hover:bg-zinc-800/50",
                            "border border-dashed border-zinc-800/50 hover:border-accent/50",
                            focusedRole === role.id && "border-accent/50 bg-accent/10",
                            selectedRole === role.id && "border-accent bg-accent/20"
                          )}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => handleRoleSelect(role.id)}
                          onFocus={() => setFocusedRole(role.id)}
                          onBlur={() => setFocusedRole(null)}
                        >
                          <div className="w-8 h-8 rounded-md bg-zinc-800/50 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                            <Paintbrush className="h-3 w-3 text-zinc-400 group-hover:text-accent transition-colors" />
                          </div>
                          <div className="flex-1 text-left">
                            <span className="text-sm text-zinc-400 group-hover:text-accent transition-colors">
                              {selectedRole === role.id ? "Select a color to assign" : `Add ${role.name} color`}
                            </span>
                          </div>
                        </motion.button>
                      )}
                    </div>

                    {/* Color Swatches - Only show when role is focused or selected */}
                    {(focusedRole === role.id || selectedRole === role.id) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                      >
                        <div className="grid grid-cols-6 gap-0.5">
                          {state.extractedColors.map((color, index) => (
                            <ColorSwatch
                              key={color + index}
                              color={color}
                              isSelected={selectedColor === color}
                              onClick={() => handleColorClick(null, color)}
                              size="md"
                              className={cn(
                                "w-8 h-8 rounded-md transition-transform duration-200 hover:scale-105",
                                isSelecting && "opacity-50",
                                selectionError && "border-red-500"
                              )}
                            />
                          ))}
                </div>
                      </motion.div>
                    )}
                  </div>
                ))}

                {/* Error Display */}
                {selectionError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                  >
                    <p className="text-xs text-red-500">{selectionError}</p>
                  </motion.div>
                )}
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Navigation */}
        <div className={cn(
          "flex items-center justify-between h-12 px-3",
          "border-t border-zinc-800/50"
        )}>
          <AnimatePresence>
            {isExpanded && (
                      <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-4 w-full"
              >
                <button
                  onClick={() => onImageUpload?.(new File([], 'image.png'))}
                  className="flex items-center gap-2 text-sm hover:text-accent transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload Image</span>
                </button>
                <div className="h-4 w-px bg-zinc-800/50" />
                <button
                  onClick={() => router.push('/gradient-studio')}
                  className="flex items-center gap-2 text-sm hover:text-accent transition-colors"
                >
                  <LineChart className="h-4 w-4" />
                  <span>Gradient Machine</span>
                </button>
                <div className="h-4 w-px bg-zinc-800/50" />
                <button
                  onClick={() => router.push('/design-system')}
                  className="flex items-center gap-2 text-sm hover:text-accent transition-colors"
                >
                  <Wand2 className="h-4 w-4" />
                  <span>Color System</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Mobile Bottom Sheet */}
      {isMobile && (
        <motion.div
          initial={false}
          animate={{
            y: isBottomSheetOpen ? 0 : window.innerHeight,
            height: isBottomSheetOpen ? '80vh' : '40vh',
          }}
          transition={{ type: "spring", damping: 20 }}
          className={cn(
            "fixed bottom-0 left-0 right-0",
            "bg-background-secondary backdrop-blur-sm",
            "border-t border-zinc-800/50",
            "z-50",
            "rounded-t-xl",
            "shadow-lg"
          )}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex items-center justify-center p-2">
            <div className="w-12 h-1 bg-zinc-800 rounded-full" />
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <div className="space-y-6">
              {/* Role Sections with Focus-based Color Swatches */}
              {COLOR_ROLES.map((role) => (
                <div 
                  key={role.id} 
                  className="space-y-3"
                  onFocus={() => setFocusedRole(role.id)}
                  onBlur={() => setFocusedRole(null)}
                >
                  <div 
                    className={cn(
                      "flex items-center justify-between pb-2",
                      "cursor-pointer",
                      selectedRole === role.id && "border-b border-accent/50"
                    )}
                    onClick={() => handleRoleSelect(role.id)}
                  >
                    <h3 className={cn(
                      "text-sm font-medium",
                      selectedRole === role.id && "text-accent"
                    )}>
                      {role.name}
                    </h3>
                    {selectedRole === role.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 rounded-full bg-accent"
                      />
                    )}
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
                    {!roleColors[role.id].length && (
                      <motion.button
                        className={cn(
                          "w-full group flex items-center gap-3 p-3 rounded-lg transition-all",
                          "bg-zinc-900/30 hover:bg-zinc-800/50",
                          "border border-dashed border-zinc-800/50 hover:border-accent/50",
                          focusedRole === role.id && "border-accent/50 bg-accent/10",
                          selectedRole === role.id && "border-accent bg-accent/20"
                        )}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => handleRoleSelect(role.id)}
                        onFocus={() => setFocusedRole(role.id)}
                        onBlur={() => setFocusedRole(null)}
                      >
                        <div className="w-8 h-8 rounded-md bg-zinc-800/50 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                          <Paintbrush className="h-3 w-3 text-zinc-400 group-hover:text-accent transition-colors" />
                </div>
                        <div className="flex-1 text-left">
                          <span className="text-sm text-zinc-400 group-hover:text-accent transition-colors">
                            {selectedRole === role.id ? "Select a color to assign" : `Add ${role.name} color`}
                          </span>
              </div>
                      </motion.button>
                    )}
                  </div>

                  {/* Color Swatches - Only show when role is focused or selected */}
                  {(focusedRole === role.id || selectedRole === role.id) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-4 gap-2"
                    >
                      {state.extractedColors.map((color, index) => (
                        <ColorSwatch
                          key={color + index}
                          color={color}
                          isSelected={selectedColor === color}
                          onClick={() => handleColorClick(null, color)}
                          size="sm"
                        />
                      ))}
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Mobile Toggle Button */}
      {isMobile && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            "fixed bottom-4 right-4",
            "w-12 h-12 rounded-full",
            "bg-accent text-white",
            "shadow-lg",
            "flex items-center justify-center",
            "z-50"
          )}
          onClick={() => setIsBottomSheetOpen(!isBottomSheetOpen)}
          aria-label="Toggle color palette"
        >
          <Palette className="w-6 h-6" />
        </motion.button>
      )}
    </>
  );
}