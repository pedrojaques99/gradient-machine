'use client';

import { useEffect, useRef, useState, useCallback, memo, useMemo } from 'react';
import { Button } from '@/app/components/ui/button';
import { RotateCw } from 'lucide-react';
import { useColorStops, useGradient, useGradientError } from '@/app/contexts/GradientContext';
import { CANVAS, COLOR_STOP } from '@/app/lib/constants';
import { cn } from '@/app/lib/utils';
import { ColorStop, GradientStyle } from '@/app/lib/utils/colors';
import { ColorStopTrack } from './color-stop-track';

// Orientation toggle button component
const OrientationButton = memo(({ isVertical, onToggle }: { 
  isVertical: boolean; 
  onToggle: () => void;
}) => (
  <Button
    variant="outline"
    size="icon"
    onClick={onToggle}
    className="self-end hover:bg-primary/5 h-7 w-7 sm:h-8 sm:w-8"
    title={`Switch to ${isVertical ? 'horizontal' : 'vertical'} orientation`}
  >
    <RotateCw 
      className={cn(
        "h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-200 ease-out",
        isVertical && "rotate-90"
      )}
      aria-hidden="true"
    />
    <span className="sr-only">
      Switch to {isVertical ? 'horizontal' : 'vertical'} orientation
    </span>
  </Button>
));
OrientationButton.displayName = 'OrientationButton';

interface GradientCanvasProps {
  showTrack?: boolean;
  showOrientationToggle?: boolean;
  gradientStyle?: GradientStyle;
  onColorStopsChange?: (stops: ColorStop[]) => void;
  backgroundColor?: string;
  gradientSize?: number;
}

// Add this helper function before the GradientCanvas component
function addTransparency(color: string, opacity: number): string {
  // For hex colors
  if (color.startsWith('#')) {
    // Convert hex opacity (0-1) to hex string (00-FF)
    const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
    return `${color}${alpha}`;
  }
  
  // For rgb colors
  if (color.startsWith('rgb')) {
    // If already rgba, replace the opacity value
    if (color.startsWith('rgba')) {
      return color.replace(/rgba\(([^)]+)\)/, (_, params) => {
        const values = params.split(',').slice(0, 3);
        return `rgba(${values.join(',')}, ${opacity})`;
      });
    }
    // Convert rgb to rgba
    return color.replace(/rgb\(([^)]+)\)/, (_, params) => {
      return `rgba(${params}, ${opacity})`;
    });
  }
  
  // Default fallback
  return `rgba(0,0,0,${opacity})`;
}

// Constants for gradient limits
const MAX_FLUID_SOFT_STOPS = 8;

// Add performance utility functions before the GradientCanvas component
// Performance utilities
function getDevicePerformanceLevel(): 'high' | 'medium' | 'low' {
  // Check for device capabilities to determine performance level
  const memory = (navigator as any).deviceMemory;
  const cores = navigator.hardwareConcurrency;
  
  if (memory && cores) {
    if (memory >= 4 && cores >= 4) return 'high';
    if (memory >= 2 && cores >= 2) return 'medium';
  }
  
  // Mobile detection (simplified)
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return isMobile ? 'low' : 'medium';
}

// Adaptive frame rate control based on interaction type
function getTargetFPS(interactionType: 'dragging' | 'hovering' | 'static', performanceLevel: 'high' | 'medium' | 'low'): number {
  const fpsTable = {
    high: { dragging: 60, hovering: 30, static: 10 },
    medium: { dragging: 30, hovering: 20, static: 5 },
    low: { dragging: 24, hovering: 15, static: 2 }
  };
  
  return fpsTable[performanceLevel][interactionType];
}

// History tracking for undo/redo
interface GradientHistory {
  colorStops: ColorStop[];
  timestamp: number;
}

