'use client';

import { ColorPreview } from './color-preview';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Palette, X, AlertCircle, Paintbrush, Upload, Wand2, LineChart, Droplet, ArrowRight } from 'lucide-react';
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
  const [error, setError] = useState<string | null>(null);

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.trim();
    value = value.replace(/[^0-9A-Fa-f]/g, '');
    if (!value.startsWith('#')) {
      value = '#' + value;
    }
    value = value.slice(0, 7);
    setInputValue(value);
    setError(null);
    
    if (value.length === 7 && /^#[0-9A-Fa-f]{6}$/.test(value)) {
      onUpdate(value, index);
    }
  };

  const handleColorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      setError('Invalid color');
      return;
    }
    dispatch({ type: 'SET_SELECTED_COLOR', payload: color });
    onSelect(color);
  };

  return (
    <motion.div
      className={cn(
        "group flex items-center gap-2 p-2 rounded-lg transition-all",
        "bg-zinc-900/50 hover:bg-zinc-800/50",
        isSelected && "ring-1 ring-accent",
        error && "ring-1 ring-red-500"
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
              if (!/^#[0-9A-Fa-f]{6}$/.test(inputValue)) {
                setError('Invalid color');
                setInputValue(color);
              } else {
                setError(null);
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
            >
              <ColorPicker
                color={color}
                onChange={(newColor) => {
                  onUpdate(newColor, index);
                  setInputValue(newColor);
                  setIsOpen(false);
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
        onClick={() => onRemove(color)}
        className={cn(
          "opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-800 rounded-lg"
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <X className="h-3 w-3" />
      </motion.button>
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
  const { state, dispatch } = useGradient();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedColorState, setSelectedColorState] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<DesignSystemRoleId | null>(null);
  const [focusedRole, setFocusedRole] = useState<DesignSystemRoleId | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle role selection
  const handleRoleSelect = useCallback((roleId: DesignSystemRoleId) => {
    setIsSelecting(true);
    setError(null);

    // If clicking the same role that's already selected, exit focus mode
    if (selectedRole === roleId) {
      setSelectedRole(null);
      setFocusedRole(null);
      setIsSelecting(false);
      return;
    }

    // If a color is already selected, assign it to this role
    if (selectedColorState) {
      handleRoleAssign(roleId, selectedColorState);
      setIsSelecting(false);
      return;
    }

    // Otherwise, enter focus mode for color selection
    setSelectedRole(roleId);
    setFocusedRole(roleId);
  }, [selectedRole, selectedColorState]);

  // Handle color selection
  const handleColorSelect = useCallback((color: string) => {
    setIsSelecting(true);
    setError(null);

    // If clicking the same color that's already selected, exit focus mode
    if (selectedColorState === color) {
      setSelectedColorState(null);
      setSelectedRole(null);
      setFocusedRole(null);
      setIsSelecting(false);
      return;
    }

    // If a role is already selected, assign the color to that role
    if (selectedRole) {
      handleRoleAssign(selectedRole, color);
      setIsSelecting(false);
      return;
    }

    // Otherwise, just select the color
    setSelectedColorState(color);
    setFocusedRole(null);
  }, [selectedColorState, selectedRole]);

  // Handle role assignment
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

    // Update extracted colors if needed
    if (!state.extractedColors.includes(color)) {
      dispatch({
        type: 'SET_EXTRACTED_COLORS',
        payload: [...state.extractedColors, color]
      });
    }

    // Reset selection states
    setSelectedColorState(null);
    setSelectedRole(null);
    setFocusedRole(null);
    setIsSelecting(false);

    showToast(`${roleId.charAt(0).toUpperCase() + roleId.slice(1)} color updated!`, 'success');
  }, [dispatch, state.designSystem, state.extractedColors]);

  // Handle color removal
  const handleColorRemove = useCallback((roleId: DesignSystemRoleId) => {
    const newDesignSystem = { ...state.designSystem };
    delete newDesignSystem[roleId];
    dispatch({ type: 'SET_DESIGN_SYSTEM', payload: newDesignSystem });

    // Update extracted colors
    const newColors = state.extractedColors.filter(c => c !== state.designSystem[roleId]);
    dispatch({ type: 'SET_EXTRACTED_COLORS', payload: newColors });

    // Update gradient stops if needed
    const colorIndex = state.colorStops.findIndex(stop => stop.color === state.designSystem[roleId]);
    if (colorIndex !== -1) {
      const newColorStops = state.colorStops.filter((_, i) => i !== colorIndex);
      dispatch({ type: 'SET_COLOR_STOPS', payload: newColorStops });
    }

    // Clear selection if needed
    if (selectedRole === roleId) {
      setSelectedRole(null);
      setFocusedRole(null);
    }
  }, [dispatch, state.designSystem, state.extractedColors, state.colorStops, selectedRole]);

  // Mobile detection
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

  return (
    <motion.div
      initial={false}
      animate={{
        width: isExpanded ? (isMobile ? '100%' : '300px') : (isMobile ? '0' : '60px'),
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
        isMobile && "hidden"
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between h-12 px-4",
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
          onClick={() => setIsExpanded(!isExpanded)}
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
        "flex-1 overflow-y-auto p-4 space-y-4",
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
                  <motion.div
                    className={cn(
                      "group relative overflow-hidden rounded-xl",
                      "bg-zinc-900/50 hover:bg-zinc-800/50",
                      "border border-zinc-800/50",
                      "transition-all duration-200",
                      selectedRole === role.id && "border-accent/50 bg-accent/5",
                      focusedRole === role.id && "border-accent/30 bg-accent/5",
                      "hover:border-accent/30 hover:bg-accent/5",
                      "cursor-pointer"
                    )}
                    onClick={() => handleRoleSelect(role.id)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {/* Background highlight effect */}
                    <motion.div
                      className={cn(
                        "absolute inset-0 bg-accent/5 opacity-0",
                        "transition-opacity duration-200",
                        "group-hover:opacity-100",
                        (selectedRole === role.id || focusedRole === role.id) && "opacity-100"
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
                            (selectedRole === role.id || focusedRole === role.id) && "bg-accent/10"
                          )}>
                            {state.designSystem[role.id] ? (
                              <div 
                                className="w-5 h-5 rounded-full ring-2 ring-accent/30"
                                style={{ backgroundColor: state.designSystem[role.id] }}
                              />
                            ) : (
                              <Paintbrush className={cn(
                                "w-5 h-5",
                                "text-zinc-400 group-hover:text-accent",
                                "transition-colors duration-200",
                                (selectedRole === role.id || focusedRole === role.id) && "text-accent"
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
                                (selectedRole === role.id || focusedRole === role.id) && "text-accent"
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
                            <p className="text-xs text-zinc-400 group-hover:text-zinc-300">
                              {role.description}
                            </p>
                          </div>
                        </div>

                        {/* Status indicators and color thumbnails */}
                        <div className="flex items-center gap-3">                         
                          {/* Status messages */}
                          <div className="flex items-center gap-2">
                            {focusedRole === role.id && (
                              <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-1.5 text-xs text-white/70"
                              >
                                <span>Selecione uma cor</span>
                                <ArrowRight className="w-3.5 h-3.5 text-white" />
                              </motion.div>
                            )}
                            {selectedColorState && selectedRole === role.id && (
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

                  {/* Color Swatches */}
                  {selectedRole === role.id && (
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
                          isSelected={state.designSystem[role.id] === color}
                          onClick={() => handleColorSelect(color)}
                          size="sm"
                        />
                      ))}
                    </motion.div>
                  )}
                </div>
              ))}

              {/* Error Display */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                >
                  <p className="text-xs text-red-500">{error}</p>
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
                state.designSystem[role.id] && (
                  <TooltipProvider key={role.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.button
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className={cn(
                            "w-8 h-8 rounded-full cursor-pointer transition-all",
                            "border border-zinc-800/50",
                            "hover:scale-110 hover:border-accent/50",
                            selectedColorState === state.designSystem[role.id] && "ring-2 ring-accent"
                          )}
                          style={{ backgroundColor: state.designSystem[role.id] }}
                          onClick={() => handleColorSelect(state.designSystem[role.id]!)}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={5}>
                        <p className="text-xs capitalize">{role.name}: {state.designSystem[role.id]}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <div className={cn(
        "flex items-center justify-between px-2 py-2",
        "border-t border-zinc-800/50",
        "bg-background/50 backdrop-blur-sm"
      )}>
        <AnimatePresence>
          {isExpanded ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-3 gap-1 w-full"
            >
              {/* Upload Button */}
              <UploadButton
                variant="sidebar"
                onImageUpload={onImageUpload}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg text-sm",
                  "hover:bg-accent/10 hover:text-accent",
                  "transition-all duration-200",
                  "group"
                )}
              />

              {/* Gradient Studio Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      onClick={() => router.push('/gradient-studio')}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg text-sm",
                        "hover:bg-accent/10 hover:text-accent",
                        "transition-all duration-200",
                        "group"
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <LineChart className="h-4 w-4 group-hover:text-accent transition-colors" />
                      <span className="text-xs font-medium">Gradient</span>
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">Open Gradient Studio</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Color System Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      onClick={() => router.push('/design-system')}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg text-sm",
                        "hover:bg-accent/10 hover:text-accent",
                        "transition-all duration-200",
                        "group"
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Wand2 className="h-4 w-4 group-hover:text-accent transition-colors" />
                      <span className="text-xs font-medium">System</span>
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">Open Color System</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-2"
            >
              {/* Collapsed Upload Button */}
              <UploadButton
                variant="sidebar"
                collapsed={true}
                onImageUpload={onImageUpload}
                className={cn(
                  "p-2 rounded-lg",
                  "hover:bg-accent/10 hover:text-accent",
                  "transition-all duration-200"
                )}
              />

              {/* Collapsed Gradient Studio Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      onClick={() => router.push('/gradient-studio')}
                      className={cn(
                        "p-2 rounded-lg",
                        "hover:bg-accent/10 hover:text-accent",
                        "transition-all duration-200"
                      )}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <LineChart className="h-4 w-4" />
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="text-xs">Open Gradient Studio</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Collapsed Color System Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      onClick={() => router.push('/design-system')}
                      className={cn(
                        "p-2 rounded-lg",
                        "hover:bg-accent/10 hover:text-accent",
                        "transition-all duration-200"
                      )}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Wand2 className="h-4 w-4" />
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="text-xs">Open Color System</p>
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