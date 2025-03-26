'use client';

import { createContext, useContext, useReducer, ReactNode, useMemo, useState, useCallback } from 'react';
import { ColorStop, GradientStyle } from '@/app/lib/utils/colors';

interface GradientState {
  interface: 'discovery' | 'ecosystem' | 'gradient-studio';
  extractedColors: string[];
  selectedColor: string | null;
  selectedColorIndex: number | null;
  colorStops: ColorStop[];
  style: GradientStyle;
  colorFormat: 'rgb' | 'hsl' | 'hex';
  canvasWidth: number;
  canvasHeight: number;
  handleSize: number;
  gradientSize: number;
  maxColors: number;
  gradients: string[];
  gradientSettings: {
    texture: string;
    intensity: number;
    gitterIntensity: number;
    halftoneMode: boolean;
  };
  designSystem: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}

type GradientAction =
  | { type: 'SET_INTERFACE'; payload: 'discovery' | 'ecosystem' | 'gradient-studio' }
  | { type: 'SET_EXTRACTED_COLORS'; payload: string[] }
  | { type: 'SET_SELECTED_COLOR'; payload: string | null }
  | { type: 'SET_SELECTED_COLOR_INDEX'; payload: number | null }
  | { type: 'SET_COLOR_STOPS'; payload: ColorStop[] }
  | { type: 'SET_STYLE'; payload: GradientStyle }
  | { type: 'SET_COLOR_FORMAT'; payload: 'rgb' | 'hsl' | 'hex' }
  | { type: 'UPDATE_GRADIENT_SETTINGS'; payload: Partial<GradientState['gradientSettings']> }
  | { type: 'SET_GITTER_INTENSITY'; payload: number }
  | { type: 'SET_HALFTONE_MODE'; payload: boolean }
  | { type: 'UPDATE_DESIGN_SYSTEM'; payload: Partial<GradientState['designSystem']> }
  | { type: 'SET_CANVAS_SIZE'; payload: { width: number; height: number } }
  | { type: 'SET_HANDLE_SIZE'; payload: number }
  | { type: 'SET_GRADIENT_SIZE'; payload: number }
  | { type: 'SET_DESIGN_SYSTEM'; payload: { primary: string; secondary: string; accent: string; background: string; text: string } }
  | { type: 'REMOVE_COLOR'; payload: string }
  | { type: 'SET_MAX_COLORS'; payload: number }
  | { type: 'ADD_GRADIENT'; payload: string };

const initialState: GradientState = {
  interface: 'discovery',
  extractedColors: [],
  selectedColor: null,
  selectedColorIndex: null,
  colorStops: [
    { id: '1', color: '#bfff58', position: 0 },
    { id: '2', color: '#111111', position: 1 },
    { id: '3', color: '#d1d1d1', position: 2 },
    { id: '4', color: '#111111', position: 3 },
    { id: '5', color: '#CDDFAFFF', position: 4 },
    
  ],
  style: 'linear',
  colorFormat: 'hex',
  canvasWidth: 800,
  canvasHeight: 400,
  handleSize: 16,
  gradientSize: 100,
  maxColors: 10,
  gradients: [],
  gradientSettings: {
    texture: 'smooth',
    intensity: 0,
    gitterIntensity: 0,
    halftoneMode: false
  },
  designSystem: {
    primary: '#bfff58',
    secondary: '#111111',
    accent: '#bfff58',
    background: '#0F172A',
    text: '#F8FAFC'
  }
};