// Validate and normalize color stops to prevent errors
function normalizeColorStops(stops: ColorStop[]): ColorStop[] {
  if (!stops || !Array.isArray(stops)) {
    return [{ id: '1', color: '#000000', position: 0 }, { id: '2', color: '#ffffff', position: 1 }];
  }
  
  return stops.map(stop => {
    // Clone to avoid mutations
    const normalizedStop = { ...stop };
    
    // Ensure position is within 0-1 range
    normalizedStop.position = Math.max(0, Math.min(1, normalizedStop.position));
    
    // Ensure x/y are within 0-1 range if they exist
    if (normalizedStop.x !== undefined) {
      normalizedStop.x = Math.max(0, Math.min(1, normalizedStop.x));
    }
    
    if (normalizedStop.y !== undefined) {
      normalizedStop.y = Math.max(0, Math.min(1, normalizedStop.y));
    }
    
    // Ensure color is valid
    if (!normalizedStop.color || typeof normalizedStop.color !== 'string') {
      normalizedStop.color = '#000000';
    } else if (!normalizedStop.color.startsWith('#') && !normalizedStop.color.startsWith('rgb')) {
      // Try to fix common color format issues
      if (/^[0-9A-Fa-f]{6}$/.test(normalizedStop.color)) {
        normalizedStop.color = '#' + normalizedStop.color;
      }
    }
    
    return normalizedStop;
  });
}

// Function to safely add color stops to a gradient
function safelyAddColorStops(gradient: CanvasGradient, stops: ColorStop[]): boolean {
  let success = true;
  
  try {
    // First validate all stops have positions between 0-1
    const normalizedStops = normalizeColorStops(stops);
    
    // Then add them to the gradient
    normalizedStops.forEach(stop => {
      try {
        gradient.addColorStop(stop.position, stop.color);
      } catch (error) {
        console.error(`Error adding color stop at position ${stop.position}:`, error);
        success = false;
        
        // Try adding a fallback color if the position is valid
        if (stop.position >= 0 && stop.position <= 1) {
          try {
            gradient.addColorStop(stop.position, '#000000');
          } catch (e) {
            // If even the fallback fails, we can't do much
          }
        }
      }
    });
  } catch (error) {
    console.error("Error adding gradient color stops:", error);
    success = false;
    
    // Add basic fallback gradient if all else fails
    try {
      gradient.addColorStop(0, '#000000');
      gradient.addColorStop(1, '#ffffff');
    } catch (e) {
      // Last resort failed, gradient will be broken
    }
  }
  
  return success;
}

