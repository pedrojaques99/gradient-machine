'use client';

import { motion } from 'framer-motion';
import { Card } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Button } from '@/app/components/ui/button';
import { Copy, RefreshCw, ChevronDown, Paintbrush, Check, Plus, X } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/app/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { cn } from '@/app/lib/utils';
import { validateColor, generateColorVariations, type ColorVariation } from '../features/color/core/color-system';

// Shared utilities
const handleEventPropagation = (e: React.MouseEvent) => e.stopPropagation();

interface ColorPreviewProps {
  colors: string[];
  selectedColor: string | null;
  onColorSelect: (color: string) => void;
  onColorChange?: (color: string, index: number) => void;
  defaultColor?: string;
  isFixed?: boolean;
  showUpload?: boolean;
  onUpload?: (file: File) => void;
  showVariations?: boolean;
  singleColumn?: boolean;
  hideToggle?: boolean;
  transparent?: boolean;
  containerRef?: React.RefObject<HTMLDivElement>;
  selectedColorIndex?: number | null;
  onColorIndexSelect?: (index: number | null) => void;
}

export function ColorPreview({ 
  colors, 
  selectedColor, 
  onColorSelect,
  onColorChange,
  defaultColor = "#1C9488",
  isFixed,
  showUpload,
  onUpload,
  showVariations = false,
  singleColumn = false,
  hideToggle = false,
  transparent = false,
  containerRef,
  selectedColorIndex,
  onColorIndexSelect
}: ColorPreviewProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [colorVariations, setColorVariations] = useState<ColorVariation[]>([]);
  const colorSelectorRef = useRef<HTMLDivElement>(null);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef?.current && !containerRef.current.contains(e.target as Node)) {
        setEditingColorIndex(null);
        setError(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [containerRef]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    switch (e.key) {
      case 'Enter':
        handleColorClick(e as any, colors[index], index);
        break;
      case 'Delete':
        if (index >= 4) handleRemoveColor(index);
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (index < colors.length - 1) {
          onColorIndexSelect?.(index + 1);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (index > 0) {
          onColorIndexSelect?.(index - 1);
        }
        break;
    }
  }, [colors, onColorIndexSelect]);

  // Handle color copy
  const handleCopyColor = useCallback(async (colorToCopy: string) => {
    try {
      setIsLoading(true);
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(colorToCopy);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = colorToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(colorToCopy);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      setError('Failed to copy color');
      console.error('Failed to copy color:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle color click
  const handleColorClick = useCallback((e: React.MouseEvent, color: string, index: number) => {
    handleEventPropagation(e);
    if (!validateColor(color)) {
      setError('Invalid color format');
      return;
    }
    setError(null);
    setEditingColorIndex(index);
    onColorIndexSelect?.(index);

    // Generate color variations
    const variations = generateColorVariations(color);
    setColorVariations(variations);
  }, [onColorIndexSelect]);

  // Handle color removal
  const handleRemoveColor = useCallback((indexToRemove: number) => {
    if (indexToRemove < 4) return;
    
    const newColors = colors.filter((_, index) => index !== indexToRemove);
    newColors.forEach((color, index) => {
      if (index >= indexToRemove) {
        onColorChange?.(color, index);
      }
    });
  }, [colors, onColorChange]);

  // Handle color addition
  const handleAddColor = useCallback(() => {
    const newColors = [...colors];
    newColors.push(defaultColor);
    onColorChange?.(defaultColor, newColors.length - 1);
  }, [colors, defaultColor, onColorChange]);

  // Handle variation selection
  const handleVariationSelect = useCallback((variation: ColorVariation, index: number) => {
    onColorChange?.(variation.hex, index);
    setColorVariations([]);
  }, [onColorChange]);

  const Wrapper = transparent ? 'div' : Card;
  
  return (
    <TooltipProvider>
      <Wrapper className={cn(
        transparent ? "" : "border border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm",
        "rounded-lg overflow-hidden"
      )}>
        <div 
          className="flex items-center justify-between p-2 sm:p-3 cursor-pointer hover:bg-zinc-800/20 transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
          role="button"
          aria-expanded={!isCollapsed}
          aria-label="Toggle color palette"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <Label className="text-sm sm:text-base font-medium select-none">Color Palette</Label>
            {isCollapsed && colors.length > 0 && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {colors.slice(0, 4).map((color, index) => (
                  <motion.div
                    key={color + index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-zinc-800 shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                ))}
                {colors.length > 4 && (
                  <span className="text-xs text-zinc-400 select-none">+{colors.length - 4}</span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {!isCollapsed && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleEventPropagation}
                      className="h-6 w-6 sm:h-7 sm:w-7 hover:bg-zinc-800/50"
                      aria-label="Add new color"
                      disabled={isFixed}
                    >
                      <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Add new color</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
            {!hideToggle && (
              <motion.div
                animate={{ rotate: isCollapsed ? 0 : 180 }}
                transition={{ duration: 0.2 }}
                className="select-none"
              >
                <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </motion.div>
            )}
          </div>
        </div>
        
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: isCollapsed ? 0 : "auto", opacity: isCollapsed ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="p-2 sm:p-3 pt-0">
            <div className={cn(
              "grid gap-2 sm:gap-3",
              singleColumn ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
            )}>
              {colors.map((color, index) => (
                <motion.div
                  key={color + index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div 
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg transition-all",
                      "hover:bg-zinc-800/20",
                      selectedColorIndex === index && "bg-zinc-800/30"
                    )}
                    role="listitem"
                    aria-label={`Color ${index + 1}`}
                    tabIndex={0}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                  >
                    <motion.div 
                      className={cn(
                        "relative aspect-square rounded-lg shadow-sm cursor-pointer border transition-all",
                        "hover:scale-105 hover:shadow-lg",
                        selectedColorIndex === index && "ring-2 ring-accent ring-offset-2 ring-offset-zinc-950"
                      )}
                      style={{ backgroundColor: color }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => handleColorClick(e, color, index)}
                    >
                      {hoveredIndex === index && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg"
                        >
                          <Paintbrush className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          defaultValue={color}
                          onChange={(e) => {
                            let newColor = e.target.value;
                            if (!newColor.startsWith('#')) {
                              newColor = `#${newColor}`;
                            }
                            if (newColor.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                              e.target.value = newColor;
                            }
                          }}
                          onBlur={(e) => {
                            const newColor = e.target.value;
                            if (validateColor(newColor)) {
                              onColorChange?.(newColor, index);
                              setError(null);
                            } else {
                              e.target.value = color;
                              setError('Invalid color format');
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const newColor = e.currentTarget.value;
                              if (validateColor(newColor)) {
                                onColorChange?.(newColor, index);
                                handleCopyColor(newColor);
                                setError(null);
                              } else {
                                e.currentTarget.value = color;
                                setError('Invalid color format');
                              }
                            }
                          }}
                          className="h-6 text-xs sm:text-sm font-mono bg-transparent border-0 p-0 focus:ring-0 hover:bg-zinc-800/30 focus:bg-zinc-800/50 rounded transition-colors"
                          aria-label={`Color ${index + 1} hex value`}
                        />
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCopyColor(color)}
                                className="h-6 w-6 hover:bg-zinc-800/50 transition-all text-zinc-400 opacity-0 group-hover:opacity-100"
                                disabled={isLoading}
                                aria-label="Copy color"
                              >
                                {copied === color ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Copy hex code</p>
                            </TooltipContent>
                          </Tooltip>
                          {!isFixed && index >= 4 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveColor(index)}
                                  className="h-6 w-6 hover:bg-zinc-800/50 transition-all text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
                                  aria-label="Remove color"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Remove color</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                      {error && index === selectedColorIndex && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-500 mt-1"
                        >
                          {error}
                        </motion.p>
                      )}
                    </div>
                  </div>

                  {/* Color Variations */}
                  {showVariations && colorVariations.length > 0 && selectedColorIndex === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="absolute left-0 right-0 top-full mt-2 p-2 bg-zinc-900/90 backdrop-blur-sm rounded-lg shadow-lg z-10"
                    >
                      <div className="grid grid-cols-5 gap-1">
                        {colorVariations.map((variation) => (
                          <Tooltip key={variation.hex}>
                            <TooltipTrigger asChild>
                              <motion.div
                                className="aspect-square rounded cursor-pointer hover:scale-110 transition-transform"
                                style={{ backgroundColor: variation.hex }}
                                onClick={() => handleVariationSelect(variation, index)}
                                whileHover={{ y: -2 }}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs capitalize">{variation.type}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}

              {/* Add Color Button */}
              {!isFixed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center"
                >
                  <Button
                    variant="ghost"
                    className="w-full h-full min-h-[80px] border-2 border-dashed border-zinc-800/50 hover:border-accent/50 hover:bg-zinc-800/20"
                    onClick={handleAddColor}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </Wrapper>
    </TooltipProvider>
  );
} 