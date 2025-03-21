import { memo, useCallback } from 'react';
import { ColorStop } from '../lib/utils/colors';

interface ColorStopTrackProps {
  colorStops: ColorStop[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

const ColorStopHandle = memo(function ColorStopHandle({ 
  stop, 
  index, 
  isSelected, 
  onSelect 
}: { 
  stop: ColorStop; 
  index: number; 
  isSelected: boolean; 
  onSelect: (index: number) => void;
}) {
  return (
    <div
      className="absolute -translate-x-1/2 group"
      style={{ left: `${stop.position * 100}%` }}
    >
      <div
        className={`
          w-4 h-4 rounded-full cursor-pointer 
          ring-2 ring-white shadow-lg 
          transition-all duration-150 ease-out
          hover:scale-110 hover:ring-offset-2 hover:ring-offset-background
          ${isSelected ? 'scale-125 ring-primary' : 'scale-100'}
        `}
        style={{ backgroundColor: stop.color }}
        onClick={() => onSelect(index)}
      />
      <div className="
        absolute -bottom-6 left-1/2 -translate-x-1/2 
        opacity-0 group-hover:opacity-100 
        transition-opacity duration-200
        text-xs font-medium text-muted-foreground
      ">
        {stop.color.toUpperCase()}
      </div>
    </div>
  );
});

export const ColorStopTrack = memo(function ColorStopTrack({ 
  colorStops, 
  selectedIndex, 
  onSelect 
}: ColorStopTrackProps) {
  const handleSelect = useCallback((index: number) => {
    onSelect(index);
  }, [onSelect]);

  return (
    <div className="relative h-12 px-4 bg-background/50">
      <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-muted-foreground/20 rounded-full" />
      <div className="absolute inset-x-4 top-1/2 -translate-y-1/2">
        {colorStops.map((stop, index) => (
          <ColorStopHandle
            key={stop.id}
            stop={stop}
            index={index}
            isSelected={selectedIndex === index}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}); 