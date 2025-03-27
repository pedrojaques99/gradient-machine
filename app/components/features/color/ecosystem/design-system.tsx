'use client';

import { Card } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { useGradient } from '@/app/contexts/GradientContext';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Image, Copy, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useState, useEffect } from 'react';
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";

// Sample data for the chart
const data = [
  { name: 'S', value: 65 },
  { name: 'T', value: 45 },
  { name: 'Q', value: 85 },
  { name: 'Q', value: 55 },
  { name: 'S', value: 75 },
  { name: 'S', value: 35 },
  { name: 'D', value: 95 },
];

// Preview Panel Component
function PreviewPanel() {
  const { state, dispatch } = useGradient();

  return (
    <div className="space-y-4">
      {/* Buttons Preview */}
      <Card className="p-6 hover:shadow-md transition-shadow">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Buttons</Label>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              {/* Primary Button */}
              <button
                className="flex-1 py-2 px-4 rounded-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative group overflow-hidden shadow-sm"
                style={{
                  backgroundColor: state.designSystem.primary,
                  color: state.designSystem.text,
                  boxShadow: `0 4px 12px ${state.designSystem.primary}25`
                }}
              >
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: `linear-gradient(45deg, ${state.designSystem.primary}, ${state.designSystem.accent}90)`
                  }}
                />
                <span className="relative z-10">Primary</span>
              </button>
              
              {/* Secondary Button */}
              <button
                className="flex-1 py-2 px-4 rounded-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative group overflow-hidden shadow-sm"
                style={{
                  backgroundColor: state.designSystem.secondary,
                  color: state.designSystem.text,
                  boxShadow: `0 4px 12px ${state.designSystem.secondary}25`
                }}
              >
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: `linear-gradient(45deg, ${state.designSystem.secondary}, ${state.designSystem.primary}90)`
                  }}
                />
                <span className="relative z-10">Secondary</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {/* Accent Button */}
              <button
                className="w-full py-2 px-4 rounded-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative group overflow-hidden shadow-sm"
                style={{
                  backgroundColor: state.designSystem.accent,
                  color: state.designSystem.text,
                  boxShadow: `0 4px 12px ${state.designSystem.accent}25`
                }}
              >
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: `linear-gradient(45deg, ${state.designSystem.accent}, ${state.designSystem.primary}90)`
                  }}
                />
                <span className="relative z-10">Accent</span>
              </button>
              
              {/* Outline Button */}
              <button
                className="w-full py-2 px-4 rounded-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative group overflow-hidden border-2"
                style={{
                  borderColor: state.designSystem.accent,
                  color: state.designSystem.accent,
                  backgroundColor: state.designSystem.background
                }}
              >
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: `linear-gradient(45deg, ${state.designSystem.accent}90, ${state.designSystem.primary}70)`
                  }}
                />
                <span className="relative z-10 group-hover:text-white transition-colors">Outline</span>
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Chart Preview */}
      <Card className="p-6 hover:shadow-md transition-all duration-300">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Data Visualization</Label>
            <div className="text-xs text-muted-foreground">Weekly Activity</div>
          </div>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  stroke={state.designSystem.text}
                  tick={{ fill: state.designSystem.text, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                />
                <YAxis 
                  stroke={state.designSystem.text}
                  tick={{ fill: state.designSystem.text, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                  tickMargin={8}
                />
                <Tooltip 
                  cursor={{ fill: state.designSystem.secondary + '10' }}
                  contentStyle={{ 
                    backgroundColor: state.designSystem.background,
                    border: `1px solid ${state.designSystem.secondary}20`,
                    borderRadius: '8px',
                    boxShadow: `0 4px 12px ${state.designSystem.primary}15`
                  }}
                  labelStyle={{ 
                    color: state.designSystem.text,
                    fontWeight: 500,
                    marginBottom: '4px',
                    fontSize: '12px'
                  }}
                  itemStyle={{
                    color: state.designSystem.text,
                    fontSize: '12px'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={index === data.length - 1 ? state.designSystem.accent : state.designSystem.primary}
                      opacity={index === data.length - 1 ? 1 : 0.7}
                      style={{
                        filter: `drop-shadow(0 2px 4px ${state.designSystem.primary}25)`,
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        const target = e.target as SVGElement;
                        target.style.opacity = '1';
                        target.style.transform = 'translateY(-2px)';
                        target.style.filter = `drop-shadow(0 4px 8px ${state.designSystem.primary}40)`;
                      }}
                      onMouseLeave={(e) => {
                        const target = e.target as SVGElement;
                        target.style.opacity = index === data.length - 1 ? '1' : '0.7';
                        target.style.transform = 'translateY(0)';
                        target.style.filter = `drop-shadow(0 2px 4px ${state.designSystem.primary}25)`;
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded-sm shadow-sm" 
                style={{ 
                  backgroundColor: state.designSystem.primary,
                  opacity: 0.7,
                  boxShadow: `0 2px 4px ${state.designSystem.primary}25`
                }} 
              />
              <span>Regular</span>
            </div>
            <div className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded-sm shadow-sm" 
                style={{ 
                  backgroundColor: state.designSystem.accent,
                  boxShadow: `0 2px 4px ${state.designSystem.accent}25`
                }} 
              />
              <span>Peak</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Brand Elements Preview Component
function BrandElements() {
  const { state } = useGradient();

  return (
    <Card className="p-6 hover:shadow-md transition-all duration-300">
      <div className="space-y-6">
        <Label className="text-sm font-medium">Brand Elements</Label>
        
        {/* Logo Preview */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Logo</div>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-4 p-6 rounded-lg border backdrop-blur-sm transition-all duration-300 group hover:shadow-lg" 
            style={{ 
              backgroundColor: state.designSystem.background,
              borderColor: `${state.designSystem.secondary}30`,
              boxShadow: `0 4px 12px ${state.designSystem.primary}10`
            }}
          >
            <motion.div 
              whileHover={{ rotate: 10 }}
              className="w-12 h-12 rounded-lg flex items-center justify-center shadow-lg transition-shadow duration-300 group-hover:shadow-xl" 
              style={{ 
                background: `linear-gradient(135deg, ${state.designSystem.primary}, ${state.designSystem.accent})`,
                boxShadow: `0 8px 24px ${state.designSystem.primary}30`
              }}
            >
              <span className="text-xl font-bold transition-transform duration-300 group-hover:scale-110" 
                style={{ color: state.designSystem.text }}>
                B
              </span>
            </motion.div>
            <div className="flex-1 space-y-2">
              <motion.div 
                className="h-4 w-24 rounded-full transition-all duration-300 group-hover:w-32" 
                style={{ 
                  background: `linear-gradient(to right, ${state.designSystem.primary}, ${state.designSystem.accent})`,
                  boxShadow: `0 2px 8px ${state.designSystem.primary}20`
                }} 
              />
              <motion.div 
                className="h-3 w-16 rounded-full transition-all duration-300 group-hover:w-20" 
                style={{ 
                  backgroundColor: state.designSystem.secondary,
                  opacity: 0.8,
                  boxShadow: `0 2px 8px ${state.designSystem.secondary}20`
                }} 
              />
            </div>
          </motion.div>
        </div>

        {/* Social Media Header */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Social Profile</div>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="relative h-32 rounded-lg overflow-hidden shadow-lg transition-shadow duration-300 hover:shadow-xl group"
          >
            <motion.div 
              className="absolute inset-0 transition-all duration-500 group-hover:scale-110" 
              style={{ 
                background: `linear-gradient(45deg, 
                  ${state.designSystem.primary}, 
                  ${state.designSystem.secondary}, 
                  ${state.designSystem.accent}
                )`,
                opacity: 0.9
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent backdrop-blur-[1px] transition-all duration-300 group-hover:backdrop-blur-0" />
            <motion.div 
              initial={false}
              className="absolute bottom-4 left-4 flex items-center gap-4"
            >
              <motion.div 
                whileHover={{ rotate: 10 }}
                className="w-16 h-16 rounded-full border-4 shadow-lg transition-all duration-300 group-hover:shadow-2xl" 
                style={{ 
                  background: `linear-gradient(135deg, ${state.designSystem.primary}, ${state.designSystem.accent})`,
                  borderColor: state.designSystem.background,
                  boxShadow: `0 8px 24px ${state.designSystem.accent}40`
                }} 
              />
              <div className="space-y-2">
                <motion.div 
                  className="h-4 w-32 rounded-full transition-all duration-300 group-hover:w-36" 
                  style={{ 
                    backgroundColor: state.designSystem.background,
                    boxShadow: `0 2px 8px ${state.designSystem.primary}30`
                  }} 
                />
                <motion.div 
                  className="h-3 w-24 rounded-full transition-all duration-300 group-hover:w-28" 
                  style={{ 
                    backgroundColor: state.designSystem.background,
                    opacity: 0.8,
                    boxShadow: `0 2px 8px ${state.designSystem.primary}20`
                  }} 
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </Card>
  );
}

interface DesignSystemProps {
  onColorRemove: (color: string) => void;
}

export function DesignSystem({ onColorRemove }: DesignSystemProps) {
  const { state, dispatch } = useGradient();
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayedColors, setDisplayedColors] = useState<string[]>([]);
  const [hasMore, setHasMore] = useState(true);

  // Initialize displayed colors when component mounts or colors change
  useEffect(() => {
    setDisplayedColors(state.extractedColors.slice(0, 10));
    setHasMore(state.extractedColors.length > 10);
  }, [state.extractedColors]);

  // Handle load more
  const handleLoadMore = () => {
    const currentLength = displayedColors.length;
    const nextColors = state.extractedColors.slice(currentLength, currentLength + 10);
    setDisplayedColors([...displayedColors, ...nextColors]);
    setHasMore(currentLength + 10 < state.extractedColors.length);
  };

  // Helper function to adjust color opacity
  const adjustOpacity = (hex: string, opacity: number) => {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Helper function to generate variations of a color
  const generateColorVariations = (baseColor: string) => {
    const variations = [
      baseColor, // 100%
      adjustOpacity(baseColor, 0.8), // 80%
      adjustOpacity(baseColor, 0.6), // 60%
      adjustOpacity(baseColor, 0.4), // 40%
    ];
    return variations;
  };

  const handleCopyColor = async (color: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(color);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = color;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedColor(color);
      setTimeout(() => setCopiedColor(null), 2000);
    } catch (error) {
      console.error('Failed to copy color:', error);
    }
  };

  const handleRefreshScales = () => {
    setIsRefreshing(true);

    // Generate new color variations
    const primaryVariations = generateColorVariations(state.designSystem.primary);
    const secondaryVariations = generateColorVariations(state.designSystem.secondary);
    const accentVariations = generateColorVariations(state.designSystem.accent);
    const backgroundVariations = generateColorVariations(state.designSystem.background);

    // Update the design system with base colors only
    dispatch({
      type: 'SET_DESIGN_SYSTEM',
      payload: {
        ...state.designSystem,
        primary: state.designSystem.primary,
        secondary: state.designSystem.secondary,
        accent: state.designSystem.accent,
        background: state.designSystem.background,
      },
    });

    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const ColorScale = ({ color, label }: { color: string; label: string }) => {
    const generateScales = (baseColor: string) => {
      // If the color is in rgba format, parse it
      if (baseColor.startsWith('rgba')) {
        return [
          baseColor,
          baseColor.replace('rgba', 'rgba').replace(/[\d.]+\)$/g, '0.8)'),
          baseColor.replace('rgba', 'rgba').replace(/[\d.]+\)$/g, '0.6)'),
          baseColor.replace('rgba', 'rgba').replace(/[\d.]+\)$/g, '0.4)')
        ];
      }

      // For hex colors
      return [
        baseColor,
        adjustOpacity(baseColor, 0.8),
        adjustOpacity(baseColor, 0.6),
        adjustOpacity(baseColor, 0.4)
      ];
    };

    // Generate scales with a random offset to ensure new values on refresh
    const randomOffset = isRefreshing ? Math.random() * 0.1 : 0;
    const scales = generateScales(color).map(scale => {
      if (scale.startsWith('rgba')) {
        return scale.replace(/[\d.]+\)$/g, (match) => {
          const opacity = parseFloat(match);
          return `${Math.max(0.1, Math.min(1, opacity + randomOffset))})`; 
        });
      }
      return scale;
    });

    return (
      <motion.div 
        className="space-y-2"
        animate={isRefreshing ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 0.2 }}
        key={`${color}-${isRefreshing}-${Date.now()}`}
      >
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        <div className="grid grid-cols-4 gap-2">
          {scales.map((scale, index) => (
            <UiTooltip key={`${scale}-${isRefreshing}-${index}-${Date.now()}`}>
              <TooltipTrigger asChild>
                <motion.div 
                  className="h-12 rounded-lg cursor-pointer relative group shadow-sm hover:shadow-md transition-all"
                  style={{ backgroundColor: scale }}
                  onClick={() => handleCopyColor(scale)}
                  animate={isRefreshing ? { 
                    scale: [1, 1.05, 1],
                    opacity: [1, 0.8, 1]
                  } : {}}
                  transition={{ 
                    duration: 0.3,
                    delay: index * 0.05
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                    {copiedColor === scale ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <Copy className="w-4 h-4 text-white" />
                    )}
                  </div>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Click to copy {scale}</p>
              </TooltipContent>
            </UiTooltip>
          ))}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Color Scales</h3>
          <p className="text-sm text-muted-foreground">Click to copy, drag to reorder</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshScales}
          className="text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* Color Scales Grid */}
      <motion.div 
        className="grid gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {displayedColors.map((color, index) => (
          <motion.div 
            key={color} 
            className="relative group"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
          >
            <TooltipProvider>
              <ColorScale color={color} label={`Color ${index + 1}`} />
            </TooltipProvider>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 hover:text-red-500"
              onClick={() => onColorRemove(color)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </Button>
          </motion.div>
        ))}
      </motion.div>

      {/* Load More Button */}
      {hasMore && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center pt-4"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            className="text-xs"
          >
            Load More Colors
          </Button>
        </motion.div>
      )}

      {/* Preview Sections */}
      <div className="space-y-8 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <PreviewPanel />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <BrandElements />
        </motion.div>
      </div>
    </div>
  );
} 