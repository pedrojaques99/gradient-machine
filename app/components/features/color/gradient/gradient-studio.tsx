'use client';

import { Card } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Slider } from '@/app/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Button } from '@/app/components/ui/button';
import { GradientCanvas } from '../shared/gradient-canvas';
import { useGradient } from '@/app/contexts/GradientContext';
import { useState, useEffect, memo, useCallback } from 'react';
import { ColorStop, GradientStyle } from '@/app/lib/utils/colors';
import { Download, FileJson, FileCode, FileImage, Wand2, RefreshCw } from 'lucide-react';
import { Input } from '@/app/components/ui/input';

interface GradientSettings {
  style: GradientStyle;
  texture: 'smooth' | 'noise' | 'grain';
  intensity: number;
  backgroundColor: string;
  size: number;
}

interface GradientControlsProps {
  settings: GradientSettings;
  onSettingsChange: (settings: GradientSettings) => void;
  onExport: (type: 'json' | 'css' | 'svg') => void;
  onRandomize: () => void;
}

// Separate control components for better performance
const GradientStyleControl = memo(({ value, onChange }: { 
  value: GradientStyle; 
  onChange: (value: GradientStyle) => void;
}) => (
  <div>
    <Label>Gradient Style</Label>
    <Select value={value} onValueChange={onChange}>
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
));

const BackgroundControl = memo(({ value, onChange }: { 
  value: string; 
  onChange: (value: string) => void;
}) => (
  <div>
    <Label>Background</Label>
    <div className="flex gap-2 mt-1.5 sm:mt-2">
    <div 
        className="w-9 h-9 rounded-md border border-input cursor-pointer"
        style={{ backgroundColor: value || '#000000' }}
      />
      <div className="flex-1 w-9">
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="h-9 w-30"
        />
      </div>
    </div>
  </div>
));

const SizeControl = memo(({ value, onChange }: { 
  value: number; 
  onChange: (value: number) => void;
}) => (
  <div className="w-80">
    <Label>Gradient Size</Label>
    <Slider
      value={[value]}
      onValueChange={([newValue]) => onChange(newValue)}
      min={50}
      max={200}
      step={1}
      className="mt-1.5 sm:mt-2"
    />
  </div>
));

const TextureControl = memo(({ value, onChange }: { 
  value: 'smooth' | 'noise' | 'grain'; 
  onChange: (value: 'smooth' | 'noise' | 'grain') => void;
}) => (
  <div>
    <Label>Texture</Label>
    <Select value={value} onValueChange={onChange}>
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
));

const IntensityControl = memo(({ value, onChange }: { 
  value: number; 
  onChange: (value: number) => void;
}) => (
  <div className="w-80">
    <Label>Intensity</Label>
    <Slider
      value={[value]}
      onValueChange={([newValue]) => onChange(newValue)}
      max={1}
      step={0.01}
      className="mt-1.5 sm:mt-2"
    />
  </div>
));

const ExportButtons = memo(({ onExport }: { onExport: (type: 'json' | 'css' | 'svg') => void }) => (
  <div className="grid grid-cols-3 gap-2 sm:gap-4">
    <Button
      variant="outline"
      className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-4 h-auto text-xs sm:text-sm"
      onClick={() => onExport('json')}
    >
      <FileJson className="w-4 h-4 sm:w-6 sm:h-6" />
      <span>JSON</span>
    </Button>
    <Button
      variant="outline"
      className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-4 h-auto text-xs sm:text-sm"
      onClick={() => onExport('css')}
    >
      <FileCode className="w-4 h-4 sm:w-6 sm:h-6" />
      <span>CSS</span>
    </Button>
    <Button
      variant="outline"
      className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-4 h-auto text-xs sm:text-sm"
      onClick={() => onExport('svg')}
    >
      <FileImage className="w-4 h-4 sm:w-6 sm:h-6" />
      <span>SVG</span>
    </Button>
  </div>
));

function GradientControls({ settings, onSettingsChange, onExport, onRandomize }: GradientControlsProps) {
  return (
    <Card className="p-3 sm:p-6 w-full">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-base sm:text-lg font-semibold">Gradient Controls</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={onRandomize}
            className="text-xs flex items-center gap-1.5 group"
          >
            <Wand2 className="w-3.5 h-3.5 group-hover:text-accent transition-colors" />
            <span>Random</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-3 sm:space-y-4">
            <GradientStyleControl
              value={settings.style}
              onChange={(value) => onSettingsChange({ ...settings, style: value })}
            />
            <BackgroundControl
              value={settings.backgroundColor}
              onChange={(value) => onSettingsChange({ ...settings, backgroundColor: value })}
            />
            <SizeControl
              value={settings.size}
              onChange={(value) => onSettingsChange({ ...settings, size: value })}
            />
          </div>

          <div className="space-y-3 sm:space-y-4">
            <TextureControl
              value={settings.texture}
              onChange={(value) => onSettingsChange({ ...settings, texture: value })}
            />
            <IntensityControl
              value={settings.intensity}
              onChange={(value) => onSettingsChange({ ...settings, intensity: value })}
            />
          </div>
        </div>

        <div className="border-t pt-4 sm:pt-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <Label className="text-base sm:text-lg font-semibold">Export</Label>
          </div>
          <ExportButtons onExport={onExport} />
        </div>
      </div>
    </Card>
  );
}

