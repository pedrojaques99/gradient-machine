'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { HexColorPicker } from 'react-colorful';
import { WebGLGradient } from './components/WebGLGradient';
import { UploadButton } from './components/UploadButton';
import { ColorStop, GradientStyle, rgbToHex, hexToRgb, rgbToHsl, generateGradient } from './lib/utils/colors';
import { Card } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Separator } from '@/app/components/ui/separator';
import { Button } from '@/app/components/ui/button';
import { Slider } from '@/app/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { useToast } from '@/app/components/ui/use-toast';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Sidebar, SidebarSection } from './components/ui/sidebar';
import { cn } from './lib/utils';
import ColorPicker from "@/app/components/ColorPicker";
import { ColorStopList } from './components/ColorStopList';
import { useGradient, useColorStops } from './contexts/GradientContext';
import { Toaster } from './components/ui/toaster';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gradientStyle, setGradientStyle] = useState<GradientStyle>('linear');
  const imageRef = useRef<HTMLImageElement>(null);
  const { toast } = useToast();
  const { state, dispatch } = useGradient();
  const colorStops = useColorStops();
  const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleImageUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imgUrl = e.target?.result as string;
        setImage(imgUrl);
        
        const img = new Image();
        img.src = imgUrl;
        img.crossOrigin = "anonymous";
        
        img.onload = async () => {
          const ColorThief = (await import('color-thief-browser')).default;
          const colorThief = new ColorThief();
          const palette = colorThief.getPalette(img, 6);
          dispatch({ type: 'SET_COLOR_STOPS', payload: palette.map((color: [number, number, number], index) => ({
            id: uuidv4(),
            color: rgbToHex(color[0], color[1], color[2]),
            position: index / (palette.length - 1)
          })) });
          setIsProcessing(false);
          toast({
            title: "Colors extracted",
            description: "Colors have been extracted from your image.",
          });
        };
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsProcessing(false);
      toast({
        title: "Error",
        description: "Failed to process image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleResetColors = useCallback(() => {
    if (colorStops.length <= 2) return;
    
    // Create a copy of color stops and shuffle them
    const shuffledStops = [...colorStops]
      .sort(() => Math.random() - 0.5)
      .map((stop, index) => ({
        ...stop,
        position: index / (colorStops.length - 1)
      }));
    
    dispatch({
      type: 'SET_COLOR_STOPS',
      payload: shuffledStops
    });
    
    toast({
      title: "Colors randomized",
      description: "Color stops have been randomly reordered.",
    });
  }, [colorStops, dispatch]);

  const updateColor = (newColor: string) => {
    if (selectedColorIndex !== null) {
      dispatch({
        type: 'UPDATE_COLOR_STOP',
        payload: {
          index: selectedColorIndex,
          stop: { ...colorStops[selectedColorIndex], color: newColor }
        }
      });
    }
  };

  const handleColorStopUpdate = useCallback((index: number, position: number) => {
    dispatch({
      type: 'UPDATE_COLOR_STOP',
      payload: {
        index,
        stop: { ...colorStops[index], position }
      }
    });
  }, [colorStops, dispatch]);

  const handleColorStopSelect = useCallback((index: number | null) => {
    setSelectedColorIndex(index);
  }, []);

  const handleGradientColorStopUpdate = useCallback((newStops: ColorStop[]) => {
    dispatch({
      type: 'SET_COLOR_STOPS',
      payload: newStops
    });
  }, [dispatch]);

  const addColorStop = useCallback(() => {
    const lastPosition = colorStops[colorStops.length - 1]?.position || 0;
    const newPosition = Math.min(1, lastPosition + 0.2);
    dispatch({
      type: 'ADD_COLOR_STOP',
      payload: { 
        id: uuidv4(),
        color: '#7961D3', 
        position: newPosition 
      }
    });
  }, [colorStops, dispatch]);

  const removeColorStop = useCallback((index: number) => {
    if (colorStops.length <= 2) return;
    dispatch({ type: 'REMOVE_COLOR_STOP', payload: index });
    if (selectedColorIndex === index) {
      setSelectedColorIndex(null);
    }
  }, [colorStops.length, selectedColorIndex, dispatch]);

  const updateColorAtIndex = useCallback((index: number, newColor: string) => {
    dispatch({
      type: 'UPDATE_COLOR_STOP',
      payload: {
        index,
        stop: { ...colorStops[index], color: newColor }
      }
    });
  }, [colorStops, dispatch]);

  return (
    <main className="min-h-screen flex bg-gradient-to-b from-background to-background/80">
      <Toaster />
      {/* Sidebar */}
      <Sidebar className="h-screen sticky top-0">
        {/* Colors Section */}
        <SidebarSection title="Colors">
          <div className="space-y-2 p-4 rounded-lg border border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(file);
                    }
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16.6667 6H7.33333C6.59695 6 6 6.59695 6 7.33333V16.6667C6 17.403 6.59695 18 7.33333 18H16.6667C17.403 18 18 17.403 18 16.6667V7.33333C18 6.59695 17.403 6 16.6667 6Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9.33333 10.6667C10.0697 10.6667 10.6667 10.0697 10.6667 9.33333C10.6667 8.59695 10.0697 8 9.33333 8C8.59695 8 8 8.59695 8 9.33333C8 10.0697 8.59695 10.6667 9.33333 10.6667Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17.9997 13.9998L14.6663 10.6665L7.33301 17.9998" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleResetColors}
                  disabled={colorStops.length <= 2}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.5 3V5.5H10M6 10.5H3.5V13" stroke="currentColor" strokeOpacity="0.9" strokeLinecap="round" strokeLinejoin="round"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M8 3.5C5.68343 3.5 3.77571 5.25044 3.52735 7.5008C3.49706 7.77528 3.27612 8 3 8C2.72384 8 2.4976 7.7754 2.52237 7.50037C2.7748 4.69694 5.13083 2.5 8 2.5C9.72916 2.5 11.272 3.29799 12.2802 4.54579C12.4539 4.76074 12.3902 5.07317 12.1603 5.22646C11.9306 5.37955 11.6224 5.31549 11.4447 5.10432C10.6192 4.12336 9.38239 3.5 8 3.5ZM3.83967 10.7735C3.60973 10.9268 3.54605 11.2393 3.71973 11.4542C4.72799 12.702 6.27079 13.5 8 13.5C10.8691 13.5 13.2252 11.3031 13.4776 8.49963C13.5024 8.2246 13.2761 8 13 8C12.7238 8 12.5029 8.22472 12.4726 8.4992C12.2242 10.7496 10.3165 12.5 8 12.5C6.61757 12.5 5.38075 11.8766 4.55528 10.8957C4.37758 10.6845 4.06931 10.6204 3.83967 10.7735Z" fill="currentColor" fillOpacity="0.9"/>
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={addColorStop}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.41268 7.5879L13.587 7.58736C13.815 7.58734 13.9999 7.77227 13.9997 8.00031C13.9996 8.2281 13.8148 8.41267 13.5871 8.41267H8.41152L8.41206 13.5876C8.41209 13.8154 8.22746 14 7.9997 14C7.77195 14 7.58733 13.8154 7.58733 13.5876V8.41209L2.4124 8.41262C2.18465 8.41265 2 8.22802 2 8.00026C2 7.77252 2.18462 7.5879 2.41236 7.5879H7.58791L7.58683 2.41304C7.58679 2.18498 7.77173 2.00013 7.99978 2.00029C8.22756 2.00045 8.41212 2.18513 8.41215 2.41291L8.41268 7.5879Z" fill="currentColor"/>
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeColorStop(colorStops.length - 1)}
                  disabled={colorStops.length <= 2}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 8H13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Button>
              </div>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(event) => {
                const { active, over } = event;
                if (over && active.id !== over.id) {
                  const oldIndex = colorStops.findIndex((stop) => stop.id === active.id);
                  const newIndex = colorStops.findIndex((stop) => stop.id === over.id);
                  const newStops = [...colorStops];
                  const [movedItem] = newStops.splice(oldIndex, 1);
                  newStops.splice(newIndex, 0, movedItem);
                  dispatch({
                    type: 'REORDER_COLOR_STOPS',
                    payload: newStops
                  });
                }
              }}
            >
              <SortableContext items={colorStops.map(stop => stop.id)} strategy={verticalListSortingStrategy}>
                <ColorStopList
                  colorStops={colorStops}
                  onColorStopsChange={(newStops) => dispatch({ type: 'SET_COLOR_STOPS', payload: newStops })}
                  updateColorAtIndex={updateColorAtIndex}
                  removeColorStop={removeColorStop}
                  onColorStopSelect={handleColorStopSelect}
                  selectedColorIndex={selectedColorIndex}
                />
              </SortableContext>
            </DndContext>
          </div>
        </SidebarSection>

        {/* Style Controls */}
        <SidebarSection title="Style">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={gradientStyle === 'linear' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGradientStyle('linear')}
            >
              Linear
            </Button>
            <Button
              variant={gradientStyle === 'radial' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGradientStyle('radial')}
            >
              Radial
            </Button>
            <Button
              variant={gradientStyle === 'conic' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGradientStyle('conic')}
            >
              Conic
            </Button>
            <Button
              variant={gradientStyle === 'diagonal' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGradientStyle('diagonal')}
            >
              Diagonal
            </Button>
            <Button
              variant={gradientStyle === 'fluid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGradientStyle('fluid')}
            >
              Fluid
            </Button>
            <Button
              variant={gradientStyle === 'soft' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGradientStyle('soft')}
            >
              Soft
            </Button>
          </div>
        </SidebarSection>

        {/* Selected Color */}
        {selectedColorIndex !== null && (
          <SidebarSection title="Selected Color">
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-lg shadow-inner border border-border/50"
                style={{ backgroundColor: colorStops[selectedColorIndex].color }}
              />
              <code className="text-sm font-mono">
                {colorStops[selectedColorIndex].color}
              </code>
            </div>
            <div className="mt-4">
              <ColorPicker
                default_value={colorStops[selectedColorIndex].color}
                onChange={updateColor}
              />
            </div>
          </SidebarSection>
        )}
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 ml-[320px]">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">Gradient Generator</h1>
            <UploadButton
              onUpload={handleImageUpload}
              isLoading={isProcessing}
            />
          </div>

          {/* Gradient Preview */}
          <div className="space-y-6">
            <WebGLGradient
              colorStops={colorStops}
              gradientStyle={gradientStyle}
              onColorStopsChange={handleGradientColorStopUpdate}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
