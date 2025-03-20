'use client';

import { useState } from 'react';
import * as Slider from '@radix-ui/react-slider';
import * as Switch from '@radix-ui/react-switch';
import * as Label from '@radix-ui/react-label';
import * as Tooltip from '@radix-ui/react-tooltip';

interface EffectControlsProps {
  onWarpChange: (size: number, amount: number, type: 'wave' | 'ripple' | 'none') => void;
  onGrainChange: (amount: number) => void;
  onHidePhotoChange: (hidden: boolean) => void;
}

export function EffectControls({ onWarpChange, onGrainChange, onHidePhotoChange }: EffectControlsProps) {
  const [warpSize, setWarpSize] = useState(0.5);
  const [warpAmount, setWarpAmount] = useState(0.5);
  const [warpType, setWarpType] = useState<'wave' | 'ripple' | 'none'>('none');
  const [grainAmount, setGrainAmount] = useState(0);
  const [hidePhoto, setHidePhoto] = useState(false);

  const handleWarpSizeChange = (value: number[]) => {
    setWarpSize(value[0]);
    onWarpChange(value[0], warpAmount, warpType);
  };

  const handleWarpAmountChange = (value: number[]) => {
    setWarpAmount(value[0]);
    onWarpChange(warpSize, value[0], warpType);
  };

  const handleWarpTypeChange = (type: 'wave' | 'ripple' | 'none') => {
    setWarpType(type);
    onWarpChange(warpSize, warpAmount, type);
  };

  const handleGrainChange = (value: number[]) => {
    setGrainAmount(value[0]);
    onGrainChange(value[0]);
  };

  const handleHidePhotoChange = (checked: boolean) => {
    setHidePhoto(checked);
    onHidePhotoChange(checked);
  };

  return (
    <div className="space-y-6 p-4 bg-gray-800 rounded-lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label.Root className="text-sm font-medium text-gray-200">
            Hide Photo
          </Label.Root>
          <Switch.Root
            checked={hidePhoto}
            onCheckedChange={handleHidePhotoChange}
            className="relative h-6 w-11 rounded-full bg-gray-700 data-[state=checked]:bg-blue-500"
          >
            <Switch.Thumb className="block h-5 w-5 rounded-full bg-white shadow-lg transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-5" />
          </Switch.Root>
        </div>

        <div className="space-y-2">
          <Label.Root className="text-sm font-medium text-gray-200">
            Grain Amount
          </Label.Root>
          <Slider.Root
            value={[grainAmount]}
            onValueChange={handleGrainChange}
            max={1}
            step={0.01}
            className="relative flex items-center select-none touch-none w-full h-5"
          >
            <Slider.Track className="bg-gray-700 relative grow rounded-full h-2">
              <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
              <Slider.Thumb className="block w-4 h-4 bg-white shadow-lg rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </Slider.Track>
          </Slider.Root>
        </div>

        <div className="space-y-2">
          <Label.Root className="text-sm font-medium text-gray-200">
            Warp Effect
          </Label.Root>
          <div className="flex gap-2">
            <button
              onClick={() => handleWarpTypeChange('none')}
              className={`px-3 py-1 rounded text-sm ${
                warpType === 'none'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
              }`}
            >
              None
            </button>
            <button
              onClick={() => handleWarpTypeChange('wave')}
              className={`px-3 py-1 rounded text-sm ${
                warpType === 'wave'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
              }`}
            >
              Wave
            </button>
            <button
              onClick={() => handleWarpTypeChange('ripple')}
              className={`px-3 py-1 rounded text-sm ${
                warpType === 'ripple'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
              }`}
            >
              Ripple
            </button>
          </div>

          {warpType !== 'none' && (
            <>
              <div className="space-y-2">
                <Label.Root className="text-sm font-medium text-gray-200">
                  Warp Size
                </Label.Root>
                <Slider.Root
                  value={[warpSize]}
                  onValueChange={handleWarpSizeChange}
                  max={1}
                  step={0.01}
                  className="relative flex items-center select-none touch-none w-full h-5"
                >
                  <Slider.Track className="bg-gray-700 relative grow rounded-full h-2">
                    <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
                    <Slider.Thumb className="block w-4 h-4 bg-white shadow-lg rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </Slider.Track>
                </Slider.Root>
              </div>

              <div className="space-y-2">
                <Label.Root className="text-sm font-medium text-gray-200">
                  Warp Amount
                </Label.Root>
                <Slider.Root
                  value={[warpAmount]}
                  onValueChange={handleWarpAmountChange}
                  max={1}
                  step={0.01}
                  className="relative flex items-center select-none touch-none w-full h-5"
                >
                  <Slider.Track className="bg-gray-700 relative grow rounded-full h-2">
                    <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
                    <Slider.Thumb className="block w-4 h-4 bg-white shadow-lg rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </Slider.Track>
                </Slider.Root>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 