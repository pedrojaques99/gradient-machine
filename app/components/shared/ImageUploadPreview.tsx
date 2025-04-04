import { Button } from "@/app/components/ui/button";
import { UploadButton } from "./UploadButton";
import { RefreshCw, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { cn } from "@/app/lib/utils";

interface ImageUploadPreviewProps {
  imagePreview: string | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
  isExtracting: boolean;
  size?: 'sm' | 'lg';
  className?: string;
}

export function ImageUploadPreview({
  imagePreview,
  onUpload,
  onRemove,
  isExtracting,
  size = 'sm',
  className
}: ImageUploadPreviewProps) {
  const containerSize = size === 'sm' 
    ? 'w-full h-[160px] sm:w-[300px]' 
    : 'w-full aspect-square max-w-[300px]';
  const bgOpacity = size === 'sm' ? 'bg-zinc-900/30' : 'bg-zinc-900/50';
  const inputId = `image-upload-${size}`;

  return (
    <div className={cn(
      "relative rounded-md overflow-hidden group backdrop-blur-sm border border-white/5",
      containerSize,
      bgOpacity,
      className
    )}>
      {imagePreview ? (
        <>
          <div 
            className="absolute inset-0 cursor-pointer group"
            onClick={() => document.getElementById(inputId)?.click()}
          >
            <div className="absolute inset-0">
              <img 
                src={imagePreview} 
                alt="Uploaded preview" 
                className="w-full h-full object-cover"
              />
            </div>

            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/60 transition-all duration-200">
              <div className="transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1 bg-zinc-900/90 hover:bg-zinc-800/90 text-xs h-8"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span className="hidden sm:inline">Alterar imagem</span>
                  <span className="sm:hidden">Alterar</span>
                </Button>
              </div>
            </div>
          </div>

          <UploadButton 
            onUpload={onUpload} 
            hasImage={true}
            isLoading={isExtracting}
            title="Alterar imagem"
            imagePreview={imagePreview}
            className="hidden"
            id={inputId}
          />

          <TooltipProvider>
            <div className="absolute top-2 right-2 z-20">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-6 w-6 rounded-full shadow-lg bg-zinc-900/90 hover:bg-red-900/90 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove();
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remove image</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          <UploadButton 
            onUpload={onUpload} 
            hasImage={false}
            isLoading={isExtracting}
            title="Upload Image"
            imagePreview={undefined}
            className="w-full sm:w-auto"
          />
        </div>
      )}
    </div>
  );
} 