export function GradientCanvas({ 
  showTrack = true,
  showOrientationToggle = true,
  gradientStyle = 'linear',
  onColorStopsChange,
  backgroundColor = 'zinc',
  gradientSize
}: GradientCanvasProps) {
  const colorStops = useColorStops();
  const { state, dispatch } = useGradient();
  const { setError } = useGradientError();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isVertical, setIsVertical] = useState(false);
  const [conicRotation, setConicRotation] = useState(0);
  const rafRef = useRef<number | undefined>(undefined);
  const lastDrawRef = useRef<number>(0);
  
  // Undo/Redo history system
  const [history, setHistory] = useState<GradientHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [lastSavedState, setLastSavedState] = useState<string>('');
  
  // Add undo/redo functionality
  const addToHistory = useCallback((stops: ColorStop[]) => {
    // Create a JSON representation of the current state for comparison
    const stateJson = JSON.stringify(stops);
    
    // Only add to history if state has changed from last saved state
    if (stateJson !== lastSavedState) {
      // Truncate future history if we're not at the end
      const newHistory = history.slice(0, historyIndex + 1);
      
      // Add current state to history
      newHistory.push({
        colorStops: JSON.parse(JSON.stringify(stops)), // Deep clone
        timestamp: Date.now(),
      });
      
      // Limit history size (keep last 20 states)
      if (newHistory.length > 20) {
        newHistory.shift();
      }
      
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setLastSavedState(stateJson);
    }
  }, [history, historyIndex, lastSavedState]);
  
  // Handle undo action
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousState = history[newIndex];
      
      if (previousState && previousState.colorStops) {
        if (onColorStopsChange) {
          onColorStopsChange(previousState.colorStops);
        } else {
          dispatch({ type: 'SET_COLOR_STOPS', payload: previousState.colorStops });
        }
        setHistoryIndex(newIndex);
      }
    }
  }, [history, historyIndex, dispatch, onColorStopsChange]);
  
  // Handle redo action
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];
      
      if (nextState && nextState.colorStops) {
        if (onColorStopsChange) {
          onColorStopsChange(nextState.colorStops);
        } else {
          dispatch({ type: 'SET_COLOR_STOPS', payload: nextState.colorStops });
        }
        setHistoryIndex(newIndex);
      }
    }
  }, [history, historyIndex, dispatch, onColorStopsChange]);
  
  // Add keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);
  
  // Initialize history with current state
  useEffect(() => {
    if (history.length === 0 && colorStops.length > 0) {
      addToHistory(colorStops);
    }
  }, [colorStops, history.length, addToHistory]);

  // Performance optimization state
  const performanceLevelRef = useRef<'high' | 'medium' | 'low'>(getDevicePerformanceLevel());
  const interactionTypeRef = useRef<'dragging' | 'hovering' | 'static'>('static');
  const needsFullRerenderRef = useRef<boolean>(true);
  const renderQueueRef = useRef<Set<string>>(new Set(['base']));

  // Update interaction type based on current state
  useEffect(() => {
    if (draggingIndex !== null) {
      interactionTypeRef.current = 'dragging';
    } else if (hoverIndex !== null) {
      interactionTypeRef.current = 'hovering';
    } else {
      interactionTypeRef.current = 'static';
    }
  }, [draggingIndex, hoverIndex]);

  // Force a full render when certain props change
  useEffect(() => {
    needsFullRerenderRef.current = true;
  }, [gradientStyle, isVertical, backgroundColor, state.gradientSize]);

  // Create WebGL pattern generator for optimal effect rendering
  const patternGenerator = useMemo(() => {
    if (typeof window === 'undefined') return null;
    
    // Basic check if WebGL is available
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return null;
      
      // WebGL is available - in a real implementation we would set up proper shaders here
      return {
        createPattern: (type: 'gitter' | 'halftone', params: any) => {
          // This is a placeholder - in a real implementation we would use WebGL for pattern generation
          if (type === 'gitter') {
            return createGitterPattern(canvas.getContext('2d')!, params.size);
          } else {
            return createHalftonePattern(canvas.getContext('2d')!, params.dotSize, params.spacing);
          }
        }
      };
    } catch (e) {
      return null;
    }
  }, []);

  // Initialize canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = state.canvasWidth * dpr;
    canvas.height = state.canvasHeight * dpr;
    canvas.style.width = `${state.canvasWidth}px`;
    canvas.style.height = `${state.canvasHeight}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, [state.canvasWidth, state.canvasHeight]);

  // Update canvas size with responsive values
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const dpr = window.devicePixelRatio || 1;
      const width = container.clientWidth;
      const height = container.clientHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      dispatch({ 
        type: 'SET_CANVAS_SIZE', 
        payload: { width, height } 
      });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [dispatch]);

  // Update gradient size when prop changes
  useEffect(() => {
    if (gradientSize !== undefined) {
      dispatch({ type: 'SET_GRADIENT_SIZE', payload: gradientSize });
    }
  }, [gradientSize, dispatch]);

  // Optimize canvas drawing with requestAnimationFrame
  const drawCanvas = useCallback(() => {
    const now = performance.now();
    if (now - lastDrawRef.current < 16) return; // Limit to ~60fps
    lastDrawRef.current = now;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // Schedule next frame
    rafRef.current = requestAnimationFrame(() => {
      try {
        const width = state.canvasWidth;
        const height = state.canvasHeight;
        const { SIZE, BORDER, TRACK, GUIDE_LINE } = COLOR_STOP;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 * (state.gradientSize / 100);

        // Clear canvas and set background
        ctx.fillStyle = typeof backgroundColor === 'string' ? backgroundColor : '#000000';
        ctx.fillRect(0, 0, width, height);

        // Create gradient based on style
        let gradient: CanvasGradient | undefined;
        
        // Ensure we have valid color stops before attempting to render
        const validColorStops = colorStops.filter(stop => {
          return stop && typeof stop.color === 'string' && typeof stop.position === 'number' && !isNaN(stop.position);
        });

        if (validColorStops.length < 1) {
          // If no valid color stops, render a basic gradient
          gradient = ctx.createLinearGradient(0, 0, width, height);
          gradient.addColorStop(0, '#000000');
          gradient.addColorStop(1, '#ffffff');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
          return;
        }
        
        switch (gradientStyle) {
          case 'linear':
            gradient = ctx.createLinearGradient(
              isVertical ? 0 : 0,
              isVertical ? 0 : 0,
              isVertical ? 0 : width,
              isVertical ? height : 0
            );
            break;
          case 'radial':
            gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
            break;
          case 'conic':
            gradient = ctx.createConicGradient(0, centerX, centerY);
            break;
          case 'diagonal':
            gradient = ctx.createLinearGradient(0, 0, width, height);
            break;
          case 'fluid':
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            
            // Apply safety limit for complex gradients
            const safeFluidStops = validColorStops.length > MAX_FLUID_SOFT_STOPS 
              ? validColorStops.slice(0, MAX_FLUID_SOFT_STOPS) 
              : validColorStops;
            
            safeFluidStops.forEach((stop, index) => {
              const x = (stop.x ?? stop.position) * width;
              const y = (stop.y ?? 0.5) * height;
              const gradientRadius = radius * (state.handleSize / 16) * 0.8;
              
              try {
                const fluidGradient = ctx.createRadialGradient(x, y, 0, x, y, gradientRadius);
                fluidGradient.addColorStop(0, stop.color);
                fluidGradient.addColorStop(1, 'rgba(0,0,0,0)');
                
                ctx.fillStyle = fluidGradient;
                ctx.beginPath();
                ctx.arc(x, y, gradientRadius, 0, Math.PI * 2);
                ctx.fill();
              } catch (error) {
                console.error('Error creating fluid gradient:', error);
                // Continue to next stop on error
                return;
              }
            });
            ctx.restore();
            break;
          case 'soft':
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            
            // Apply safety limit for complex gradients
            const safeColorStops = validColorStops.length > MAX_FLUID_SOFT_STOPS 
              ? validColorStops.slice(0, MAX_FLUID_SOFT_STOPS) 
              : validColorStops;
            
            safeColorStops.forEach((stop, index) => {
              const x = (stop.x ?? stop.position) * width;
              const y = (stop.y ?? 0.5) * height;
              const gradientRadius = radius * (state.handleSize / 16) * 1.2;
              const softGradient = ctx.createRadialGradient(x, y, 0, x, y, gradientRadius);
              
              try {
                softGradient.addColorStop(0, stop.color);
                // Fix the transparency issue - use rgba format instead of hex+alpha
                const rgbaColor = stop.color.startsWith('#') 
                  ? hexToRgba(stop.color, 0.5) 
                  : addTransparency(stop.color, 0.5);
                softGradient.addColorStop(0.5, rgbaColor);
                softGradient.addColorStop(1, 'rgba(0,0,0,0)');
                
                ctx.fillStyle = softGradient;
                ctx.beginPath();
                ctx.arc(x, y, gradientRadius, 0, Math.PI * 2);
                ctx.fill();
              } catch (error) {
                console.error('Error creating soft gradient:', error);
                // Fallback to simpler gradient
                const simpleGradient = ctx.createRadialGradient(x, y, 0, x, y, gradientRadius);
                simpleGradient.addColorStop(0, stop.color);
                simpleGradient.addColorStop(1, 'rgba(0,0,0,0)');
                
                ctx.fillStyle = simpleGradient;
                ctx.beginPath();
                ctx.arc(x, y, gradientRadius, 0, Math.PI * 2);
                ctx.fill();
              }
            });
            ctx.restore();
            break;
        }

        // Add color stops to gradient for non-fluid/soft styles
        if (gradient) {
          try {
            // Ensure positions are in ascending order for color stops
            validColorStops
              .slice()
              .sort((a, b) => a.position - b.position)
              .forEach(stop => {
                try {
                  // Ensure position is between 0 and 1
                  const safePosition = Math.max(0, Math.min(1, stop.position));
                  gradient!.addColorStop(safePosition, stop.color);
                } catch (error) {
                  console.error(`Error adding color stop (${stop.color}) at position ${stop.position}:`, error);
                  // Try with a fallback color
                  try {
                    gradient!.addColorStop(Math.max(0, Math.min(1, stop.position)), 'rgba(0,0,0,0.5)');
                  } catch (e) {
                    // Ignore if even this fails
                  }
                }
              });
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
          } catch (error) {
            console.error('Error rendering gradient:', error);
            // Fallback to a basic gradient
            const fallbackGradient = ctx.createLinearGradient(0, 0, width, height);
            fallbackGradient.addColorStop(0, '#000000');
            fallbackGradient.addColorStop(1, '#ffffff');
            ctx.fillStyle = fallbackGradient;
            ctx.fillRect(0, 0, width, height);
            
            // Notify user of the error
            setError('Error rendering gradient. Try a different style or fewer colors.');
          }
        }
        
        // Draw effects if enabled
        if (state.gradientSettings.gitterIntensity > 0) {
          try {
            ctx.save();
            ctx.globalAlpha = state.gradientSettings.gitterIntensity / 100;
            ctx.globalCompositeOperation = 'overlay';
            const pattern = ctx.createPattern(createGitterPattern(ctx, 4), 'repeat');
            if (pattern) {
              ctx.fillStyle = pattern;
              ctx.fillRect(0, 0, width, height);
            }
            ctx.restore();
          } catch (error) {
            console.error('Error applying gitter effect:', error);
          }
        }

        if (state.gradientSettings.halftoneMode) {
          try {
            ctx.save();
            ctx.globalCompositeOperation = 'overlay';
            const pattern = ctx.createPattern(createHalftonePattern(ctx, 4, 8), 'repeat');
            if (pattern) {
              ctx.fillStyle = pattern;
              ctx.fillRect(0, 0, width, height);
            }
            ctx.restore();
          } catch (error) {
            console.error('Error applying halftone effect:', error);
          }
        }

        // Draw track if enabled
        if (showTrack) {
          try {
            ctx.save();
            ctx.fillStyle = `rgba(0, 0, 0, ${TRACK.OPACITY})`;
            const trackX = isVertical ? width - SIZE.DEFAULT - TRACK.HEIGHT : TRACK.PADDING;
            const trackY = isVertical ? TRACK.PADDING : height - SIZE.DEFAULT - TRACK.HEIGHT;
            const trackWidth = isVertical ? TRACK.HEIGHT : width - TRACK.PADDING * 2;
            const trackHeight = isVertical ? height - TRACK.PADDING * 2 : TRACK.HEIGHT;

            ctx.beginPath();
            ctx.roundRect(trackX, trackY, trackWidth, trackHeight, TRACK.HEIGHT / 2);
            ctx.fill();
            ctx.restore();
          } catch (error) {
            console.error('Error drawing track:', error);
          }
        }

        // Draw color stops
        validColorStops.forEach((stop, index) => {
          try {
            let x, y;
            switch (gradientStyle) {
              case 'linear':
                x = isVertical 
                  ? width - SIZE.DEFAULT - TRACK.HEIGHT / 2 
                  : TRACK.PADDING + stop.position * (width - TRACK.PADDING * 2);
                y = isVertical 
                  ? TRACK.PADDING + stop.position * (height - TRACK.PADDING * 2)
                  : height - SIZE.DEFAULT - TRACK.HEIGHT / 2;
                break;
              case 'radial':
                x = width / 2;
                y = height / 2 + (stop.position - 0.5) * height;
                break;
              case 'conic':
                const angle = stop.position * Math.PI * 2;
                x = centerX + Math.cos(angle) * radius;
                y = centerY + Math.sin(angle) * radius;
                break;
              case 'diagonal':
                x = stop.position * width;
                y = stop.position * height;
                break;
              case 'fluid':
              case 'soft':
                x = (stop.x ?? stop.position) * width;
                y = (stop.y ?? 0.5) * height;
                break;
              default:
                x = TRACK.PADDING + stop.position * (width - TRACK.PADDING * 2);
                y = height - SIZE.DEFAULT - TRACK.HEIGHT / 2;
            }

            const isSelected = index === state.selectedColorIndex;
            const isHovered = index === hoverIndex;
            const isDragging = index === draggingIndex;
            const scale = isDragging ? SIZE.ACTIVE / SIZE.DEFAULT : 
                        isHovered ? SIZE.HOVER / SIZE.DEFAULT : 1;

            // Draw guide line for selected stop
            if (isSelected && showTrack) {
              ctx.save();
              ctx.beginPath();
              if (isVertical) {
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
              } else {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
              }
              ctx.strokeStyle = `rgba(var(--primary), ${GUIDE_LINE.OPACITY})`;
              ctx.lineWidth = GUIDE_LINE.WIDTH;
              ctx.stroke();
              ctx.restore();
            }

            // Draw stop handle
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);
            
            // Shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetY = 2;

            // Stop circle
            ctx.beginPath();
            ctx.arc(0, 0, SIZE.DEFAULT / 2, 0, Math.PI * 2);
            ctx.fillStyle = stop.color;
            ctx.fill();

            // Border
            ctx.strokeStyle = isSelected || isHovered ? 'hsl(var(--primary))' : 'white';
            ctx.lineWidth = isSelected || isDragging ? BORDER.HOVER_WIDTH : BORDER.WIDTH;
            ctx.stroke();

            ctx.restore();
          } catch (error) {
            console.error('Error drawing color stop:', error);
          }
        });
      } catch (error) {
        console.error('Critical error in canvas rendering:', error);
        
        // Last resort fallback - just fill with a solid color
        try {
          ctx.fillStyle = '#333333';
          ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          
          // Draw error message
          ctx.fillStyle = '#ffffff';
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Error rendering gradient', ctx.canvas.width / 2, ctx.canvas.height / 2);
        } catch (e) {
          // Nothing more we can do
        }
      }
    });
  }, [colorStops, gradientStyle, isVertical, backgroundColor, state.gradientSize, state.handleSize, state.selectedColorIndex, hoverIndex, draggingIndex, state.gradientSettings.gitterIntensity, state.gradientSettings.halftoneMode, showTrack, setError]);

  // Request a render when interaction state changes
  const requestRender = useCallback((layers: string[] = ['base']) => {
    layers.forEach(layer => renderQueueRef.current.add(layer));
    drawCanvas();
  }, [drawCanvas]);

  // Draw on changes and setup a lower frequency static render loop
  useEffect(() => {
    // Initial render
    requestRender();
    
    // Static render loop for gradual effects/animations
    let staticInterval: NodeJS.Timeout;
    if (interactionTypeRef.current === 'static') {
      const staticFPS = getTargetFPS('static', performanceLevelRef.current);
      staticInterval = setInterval(() => {
        if (state.gradientSettings.halftoneMode || state.gradientSettings.gitterIntensity > 0) {
          // Only request renders for animations or effects
          requestRender(['effects']);
        }
      }, 1000 / staticFPS);
    }
    
    return () => {
      if (staticInterval) clearInterval(staticInterval);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [drawCanvas, requestRender, state.gradientSettings.halftoneMode, state.gradientSettings.gitterIntensity]);

  // Position calculation
  const getColorStopAtPosition = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const width = state.canvasWidth;
    const height = state.canvasHeight;
    const { SIZE, TRACK } = COLOR_STOP;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 * (state.gradientSize / 100);
    
    // Check if clicking on center point for conic gradient
    if (gradientStyle === 'conic') {
      const distance = Math.sqrt(
        Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
      );
      if (distance < SIZE.DEFAULT) {
        return -1; // Special index for center point
      }
    }
    
    for (let i = 0; i < colorStops.length; i++) {
      const stop = colorStops[i];
      let stopX, stopY;

      switch (gradientStyle) {
        case 'linear':
          stopX = isVertical 
            ? width - SIZE.DEFAULT - TRACK.HEIGHT / 2 
            : TRACK.PADDING + stop.position * (width - TRACK.PADDING * 2);
          stopY = isVertical 
            ? TRACK.PADDING + stop.position * (height - TRACK.PADDING * 2)
            : height - SIZE.DEFAULT - TRACK.HEIGHT / 2;
          break;
        case 'radial':
          stopX = width / 2;
          stopY = height / 2 + (stop.position - 0.5) * height;
          break;
        case 'conic':
          const angle = stop.position * Math.PI * 2;
          stopX = centerX + Math.cos(angle) * radius;
          stopY = centerY + Math.sin(angle) * radius;
          break;
        case 'diagonal':
          stopX = stop.position * width;
          stopY = stop.position * height;
          break;
        case 'fluid':
        case 'soft':
          stopX = (stop.x ?? stop.position) * width;
          stopY = (stop.y ?? 0.5) * height;
          break;
      }
      
      const distance = Math.sqrt(
        Math.pow(x - stopX, 2) + Math.pow(y - stopY, 2)
      );

      if (distance < SIZE.DEFAULT) {
        return i;
      }
    }
    return null;
  }, [colorStops, isVertical, gradientStyle, state.canvasWidth, state.canvasHeight, state.gradientSize]);

  // Event handlers - update to use the new rendering system
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const stopIndex = getColorStopAtPosition(x, y);
    if (stopIndex !== null) {
      setDraggingIndex(stopIndex);
      interactionTypeRef.current = 'dragging';
      if (stopIndex !== -1) {
        dispatch({ type: 'SET_SELECTED_COLOR_INDEX', payload: stopIndex });
      }
      canvas.setPointerCapture(e.pointerId);
      requestRender(['handles']);
    } else {
      dispatch({ type: 'SET_SELECTED_COLOR_INDEX', payload: null });
    }
  }, [getColorStopAtPosition, dispatch, requestRender]);

  // Modify handlePointerMove to ensure we have valid updates
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    if (draggingIndex !== null && draggingIndex >= 0 && draggingIndex < colorStops.length) {
      if (draggingIndex === -1 && gradientStyle === 'conic') {
        // Handle center point dragging
        const centerX = 0.5;
        const centerY = 0.5;
        const angle = Math.atan2(y - centerY, x - centerX);
        setConicRotation(angle);
      } else {
        const newStops = [...colorStops];

        if (gradientStyle === 'fluid' || gradientStyle === 'soft') {
          newStops[draggingIndex] = {
            ...newStops[draggingIndex],
            x: Math.max(0, Math.min(1, x)),
            y: Math.max(0, Math.min(1, y))
          };
        } else {
          let position;
          switch (gradientStyle) {
            case 'linear':
              position = isVertical ? y : x;
              break;
            case 'radial':
              position = y;
              break;
            case 'conic': {
              const centerX = 0.5;
              const centerY = 0.5;
              const angle = Math.atan2(y - centerY, x - centerX);
              position = ((angle + Math.PI * 1.5) % (Math.PI * 2)) / (Math.PI * 2);
              break;
            }
            case 'diagonal':
              position = (x + y) / 2;
              break;
            default:
              position = x;
          }

          // Ensure position is within valid range
          position = Math.max(0, Math.min(1, position));

          newStops[draggingIndex] = {
            ...newStops[draggingIndex],
            position
          };
        }

        if (onColorStopsChange) {
          onColorStopsChange(newStops);
        } else {
          dispatch({ type: 'SET_COLOR_STOPS', payload: newStops });
        }
      }
      
      // Force a redraw
      drawCanvas();
    } else {
      const hoveredIndex = getColorStopAtPosition(
        e.clientX - rect.left,
        e.clientY - rect.top
      );
      setHoverIndex(hoveredIndex);
    }
  }, [draggingIndex, colorStops, gradientStyle, isVertical, onColorStopsChange, dispatch, getColorStopAtPosition, drawCanvas]);

  // Modify handlePointerUp to add to history when dragging ends
  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas && draggingIndex !== null) {
      canvas.releasePointerCapture(e.pointerId);
      
      // Add current state to history when dragging ends
      addToHistory(colorStops);
    }
    setDraggingIndex(null);
    
    if (draggingIndex !== -1) {
      dispatch({ type: 'SET_SELECTED_COLOR_INDEX', payload: null });
    }
  }, [draggingIndex, dispatch, colorStops, addToHistory]);

  const handleColorChange = useCallback((color: string, index: number) => {
    const newStops = [...colorStops];
    newStops[index] = {
      ...newStops[index],
      color
    };
    if (onColorStopsChange) {
      onColorStopsChange(newStops);
    } else {
      dispatch({ type: 'SET_COLOR_STOPS', payload: newStops });
    }
  }, [colorStops, onColorStopsChange, dispatch]);

  // Add keyboard shortcut status
  const [showShortcutHint, setShowShortcutHint] = useState(false);
  
  // Show shortcut hint when Ctrl is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        setShowShortcutHint(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) {
        setShowShortcutHint(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', () => setShowShortcutHint(false));
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', () => setShowShortcutHint(false));
    };
  }, []);

  // Add a helper function to convert hex to rgba
  function hexToRgba(hex: string, alpha: number): string {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Return rgba string
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className={cn(
          "w-full h-full touch-none select-none",
          "transition-shadow duration-200",
          "hover:shadow-md",
          draggingIndex !== null && "cursor-grabbing",
          hoverIndex !== null && "cursor-grab",
          gradientStyle === 'conic' && draggingIndex === -1 && "cursor-rotate"
        )}
        style={{
          width: `${state.canvasWidth}px`,
          height: `${state.canvasHeight}px`
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      
      {/* Undo/Redo Controls */}
      <div className="absolute top-2 left-2 flex gap-1 opacity-50 hover:opacity-100 transition-opacity">
        <Button
          variant="outline"
          size="icon"
          onClick={handleUndo}
          disabled={historyIndex <= 0}
          className="h-7 w-7 bg-background/80 backdrop-blur-sm"
          title="Undo (Ctrl+Z)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 14 4 9l5-5"/>
            <path d="M4 9h10c3 0 7 1 9 5"/>
          </svg>
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRedo}
          disabled={historyIndex >= history.length - 1}
          className="h-7 w-7 bg-background/80 backdrop-blur-sm"
          title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 14 5-5-5-5"/>
            <path d="M4 9h10c3 0 7 1 9 5"/>
          </svg>
        </Button>
      </div>
      
      {/* Keyboard shortcut hint */}
      {showShortcutHint && (
        <div className="absolute bottom-2 left-2 right-2 p-2 bg-background/80 backdrop-blur-sm text-xs rounded border border-border text-center">
          Ctrl+Z: Undo • Ctrl+Y: Redo • Double-click: Edit color
        </div>
      )}
      
      {showTrack && (
        <ColorStopTrack 
          colorStops={colorStops}
          selectedIndex={state.selectedColorIndex}
          onSelect={(index: number) => dispatch({ type: 'SET_SELECTED_COLOR_INDEX', payload: index })}
          onColorChange={handleColorChange}
          className="hidden sm:block" // Hide on mobile for better UX
        />
      )}
      {showOrientationToggle && (
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
          <OrientationButton isVertical={isVertical} onToggle={() => setIsVertical(!isVertical)} />
        </div>
      )}
    </div>
  );
}

function createGitterPattern(ctx: CanvasRenderingContext2D, size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const patternCtx = canvas.getContext('2d');
  
  if (patternCtx) {
    patternCtx.fillStyle = '#000';
    patternCtx.fillRect(0, 0, size, size);
    patternCtx.fillStyle = '#fff';
    patternCtx.fillRect(0, 0, size/2, size/2);
    patternCtx.fillRect(size/2, size/2, size/2, size/2);
  }
  
  return canvas;
}

function createHalftonePattern(ctx: CanvasRenderingContext2D, dotSize: number, spacing: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = spacing;
  canvas.height = spacing;
  const patternCtx = canvas.getContext('2d');
  
  if (patternCtx) {
    patternCtx.fillStyle = '#000';
    patternCtx.beginPath();
    patternCtx.arc(spacing/2, spacing/2, dotSize/2, 0, Math.PI * 2);
    patternCtx.fill();
  }
  
  return canvas;
}