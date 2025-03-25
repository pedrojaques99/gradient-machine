'use client';

import { Button } from '@/app/components/ui/button';
import { Loader2, Image, Upload, X } from 'lucide-react';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface UploadButtonProps {
  onUpload: (file: File) => void;
  hasImage?: boolean;
  isLoading?: boolean;
  title?: string;
  imagePreview?: string;
  variant?: 'default' | 'sidebar';
  collapsed?: boolean;
  className?: string;
  id?: string;
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
  id
}: UploadButtonProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError(null);
    onUpload(file);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    inputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleErrorDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setError(null);
  };

  const renderIcon = () => {
    if (isLoading) {
      return <Loader2 className={`${variant === 'sidebar' && collapsed ? 'h-5 w-5' : 'h-4 w-4'} animate-spin`} />;
    }
    
    const Icon = variant === 'default' ? Upload : Image;
    return <Icon className={`${variant === 'sidebar' && collapsed ? 'h-5 w-5' : 'h-4 w-4'} transition-transform group-hover:scale-110`} />;
  };

  const commonButtonClasses = "bg-gradient-to-r from-zinc-800/50 via-accent/10 to-zinc-800/30 hover:from-zinc-700/50 hover:via-accent/20 hover:to-zinc-700/30 transition-all border border-zinc-700/50 group";

  const renderButton = () => {
    if (variant === 'sidebar') {
      if (collapsed) {
        return (
          <button
            type="button"
            onClick={handleClick}
            disabled={isLoading}
            className={`relative w-8 h-8 rounded-lg ${commonButtonClasses}`}
            title={title || (hasImage ? "Change Image" : "Upload Image")}
          >
            {renderIcon()}
            <div className="absolute inset-0 rounded-lg bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </button>
        );
      }

      return (
        <button
          type="button"
          onClick={handleClick}
          disabled={isLoading}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-md ${commonButtonClasses}`}
        >
          {renderIcon()}
          <span className="text-sm group-hover:text-accent transition-colors">{title || 'Upload Image'}</span>
        </button>
      );
    }

    return (
      <div 
        className="flex flex-col gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`relative h-20 w-20 rounded-lg border-2 border-dashed transition-all duration-200 overflow-hidden
            ${isDragging 
              ? 'border-accent bg-accent/10 scale-105' 
              : 'border-zinc-700/50 hover:border-accent/50 hover:bg-accent/5'
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {imagePreview ? (
            <div className="absolute inset-0">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Image className="w-6 h-6 text-white" />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleClick}
              disabled={isLoading}
              className="w-full h-full flex flex-col items-center justify-center gap-2 group"
            >
              {renderIcon()}
              <span className="text-xs text-muted-foreground group-hover:text-accent transition-colors">
                {hasImage ? 'Change' : 'Upload'}
              </span>
            </button>
          )}
        </div>

        {hasImage && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={`w-full ${commonButtonClasses}`}
            onClick={handleClick}
            disabled={isLoading}
          >
            <Image className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" />
            <span className="group-hover:text-accent transition-colors">Change Image</span>
          </Button>
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
      <div 
        className="flex flex-col gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {renderButton()}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-sm"
            >
              <span>{error}</span>
              <button
                type="button"
                onClick={handleErrorDismiss}
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