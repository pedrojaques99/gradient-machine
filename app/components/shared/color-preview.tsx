'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Button } from '@/app/components/ui/button';
import { Copy, RefreshCw, ChevronDown, Paintbrush, Check, Plus, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ColorPicker } from '../features/color/shared/color-picker';
import { Input } from '@/app/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";

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
}

const getColorRole = (index: number): { name: string; description: string } => {
  switch (index) {
    case 0:
      return {
        name: "Primary",
        description: "Main brand color, used for primary actions and key UI elements"
      };
    case 1:
      return {
        name: "Secondary",
        description: "Supporting color for secondary actions and less prominent elements"
      };
    case 2:
      return {
        name: "Accent",
        description: "Highlight color for emphasis and interactive elements"
      };
    case 3:
      return {
        name: "Background",
        description: "Base color for surfaces and containers"
      };
    default:
      return {
        name: `Supporting ${index - 3}`,
        description: "Additional color for variety and visual hierarchy"
      };
  }
};

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
  transparent = false
}: ColorPreviewProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (editingColorIndex !== null && !(e.target as HTMLElement).closest('.color-item')) {
        setEditingColorIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingColorIndex]);

  const handleCopyColor = async (colorToCopy: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(colorToCopy);
        setCopied(colorToCopy);
        setTimeout(() => setCopied(null), 2000);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = colorToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(colorToCopy);
        setTimeout(() => setCopied(null), 2000);
      }
    } catch (error) {
      console.error('Failed to copy color:', error);
    }
  };

  const handleRandomize = () => {
    const shuffledColors = [...colors].sort(() => Math.random() - 0.5);
    shuffledColors.forEach((color, index) => {
      onColorChange?.(color, index);
    });
  };

  const handleAddColor = () => {
    const newColors = [...colors];
    newColors.push(defaultColor);
    onColorChange?.(defaultColor, newColors.length - 1);
  };

  const handleRemoveColor = (indexToRemove: number) => {
    // Don't allow removing the first 4 colors (primary, secondary, accent, background)
    if (indexToRemove < 4) return;
    
    const newColors = colors.filter((_, index) => index !== indexToRemove);
    // Update all colors after the removed index
    newColors.forEach((color, index) => {
      if (index >= indexToRemove) {
        onColorChange?.(color, index);
      }
    });
  };

  const Wrapper = transparent ? 'div' : Card;
  
  return (
    <TooltipProvider>
      <Wrapper className={`${transparent ? "" : "border border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm"} rounded-lg overflow-hidden`}>
        <div 
          className="flex items-center justify-between p-2 sm:p-3 cursor-pointer hover:bg-zinc-800/20 transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <Label className="text-sm sm:text-base font-medium select-none">Paleta de cores</Label>
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRandomize();
                      }}
                      className="h-6 w-6 sm:h-7 sm:w-7 hover:bg-zinc-800/50"
                    >
                      <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Randomize colors</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddColor();
                      }}
                      className="h-6 w-6 sm:h-7 sm:w-7 hover:bg-zinc-800/50"
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
        
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-2 sm:p-3 pt-0">
                <div className={`grid ${singleColumn ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'} gap-2 sm:gap-3`}>
                  {colors.map((color, index) => (
                    <motion.div
                      key={color + index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group color-item"
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <div 
                        className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg hover:bg-zinc-800/20 transition-colors relative"
                      >
                        <motion.div 
                          className="relative h-6 w-6 sm:h-8 sm:w-8 rounded-lg shadow-sm hover:scale-110 transition-all cursor-pointer border border-zinc-800"
                          whileTap={{ scale: 0.95 }}
                          style={{ backgroundColor: color }}
                          onClick={() => setEditingColorIndex(editingColorIndex === index ? null : index)}
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
                                // Allow typing without # prefix
                                if (!newColor.startsWith('#')) {
                                  newColor = `#${newColor}`;
                                }
                                // Allow any length up to 7 chars (#RRGGBB)
                                if (newColor.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                                  e.target.value = newColor;
                                }
                              }}
                              onBlur={(e) => {
                                const newColor = e.target.value;
                                // On blur, update if valid or revert to original
                                if (newColor.match(/^#[0-9A-Fa-f]{6}$/)) {
                                  onColorChange?.(newColor, index);
                                } else {
                                  e.target.value = color;
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const newColor = e.currentTarget.value;
                                  if (newColor.match(/^#[0-9A-Fa-f]{6}$/)) {
                                    onColorChange?.(newColor, index);
                                    handleCopyColor(newColor);
                                  } else {
                                    e.currentTarget.value = color;
                                  }
                                }
                              }}
                              className="h-6 text-xs sm:text-sm font-mono bg-transparent border-0 p-0 focus:ring-0 hover:bg-zinc-800/30 focus:bg-zinc-800/50 rounded transition-colors"
                            />
                            <div className="flex items-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleCopyColor(color)}
                                    className="h-6 w-6 hover:bg-zinc-800/50 transition-all text-zinc-400 opacity-0 group-hover:opacity-100"
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
                              {index >= 4 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRemoveColor(index)}
                                      className="h-6 w-6 hover:bg-zinc-800/50 transition-all text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
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
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-[10px] sm:text-xs text-zinc-500 mt-1 select-none">
                                {getColorRole(index).name}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">{getColorRole(index).description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      <AnimatePresence>
                        {editingColorIndex === index && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-1.5 sm:mt-2"
                          >
                            <ColorPicker
                              color={color}
                              onChange={(newColor) => {
                                onColorChange?.(newColor, index);
                              }}
                              onClose={() => setEditingColorIndex(null)}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Wrapper>
    </TooltipProvider>
  );
} 