'use client';

import { motion } from 'framer-motion';
import { Card } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Slider } from '@/app/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Button } from '@/app/components/ui/button';
import { GradientCanvas } from '../shared/gradient-canvas';
import { useGradient } from '@/app/contexts/GradientContext';
import { useState, useEffect } from 'react';
import { ColorStop, GradientStyle } from '@/app/lib/utils/colors';
import { Download, FileJson, FileCode, FileImage } from 'lucide-react';

interface GradientSettings {
  style: GradientStyle;
  texture: 'smooth' | 'noise' | 'grain';
  intensity: number;
  backgroundColor: 'zinc' | 'white';
  size: number;
}

export function GradientStudio() {
  const { state, dispatch } = useGradient();
  const [settings, setSettings] = useState<GradientSettings>({
    style: state.style,
    texture: state.gradientSettings.texture as 'smooth' | 'noise' | 'grain',
    intensity: state.gradientSettings.intensity,
    backgroundColor: 'zinc',
    size: state.gradientSize
  });

  // Update gradient settings when they change
  useEffect(() => {
    dispatch({
      type: 'UPDATE_GRADIENT_SETTINGS',
      payload: {
        texture: settings.texture,
        intensity: settings.intensity
      }
    });
    dispatch({
      type: 'SET_STYLE',
      payload: settings.style
    });
  }, [settings, dispatch]);

  // Update texture effects based on settings
  useEffect(() => {
    switch (settings.texture) {
      case 'noise':
        dispatch({ type: 'SET_GITTER_INTENSITY', payload: settings.intensity * 100 });
        dispatch({ type: 'SET_HALFTONE_MODE', payload: false });
        break;
      case 'grain':
        dispatch({ type: 'SET_HALFTONE_MODE', payload: true });
        dispatch({ type: 'SET_GITTER_INTENSITY', payload: 0 });
        break;
      case 'smooth':
      default:
        dispatch({ type: 'SET_GITTER_INTENSITY', payload: 0 });
        dispatch({ type: 'SET_HALFTONE_MODE', payload: false });
    }
  }, [settings.texture, settings.intensity, dispatch]);

  const handleColorModeChange = (mode: string) => {
    dispatch({ 
      type: 'SET_COLOR_FORMAT', 
      payload: mode === 'rgb' ? 'rgb' : mode === 'hsl' ? 'hsl' : 'hex' 
    });
  };

  return (
    <Card className="p-3 sm:p-6 w-full">
      <div className="space-y-4 sm:space-y-6">
        <div className="h-[200px] sm:h-[300px] relative overflow-hidden rounded-lg bg-zinc-900">
          <GradientCanvas
            gradientStyle={settings.style}
            showTrack={true}
            showOrientationToggle={true}
            backgroundColor={settings.backgroundColor}
            gradientSize={settings.size}
            onColorStopsChange={(newStops: ColorStop[]) => 
              dispatch({ type: 'SET_COLOR_STOPS', payload: newStops })
            }
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label>Gradient Style</Label>
              <Select
                value={settings.style}
                onValueChange={(value: string) => setSettings(prev => ({ ...prev, style: value as GradientStyle }))}
              >
                <SelectTrigger className="mt-1.5 sm:mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="radial">Radial</SelectItem>
                  <SelectItem value="conic">Conic</SelectItem>
                  <SelectItem value="diagonal">Diagonal</SelectItem>
                  <SelectItem value="fluid">Fluid</SelectItem>
                  <SelectItem value="soft">Soft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Background</Label>
              <Select
                value={settings.backgroundColor}
                onValueChange={(value: string) => setSettings(prev => ({ ...prev, backgroundColor: value as 'zinc' | 'white' }))}
              >
                <SelectTrigger className="mt-1.5 sm:mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zinc">Zinc</SelectItem>
                  <SelectItem value="white">White</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Gradient Size</Label>
              <Slider
                value={[settings.size]}
                onValueChange={([value]: number[]) => {
                  setSettings(prev => ({ ...prev, size: value }));
                  dispatch({ type: 'SET_GRADIENT_SIZE', payload: value });
                }}
                min={50}
                max={200}
                step={1}
                className="mt-1.5 sm:mt-2"
              />
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label>Texture</Label>
              <Select
                value={settings.texture}
                onValueChange={(value: string) => setSettings(prev => ({ ...prev, texture: value as GradientSettings['texture'] }))}
              >
                <SelectTrigger className="mt-1.5 sm:mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="smooth">Smooth</SelectItem>
                  <SelectItem value="noise">Noise</SelectItem>
                  <SelectItem value="grain">Grain</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Intensity</Label>
              <Slider
                value={[settings.intensity]}
                onValueChange={([value]: number[]) => setSettings(prev => ({ ...prev, intensity: value }))}
                max={1}
                step={0.01}
                className="mt-1.5 sm:mt-2"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-4 sm:pt-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <Label className="text-base sm:text-lg font-semibold">Export</Label>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <Button
              variant="outline"
              className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-4 h-auto text-xs sm:text-sm"
              onClick={() => {
                const content = JSON.stringify({
                  colorStops: state.colorStops,
                  designSystem: state.designSystem,
                  gradientSettings: state.gradientSettings
                }, null, 2);
                const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'gradient-system.json';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }}
            >
              <FileJson className="w-4 h-4 sm:w-6 sm:h-6" />
              <span>JSON</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-4 h-auto text-xs sm:text-sm"
              onClick={() => {
                const gradientType = state.style === 'linear' ? 'linear-gradient(to right'
                  : state.style === 'radial' ? 'radial-gradient(circle'
                  : 'conic-gradient(from 0deg';
                const content = `:root {
  --primary: ${state.designSystem.primary};
  --secondary: ${state.designSystem.secondary};
  --accent: ${state.designSystem.accent};
  --background: ${state.designSystem.background};
  --text: ${state.designSystem.text};

  --gradient: ${gradientType}, ${state.colorStops.map(stop => 
    `${stop.color} ${stop.position * 100}%`).join(', ')});
}`;
                const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'gradient-system.css';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }}
            >
              <FileCode className="w-4 h-4 sm:w-6 sm:h-6" />
              <span>CSS</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-4 h-auto text-xs sm:text-sm"
              onClick={() => {
                const gradientId = 'gradient';
                const content = `<svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <${state.style}Gradient id="${gradientId}">
      ${state.colorStops.map(stop => 
        `<stop offset="${stop.position * 100}%" stop-color="${stop.color}" />`
      ).join('\n      ')}
    </${state.style}Gradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#${gradientId})" />
</svg>`;
                const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'gradient.svg';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }}
            >
              <FileImage className="w-4 h-4 sm:w-6 sm:h-6" />
              <span>SVG</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
} 