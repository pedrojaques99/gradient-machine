'use client';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '@/app/components/ui/button';
import { ColorPicker } from './color-picker';
import { ColorStop } from '@/app/lib/utils/colors';
import { useCallback, useState, useEffect, memo } from 'react';

interface ColorStopItemProps {
  stop: ColorStop;
  index: number;
  updateColorAtIndex: (index: number, color: string) => void;
  removeColorStop: (index: number) => void;
  isSelected: boolean;
  onSelect: () => void;
}

// Memoized ColorStopItem component
const ColorStopItem = memo(function ColorStopItem({ 
  stop, 
  index, 
  updateColorAtIndex, 
  removeColorStop,
  isSelected,
  onSelect
}: ColorStopItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: stop.id,
    data: {
      index,
      stop,
    }
  });

  const style = {
    transform: transform ? `tranzinc3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.8 : 1,
  };

  const handleColorChange = useCallback((color: string) => {
    updateColorAtIndex(index, color);
  }, [index, updateColorAtIndex]);

  const handleRemove = useCallback(() => {
    removeColorStop(index);
  }, [index, removeColorStop]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        space-y-2 rounded-lg
        transition-colors duration-200
        ${isDragging ? 'bg-muted/50 shadow-lg' : ''}
      `}
    >
      <div 
        className={`
          group flex gap-2 p-2 rounded-md
          transition-all duration-200 ease-out
          ${isSelected ? 'bg-muted shadow-sm' : 'hover:bg-muted/50'}
          ${isDragging ? 'cursor-grabbing' : ''}
        `}
        onClick={onSelect}
      >
        <button
          type="button"
          className={`
            flex-shrink-0 text-muted-foreground/30
            transition-colors duration-200
            ${isDragging ? 'cursor-grabbing' : 'cursor-grab hover:text-muted-foreground/50'}
          `}
          {...attributes}
          {...listeners}
        >
          <svg width="8" height="24" viewBox="0 0 8 24" fill="none">
            <rect x="1" y="7" width="6" height="2" rx="1" fill="currentColor"/>
            <rect x="1" y="11" width="6" height="2" rx="1" fill="currentColor"/>
            <rect x="1" y="15" width="6" height="2" rx="1" fill="currentColor"/>
          </svg>
        </button>
        
        <div className="flex-1 flex items-center gap-2">
          <div
            className={`
              w-8 h-8 rounded-md border border-border/50 shadow-sm
              transition-transform duration-200
              ${isDragging ? 'scale-95' : 'hover:scale-105'}
            `}
            style={{ backgroundColor: stop.color }}
          />
          <input
            type="text"
            className={`
              bg-transparent w-24 font-mono text-sm px-2 py-1 rounded
              border border-transparent focus:border-border/50 focus:outline-none
              transition-colors duration-200
              ${isDragging ? 'opacity-50' : ''}
            `}
            value={(stop.color || '#000000').replace('#', '').toUpperCase()}
            onChange={(e) => {
              const value = e.target.value;
              if (/^[0-9A-Fa-f]{6}$/.test(value)) {
                handleColorChange('#' + value);
              }
            }}
          />
          {stop.position > 0 && stop.position < 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`
                h-8 w-8 opacity-0 group-hover:opacity-100
                transition-all duration-200
                hover:bg-zinc/[2.5%] dark:hover:bg-white/[2.5%]
                hover:text-zinc-700 dark:hover:text-zinc-200
                ${isDragging ? 'pointer-events-none' : ''}
              `}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleRemove();
              }}
            >
              <svg 
                className="size-4" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </Button>
          )}
        </div>
      </div>
      {isSelected && !isDragging && (
        <div className="pl-6">
          <ColorPicker 
            color={stop.color} 
            onChange={handleColorChange}
          />
        </div>
      )}
    </div>
  );
});

ColorStopItem.displayName = 'ColorStopItem';

interface ColorStopListProps {
  colorStops: ColorStop[];
  onColorStopsChange: (newStops: ColorStop[]) => void;
  updateColorAtIndex: (index: number, color: string) => void;
  removeColorStop: (index: number) => void;
  onColorStopSelect: (index: number | null) => void;
  selectedColorIndex: number | null;
}

export const ColorStopList = memo(function ColorStopList({ 
  colorStops, 
  onColorStopsChange,
  updateColorAtIndex,
  removeColorStop,
  onColorStopSelect,
  selectedColorIndex
}: ColorStopListProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = Number(active.id);
      const newIndex = Number(over.id);
      
      if (isNaN(oldIndex) || isNaN(newIndex)) {
        return;
      }

      const newStops = [...colorStops];
      const [movedItem] = newStops.splice(oldIndex, 1);
      newStops.splice(newIndex, 0, movedItem);
      onColorStopsChange(newStops);
    }
  }, [colorStops, onColorStopsChange]);

  if (!Array.isArray(colorStops) || !mounted) {
    return null;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={colorStops.map(stop => stop.id)}
        strategy={verticalListSortingStrategy}
      >
        {colorStops.map((stop, index) => (
          <ColorStopItem
            key={stop.id}
            stop={stop}
            index={index}
            updateColorAtIndex={updateColorAtIndex}
            removeColorStop={removeColorStop}
            isSelected={selectedColorIndex === index}
            onSelect={() => onColorStopSelect(index === selectedColorIndex ? null : index)}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
});

ColorStopList.displayName = 'ColorStopList'; 