export function GradientStudio() {
  const { state, dispatch } = useGradient();
  const [settings, setSettings] = useState<GradientSettings>({
    style: state.style,
    texture: state.gradientSettings.texture as 'smooth' | 'noise' | 'grain',
    intensity: state.gradientSettings.intensity,
    backgroundColor: '#000000',
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

  // Add randomize function
  const handleRandomize = useCallback(() => {
    const styles: GradientStyle[] = ['linear', 'radial', 'conic', 'diagonal', 'fluid', 'soft'];
    const textures: ('smooth' | 'noise' | 'grain')[] = ['smooth', 'noise', 'grain'];
    
    // Get available colors from state
    const availableColors = [...state.extractedColors];
    
    // Generate 2-4 random color stops
    const numStops = Math.floor(Math.random() * 3) + 2; // 2 to 4 stops
    const newStops: ColorStop[] = [];
    
    for (let i = 0; i < numStops; i++) {
      // Get random color from available colors
      const randomIndex = Math.floor(Math.random() * availableColors.length);
      const color = availableColors[randomIndex];
      
      // Calculate position (ensure first is 0 and last is 1)
      let position;
      if (i === 0) position = 0;
      else if (i === numStops - 1) position = 1;
      else position = Math.random();
      
      newStops.push({ id: `stop-${i}`, color, position });
      
      // Remove used color to avoid duplicates
      availableColors.splice(randomIndex, 1);
      
      // Break if we run out of colors
      if (availableColors.length === 0) break;
    }
    
    // Sort stops by position
    newStops.sort((a, b) => a.position - b.position);
    
    // Update gradient settings
    const newSettings: GradientSettings = {
      ...settings,
      style: styles[Math.floor(Math.random() * styles.length)],
      texture: textures[Math.floor(Math.random() * textures.length)],
      intensity: Math.random() * 0.5 + 0.2, // Random intensity between 0.2 and 0.7
    };
    
    // Update state
    setSettings(newSettings);
    dispatch({ type: 'SET_COLOR_STOPS', payload: newStops });
  }, [state.extractedColors, settings, dispatch]);

  const handleExport = (type: 'json' | 'css' | 'svg') => {
    switch (type) {
      case 'json':
        const content = JSON.stringify({
          colorStops: state.colorStops,
          designSystem: state.designSystem,
          gradientSettings: state.gradientSettings
        }, null, 2);
        downloadFile(content, 'gradient-system.json', 'text/plain;charset=utf-8');
        break;
      case 'css':
        const gradientType = state.style === 'linear' ? 'linear-gradient(to right'
          : state.style === 'radial' ? 'radial-gradient(circle'
          : 'conic-gradient(from 0deg';
        const cssContent = `:root {
  --primary: ${state.designSystem.primary};
  --secondary: ${state.designSystem.secondary};
  --accent: ${state.designSystem.accent};
  --background: ${state.designSystem.background};
  --text: ${state.designSystem.text};

  --gradient: ${gradientType}, ${state.colorStops.map(stop => 
    `${stop.color} ${stop.position * 100}%`).join(', ')});
}`;
        downloadFile(cssContent, 'gradient-system.css', 'text/plain;charset=utf-8');
        break;
      case 'svg':
        const gradientId = 'gradient';
        const svgContent = `<svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <${state.style}Gradient id="${gradientId}">
      ${state.colorStops.map(stop => 
        `<stop offset="${stop.position * 100}%" stop-color="${stop.color}" />`
      ).join('\n      ')}
    </${state.style}Gradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#${gradientId})" />
</svg>`;
        downloadFile(svgContent, 'gradient.svg', 'text/plain;charset=utf-8');
        break;
    }
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="p-3 sm:p-6 w-full">
        <div className="h-[200px] sm:h-[300px] relative overflow-hidden rounded-lg"
          style={{ backgroundColor: settings.backgroundColor || '#000000' }}>
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
      </Card>

      <GradientControls
        settings={settings}
        onSettingsChange={setSettings}
        onExport={handleExport}
        onRandomize={handleRandomize}
      />
    </div>
  );
} 