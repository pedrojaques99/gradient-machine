'use client';

import { useState, useRef } from 'react';
import ColorThief from 'color-thief-browser';
import { HexColorPicker } from 'react-colorful';
import { GradientCanvas } from './components/GradientCanvas';
import { WebGLGradient } from './components/WebGLGradient';
import { EffectControls } from './components/EffectControls';
import { ColorStop, GradientStyle, rgbToHex, hexToRgb, rgbToHsl, generateGradient } from './utils/colors';

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [colorStops, setColorStops] = useState<ColorStop[]>([]);
  const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(null);
  const [gradientStyle, setGradientStyle] = useState<GradientStyle>('linear');
  const [colorFormat, setColorFormat] = useState<'hex' | 'rgb' | 'hsl'>('hex');
  const [warpSize, setWarpSize] = useState(0.5);
  const [warpAmount, setWarpAmount] = useState(0.5);
  const [warpType, setWarpType] = useState<'wave' | 'ripple' | 'none'>('none');
  const [grainAmount, setGrainAmount] = useState(0);
  const [hidePhoto, setHidePhoto] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imgUrl = e.target?.result as string;
        setImage(imgUrl);
        // Extract colors after image loads
        const img = new Image();
        img.src = imgUrl;
        img.onload = () => {
          const colorThief = new ColorThief();
          const palette = colorThief.getPalette(img, 6);
          setColorStops(palette.map((color: [number, number, number], index) => ({
            color: `rgb(${color[0]}, ${color[1]}, ${color[2]})`,
            position: index / (palette.length - 1)
          })));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const updateColor = (newColor: string) => {
    if (selectedColorIndex !== null) {
      setColorStops(colorStops.map((stop, index) => 
        index === selectedColorIndex ? { ...stop, color: newColor } : stop
      ));
    }
  };

  const updateColorStopPosition = (index: number, position: number) => {
    setColorStops(colorStops.map((stop, i) => 
      i === index ? { ...stop, position } : stop
    ));
  };

  const formatColor = (color: string) => {
    const rgb = hexToRgb(color);
    switch (colorFormat) {
      case 'hex':
        return color;
      case 'rgb':
        return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
      case 'hsl':
        const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
        return `hsl(${Math.round(hsl[0])}, ${Math.round(hsl[1])}%, ${Math.round(hsl[2])}%)`;
      default:
        return color;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        <h1 className="text-3xl font-bold text-center text-white">Gradient Generator</h1>
        
        {/* Image Upload */}
        <div className="flex justify-center">
          <label className="cursor-pointer bg-gray-800 px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-gray-700">
            <span className="text-gray-200">Upload Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Image Display */}
        {image && !hidePhoto && (
          <div className="flex justify-center">
            <img
              ref={imageRef}
              src={image}
              alt="Uploaded"
              className="max-w-full h-auto rounded-lg shadow-lg"
            />
          </div>
        )}

        {/* Gradient Controls */}
        {colorStops.length > 0 && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-6 border border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Gradient Editor</h2>
              <select
                value={gradientStyle}
                onChange={(e) => setGradientStyle(e.target.value as GradientStyle)}
                className="px-3 py-1 rounded bg-gray-700 text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="linear">Linear</option>
                <option value="bezier">Bezier</option>
                <option value="sharp">Sharp</option>
                <option value="clean">Clean</option>
              </select>
            </div>

            {/* WebGL Gradient Preview */}
            <WebGLGradient
              colorStops={colorStops}
              style={gradientStyle}
              warpSize={warpSize}
              warpAmount={warpAmount}
              warpType={warpType}
              grainAmount={grainAmount}
            />

            {/* Color Stops */}
            <div className="flex flex-wrap gap-4">
              {colorStops.map((stop, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center gap-2"
                >
                  <div
                    className="w-12 h-12 rounded-full cursor-pointer border-2 transition-all"
                    style={{
                      backgroundColor: stop.color,
                      borderColor: selectedColorIndex === index ? '#3b82f6' : 'transparent'
                    }}
                    onClick={() => setSelectedColorIndex(index)}
                  />
                  {selectedColorIndex === index && (
                    <div className="absolute mt-16 z-10">
                      <HexColorPicker color={stop.color} onChange={updateColor} />
                    </div>
                  )}
                  <span className="text-sm text-gray-400">
                    {formatColor(stop.color)}
                  </span>
                </div>
              ))}
            </div>

            {/* Color Format Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Color Format:</span>
              <select
                value={colorFormat}
                onChange={(e) => setColorFormat(e.target.value as 'hex' | 'rgb' | 'hsl')}
                className="px-3 py-1 rounded bg-gray-700 text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="hex">HEX</option>
                <option value="rgb">RGB</option>
                <option value="hsl">HSL</option>
              </select>
            </div>
          </div>
        )}

        {/* Effect Controls */}
        {colorStops.length > 0 && (
          <EffectControls
            onWarpChange={(size, amount, type) => {
              setWarpSize(size);
              setWarpAmount(amount);
              setWarpType(type);
            }}
            onGrainChange={setGrainAmount}
            onHidePhotoChange={setHidePhoto}
          />
        )}
      </div>
    </div>
  );
}
