'use client';

import { useEffect, useRef, useState, useCallback, memo } from 'react';
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

  // Drawing function
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = state.canvasWidth;
    const height = state.canvasHeight;
    const { SIZE, BORDER, TRACK, GUIDE_LINE } = COLOR_STOP;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 * (state.gradientSize / 100);

    // Clear canvas and set background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Create gradient based on style
    let gradient: CanvasGradient | undefined;
    
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
        colorStops.forEach((stop, index) => {
          const x = (stop.x ?? stop.position) * width;
          const y = (stop.y ?? 0.5) * height;
          const gradientRadius = radius * (state.handleSize / 16) * 0.8;
          const fluidGradient = ctx.createRadialGradient(x, y, 0, x, y, gradientRadius);
          fluidGradient.addColorStop(0, stop.color);
          fluidGradient.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = fluidGradient;
          ctx.beginPath();
          ctx.arc(x, y, gradientRadius, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
        break;
      case 'soft':
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        colorStops.forEach((stop, index) => {
          const x = (stop.x ?? stop.position) * width;
          const y = (stop.y ?? 0.5) * height;
          const gradientRadius = radius * (state.handleSize / 16) * 1.2;
          const softGradient = ctx.createRadialGradient(x, y, 0, x, y, gradientRadius);
          softGradient.addColorStop(0, stop.color);
          softGradient.addColorStop(0.5, `${stop.color}80`);
          softGradient.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = softGradient;
          ctx.beginPath();
          ctx.arc(x, y, gradientRadius, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
        break;
    }

    // Add color stops to gradient for non-fluid/soft styles
    if (gradient && gradientStyle !== 'fluid' && gradientStyle !== 'soft') {
      colorStops.forEach(stop => {
        gradient.addColorStop(stop.position, stop.color);
      });
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    // Draw effects if enabled
    if (state.gradientSettings.gitterIntensity > 0) {
      ctx.save();
      ctx.globalAlpha = state.gradientSettings.gitterIntensity / 100;
      ctx.globalCompositeOperation = 'overlay';
      const pattern = ctx.createPattern(createGitterPattern(ctx, 4), 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.restore();
    }

    if (state.gradientSettings.halftoneMode) {
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      const pattern = ctx.createPattern(createHalftonePattern(ctx, 4, 8), 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.restore();
    }

    // Draw track if enabled
    if (showTrack) {
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
    }

    // Draw color stops
    colorStops.forEach((stop, index) => {
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
    });

    rafRef.current = requestAnimationFrame(drawCanvas);
  }, [colorStops, isVertical, state.selectedColorIndex, hoverIndex, draggingIndex, state.canvasWidth, state.canvasHeight, gradientStyle, showTrack, state.handleSize, state.gradientSize, state.gradientSettings.gitterIntensity, state.gradientSettings.halftoneMode, backgroundColor]);

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Draw on changes
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

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

  // Event handlers
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const stopIndex = getColorStopAtPosition(x, y);
    if (stopIndex !== null) {
      setDraggingIndex(stopIndex);
      if (stopIndex !== -1) {
        dispatch({ type: 'SET_SELECTED_COLOR_INDEX', payload: stopIndex });
      }
      canvas.setPointerCapture(e.pointerId);
    } else {
      dispatch({ type: 'SET_SELECTED_COLOR_INDEX', payload: null });
    }
  }, [getColorStopAtPosition, dispatch]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    if (draggingIndex !== null) {
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

          newStops[draggingIndex] = {
            ...newStops[draggingIndex],
            position: Math.max(0, Math.min(1, position))
          };
        }

        if (onColorStopsChange) {
          onColorStopsChange(newStops);
        } else {
          dispatch({ type: 'SET_COLOR_STOPS', payload: newStops });
        }
      }
    } else {
      const hoveredIndex = getColorStopAtPosition(
        e.clientX - rect.left,
        e.clientY - rect.top
      );
      setHoverIndex(hoveredIndex);
    }
  }, [draggingIndex, colorStops, gradientStyle, isVertical, onColorStopsChange, dispatch, getColorStopAtPosition]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas && draggingIndex !== null) {
      canvas.releasePointerCapture(e.pointerId);
    }
    setDraggingIndex(null);
    if (draggingIndex !== -1) {
      dispatch({ type: 'SET_SELECTED_COLOR_INDEX', payload: null });
    }
  }, [draggingIndex, dispatch]);

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