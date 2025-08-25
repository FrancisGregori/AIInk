import { useState } from "react";
import { Image, Grid3X3, Pencil, Minus, ZoomIn, Info, X, BadgeCheck, Brush, Plus, Sparkles } from "lucide-react";

// Import style thumbnails
import stevenThumbnail from "@/assets/style-thumbnails/steven.png";
import makiThumbnail from "@/assets/style-thumbnails/maki.png";
import darwinThumbnail from "@/assets/style-thumbnails/darwin.png";
import adrianThumbnail from "@/assets/style-thumbnails/adrian.png";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { StencilStyle } from "@shared/schema";

interface StyleSelectorProps {
  selectedStyle: string;
  onStyleChange: (style: string) => void;
  onOpenHelp?: (tab: string) => void;
  styles?: StencilStyle[];
}

// Map style IDs to icons
const styleIcons: Record<string, any> = {
  steven: Image,
  maki: Grid3X3,
  makishi: Grid3X3,
  darwin: Pencil,
  adrian: Minus,
  neutral: Brush, // Icon for Neutral style
};

// Map style IDs to thumbnails
const styleThumbnails: Record<string, string> = {
  steven: stevenThumbnail,
  maki: makiThumbnail,
  makishi: makiThumbnail,
  darwin: darwinThumbnail,
  adrian: adrianThumbnail,
};

// Default hardcoded styles (fallback if API doesn't return data)
const defaultStyles = [
  {
    id: "steven",
    name: "Stiven Hernandez",
    description: "Clean, classic detail",
    icon: Image,
    thumbnail: stevenThumbnail,
    verified: true,
  },
  {
    id: "maki",
    name: "Andres Makishi",
    description: "Minimalist fine-line",
    icon: Grid3X3,
    thumbnail: makiThumbnail,
    verified: true,
  },
  {
    id: "darwin",
    name: "Darwin Enriquez",
    description: "Clean, detailed lines",
    icon: Pencil,
    thumbnail: darwinThumbnail,
    verified: true,
  },
  {
    id: "adrian",
    name: "Adrian Rod",
    description: "Detailed & high-contrast",
    icon: Minus,
    thumbnail: adrianThumbnail,
    verified: true,
  },
];

export default function StyleSelector({ selectedStyle, onStyleChange, onOpenHelp, styles: apiStyles }: StyleSelectorProps) {
  const [previewImage, setPreviewImage] = useState<{ src: string; name: string } | null>(null);
  
  // Use API styles if available, otherwise use defaults
  const styles = apiStyles && apiStyles.length > 0 
    ? apiStyles.map(style => ({
        id: style.id,
        name: style.name,
        description: style.description || "Professional tattoo stencil",
        icon: styleIcons[style.id] || Brush,
        thumbnail: styleThumbnails[style.id] || style.previewImageUrl || null,
        verified: style.isActive !== false,
      }))
    : defaultStyles;

  const handleThumbnailClick = (e: React.MouseEvent, src: string | null, name: string) => {
    e.stopPropagation();
    if (src) {
      setPreviewImage({ src, name });
    }
  };

  return (
    <>
      <div className="bg-zinc-900 rounded-2xl p-6">
        <div className="mb-4">
          <div className="flex items-center">
            <h3 className="text-lg font-semibold">Stencil Style</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="inline-flex items-center justify-center w-5 h-5 ml-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-zinc-700/50"
                    aria-label="Information about custom AI styles"
                    onClick={() => onOpenHelp?.("premium")}
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Train AI with your unique tattoo style. Check Premium tab in Help for details.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-sm text-gray-400 mt-1">Exclusive AI models trained on each artist's signature lines</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {styles.map((style) => {
            const Icon = style.icon;
            const isSelected = selectedStyle === style.id;
            
            return (
              <div key={style.id} className="relative">
                <input
                  type="radio"
                  id={`style-${style.id}`}
                  name="stencil-style"
                  value={style.id}
                  checked={isSelected}
                  onChange={() => onStyleChange(style.id)}
                  className="sr-only"
                />
                <label
                  htmlFor={`style-${style.id}`}
                  className={`block p-2 bg-zinc-800 rounded-lg border-2 cursor-pointer transition-colors ${
                    isSelected 
                      ? 'border-white bg-white/10' 
                      : 'border-zinc-700 hover:border-zinc-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Thumbnail or Icon */}
                    <div className="relative w-12 h-12 bg-zinc-700 rounded-lg flex-shrink-0 overflow-hidden">
                      {style.thumbnail ? (
                        <>
                          <img 
                            src={style.thumbnail} 
                            alt={`${style.name} style`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={(e) => handleThumbnailClick(e, style.thumbnail, style.name)}
                            className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
                            aria-label={`Preview ${style.name} style`}
                          >
                            <ZoomIn className="h-5 w-5 text-white" />
                          </button>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon className="h-6 w-6 text-zinc-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Style Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                          {style.name}
                        </span>
                        {style.verified && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <BadgeCheck 
                                  className="h-4 w-4 text-[#1DA1F2] flex-shrink-0" 
                                  aria-label="Verified Pro Artist"
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Verified Pro Artist</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">{style.description}</div>
                    </div>
                  </div>
                </label>
              </div>
            );
          })}
          
          {/* Add Custom Style Promotional Card */}
          <div className="relative">
            <button
              onClick={() => onOpenHelp?.("premium")}
              className="block w-full p-2 bg-zinc-800/50 rounded-lg border-2 border-dashed border-zinc-600 hover:border-zinc-400 transition-all hover:bg-zinc-700/30 cursor-pointer group"
              aria-label="Create your custom style"
            >
              <div className="flex items-center gap-3">
                {/* Icon Container */}
                <div className="relative w-12 h-12 bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-lg flex-shrink-0 overflow-hidden group-hover:from-zinc-600 group-hover:to-zinc-700 transition-colors">
                  <div className="w-full h-full flex items-center justify-center">
                    <Plus className="h-6 w-6 text-zinc-400 group-hover:text-white transition-colors" />
                  </div>
                  <Sparkles className="absolute top-0.5 right-0.5 h-3 w-3 text-yellow-500 animate-pulse" />
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors">
                      Create Your Style
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors">
                    Train AI with your art
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-md">
          <DialogTitle>{previewImage?.name} Style Example</DialogTitle>
          <DialogDescription>
            High-resolution preview of the artist's style
          </DialogDescription>
          <div className="mt-4 flex justify-center">
            <img 
              src={previewImage?.src || ""} 
              alt={`${previewImage?.name} style preview`}
              className="max-w-xs h-auto rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}