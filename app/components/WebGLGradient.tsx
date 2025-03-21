'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useGradient } from '../contexts/GradientContext';
import { ColorStop, GradientStyle } from '../lib/utils/colors';
import { ColorStopTrack } from './ColorStopTrack';

interface WebGLGradientProps {
  colorStops: ColorStop[];
  gradientStyle: GradientStyle;
  onColorStopsChange: (stops: ColorStop[]) => void;
}

export function WebGLGradient({ colorStops, gradientStyle, onColorStopsChange }: WebGLGradientProps) {
  const { state, dispatch } = useGradient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const rafRef = useRef<number | undefined>(undefined);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, []);

  // Render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Create gradient based on style
    let gradient: CanvasGradient | undefined;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 * (state.gradientSize / 100); // Scale with gradient size
    
    // First, draw the base gradient or effects
    switch (gradientStyle as GradientStyle) {
      case 'linear':
        gradient = ctx.createLinearGradient(0, 0, width, 0);
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
        // Create a liquid-like effect using multiple overlapping radial gradients
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
        // Create a soft, blurred effect using multiple overlapping radial gradients
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

    // Draw gitter texture if enabled
    if (state.gitterIntensity > 0) {
      ctx.save();
      ctx.globalAlpha = state.gitterIntensity / 100;
      ctx.globalCompositeOperation = 'overlay';
      
      // Create gitter pattern
      const patternSize = 4;
      const pattern = ctx.createPattern(
        createGitterPattern(ctx, patternSize),
        'repeat'
      );
      
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.restore();
    }

    // Draw halftone effect if enabled
    if (state.halftoneEnabled) {
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      
      // Create halftone pattern
      const dotSize = 4;
      const spacing = 8;
      const pattern = ctx.createPattern(
        createHalftonePattern(ctx, dotSize, spacing),
        'repeat'
      );
      
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.restore();
    }

    // Draw color stop handles on top of everything
    colorStops.forEach((stop, index) => {
      let x, y;
      switch (gradientStyle as GradientStyle) {
        case 'linear':
          x = stop.position * width;
          y = height - 24;
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
          x = (stop.x ?? stop.position) * width;
          y = (stop.y ?? 0.5) * height;
          break;
        case 'soft':
          x = (stop.x ?? stop.position) * width;
          y = (stop.y ?? 0.5) * height;
          break;
      }

      // Draw handle with enhanced visibility
      const isHovered = index === hoverIndex;
      const isActive = index === draggingIndex;
      const baseSize = state.handleSize;
      const size = isActive ? baseSize * 1.5 : isHovered ? baseSize * 1.25 : baseSize;

      ctx.save();
      // Draw white background circle
      ctx.beginPath();
      ctx.arc(x, y, size / 2 + 2, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
      
      // Draw main handle
      ctx.beginPath();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 2;
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = stop.color;
      ctx.fill();
      ctx.strokeStyle = isHovered || isActive ? '#fff' : 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = isActive ? 3 : 2;
      ctx.stroke();
      ctx.restore();
    });

    rafRef.current = requestAnimationFrame(render);
  }, [colorStops, gradientStyle, hoverIndex, draggingIndex, state.handleSize, state.gradientSize, state.gitterIntensity, state.halftoneEnabled]);

  // Start/cleanup render loop
  useEffect(() => {
    render();
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [render]);

  const calculatePosition = useCallback((x: number, y: number) => {
    switch (gradientStyle as GradientStyle) {
      case 'linear':
        return x;
      case 'radial':
        return y;
      case 'conic': {
        const centerX = 0.5;
        const centerY = 0.5;
        const angle = Math.atan2(y - centerY, x - centerX);
        return ((angle + Math.PI * 1.5) % (Math.PI * 2)) / (Math.PI * 2);
      }
      case 'diagonal':
        return (x + y) / 2;
      case 'fluid':
      case 'soft':
        return { x, y };
      default:
        return x;
    }
  }, [gradientStyle]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    if (isDragging && draggingIndex !== null) {
      const newPosition = calculatePosition(x, y);
      const newStops = [...colorStops];

      if (gradientStyle === 'fluid' || gradientStyle === 'soft') {
        // For fluid and soft styles, store x and y positions
        newStops[draggingIndex] = {
          ...newStops[draggingIndex],
          x: Math.max(0, Math.min(1, x)),
          y: Math.max(0, Math.min(1, y))
        };
      } else {
        // For other styles, use the position as before
        newStops[draggingIndex] = {
          ...newStops[draggingIndex],
          position: Math.max(0, Math.min(1, newPosition as number))
        };
      }

      onColorStopsChange(newStops);
    } else {
      const hoveredIndex = findClosestColorStop(calculatePosition(x, y), colorStops, gradientStyle);
      setHoverIndex(hoveredIndex);
    }
  }, [isDragging, draggingIndex, colorStops, onColorStopsChange, calculatePosition, gradientStyle]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const clickedIndex = findClosestColorStop(calculatePosition(x, y), colorStops, gradientStyle);

    if (clickedIndex !== null) {
      setDraggingIndex(clickedIndex);
      setIsDragging(true);
      canvas.setPointerCapture(e.pointerId);
    }
  }, [colorStops, calculatePosition, gradientStyle]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas && draggingIndex !== null) {
      canvas.releasePointerCapture(e.pointerId);
    }
    setDraggingIndex(null);
    setIsDragging(false);
  }, [draggingIndex]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-background/10 backdrop-blur-sm border border-border/50 transition-shadow duration-200 hover:shadow-lg">
      <canvas
        ref={canvasRef}
        className={`
          w-full aspect-[3/2] rounded-t-xl
          transition-all duration-200
          ${isDragging ? 'cursor-grabbing' : hoverIndex !== null ? 'cursor-grab' : 'cursor-default'}
        `}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: 'none' }}
      />
      <ColorStopTrack 
        colorStops={colorStops}
        selectedIndex={state.selectedColorIndex}
        onSelect={(index: number) => dispatch({ type: 'SET_SELECTED_COLOR', payload: index })}
      />
    </div>
  );
}

function findClosestColorStop(pos: number | { x: number; y: number }, colorStops: ColorStop[], gradientStyle: GradientStyle): number | null {
  let closestIndex = 0;
  let minDistance = Infinity;

  colorStops.forEach((stop, index) => {
    let distance;
    if (gradientStyle === 'fluid' || gradientStyle === 'soft') {
      const x = stop.x ?? stop.position;
      const y = stop.y ?? 0.5;
      const posX = (pos as { x: number; y: number }).x;
      const posY = (pos as { x: number; y: number }).y;
      distance = Math.sqrt(Math.pow(x - posX, 2) + Math.pow(y - posY, 2));
    } else {
      distance = Math.abs(stop.position - (pos as number));
    }
    
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = index;
    }
  });

  return minDistance < 0.08 ? closestIndex : null;
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