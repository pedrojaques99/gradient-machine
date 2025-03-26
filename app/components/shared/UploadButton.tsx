'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Loader2, Image, X } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { toast } from '@/app/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadButtonProps {
  onUpload?: (file: File) => void;
  hasImage?: boolean;
  isLoading?: boolean;
  title?: string;
  imagePreview?: string;
  variant?: 'default' | 'sidebar';
  collapsed?: boolean;
  className?: string;
  id?: string;
  onImageUpload?: (file: File) => void;
}

export function UploadButton({
  onUpload,
  hasImage = false,
  isLoading = false,
  title = 'Upload',
  imagePreview,
  variant = 'default',
  collapsed = false,
  className,
  id,
  onImageUpload
}: UploadButtonProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback((file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const img = new window.Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Resize image if needed
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1080;
          let { width, height } = img;
          
          if (width > height && width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          } else if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to process image'));
              return;
            }
            resolve(new File([blob], file.name, { type: file.type, lastModified: file.lastModified }));
          }, file.type, 0.9);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }, []);

  const handleFileChange = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (PNG, JPG, WEBP)',
        variant: 'destructive'
      });
      return;
    }

    try {
      const processedFile = await processImage(file);
      onImageUpload?.(processedFile);
      onUpload?.(processedFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
      toast({
        title: 'Error processing image',
        description: err instanceof Error ? err.message : 'Failed to process image',
        variant: 'destructive'
      });
    }
  }, [onImageUpload, onUpload, processImage]);

  const handleDragEvents = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragover') setIsDragging(true);
    if (e.type === 'dragleave') setIsDragging(false);
    if (e.type === 'drop') {
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileChange(file);
    }
  }, [handleFileChange]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileChange(file);
  }, [handleFileChange]);

  const buttonClasses = cn(
    "bg-gradient-to-r from-zinc-800/50 via-accent/10 to-zinc-800/30",
    "hover:from-zinc-700/50 hover:via-accent/20 hover:to-zinc-700/30",
    "transition-all border border-zinc-700/50 group"
  );

  const renderContent = () => {
    if (variant === 'sidebar') {
      return (
        <button
          type="button"
          onClick={handleClick}
          disabled={isLoading}
          className={cn(
            buttonClasses,
            collapsed ? "w-8 h-8 rounded-lg" : "w-full flex items-center gap-1 px-3 py-2 rounded-md"
          )}
          title={title || (hasImage ? "Change Image" : "Upload Image")}
        >
          {isLoading ? (
            <Loader2 className={cn("animate-spin", collapsed ? "h-5 w-5" : "h-4 w-4")} />
          ) : (
            <>
              {variant === 'sidebar' ? (
                <Image className={cn("transition-transform group-hover:scale-100", collapsed ? "h-5 w-5" : "h-4 w-4")} />
              ) : (
                <Upload className={cn("transition-transform group-hover:scale-100", collapsed ? "h-5 w-5" : "h-4 w-4")} />
              )}
              {!collapsed && <span className="text-sm group-hover:text-accent transition-colors">{title || 'Upload Image'}</span>}
            </>
          )}
        </button>
      );
    }

    return (
      <div 
        className={cn(
          "relative rounded-lg border-2 border-dashed transition-all duration-200 overflow-hidden",
          isDragging ? "border-accent bg-accent/5" : "border-zinc-700/50",
          hasImage ? "bg-zinc-900/50" : "bg-zinc-900/30",
          collapsed ? "w-12 h-12" : "w-full h-32",
          className
        )}
        onDragOver={handleDragEvents}
        onDragLeave={handleDragEvents}
        onDrop={handleDragEvents}
        onClick={handleClick}
      >
        {imagePreview ? (
          <div className="absolute inset-0">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Image className="w-6 h-6 text-white" />
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 group">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            ) : (
              <>
                <Upload className="h-6 w-6 text-zinc-400 group-hover:text-accent transition-colors w-50" />
                {!collapsed && (
                  <span className="text-xs text-muted-foreground group-hover:text-accent transition-colors">
                    {hasImage ? 'Change' : 'Upload'}
                  </span>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        id={id}
        onClick={(e) => e.stopPropagation()}
      />
      <div onClick={(e) => e.stopPropagation()}>
        {renderContent()}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 px-3 py-2 mt-2 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-sm"
            >
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="ml-auto hover:text-red-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 