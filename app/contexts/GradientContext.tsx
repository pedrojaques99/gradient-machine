'use client';

import { createContext, useContext, useReducer, ReactNode, useCallback, useMemo } from 'react';
import { ColorStop, GradientStyle } from '../lib/utils/colors';
import { v4 as uuidv4 } from 'uuid';

export interface EffectSettings {
  warpSize: number;
  warpAmount: number;
  warpType: 'wave' | 'ripple' | 'none';
  hidePhoto: boolean;
}

interface GradientState {
  colorStops: ColorStop[];
  style: GradientStyle;
  selectedColorIndex: number | null;
  colorFormat: 'hex' | 'rgb' | 'hsl';
  isProcessing: boolean;
  error: string | null;
  handleSize: number;
  gradientSize: number;
  gitterIntensity: number;
  halftoneEnabled: boolean;
}

type GradientAction =
  | { type: 'SET_COLOR_STOPS'; payload: ColorStop[] }
  | { type: 'UPDATE_COLOR_STOP'; payload: { index: number; stop: ColorStop } }
  | { type: 'SET_STYLE'; payload: GradientStyle }
  | { type: 'SET_SELECTED_COLOR'; payload: number | null }
  | { type: 'SET_COLOR_FORMAT'; payload: 'hex' | 'rgb' | 'hsl' }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_COLOR_STOP'; payload: ColorStop }
  | { type: 'REMOVE_COLOR_STOP'; payload: number }
  | { type: 'REORDER_COLOR_STOPS'; payload: ColorStop[] }
  | { type: 'SET_HANDLE_SIZE'; payload: number }
  | { type: 'SET_GRADIENT_SIZE'; payload: number }
  | { type: 'SET_GITTER_INTENSITY'; payload: number }
  | { type: 'SET_HALFTONE_MODE'; payload: boolean };

const initialState: GradientState = {
  colorStops: [
    { id: uuidv4(), color: '#7961D3', position: 0 },
    { id: uuidv4(), color: '#FF6B6B', position: 1 }
  ],
  style: 'linear',
  selectedColorIndex: null,
  colorFormat: 'hex',
  isProcessing: false,
  error: null,
  handleSize: 16,
  gradientSize: 100,
  gitterIntensity: 0,
  halftoneEnabled: false
};

function gradientReducer(state: GradientState, action: GradientAction): GradientState {
  switch (action.type) {
    case 'SET_COLOR_STOPS':
      return { ...state, colorStops: action.payload };
    case 'UPDATE_COLOR_STOP':
      return {
        ...state,
        colorStops: state.colorStops.map((stop, index) =>
          index === action.payload.index ? action.payload.stop : stop
        )
      };
    case 'SET_STYLE':
      return { ...state, style: action.payload };
    case 'SET_SELECTED_COLOR':
      return { ...state, selectedColorIndex: action.payload };
    case 'SET_COLOR_FORMAT':
      return { ...state, colorFormat: action.payload };
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'ADD_COLOR_STOP':
      return {
        ...state,
        colorStops: [...state.colorStops, action.payload].sort((a, b) => a.position - b.position)
      };
    case 'REMOVE_COLOR_STOP':
      return {
        ...state,
        colorStops: state.colorStops.filter((_, index) => index !== action.payload),
        selectedColorIndex: state.selectedColorIndex === action.payload ? null : state.selectedColorIndex
      };
    case 'REORDER_COLOR_STOPS':
      return { ...state, colorStops: action.payload };
    case 'SET_HANDLE_SIZE':
      return { ...state, handleSize: action.payload };
    case 'SET_GRADIENT_SIZE':
      return { ...state, gradientSize: action.payload };
    case 'SET_GITTER_INTENSITY':
      return { ...state, gitterIntensity: action.payload };
    case 'SET_HALFTONE_MODE':
      return { ...state, halftoneEnabled: action.payload };
    default:
      return state;
  }
}

type EnhancedDispatch = React.Dispatch<GradientAction> & {
  setColorStop: (index: number, stop: ColorStop) => void;
  setSelectedColor: (index: number | null) => void;
};

const GradientContext = createContext<{
  state: GradientState;
  dispatch: EnhancedDispatch;
} | null>(null);

export function useColorStops() {
  const context = useGradient();
  return context.state.colorStops;
}

export function useGradient() {
  const context = useContext(GradientContext);
  if (!context) {
    throw new Error('useGradient must be used within a GradientProvider');
  }
  return context;
}

export function useGradientError() {
  const { state, dispatch } = useGradient();
  
  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, [dispatch]);

  return {
    error: state.error,
    setError,
    clearError,
    isProcessing: state.isProcessing
  };
}

export function GradientProvider({ children }: { children: ReactNode }) {
  const [state, baseDispatch] = useReducer(gradientReducer, initialState);

  const dispatch = useMemo(() => {
    const enhancedDispatch = baseDispatch as EnhancedDispatch;
    
    enhancedDispatch.setColorStop = (index: number, stop: ColorStop) => {
      try {
        baseDispatch({ type: 'UPDATE_COLOR_STOP', payload: { index, stop } });
      } catch (error) {
        baseDispatch({ 
          type: 'SET_ERROR', 
          payload: error instanceof Error ? error.message : 'An error occurred while updating color stop' 
        });
      }
    };

    enhancedDispatch.setSelectedColor = (index: number | null) => {
      try {
        baseDispatch({ type: 'SET_SELECTED_COLOR', payload: index });
      } catch (error) {
        baseDispatch({ 
          type: 'SET_ERROR', 
          payload: error instanceof Error ? error.message : 'An error occurred while selecting color' 
        });
      }
    };

    return enhancedDispatch;
  }, [baseDispatch]);

  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);

  return (
    <GradientContext.Provider value={value}>
      {children}
    </GradientContext.Provider>
  );
} 