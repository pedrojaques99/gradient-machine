import { ColorStop, GradientStyle } from '@/app/lib/utils/colors';

export interface NavigationProps {
  onBack: () => void;
}

export interface GradientSettings {
  style: GradientStyle;
  texture: 'smooth' | 'noise' | 'grain';
  intensity: number;
  backgroundColor: 'zinc' | 'white';
}

export interface ColorSettings {
  texture: string;
  intensity: number;
  style: 'linear' | 'radial' | 'conic';
}

export interface DesignSystemProps {
  onColorChange?: (type: string, color: string) => void;
}

export interface ExportSuiteProps {
  onExport?: (format: string) => void;
} 