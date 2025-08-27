import { useState } from "react";
import { X, Download, Share, Layers } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import ImageCompare from "@/components/image-compare";
import type { GeneratedImage } from "@shared/schema";

interface ImageModalProps {
  image: GeneratedImage | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageModal({ image, isOpen, onClose }: ImageModalProps) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [showComparison, setShowComparison] = useState(false);

  if (!image) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(image.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `generated-image-${image.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Image download started",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download image",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Generated Image',
          text: image.prompt,
          url: image.imageUrl,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(image.imageUrl);
        toast({
          title: "Success",
          description: "Image URL copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to copy URL",
          variant: "destructive",
        });
      }
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-card border-border">
        <DialogTitle className="sr-only">Generated Image Details</DialogTitle>
        <DialogDescription className="sr-only">
          View and interact with the generated image: {image.prompt}
        </DialogDescription>
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute -top-12 right-0 text-white hover:text-muted-foreground z-10"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
          
          <div className="overflow-hidden rounded-lg">
            {/* Image Display Area */}
            <div className="relative bg-black/90" style={{ minHeight: '400px' }}>
              {showComparison && image.inputImageUrl ? (
                <div className="w-full h-[80vh]">
                  <ImageCompare
                    beforeImage={image.inputImageUrl}
                    afterImage={image.imageUrl}
                    beforeLabel={language === 'es' ? 'Original' : 'Original'}
                    afterLabel={language === 'es' ? 'Generado' : 'Generated'}
                  />
                </div>
              ) : (
                <img 
                  src={image.imageUrl}
                  alt={image.prompt}
                  className="w-full h-auto max-h-[80vh] object-contain"
                />
              )}
            </div>
            
            <div className="p-4 flex items-center justify-between bg-background">
              <div className="flex-1">
                <p className="text-foreground font-medium">{image.prompt}</p>
                <p className="text-muted-foreground text-sm">
                  {image.width}x{image.height} • {language === 'es' ? 'Generado' : 'Generated'} {formatDate(image.createdAt)}
                </p>
                {image.inputImageUrl && (
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                      {language === 'es' ? 'Editado desde imagen de referencia' : 'Edited from reference image'}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                {image.inputImageUrl && (
                  <Button
                    onClick={() => setShowComparison(!showComparison)}
                    variant={showComparison ? "default" : "secondary"}
                    className={showComparison ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" : ""}
                  >
                    <Layers className="mr-2 h-4 w-4" />
                    {showComparison 
                      ? (language === 'es' ? 'Ver Normal' : 'View Normal')
                      : (language === 'es' ? 'Comparar' : 'Compare')
                    }
                  </Button>
                )}
                <Button
                  onClick={handleDownload}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {language === 'es' ? 'Descargar' : 'Download'}
                </Button>
                <Button
                  onClick={handleShare}
                  variant="secondary"
                >
                  <Share className="mr-2 h-4 w-4" />
                  {language === 'es' ? 'Compartir' : 'Share'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
