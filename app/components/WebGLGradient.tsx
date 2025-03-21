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
    let gradient: CanvasGradient;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2;
    
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
          const x = stop.position * width;
          const y = height / 2 + Math.sin(index * Math.PI / 2) * (height / 4);
          const fluidGradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 0.8);
          fluidGradient.addColorStop(0, stop.color);
          fluidGradient.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = fluidGradient;
          ctx.beginPath();
          ctx.arc(x, y, radius * 0.8, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
        return;
      case 'soft':
        // Create a soft, blurred effect using multiple overlapping radial gradients
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        colorStops.forEach((stop, index) => {
          const x = stop.position * width;
          const y = height / 2;
          const softGradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.2);
          softGradient.addColorStop(0, stop.color);
          softGradient.addColorStop(0.5, `${stop.color}80`);
          softGradient.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = softGradient;
          ctx.beginPath();
          ctx.arc(x, y, radius * 1.2, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
        return;
    }

    // Add color stops to gradient
    colorStops.forEach(stop => {
      gradient.addColorStop(stop.position, stop.color);
    });

    // Fill gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw color stop handles
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
        case 'soft': {
          // Calculate position based on both x and y
          const verticalOffset = (stop.position - Math.floor(stop.position)) * height;
          x = (Math.floor(stop.position) * width) % width;
          y = height / 2 + verticalOffset;
          break;
        }
      }

      // Draw handle with hover and active states
      const isHovered = index === hoverIndex;
      const isActive = index === draggingIndex;
      const size = isActive ? 18 : isHovered ? 15 : 12;

      ctx.save();
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
  }, [colorStops, gradientStyle, hoverIndex, draggingIndex]);

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
      case 'soft': {
        // For fluid and soft styles, we'll use both x and y coordinates
        // x determines the horizontal position (0-1)
        // y determines the vertical offset from center (-0.5 to 0.5)
        const verticalOffset = (y - 0.5) * 2; // Convert 0-1 to -1 to 1
        return x + verticalOffset * 0.1; // Add a small vertical influence to the position
      }
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
      const newPosition = Math.max(0, Math.min(1, calculatePosition(x, y)));

      const newStops = [...colorStops];
      newStops[draggingIndex] = {
        ...newStops[draggingIndex],
        position: newPosition
      };

      newStops.sort((a, b) => a.position - b.position);
      onColorStopsChange(newStops);
    } else {
      const hoveredIndex = findClosestColorStop(calculatePosition(x, y), colorStops);
      setHoverIndex(hoveredIndex);
    }
  }, [isDragging, draggingIndex, colorStops, onColorStopsChange, calculatePosition]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const clickedIndex = findClosestColorStop(calculatePosition(x, y), colorStops);

    if (clickedIndex !== null) {
      setDraggingIndex(clickedIndex);
      setIsDragging(true);
      canvas.setPointerCapture(e.pointerId);
    }
  }, [colorStops, calculatePosition]);

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

function findClosestColorStop(x: number, colorStops: ColorStop[]): number | null {
  let closestIndex = 0;
  let minDistance = Infinity;

  colorStops.forEach((stop, index) => {
    const distance = Math.abs(stop.position - x);
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = index;
    }
  });

  return minDistance < 0.05 ? closestIndex : null;
} 