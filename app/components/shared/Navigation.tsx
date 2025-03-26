'use client';

import { Button } from '@/app/components/ui/button';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface NavigationProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  onNext?: () => void;
  hideNext?: boolean;
}

export function Navigation({ 
  title, 
  subtitle,
  onBack, 
  onNext, 
  hideNext = false
}: NavigationProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-between w-full px-6 py-4 border-b bg-background backdrop-blur-sm sticky top-0 z-40"
    >
      <div className="flex items-center gap-4">
        {onBack && (
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2 text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        )}
        {title && (
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold">{title}</h1>
            {subtitle && (
              <span className="text-sm text-muted-foreground">{subtitle}</span>
            )}
          </div>
        )}
      </div>

      {onNext && !hideNext && (
        <Button
          onClick={onNext}
          className="flex items-center gap-2 text-sm"
          variant="secondary"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </motion.div>
  );
} 