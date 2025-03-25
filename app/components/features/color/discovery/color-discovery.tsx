'use client';

import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useGradient } from '@/app/contexts/GradientContext';
import { UploadButton } from '@/app/components/shared/UploadButton';
import { Navigation } from '@/app/components/shared/Navigation';
import { Label } from '@/app/components/ui/label';
import { Wand2, Check, ArrowRight, Paintbrush, X, RefreshCw, Pencil } from 'lucide-react';
import { rgbToHex, cn } from '@/app/lib/utils';
import { Button } from '@/app/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { COLOR_ROLES, type ColorRole, type DesignSystemRoleId, getColorProperties, generateColorVariations, type ColorProperties, type ColorVariation } from '../core/color-system';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Input } from "@/app/components/ui/input";
import { ColorPicker } from '../shared/color-picker';
import { ColorHarmony } from '../shared/color-harmony';

type DesignSystem = Partial<Record<DesignSystemRoleId, string>>;

interface ColorSwatchProps {
  color: string;
  isSelected: boolean;
  onClick: () => void;
}

const ColorSwatch = ({ color, isSelected, onClick }: ColorSwatchProps) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            "group relative p-2 w-full h-25 rounded-md transition-all",
            "hover:scale-105 hover:shadow-lg",
            isSelected && "ring-2 ring-accent ring-offset-2 ring-offset-zinc-950",
            "overflow-hidden"
          )}
          style={{ backgroundColor: color }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            {isSelected ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-accent text-black p-1 rounded-full"
              >
                <Check className="h-5 w-5" />
              </motion.div>
            ) : (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 absolute inset-0 flex items-center justify-center">
                <Paintbrush className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-mono text-xs">{color}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

interface ColorRoleProps {
  role: ColorRole;
  assignedColor: string | null;
  isHovered: boolean;
  isSelecting: boolean;
  onHover: (isHovered: boolean) => void;
  onClick: () => void;
  onRemove: () => void;
  onColorChange: (color: string) => void;
}

const ColorRole = ({ 
  role, 
  assignedColor, 
  isHovered, 
  isSelecting,
  onHover, 
  onClick,
  onRemove,
  onColorChange
}: ColorRoleProps) => (
  <motion.div
    onClick={onClick}
    onMouseEnter={() => onHover(true)}
    onMouseLeave={() => onHover(false)}
    className={cn(
      "group flex items-center gap-3 p-2 rounded-md transition-all",
      "bg-zinc-900/50 hover:bg-zinc-800/50",
      isSelecting && "ring-2 ring-accent/50",
      isHovered && "bg-zinc-800/40",
      !isSelecting && "cursor-default",
      assignedColor && "hover:shadow-lg hover:shadow-accent/5"
    )}
    whileHover={{ scale: 1.01 }}
    animate={{ 
      y: isHovered ? -2 : 0,
      transition: { duration: 0.2 }
    }}
  >
    <div className="relative flex items-center gap-2">
      <div 
        className={cn(
          "w-10 h-10 rounded-md transition-all",
          "border-2",
          assignedColor ? "border-transparent shadow-lg" : "border-dashed border-zinc-700/50",
          isSelecting && "ring-2 ring-accent/50"
        )}
        style={{ 
          backgroundColor: assignedColor || 'transparent',
          boxShadow: assignedColor ? `0 4px 12px ${assignedColor}15` : 'none'
        }}
      />
      {assignedColor && (
        <Popover>
          <PopoverTrigger asChild>
            <Input
              value={assignedColor}
              className="w-30 h-15 bg-zinc-900/50 border-zinc-700/50 font-mono text-xs hover:bg-zinc-500/50 border-3"
              onClick={(e) => e.stopPropagation()}
            />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-5">
            <ColorPicker
              color={assignedColor}
              onChange={onColorChange}
              compact
            />
          </PopoverContent>
        </Popover>
      )}
      {!assignedColor ? (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
          <Paintbrush className="h-10 w-10" />
        </div>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-zinc-400 hover:text-white p-1 rounded-full border-2 border-zinc-800"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
    <div className="flex-1 text-left space-y-0.5">
      <div className="text-sm font-medium flex items-center gap-2">
        {role.name}
      </div>
      <div className="text-xs text-muted-foreground">{role.description}</div>
    </div>
    {isSelecting && (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="mr-2 text-accent"
      >
        <ArrowRight className="h-7 w-7" />
      </motion.div>
    )}
  </motion.div>
);

interface ColorAnalysisProps {
  color: string | null;
}

const ColorAnalysis = ({ color }: ColorAnalysisProps) => {
  const { state, dispatch } = useGradient();

  if (!color) return null;

  const properties = getColorProperties(color);
  const variations = generateColorVariations(color);

  if (!properties) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/50 rounded-md p-3 space-y-3"
    >
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-muted-foreground">Análise de Cor</h3>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-zinc-800/50 rounded-md p-2 space-y-0.5">
            <span className="text-muted-foreground text-[10px]">Brilho</span>
            <div className="font-mono text-[10px]">{(properties.brightness * 100).toFixed(0)}%</div>
          </div>
          <div className="bg-zinc-800/50 rounded-md p-2 space-y-0.5">
            <span className="text-muted-foreground text-[10px]">Saturação</span>
            <div className="font-mono text-[10px]">{(properties.saturation * 100).toFixed(0)}%</div>
          </div>
          <div className="bg-zinc-800/50 rounded-md p-2 space-y-0.5">
            <span className="text-muted-foreground text-[10px]">Contraste</span>
            <div className="font-mono text-[10px]">{(properties.contrast * 100).toFixed(0)}%</div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-medium text-muted-foreground">Variações</h3>
        <div className="grid grid-cols-5 gap-1">
          {variations.map((variation) => (
            <TooltipProvider key={variation.hex}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    className="w-40 h-20 rounded-md cursor-pointer hover:scale-105 transition-transform"
                    style={{ backgroundColor: variation.hex }}
                    whileHover={{ y: -3 }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-0.5">
                    <p className="capitalize text-[10px]">{variation.type}</p>
                    <p className="font-mono text-[10px]">{variation.hex}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-medium text-muted-foreground">Harmonias</h3>
        <ColorHarmony 
          baseColor={color}
          onSelect={(selectedHarmonyColor) => {
            if (!state.extractedColors.includes(selectedHarmonyColor)) {
              dispatch({ 
                type: 'SET_EXTRACTED_COLORS', 
                payload: [...state.extractedColors, selectedHarmonyColor] 
              });
            }
          }}
          className="w-full"
        />
      </div>
    </motion.div>
  );
};

export function ColorDiscovery() {
  const { state, dispatch } = useGradient();
  const [isExtracting, setIsExtracting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [hoveredRole, setHoveredRole] = useState<DesignSystemRoleId | null>(null);

  const handleInterfaceChange = useCallback(() => {
    dispatch({ type: 'SET_INTERFACE', payload: 'ecosystem' });  
  }, [dispatch]);

  const extractColors = useCallback(async (img: HTMLImageElement, quality = 4) => {
    try {
      const ColorThief = (await import('color-thief-browser')).default;
      const colorThief = new ColorThief();
      const palette = colorThief.getPalette(img, quality);
      
      if (!palette || palette.length === 0) {
        throw new Error('No colors extracted from image');
      }
      
      // Map only 4 colors for our roles
      const colors = palette.slice(0, 4).map((color: [number, number, number]) => 
        rgbToHex(color[0], color[1], color[2])
      );

      // If we got less than 4 colors, fill with defaults
      while (colors.length < 4) {
        colors.push('#000000');
      }

      return colors;
    } catch (error) {
      console.error('Failed to extract colors:', error);
      // Show error toast
      const el = document.createElement('div');
      el.className = 'fixed top-4 right-4 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2';
      el.textContent = 'Não foi possível extrair as cores. Por favor, tente com uma imagem diferente.';
      document.body.appendChild(el);
      setTimeout(() => {
        el.classList.add('animate-out', 'fade-out', 'slide-out-to-top-2');
        setTimeout(() => el.remove(), 150);
      }, 3000);
      return [];
    }
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    setIsExtracting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imgUrl = e.target?.result as string;
        setImagePreview(imgUrl);
        
        const img = new Image();
        img.src = imgUrl;
        img.crossOrigin = "anonymous";
        
        img.onload = async () => {
          const colors = await extractColors(img);
          if (colors.length > 0) {
            dispatch({ type: 'SET_EXTRACTED_COLORS', payload: colors });
            
            // Set design system with all required colors
            dispatch({ 
              type: 'SET_DESIGN_SYSTEM', 
              payload: {
                primary: colors[0],
                secondary: colors[1],
                accent: colors[2],
                background: colors[3],
                text: state.designSystem.text || '#FFFFFF' // Keep existing text color or default to white
              }
            });
          }
        };
        
        img.onerror = () => {
          setIsExtracting(false);
          // Show error toast
          const el = document.createElement('div');
          el.className = 'fixed top-4 right-4 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2';
          el.textContent = 'Não foi possível carregar a imagem. Por favor, tente novamente.';
          document.body.appendChild(el);
          setTimeout(() => {
            el.classList.add('animate-out', 'fade-out', 'slide-out-to-top-2');
            setTimeout(() => el.remove(), 150); 
          }, 3000);
        };
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Não foi possível processar a imagem:', error);
      setIsExtracting(false);
    }
  }, [dispatch, extractColors, state.designSystem.text]);

  const handleRemoveImage = useCallback(() => {
    setImagePreview(null);
    setSelectedColor(null);
    setIsExtracting(false);
    setHoveredRole(null);
    dispatch({ type: 'SET_EXTRACTED_COLORS', payload: [] });
    // Reset design system with proper type
    const emptyDesignSystem = {
      primary: '',
      secondary: '',
      accent: '',
      background: '',
      text: ''
    };
    dispatch({ type: 'SET_DESIGN_SYSTEM', payload: emptyDesignSystem });
  }, [dispatch]);

  const handleColorSelect = useCallback((color: string) => {
    setSelectedColor(color === selectedColor ? null : color);
  }, [selectedColor]);

  const handleRoleAssign = useCallback((roleId: DesignSystemRoleId) => {
    if (!selectedColor) return;

    dispatch({ 
      type: 'SET_DESIGN_SYSTEM', 
      payload: { ...state.designSystem, [roleId]: selectedColor }
    });
    setSelectedColor(null);

    // Show success toast
    const el = document.createElement('div');
    el.className = 'fixed top-4 right-4 bg-accent/90 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2';
    el.textContent = `${roleId.charAt(0).toUpperCase() + roleId.slice(1)} color updated!`;
    document.body.appendChild(el);
    setTimeout(() => {
      el.classList.add('animate-out', 'fade-out', 'slide-out-to-top-2');
      setTimeout(() => el.remove(), 150);
    }, 2000);
  }, [dispatch, selectedColor, state.designSystem]);

  const handleRemoveRole = useCallback((roleId: DesignSystemRoleId) => {
    const newDesignSystem = { ...state.designSystem };
    delete newDesignSystem[roleId];
    dispatch({ type: 'SET_DESIGN_SYSTEM', payload: newDesignSystem });
  }, [dispatch, state.designSystem]);

  const handleColorChange = useCallback((color: string, roleId: DesignSystemRoleId) => {
    dispatch({ 
      type: 'SET_DESIGN_SYSTEM', 
      payload: { ...state.designSystem, [roleId]: color }
    });
  }, [dispatch, state.designSystem]);

  return (
    <div className="min-h-screen flex bg-zinc-950 flex-col">
      <Navigation title="[Colorfy]®" onNext={handleInterfaceChange} />
      
      <div className="flex-1 flex flex-col">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-accent" />
              <Label className="text-base font-medium">Extrair cores da imagem</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Crie paletas de cores perfeitas a partir de qualquer imagem
            </p>
          </div>
        </div>

        <div className="flex-1 container max-w-2xl mx-auto px-4 pb-12">
          {!state.extractedColors.length ? (
            <motion.div 
              className="max-w-md mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex flex-col items-center gap-6">
                <div className="relative w-[160px] h-[160px] bg-zinc-900/50 rounded-md overflow-hidden group">
                  {/* Image Preview */}
                  {imagePreview ? (
                    <>
                      {/* Clickable Image Container */}
                      <div 
                        className="absolute inset-0 cursor-pointer group"
                        onClick={() => document.getElementById('image-upload')?.click()}
                      >
                        {/* Image */}
                        <div className="absolute inset-0">
                          <img 
                            src={imagePreview} 
                            alt="Uploaded preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/60 transition-all duration-200">
                          <div className="transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="gap-1 bg-zinc-900/90 hover:bg-zinc-800/90 text-xs h-8"
                            >
                              <RefreshCw className="h-3 w-3" />
                              Alterar imagem
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Hidden File Input */}
                      <UploadButton 
                        onUpload={handleUpload} 
                        hasImage={true}
                        isLoading={isExtracting}
                        title="Alterar imagem"
                        imagePreview={imagePreview}
                        className="hidden"
                        id="image-upload"
                      />

                      {/* Remove Button */}
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
                                  handleRemoveImage();
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
                    /* Initial Upload State */
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <UploadButton 
                        onUpload={handleUpload} 
                        hasImage={false}
                        isLoading={isExtracting}
                        title="Upload Image"
                        imagePreview={undefined}
                      />
                    </div>
                  )}
                </div>
                {!imagePreview && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-1.5 text-[10px] text-accent/80"
                  >
                    <span className="text-muted-foreground">Supported formats:</span>
                    <span className="font-medium">PNG, JPG, WEBP</span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex flex-col items-center gap-6">
                <div className="relative w-[180px] h-[180px] bg-zinc-900/50 rounded-md overflow-hidden group cursor-pointer"
                  onClick={() => document.getElementById('image-upload-extracted')?.click()}
                >
                  {/* Image layer */}
                  {imagePreview && (
                    <div className="absolute inset-0">
                      <img 
                        src={imagePreview} 
                        alt="Uploaded preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Dark overlay and upload button on hover */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200" />
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="gap-1 bg-zinc-900/90 hover:bg-zinc-800/90 text-xs h-8"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Alterar imagem
                      </Button>
                    </div>
                  </div>
                  
                  {/* Hidden File Input */}
                  <UploadButton 
                    onUpload={handleUpload} 
                    hasImage={true}
                    isLoading={isExtracting}
                    title="Alterar imagem"
                    imagePreview={imagePreview || undefined}
                    className="hidden"
                    id="image-upload-extracted"
                  />
                  
                  {/* Remove button */}
                  <TooltipProvider>
                    <div className="absolute top-2 right-2 z-20">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-6 w-6 rounded-full shadow-lg bg-zinc-900/80 hover:bg-zinc-900"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage();
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Remover imagem</TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-medium text-muted-foreground">Cores extraídas</h3>
                  </div>
                  <TooltipProvider>
                    <div className="grid grid-cols-4 gap-2">
                      {state.extractedColors.map((color, index) => (
                        <ColorSwatch
                          key={color + index}
                          color={color}
                          isSelected={selectedColor === color}
                          onClick={() => handleColorSelect(color)}
                        />
                      ))}
                    </div>
                  </TooltipProvider>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-muted-foreground">Categorias de cores</h3>
                  {imagePreview && (
                    <motion.div 
                      className="inline-flex items-center gap-2 text-xs bg-accent/10 text-accent px-3 py-1.5 rounded-full"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <span className="font-medium">Como configurar:</span>
                      <ol className="flex items-center gap-2">
                        <li className="flex items-center gap-1">
                          <span className="bg-accent/20 w-4 h-4 rounded-full flex items-center justify-center text-[10px]">1</span>
                          Click em uma cor
                        </li>
                        <ArrowRight className="h-3 w-3 opacity-50" />
                        <li className="flex items-center gap-1">
                          <span className="bg-accent/20 w-4 h-4 rounded-full flex items-center justify-center text-[10px]">2</span>
                          Clique em uma categoria para atribuir a cor
                        </li>
                      </ol>
                    </motion.div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {COLOR_ROLES.map((role) => (
                      <ColorRole
                        key={role.id}
                        role={role}
                        assignedColor={state.designSystem[role.id]}
                        isHovered={hoveredRole === role.id}
                        isSelecting={!!selectedColor}
                        onHover={(isHovered) => setHoveredRole(isHovered ? role.id : null)}
                        onClick={() => handleRoleAssign(role.id)}
                        onRemove={() => handleRemoveRole(role.id)}
                        onColorChange={(color) => handleColorChange(color, role.id)}
                      />
                    ))}
                  </div>
                </div>

                {selectedColor && (
                  <ColorAnalysis color={selectedColor} />
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
} 