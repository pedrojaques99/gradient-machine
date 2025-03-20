'use client';

import { useEffect, useRef, useState } from 'react';
import { ColorStop, GradientStyle } from '../utils/colors';

interface GradientCanvasProps {
  colorStops: ColorStop[];
  style: GradientStyle;
  onColorStopUpdate: (index: number, position: number) => void;
}

export function GradientCanvas({ colorStops, style, onColorStopUpdate }: GradientCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    colorStops.forEach(stop => {
      gradient.addColorStop(stop.position, stop.color);
    });

    // Draw gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw color stops
    colorStops.forEach((stop, index) => {
      const x = stop.position * canvas.width;
      ctx.beginPath();
      ctx.arc(x, canvas.height / 2, 8, 0, Math.PI * 2);
      ctx.fillStyle = stop.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [colorStops, style]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if click is near a color stop
    colorStops.forEach((stop, index) => {
      const stopX = stop.position * canvas.width;
      const distance = Math.sqrt(
        Math.pow(x - stopX, 2) + Math.pow(y - canvas.height / 2, 2)
      );

      if (distance < 8) {
        setDraggingIndex(index);
      }
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggingIndex === null) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / canvas.width));
    onColorStopUpdate(draggingIndex, x);
  };

  const handleMouseUp = () => {
    setDraggingIndex(null);
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-32 rounded-lg cursor-pointer"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
} 