function gradientReducer(state: GradientState, action: GradientAction): GradientState {
  switch (action.type) {
    case 'SET_INTERFACE':
      return { ...state, interface: action.payload };
    
    case 'SET_EXTRACTED_COLORS': {
      const colors = action.payload;
      if (colors.length === 0) return state;

      // Ensure we don't exceed max colors
      const limitedColors = colors.slice(0, state.maxColors);

      // Automatically update design system when new colors are extracted
      const designSystem = {
        primary: limitedColors[0] || state.designSystem.primary,
        secondary: limitedColors[1] || state.designSystem.secondary,
        accent: limitedColors[2] || state.designSystem.accent,
        background: limitedColors[3] || state.designSystem.background,
        text: state.designSystem.text || '#FFFFFF'
      };
      
      // Create color stops from extracted colors
      const colorStops = limitedColors.map((color, index) => ({
        id: index.toString(),
        color,
        position: index / Math.max(1, limitedColors.length - 1)
      }));

      return {
        ...state,
        extractedColors: limitedColors,
        designSystem,
        colorStops,
        selectedColor: limitedColors[0] || null
      };
    }
    
    case 'SET_SELECTED_COLOR': {
      if (!action.payload) return { ...state, selectedColor: null };

      return {
        ...state,
        selectedColor: action.payload,
        colorStops: state.colorStops.map((stop, index) => 
          index === 0 ? { ...stop, color: action.payload! } : stop
        ),
        designSystem: {
          ...state.designSystem,
          primary: action.payload
        }
      };
    }

    case 'SET_SELECTED_COLOR_INDEX':
      return { ...state, selectedColorIndex: action.payload };

    case 'SET_COLOR_STOPS':
      return { ...state, colorStops: action.payload };

    case 'SET_STYLE':
      return { ...state, style: action.payload };

    case 'SET_COLOR_FORMAT':
      return { ...state, colorFormat: action.payload };

    case 'UPDATE_GRADIENT_SETTINGS':
      return {
        ...state,
        gradientSettings: { ...state.gradientSettings, ...action.payload }
      };

    case 'SET_GITTER_INTENSITY':
      return {
        ...state,
        gradientSettings: { ...state.gradientSettings, gitterIntensity: action.payload }
      };

    case 'SET_HALFTONE_MODE':
      return {
        ...state,
        gradientSettings: { ...state.gradientSettings, halftoneMode: action.payload }
      };

    case 'UPDATE_DESIGN_SYSTEM':
      return {
        ...state,
        designSystem: { ...state.designSystem, ...action.payload }
      };

    case 'SET_CANVAS_SIZE':
      return { 
        ...state, 
        canvasWidth: action.payload.width,
        canvasHeight: action.payload.height
      };
      
    case 'SET_HANDLE_SIZE':
      return { ...state, handleSize: action.payload };
      
    case 'SET_GRADIENT_SIZE':
      return { ...state, gradientSize: action.payload };

    case 'SET_DESIGN_SYSTEM':
      return {
        ...state,
        designSystem: action.payload
      };

    case 'REMOVE_COLOR': {
      const colorToRemove = action.payload;
      const newColors = state.extractedColors.filter(color => color !== colorToRemove);
      
      // Update design system
      const newDesignSystem = { ...state.designSystem };
      Object.entries(newDesignSystem).forEach(([key, value]) => {
        if (value === colorToRemove) {
          newDesignSystem[key as keyof typeof newDesignSystem] = '';
        }
      });

      // Update color stops
      const newColorStops = state.colorStops.filter(stop => stop.color !== colorToRemove);
      
      return {
        ...state,
        extractedColors: newColors,
        designSystem: newDesignSystem,
        colorStops: newColorStops,
        selectedColor: state.selectedColor === colorToRemove ? null : state.selectedColor
      };
    }

    case 'SET_MAX_COLORS':
      return {
        ...state,
        maxColors: action.payload
      };

    case 'ADD_GRADIENT':
      return {
        ...state,
        gradients: [...state.gradients, action.payload]
      };

    default:
      return state;
  }
}

const GradientContext = createContext<{
  state: GradientState;
  dispatch: React.Dispatch<GradientAction>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
} | null>(null);

const ColorStopsContext = createContext<ColorStop[] | null>(null);
const DesignSystemContext = createContext<{ primary: string; secondary: string; accent: string; background: string; text: string } | null>(null);
const GradientSettingsContext = createContext<{
  texture: string;
  intensity: number;
  gitterIntensity: number;
  halftoneMode: boolean;
} | null>(null);

export function GradientProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gradientReducer, initialState);
  const [error, setError] = useState<string | null>(null);

  // Memoize context values to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    state,
    dispatch,
    error,
    setError
  }), [state, error]);

  const colorStopsValue = useMemo(() => state.colorStops, [state.colorStops]);
  const designSystemValue = useMemo(() => state.designSystem, [state.designSystem]);
  const gradientSettingsValue = useMemo(() => state.gradientSettings, [state.gradientSettings]);

  return (
    <GradientContext.Provider value={contextValue}>
      <ColorStopsContext.Provider value={colorStopsValue}>
        <DesignSystemContext.Provider value={designSystemValue}>
          <GradientSettingsContext.Provider value={gradientSettingsValue}>
            {children}
          </GradientSettingsContext.Provider>
        </DesignSystemContext.Provider>
      </ColorStopsContext.Provider>
    </GradientContext.Provider>
  );
}

export function useGradient() {
  const context = useContext(GradientContext);
  if (!context) {
    throw new Error('useGradient must be used within a GradientProvider');
  }
  return context;
}

export function useColorStops() {
  const context = useContext(ColorStopsContext);
  if (!context) {
    throw new Error('useColorStops must be used within a GradientProvider');
  }
  return context;
}

export function useDesignSystem() {
  const context = useContext(DesignSystemContext);
  if (!context) {
    throw new Error('useDesignSystem must be used within a GradientProvider');
  }
  return context;
}

export function useGradientSettings() {
  const context = useContext(GradientSettingsContext);
  if (!context) {
    throw new Error('useGradientSettings must be used within a GradientProvider');
  }
  return context;
}

export function useGradientError() {
  const context = useContext(GradientContext);
  if (!context) {
    throw new Error('useGradientError must be used within a GradientProvider');
  }
  return {
    error: context.error,
    setError: context.setError
  };
} 