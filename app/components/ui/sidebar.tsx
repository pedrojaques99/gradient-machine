'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/app/lib/utils';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
}

export function Sidebar({ className, children, ...props }: SidebarProps) {
  const [width, setWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = Math.max(280, Math.min(600, e.clientX));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div className="relative flex h-full">
      <aside
        ref={sidebarRef}
        className={cn(
          "bg-card border-r border-border/50 overflow-y-auto",
          className
        )}
        style={{ width: `${width}px` }}
        {...props}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">Controls</h3>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {children}
        </div>
      </aside>
      <div
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/10 transition-colors"
        onMouseDown={() => setIsResizing(true)}
        style={{ transform: 'tranzincX(50%)' }}
      />
    </div>
  );
}

export function SidebarSection({ title, children }: SidebarSectionProps) {
  return (
    <div className="p-4 border-b border-border/50">
      <h3 className="mb-4 text-sm font-medium tracking-tight">{title}</h3>
      {children}
    </div>
  );
} 