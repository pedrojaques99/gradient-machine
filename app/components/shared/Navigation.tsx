'use client';

import { Button } from '@/app/components/ui/button';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Palette, LineChart, Wand2, Menu } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavigationProps {
  title?: string;
  subtitle?: string;
  onNext?: () => void;
  hideNext?: boolean;
  backTo?: string;
}

export function Navigation({ 
  title, 
  subtitle,
  onNext, 
  hideNext = false,
  backTo
}: NavigationProps) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', icon: Palette, label: 'Discovery' },
    { href: '/design-system', icon: Wand2, label: 'System' },
    { href: '/gradient-studio', icon: LineChart, label: 'Gradient' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "flex items-center justify-between w-full",
        "px-4 sm:px-6 py-2 sm:py-3",
        "border-b border-zinc-800/50",
        "bg-background/80 backdrop-blur-md",
        "sticky top-0 z-40",
        "shadow-sm"
      )}
    >
      <div className="flex items-center gap-2 sm:gap-4">
        {!isHome && (
          <Link
            href={backTo || '/'}
            className={cn(
              "flex items-center gap-1.5 text-sm",
              "hover:bg-accent/10 hover:text-accent",
              "transition-colors duration-200",
              "h-8 px-2 sm:px-3 rounded-md",
              "font-medium"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
        )}
        {title && (
          <div className="flex flex-col">
            <h1 className={cn(
              "text-sm sm:text-base font-semibold",
              "bg-gradient-to-r from-zinc-100 to-zinc-400",
              "bg-clip-text text-transparent"
            )}>
              {title}
            </h1>
            {subtitle && (
              <span className="text-[10px] sm:text-xs text-muted-foreground/80">
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center gap-2">
          {navLinks.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 text-sm",
                "hover:bg-accent/10 hover:text-accent",
                "transition-colors duration-200",
                "h-8 px-2 rounded-md",
                "font-medium",
                pathname === href && "text-accent bg-accent/10"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden h-8 w-8"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "absolute top-12 right-0",
              "bg-background/95 backdrop-blur-md",
              "border border-zinc-800/50",
              "rounded-lg shadow-lg",
              "p-2 space-y-1",
              "min-w-[160px]"
            )}
          >
            {navLinks.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "flex items-center gap-2 text-sm",
                  "hover:bg-accent/10 hover:text-accent",
                  "transition-colors duration-200",
                  "h-8 px-2 rounded-md",
                  "font-medium",
                  pathname === href && "text-accent bg-accent/10"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
          </motion.div>
        )}

        {onNext && !hideNext && (
          <Button
            onClick={onNext}
            className={cn(
              "flex items-center gap-1.5 text-sm",
              "bg-accent/10 hover:bg-accent/20",
              "text-accent hover:text-accent",
              "transition-all duration-200",
              "h-8 px-2 sm:px-3"
            )}
          >
            <span className="font-medium hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
} 