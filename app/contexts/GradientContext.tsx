'use client';

import { createContext, useContext, useReducer, ReactNode, useMemo, useState } from 'react';
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
  | { type: 'SET_DESIGN_SYSTEM'; payload: { primary: string; secondary: string; accent: string; background: string; text: string } };

const initialState: GradientState = {
  interface: 'discovery',
  extractedColors: [],
  selectedColor: null,
  selectedColorIndex: null,
  colorStops: [
    { id: '1', color: '#1C9488', position: 0 },
    { id: '2', color: '#2563EB', position: 1 }
  ],
  style: 'linear',
  colorFormat: 'hex',
  canvasWidth: 800,
  canvasHeight: 400,
  handleSize: 16,
  gradientSize: 100,
  gradientSettings: {
    texture: 'smooth',
    intensity: 0,
    gitterIntensity: 0,
    halftoneMode: false
  },
  designSystem: {
    primary: '#1C9488',
    secondary: '#164E63',
    accent: '#0EA5E9',
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

      // Automatically update design system when new colors are extracted
      const designSystem = {
        primary: colors[0] || state.designSystem.primary,
        secondary: colors[1] || state.designSystem.secondary,
        accent: colors[2] || state.designSystem.accent,
        background: colors[3] || state.designSystem.background,
        text: colors[4] || state.designSystem.text
      };
      
      // Create color stops from extracted colors
      const colorStops = colors.map((color, index) => ({
        id: index.toString(),
        color,
        position: index / Math.max(1, colors.length - 1)
      }));

      return {
        ...state,
        extractedColors: colors,
        designSystem,
        colorStops,
        selectedColor: colors[0] || null
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

    default:
      return state;
  }
}

const GradientContext = createContext<{
  state: GradientState;
  dispatch: React.Dispatch<GradientAction>;
} | null>(null);

export function useGradient() {
  const context = useContext(GradientContext);
  if (!context) {
    throw new Error('useGradient must be used within a GradientProvider');
  }
  return context;
}

export function GradientProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gradientReducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <GradientContext.Provider value={value}>
      {children}
    </GradientContext.Provider>
  );
}

export function useColorStops() {
  const { state } = useGradient();
  return state.colorStops;
}

export function useGradientError() {
  const [error, setError] = useState<string | null>(null);
  return { error, setError };
} 