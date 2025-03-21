'use client';

import { cn } from '@/app/lib/utils';
import { ScrollArea } from '@/app/components/ui/scroll-area';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ 
  className, 
  children,
  ...props 
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "group/sidebar relative flex flex-col gap-4 px-4 py-3",
        "border-r border-border/50 bg-card w-[320px]",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">Controls</h3>
        </div>
      </div>
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="flex flex-col gap-2">
          {children}
        </div>
      </ScrollArea>
    </aside>
  );
}

export function SidebarSection({ 
  title, 
  children,
  className,
  ...props
}: { 
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
} 