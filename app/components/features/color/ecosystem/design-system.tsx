'use client';

import { Card } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { useGradient } from '@/app/contexts/GradientContext';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip as RechartsTooltip } from 'recharts';
import { 
  Image, 
  Copy, 
  Check, 
  RefreshCw, 
  Palette, 
  LineChart, 
  Wand2, 
  ArrowRight,
  X
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useState, useEffect } from 'react';
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Tooltip,
} from "@/app/components/ui/tooltip";
import { ChevronDown } from 'lucide-react';

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
                className="flex-1 py-2 px-4 rounded-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative group overflow-hidden"
                style={{
                  backgroundColor: state.designSystem.primary,
                  color: state.designSystem.text,
                  boxShadow: `0 2px 8px ${state.designSystem.primary}15`
                }}
              >
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: `linear-gradient(45deg, ${state.designSystem.primary}, ${state.designSystem.secondary}90)`
                  }}
                />
                <span className="relative z-10">Primary</span>
              </button>
              
              {/* Secondary Button */}
              <button
                className="flex-1 py-2 px-4 rounded-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative group overflow-hidden"
                style={{
                  backgroundColor: state.designSystem.secondary,
                  color: state.designSystem.text,
                  boxShadow: `0 2px 8px ${state.designSystem.secondary}15`
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
                className="w-full py-2 px-4 rounded-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative group overflow-hidden"
                style={{
                  backgroundColor: state.designSystem.accent,
                  color: state.designSystem.text,
                  boxShadow: `0 2px 8px ${state.designSystem.accent}15`
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
                  borderColor: state.designSystem.primary,
                  color: state.designSystem.primary,
                  backgroundColor: state.designSystem.background
                }}
              >
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: `linear-gradient(45deg, ${state.designSystem.primary}90, ${state.designSystem.secondary}70)`
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
                <RechartsTooltip 
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
                      fill={index === data.length - 1 ? state.designSystem.secondary : state.designSystem.primary}
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

// Add BentoGrid component after PreviewPanel and before BrandElements
function BentoGrid() {
  const { state } = useGradient();

  return (
    <Card className="p-6 hover:shadow-md transition-all duration-300">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Color Showcase</Label>
          <div className="text-xs text-muted-foreground">Bento Grid</div>
        </div>

        <div className="grid grid-cols-4 gap-4 auto-rows-[120px]">
          {/* Feature Card */}
          <motion.div
            className="col-span-2 row-span-2 rounded-xl p-6 relative overflow-hidden group"
            style={{ 
              background: `linear-gradient(135deg, ${state.designSystem.primary}, ${state.designSystem.secondary})`,
              boxShadow: `0 4px 12px ${state.designSystem.primary}10`
            }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/50" />
            <div className="relative h-full flex flex-col justify-between">
              <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Color System</h3>
                <p className="text-sm text-white/80">Beautiful color combinations</p>
              </div>
            </div>
          </motion.div>

          {/* Secondary Card */}
          <motion.div
            className="rounded-xl p-4 relative overflow-hidden group"
            style={{ 
              backgroundColor: state.designSystem.secondary,
              boxShadow: `0 4px 12px ${state.designSystem.secondary}10`
            }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="h-full flex flex-col justify-between">
              <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <LineChart className="w-4 h-4 text-white" />
              </div>
              <p className="text-sm text-white/90">Analytics</p>
            </div>
          </motion.div>

          {/* Accent Card */}
          <motion.div
            className="rounded-xl p-4 relative overflow-hidden group"
            style={{ 
              backgroundColor: state.designSystem.accent,
              boxShadow: `0 4px 12px ${state.designSystem.accent}10`
            }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="h-full flex flex-col justify-between">
              <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <Wand2 className="w-4 h-4 text-white" />
              </div>
              <p className="text-sm text-white/90">Magic</p>
            </div>
          </motion.div>

          {/* Background Card */}
          <motion.div
            className="col-span-2 rounded-xl p-4 relative overflow-hidden group"
            style={{ 
              backgroundColor: state.designSystem.background,
              border: `1px solid ${state.designSystem.secondary}20`,
              boxShadow: `0 4px 12px ${state.designSystem.secondary}10`
            }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="h-full flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 backdrop-blur-sm flex items-center justify-center">
                <Image className="w-5 h-5" style={{ color: state.designSystem.primary }} />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1" style={{ color: state.designSystem.text }}>Media</h4>
                <p className="text-xs" style={{ color: `${state.designSystem.text}80` }}>Visual content</p>
              </div>
            </div>
          </motion.div>

          {/* Primary Small Card */}
          <motion.div
            className="col-span-1 rounded-xl relative overflow-hidden group"
            style={{ 
              backgroundColor: state.designSystem.primary,
              boxShadow: `0 4px 12px ${state.designSystem.primary}10`
            }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20" />
            <div className="relative h-full p-4 flex flex-col justify-between">
              <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
              <p className="text-sm text-white/90">Next</p>
            </div>
          </motion.div>

          {/* Color Scale Preview Card */}
          <motion.div
            className="col-span-3 rounded-xl relative overflow-hidden group"
            style={{ 
              backgroundColor: state.designSystem.secondary,
              boxShadow: `0 4px 12px ${state.designSystem.secondary}10`
            }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20" />
            <div className="relative h-full p-4 flex flex-col justify-between">
              <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <Palette className="w-4 h-4 text-white" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-white/90">Scale</p>
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="h-1.5 flex-1 rounded-full"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${state.designSystem.primary} ${(i + 1) * 14}%, ${state.designSystem.background})`
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Card>
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
                background: `linear-gradient(135deg, ${state.designSystem.primary}, ${state.designSystem.secondary})`,
                boxShadow: `0 8px 24px ${state.designSystem.primary}15`
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
                  background: `linear-gradient(to right, ${state.designSystem.primary}, ${state.designSystem.secondary})`,
                  boxShadow: `0 2px 8px ${state.designSystem.primary}10`
                }} 
              />
              <motion.div 
                className="h-3 w-16 rounded-full transition-all duration-300 group-hover:w-20" 
                style={{ 
                  backgroundColor: state.designSystem.secondary,
                  opacity: 0.8,
                  boxShadow: `0 2px 8px ${state.designSystem.secondary}10`
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
            style={{
              boxShadow: `0 4px 12px ${state.designSystem.primary}10`
            }}
          >
            <motion.div 
              className="absolute inset-0 transition-all duration-500 group-hover:scale-110" 
              style={{ 
                background: `linear-gradient(45deg, 
                  ${state.designSystem.primary}, 
                  ${state.designSystem.secondary}
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
                  background: `linear-gradient(135deg, ${state.designSystem.primary}, ${state.designSystem.secondary})`,
                  borderColor: state.designSystem.background,
                  boxShadow: `0 8px 24px ${state.designSystem.primary}15`
                }} 
              />
              <div className="space-y-2">
                <motion.div 
                  className="h-4 w-32 rounded-full transition-all duration-300 group-hover:w-36" 
                  style={{ 
                    backgroundColor: state.designSystem.background,
                    boxShadow: `0 2px 8px ${state.designSystem.primary}15`
                  }} 
                />
                <motion.div 
                  className="h-3 w-24 rounded-full transition-all duration-300 group-hover:w-28" 
                  style={{ 
                    backgroundColor: state.designSystem.background,
                    opacity: 0.8,
                    boxShadow: `0 2px 8px ${state.designSystem.primary}10`
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

// Add ColorCards component before PreviewPanel
function ColorCards() {
  const { state } = useGradient();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  // Helper function to copy text
  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        // For modern browsers
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (err) {
          console.error('Failed to copy text:', err);
        }
        textArea.remove();
      }
      // Show feedback
      setCopiedColor(text);
      setTimeout(() => setCopiedColor(null), 2000);
    } catch (err) {
      console.error('Failed to copy color:', err);
    }
  };

  // Helper function to determine text color based on background
  const getContrastText = (bgColor: string) => {
    // Convert hex to RGB
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  const colorRoles = [
    { id: 'primary', label: 'Cor Primária', color: state.designSystem.primary },
    { id: 'secondary', label: 'Cor Secundária', color: state.designSystem.secondary },
    { id: 'accent', label: 'Cor de Apoio', color: state.designSystem.accent },
    { id: 'background', label: 'Background', color: state.designSystem.background }
  ];

  return (
    <Card className="p-6 hover:shadow-md transition-all duration-300">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Color System</Label>
          <div className="text-xs text-muted-foreground">Brand Colors</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {colorRoles.map((role) => (
            <motion.div
              key={role.id}
              className="relative overflow-hidden rounded-xl aspect-[1.91/1] cursor-pointer group"
              style={{ backgroundColor: role.color }}
              onHoverStart={() => setHoveredCard(role.id)}
              onHoverEnd={() => setHoveredCard(null)}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="absolute inset-0 flex flex-col justify-between p-4">
                {/* Top section */}
                <div className="flex items-start justify-between">
                  <motion.span 
                    className="text-sm font-medium"
                    style={{ color: getContrastText(role.color) }}
                  >
                    {role.label}
                  </motion.span>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: hoveredCard === role.id ? 1 : 0, scale: hoveredCard === role.id ? 1 : 0.8 }}
                    className="flex items-center gap-2"
                  >
                    {copiedColor === role.color ? (
                      <Check 
                        className="w-3.5 h-3.5 transition-transform"
                        style={{ color: getContrastText(role.color) }}
                      />
                    ) : (
                      <Copy 
                        className="w-3.5 h-3.5 cursor-pointer hover:scale-110 transition-transform"
                        style={{ color: getContrastText(role.color) }}
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(role.color);
                        }}
                      />
                    )}
                  </motion.div>
                </div>

                {/* Bottom section */}
                <motion.div
                  className="text-xs font-mono"
                  style={{ color: getContrastText(role.color) }}
                >
                  {role.color}
                </motion.div>
              </div>
            </motion.div>
          ))}
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
    // Ensure we have the primary color if no extracted colors
    const initialColors = state.extractedColors.length > 0 
      ? state.extractedColors 
      : [state.designSystem.primary, state.designSystem.secondary, state.designSystem.accent];
    
    setDisplayedColors(initialColors.slice(0, 6));
    setHasMore(initialColors.length > 6);
  }, [state.extractedColors, state.designSystem]);

  // Handle load more
  const handleLoadMore = () => {
    const currentLength = displayedColors.length;
    const nextColors = state.extractedColors.slice(currentLength, currentLength + 6);
    setDisplayedColors([...displayedColors, ...nextColors]);
    setHasMore(currentLength + 6 < state.extractedColors.length);
  };

  const handleRefreshScales = () => {
    setIsRefreshing(true);
    // Get current colors
    const currentColors = displayedColors.length > 0 
      ? displayedColors 
      : [state.designSystem.primary, state.designSystem.secondary, state.designSystem.accent];
    
    // Shuffle and update displayed colors
    const shuffledColors = [...currentColors].sort(() => Math.random() - 0.5);
    setDisplayedColors(shuffledColors.slice(0, 6));
    
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const handleCopyColor = async (color: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(color);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = color;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (err) {
          console.error('Failed to copy text:', err);
        }
        textArea.remove();
      }
      setCopiedColor(color);
      setTimeout(() => setCopiedColor(null), 2000);
    } catch (error) {
      console.error('Failed to copy color:', error);
    }
  };

  // Update the ColorScale component
  const ColorScale = ({ color, label }: { color: string; label: string }) => {
    // More robust hex color validation
    const normalizeHexColor = (color: string): string => {
      // Remove hash if present
      let hex = color.replace('#', '');
      
      // Handle shorthand hex (e.g., #FFF)
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      
      // Add hash back
      hex = '#' + hex;
      
      // Validate full hex
      return /^#[0-9A-Fa-f]{6}$/i.test(hex) ? hex.toUpperCase() : '#000000';
    };

    // Ensure color is a valid hex color
    const safeColor = normalizeHexColor(color);

    // Color conversion utilities
    const parseColor = (color: string): [number, number, number] => {
      try {
        const hex = color.replace('#', '');
        return [
          parseInt(hex.substring(0, 2), 16) || 0,
          parseInt(hex.substring(2, 4), 16) || 0,
          parseInt(hex.substring(4, 6), 16) || 0
        ];
      } catch (error) {
        console.error('Error parsing color:', color, error);
        return [0, 0, 0];
      }
    };

    const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
      try {
        // Normalize RGB values
        r = Math.min(255, Math.max(0, r)) / 255;
        g = Math.min(255, Math.max(0, g)) / 255;
        b = Math.min(255, Math.max(0, b)) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const l = (max + min) / 2;
        
        if (max === min) {
          return [0, 0, Math.round(l * 100)]; // Achromatic case
        }

        const d = max - min;
        const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        let h;
        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          default: // case b
            h = (r - g) / d + 4;
        }
        h /= 6;

        return [
          Math.round(h * 360),
          Math.round(s * 100),
          Math.round(l * 100)
        ];
      } catch (error) {
        console.error('Error converting RGB to HSL:', error);
        return [0, 0, 50]; // Default to middle gray
      }
    };

    // Generate scales with proper HSL adjustments
    const generateScales = (baseColor: string) => {
      try {
        // Improved HSL to RGB conversion with better handling of edge cases
        const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
          try {
            // Normalize values
            h = ((h % 360) + 360) % 360; // Ensure h is between 0 and 360
            s = Math.min(100, Math.max(0, s)) / 100;
            l = Math.min(100, Math.max(0, l)) / 100;

            if (s === 0) {
              const rgb = Math.round(l * 255);
              return [rgb, rgb, rgb]; // Achromatic case
            }

            const hue2rgb = (p: number, q: number, t: number) => {
              if (t < 0) t += 1;
              if (t > 1) t -= 1;
              if (t < 1/6) return p + (q - p) * 6 * t;
              if (t < 1/2) return q;
              if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
              return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            const r = hue2rgb(p, q, (h / 360) + 1/3);
            const g = hue2rgb(p, q, h / 360);
            const b = hue2rgb(p, q, (h / 360) - 1/3);

            return [
              Math.round(r * 255),
              Math.round(g * 255),
              Math.round(b * 255)
            ];
          } catch (error) {
            console.error('Error converting HSL to RGB:', error);
            return [0, 0, 0];
          }
        };

        // More precise hex conversion
        const rgbToHex = (r: number, g: number, b: number): string => {
          try {
            const toHex = (n: number): string => {
              const val = Math.min(255, Math.max(0, Math.round(n)));
              const hex = val.toString(16);
              return hex.length === 1 ? '0' + hex : hex;
            };
            return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
          } catch (error) {
            console.error('Error converting RGB to Hex:', error);
            return '#000000';
          }
        };

        // Parse and convert initial color
        const [r, g, b] = parseColor(baseColor);
        const [h, s, l] = rgbToHsl(r, g, b);

        // Improved scale generation with better distribution
        const generateStep = (targetL: number, targetS: number): string => {
          try {
            // Ensure saturation is proportional to the original color's saturation
            const adjustedS = Math.min(100, Math.max(0, 
              s === 0 ? 0 : // Keep grayscale colors grayscale
              targetS < s ? 
                (targetS * (s / 100)) : // Darker shades
                (s + (targetS - s) * 0.5) // Lighter shades
            ));

            const [r, g, b] = hslToRgb(h, adjustedS, targetL);
            return rgbToHex(r, g, b);
          } catch (error) {
            console.error('Error in step generation:', error);
            return baseColor;
          }
        };

        // Generate scale with improved distribution and better contrast
        const steps = [
          { l: 12, s: 95 },  // Darkest
          { l: 24, s: 90 },  // Darker
          { l: 36, s: 85 },  // Dark
          { l: 48, s: 80 },  // Base Dark
          { l: 60, s: 75 },  // Base Light
          { l: 72, s: 70 },  // Light
          { l: 84, s: 65 },  // Lighter
          { l: 96, s: 60 }   // Lightest
        ];

        return steps.map(({ l: targetL, s: targetS }) => generateStep(targetL, targetS));

      } catch (error) {
        console.error('Error in color scale generation:', error);
        return Array(8).fill(baseColor);
      }
    };

    const scales = generateScales(safeColor);
    console.log('Generated scales for color:', color, 'Safe color:', safeColor, 'HSL:', rgbToHsl(...parseColor(safeColor)));

    return (
      <motion.div 
        className="relative group rounded-lg bg-zinc-900/20 hover:bg-zinc-800/20 p-3 transition-all duration-200"
        animate={isRefreshing ? { scale: [1, 1.01, 1] } : {}}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-md shadow-sm ring-1 ring-white/10" 
              style={{ backgroundColor: safeColor }}
            />
            <span className="text-xs font-medium text-zinc-400">{label}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 hover:text-red-500 h-6 w-6 p-0"
            onClick={() => onColorRemove(color)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        <div className="grid grid-cols-8 gap-1">
          {scales.map((scale, index) => (
            <TooltipProvider key={`${scale}-${index}`}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button 
                    className="relative group/scale h-10 rounded-md cursor-pointer overflow-hidden ring-1 ring-white/5"
                    style={{ backgroundColor: scale }}
                    onClick={() => handleCopyColor(scale)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-black/5 opacity-0 group-hover/scale:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/20 backdrop-blur-sm rounded-md p-1 opacity-0 group-hover/scale:opacity-100 transition-all duration-200 scale-75 group-hover/scale:scale-100">
                        {copiedColor === scale ? (
                          <Check className="w-2.5 h-2.5 text-white" />
                        ) : (
                          <Copy className="w-2.5 h-2.5 text-white" />
                        )}
                      </div>
                    </div>
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="top" className="select-none">
                  <p className="text-xs font-mono">{scale}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="space-y-4"
        >
          <ColorCards />
          <PreviewPanel />
          <BrandElements />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="space-y-4"
        >
          <BentoGrid />
          
          {/* Color Scales Section */}
          <Card className="p-6 hover:shadow-md transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Color Scales</Label>
                  <p className="text-xs text-muted-foreground">Click to copy color values</p>
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

              <motion.div 
                className="grid gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {displayedColors.slice(0, 6).map((color, index) => (
                  <motion.div 
                    key={color} 
                    className="relative"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <ColorScale color={color} label={`Scale ${index + 1}`} />
                  </motion.div>
                ))}
              </motion.div>

              {hasMore && displayedColors.length > 6 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center pt-2"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLoadMore}
                    className="text-xs group transition-all duration-200 hover:bg-accent/5 w-full"
                  >
                    <span>Load more scales</span>
                    <ChevronDown className="w-3.5 h-3.5 ml-1.5 group-hover:translate-y-0.5 transition-transform" />
                  </Button>
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
} 