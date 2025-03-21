'use client';

import { Button } from '@/app/components/ui/button';
import { Loader2 } from 'lucide-react';

interface UploadButtonProps {
  onUpload: (file: File) => void;
  isLoading?: boolean;
}

export function UploadButton({ onUpload, isLoading }: UploadButtonProps) {
  const handleClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        onUpload(file);
      }
    };
    input.click();
  };

  return (
    <Button
      variant="outline"
      size="icon"
      className="h-10 w-10"
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.6667 6H7.33333C6.59695 6 6 6.59695 6 7.33333V16.6667C6 17.403 6.59695 18 7.33333 18H16.6667C17.403 18 18 17.403 18 16.6667V7.33333C18 6.59695 17.403 6 16.6667 6Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9.33333 10.6667C10.0697 10.6667 10.6667 10.0697 10.6667 9.33333C10.6667 8.59695 10.0697 8 9.33333 8C8.59695 8 8 8.59695 8 9.33333C8 10.0697 8.59695 10.6667 9.33333 10.6667Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M17.9997 13.9998L14.6663 10.6665L7.33301 17.9998" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </Button>
  );
} 