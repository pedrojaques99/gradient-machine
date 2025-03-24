import { memo, useCallback, useState } from 'react';
import { ColorStop } from '@/app/lib/utils/colors';
import { cn } from '@/app/lib/utils';
import { ColorPicker } from './color-picker';

interface ColorStopTrackProps {
  colorStops: ColorStop[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onColorChange?: (color: string, index: number) => void;
  className?: string;
}

const ColorStopHandle = memo(function ColorStopHandle({ 
  stop, 
  index, 
  isSelected, 
  onSelect,
  onColorChange
}: { 
  stop: ColorStop; 
  index: number; 
  isSelected: boolean; 
  onSelect: (index: number) => void;
  onColorChange?: (color: string, index: number) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div
      className="absolute -translate-x-1/2 group"
      style={{ left: `${stop.position * 100}%` }}
    >
      <div
        className={cn(
          "w-4 h-4 rounded-full cursor-pointer",
          "ring-2 ring-white shadow-lg",
          "transition-all duration-150 ease-out",
          "hover:scale-110 hover:ring-offset-2 hover:ring-offset-background",
          isSelected && "scale-125 ring-primary"
        )}
        style={{ backgroundColor: stop.color }}
        onClick={() => {
          onSelect(index);
          setShowPicker(true);
        }}
      />
      {showPicker && (
        <div className="absolute left-0 z-50 mt-2">
          <ColorPicker
            color={stop.color}
            onChange={(color) => onColorChange?.(color, index)}
            onClose={() => setShowPicker(false)}
          />
        </div>
      )}
      <div className={cn(
        "absolute -bottom-6 left-1/2 -translate-x-1/2",
        "opacity-0 group-hover:opacity-100",
        "transition-opacity duration-200",
        "text-xs font-medium text-muted-foreground"
      )}>
        {stop.color.toUpperCase()}
      </div>
    </div>
  );
});

export function ColorStopTrack({ 
  colorStops, 
  selectedIndex, 
  onSelect,
  onColorChange,
  className 
}: ColorStopTrackProps) {
  const handleSelect = useCallback((index: number) => {
    onSelect(index);
  }, [onSelect]);

  return (
    <div className={cn("relative h-12 px-4 bg-background/50", className)}>
      <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-muted-foreground/20 rounded-full" />
      <div className="absolute inset-x-4 top-1/2 -translate-y-1/2">
        {colorStops.map((stop, index) => (
          <ColorStopHandle
            key={stop.id}
            stop={stop}
            index={index}
            isSelected={selectedIndex === index}
            onSelect={handleSelect}
            onColorChange={onColorChange}
          />
        ))}
      </div>
    </div>
  );
} 