import { useState } from "react";
import { Image, Grid3X3, Pencil, Minus, ZoomIn, Info, X, BadgeCheck, Brush } from "lucide-react";
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

// Default hardcoded styles (fallback if API doesn't return data)
const defaultStyles = [
  {
    id: "steven",
    name: "Stiven Hernandez",
    description: "Clean, classic detail",
    icon: Image,
    thumbnail: null,
    verified: true,
  },
  {
    id: "maki",
    name: "Andres Makishi",
    description: "Minimalist fine-line",
    icon: Grid3X3,
    thumbnail: null,
    verified: true,
  },
  {
    id: "darwin",
    name: "Darwin Enriquez",
    description: "Clean, detailed lines",
    icon: Pencil,
    thumbnail: null,
    verified: true,
  },
  {
    id: "adrian",
    name: "Adrian Rod",
    description: "Detailed & high-contrast",
    icon: Minus,
    thumbnail: null,
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
        thumbnail: style.previewImageUrl || null,
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
                                <svg 
                                  className="h-3.5 w-3.5 animate-fadeIn" 
                                  viewBox="0 0 22 22"
                                  aria-label="Verified Pro Artist"
                                >
                                  <g>
                                    <path
                                      fill="#1DA1F2"
                                      d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
                                    />
                                  </g>
                                </svg>
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