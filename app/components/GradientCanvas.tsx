'use client';

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { Button } from './ui/button';
import { RotateCw } from 'lucide-react';
import { useColorStops, useGradient, useGradientError } from '../contexts/GradientContext';
import { CANVAS, COLOR_STOP } from '../lib/constants';
import { cn } from '../lib/utils';
import { ColorStop } from '../lib/utils/colors';

// Orientation toggle button component
const OrientationButton = memo(({ isVertical, onToggle }: { 
  isVertical: boolean; 
  onToggle: () => void;
}) => (
  <Button
    variant="outline"
    size="icon"
    onClick={onToggle}
    className="self-end hover:bg-primary/5"
    title={`Switch to ${isVertical ? 'horizontal' : 'vertical'} orientation`}
  >
    <RotateCw 
      className={cn(
        "h-4 w-4 transition-transform duration-200 ease-out",
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

// Canvas drawing utilities
const drawGradient = (ctx: CanvasRenderingContext2D, width: number, height: number, colorStops: ColorStop[], isVertical: boolean) => {
  const gradient = ctx.createLinearGradient(
    0, 0,
    isVertical ? 0 : width,
    isVertical ? height : 0
  );
  colorStops.forEach(stop => gradient.addColorStop(stop.position, stop.color));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
};

const drawTrack = (ctx: CanvasRenderingContext2D, width: number, height: number, isVertical: boolean) => {
  const { TRACK } = COLOR_STOP;
  const trackY = isVertical ? TRACK.PADDING : height - COLOR_STOP.SIZE.DEFAULT - TRACK.HEIGHT;
  const trackX = isVertical ? width - COLOR_STOP.SIZE.DEFAULT - TRACK.HEIGHT : TRACK.PADDING;

  ctx.fillStyle = `rgba(0, 0, 0, ${TRACK.OPACITY})`;
  if (isVertical) {
    ctx.roundRect(trackX, TRACK.PADDING, TRACK.HEIGHT, height - TRACK.PADDING * 2, TRACK.HEIGHT / 2);
  } else {
    ctx.roundRect(TRACK.PADDING, trackY, width - TRACK.PADDING * 2, TRACK.HEIGHT, TRACK.HEIGHT / 2);
  }
  ctx.fill();
};

export function GradientCanvas() {
  const colorStops = useColorStops();
  const { state, dispatch } = useGradient();
  const { setError } = useGradientError();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isVertical, setIsVertical] = useState(false);
  const rafRef = useRef<number | undefined>(undefined);

  // Initialize canvas size once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size with device pixel ratio
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

  // Drawing function
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = state.canvasWidth;
    const height = state.canvasHeight;
    const { SIZE, BORDER, TRACK, GUIDE_LINE } = COLOR_STOP;

    // Clear with device pixel ratio consideration
    ctx.clearRect(0, 0, width, height);

    // Create and draw gradient
    const gradient = isVertical
      ? ctx.createLinearGradient(0, 0, 0, height)
      : ctx.createLinearGradient(0, 0, width, 0);

    // Add color stops
    colorStops.forEach(stop => {
      gradient.addColorStop(stop.position, stop.color);
    });

    // Fill gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw track with rounded corners
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

    // Draw color stops
    colorStops.forEach((stop, index) => {
      const position = stop.position;
      const x = isVertical 
        ? width - SIZE.DEFAULT - TRACK.HEIGHT / 2 
        : TRACK.PADDING + position * (width - TRACK.PADDING * 2);
      const y = isVertical 
        ? TRACK.PADDING + position * (height - TRACK.PADDING * 2)
        : height - SIZE.DEFAULT - TRACK.HEIGHT / 2;
      
      const isSelected = index === state.selectedColorIndex;
      const isHovered = index === hoverIndex;
      const isDragging = index === draggingIndex;
      const scale = isDragging ? SIZE.ACTIVE / SIZE.DEFAULT : 
                   isHovered ? SIZE.HOVER / SIZE.DEFAULT : 1;

      // Draw guide line for selected stop
      if (isSelected) {
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

      // Draw stop handle with shadow
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
  }, [colorStops, isVertical, state.selectedColorIndex, hoverIndex, draggingIndex, state.canvasWidth, state.canvasHeight]);

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Draw on color stops or orientation change
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Optimized position calculation
  const getColorStopAtPosition = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const width = state.canvasWidth;
    const height = state.canvasHeight;
    const { SIZE, TRACK } = COLOR_STOP;
    
    for (let i = 0; i < colorStops.length; i++) {
      const position = colorStops[i].position;
      const stopX = isVertical ? TRACK.PADDING + position * (width - TRACK.PADDING * 2) : TRACK.PADDING;
      const stopY = isVertical ? TRACK.PADDING + position * (height - TRACK.PADDING * 2) : TRACK.PADDING;
      
      const distance = Math.sqrt(
        Math.pow(x - stopX, 2) + Math.pow(y - stopY, 2)
      );

      if (distance < SIZE.DEFAULT) {
        return i;
      }
    }
    return null;
  }, [colorStops, isVertical, state.canvasWidth, state.canvasHeight]);

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
      dispatch({ type: 'SET_SELECTED_COLOR', payload: stopIndex });
      canvas.setPointerCapture(e.pointerId);
    } else {
      dispatch({ type: 'SET_SELECTED_COLOR', payload: null });
    }
  }, [getColorStopAtPosition, dispatch]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (draggingIndex !== null) {
      const width = state.canvasWidth;
      const height = state.canvasHeight;
      const { TRACK } = COLOR_STOP;

      const newPosition = isVertical
        ? Math.max(0, Math.min(1, (y - TRACK.PADDING) / (height - TRACK.PADDING * 2)))
        : Math.max(0, Math.min(1, (x - TRACK.PADDING) / (width - TRACK.PADDING * 2)));
      
      dispatch({
        type: 'UPDATE_COLOR_STOP',
        payload: {
          index: draggingIndex,
          stop: { ...colorStops[draggingIndex], position: newPosition }
        }
      });
    } else {
      const stopIndex = getColorStopAtPosition(x, y);
      setHoverIndex(stopIndex);
    }
  }, [draggingIndex, isVertical, dispatch, colorStops, getColorStopAtPosition, state.canvasWidth, state.canvasHeight]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas && draggingIndex !== null) {
      canvas.releasePointerCapture(e.pointerId);
    }
    setDraggingIndex(null);
  }, [draggingIndex]);

  const toggleOrientation = useCallback(() => {
    setIsVertical(prev => !prev);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <canvas
        ref={canvasRef}
        className={cn(
          "w-full rounded-lg shadow-sm touch-none select-none",
          "transition-shadow duration-200",
          "hover:shadow-md",
          draggingIndex !== null && "cursor-grabbing",
          hoverIndex !== null && "cursor-grab"
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      <OrientationButton isVertical={isVertical} onToggle={toggleOrientation} />
    </div>
  );
}