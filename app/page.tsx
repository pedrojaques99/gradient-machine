'use client';

import { AnimatePresence } from 'framer-motion';
import { useGradient } from './contexts/GradientContext';
import { ColorDiscovery, ColorEcosystem, GradientStudioPage } from './components/features/color';

export default function Home() {
  const { state } = useGradient();

  return (
    <AnimatePresence mode="wait">
      {state.interface === 'discovery' ? (
        <ColorDiscovery key="discovery" />
      ) : state.interface === 'ecosystem' ? (
        <ColorEcosystem key="ecosystem" />
      ) : (
        <GradientStudioPage key="gradient-studio" />
      )}
    </AnimatePresence>
  );
}
