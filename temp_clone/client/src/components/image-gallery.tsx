import { useState, useEffect } from "react";
import { Download, Share, Edit, Expand, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import OptimizedImage from "@/components/optimized-image";
import { useLanguage } from "@/contexts/LanguageContext";
import type { GeneratedImage } from "@shared/schema";

interface ImageGalleryProps {
  images: GeneratedImage[];
  isLoading: boolean;
  onImageSelect: (image: GeneratedImage) => void;
  onUseAsReference?: (imageUrl: string) => void;
  isGenerating?: boolean;
  isLoadingGeneratedImage?: boolean;
  onLatestImageLoad?: () => void;
}

// Helper function to convert image URL to base64
async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  try {
    console.log('fetchImageAsBase64 called with:', imageUrl);
    
    // If it's already a base64 string, return it
    if (imageUrl.startsWith('data:')) {
      console.log('Already base64, returning as is');
      return imageUrl;
    }
    
    // Fetch the image from the API
    console.log('Fetching image from:', imageUrl);
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const blob = await response.blob();
    console.log('Blob size:', blob.size);
    
    // Convert blob to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        console.log('Converted to base64, length:', result.length);
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error fetching image as base64:', error);
    throw error;
  }
}

export default function ImageGallery({ images, isLoading, onImageSelect, onUseAsReference, isGenerating, isLoadingGeneratedImage, onLatestImageLoad }: ImageGalleryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  
  // Filter out broken images from the old "renders" bucket
  const validImages = images.filter(img => 
    !img.imageUrl?.includes('/renders/') || 
    img.imageUrl?.includes('/tattoo-renders/')
  );

  // Función para simplificar las descripciones de los prompts
  const simplifyPrompt = (prompt: string): string => {
    // Remover ", keep the same composition and elements" y textos repetitivos
    let simplified = prompt.replace(/, keep the same composition and elements/gi, '');
    
    // Mapeo de transformaciones comunes a descripciones cortas
    const transformations: { [key: string]: string } = {
      'warm smile': language === 'es' ? 'Sonrisa' : 'Smile',
      'serious expression': language === 'es' ? 'Serio' : 'Serious',
      'thoughtful gaze': language === 'es' ? 'Pensativo' : 'Thoughtful',
      'profile view': language === 'es' ? 'Perfil' : 'Profile',
      'front view': language === 'es' ? 'Frontal' : 'Front',
      'three-quarter view': language === 'es' ? 'Tres cuartos' : '3/4 View',
      'dutch angle': language === 'es' ? 'Ángulo dinámico' : 'Dynamic',
      'extreme close-up': language === 'es' ? 'Primer plano' : 'Close-up',
      'hyperrealistic': language === 'es' ? 'Hiperrealista' : 'Realistic',
      'black and white': language === 'es' ? 'Blanco y negro' : 'B&W',
      'vintage style': language === 'es' ? 'Estilo vintage' : 'Vintage',
      'dramatic lighting': language === 'es' ? 'Luz dramática' : 'Dramatic',
      'soft lighting': language === 'es' ? 'Luz suave' : 'Soft light',
    };
    
    // Buscar coincidencias y reemplazar
    const lowerPrompt = simplified.toLowerCase();
    for (const [key, value] of Object.entries(transformations)) {
      if (lowerPrompt.includes(key)) {
        return value;
      }
    }
    
    // Si no hay coincidencia específica, extraer las primeras palabras clave
    const words = simplified.split(' ').slice(0, 3).join(' ');
    
    // Limitar a 20 caracteres máximo
    return words.length > 20 ? words.substring(0, 17) + '...' : words;
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/images/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: language === 'es' ? "Eliminado" : "Success",
        description: language === 'es' ? "Imagen eliminada correctamente" : "Image deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
    },
    onError: () => {
      toast({
        title: language === 'es' ? "Error" : "Error",
        description: language === 'es' ? "No se pudo eliminar la imagen" : "Failed to delete image",
        variant: "destructive",
      });
    },
  });

  const handleDownload = async (image: GeneratedImage) => {
    try {
      const response = await fetch(image.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `generated-image-${image.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: language === 'es' ? "Descarga iniciada" : "Download started",
        description: language === 'es' ? "Tu imagen se está descargando" : "Your image is being downloaded",
      });
    } catch (error) {
      toast({
        title: language === 'es' ? "Error de descarga" : "Download failed",
        description: language === 'es' ? "No se pudo descargar la imagen" : "Failed to download the image",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (image: GeneratedImage) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Generated Image',
          text: image.prompt,
          url: image.imageUrl,
        });
      } catch (error) {
        // User cancelled sharing or sharing failed
      }
    } else {
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(image.imageUrl);
        toast({
          title: language === 'es' ? "Enlace copiado" : "Link copied",
          description: language === 'es' ? "URL de imagen copiada al portapapeles" : "Image URL copied to clipboard",
        });
      } catch (error) {
        toast({
          title: language === 'es' ? "Error al compartir" : "Share failed",
          description: language === 'es' ? "No se pudo copiar el enlace" : "Failed to copy link to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  if (isLoading && images.length === 0) {
    return (
      <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">{language === 'es' ? 'Cargando imágenes...' : 'Loading images...'}</h3>
          <p className="text-muted-foreground">{language === 'es' ? 'Por favor espera mientras cargamos tus imágenes.' : 'Please wait while we fetch your generated images.'}</p>
        </div>
      </div>
    );
  }

  if (validImages.length === 0) {
    return (
      <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Edit className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">{language === 'es' ? 'Sin imágenes aún' : 'No images yet'}</h3>
          <p className="text-muted-foreground">{language === 'es' ? 'Genera tu primera imagen para verla aquí.' : 'Generate your first image to see it here.'}</p>
        </div>
      </div>
    );
  }

  const latestImage = validImages[0];
  const previousImages = validImages.slice(1);

  return (
    <div className="space-y-6">

      {/* Image Generating State - Durante generación */}
      {isGenerating && (
        <div id="generation-area" className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-xl border border-blue-500/50 p-6 animate-pulse">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-white mb-1">
                {language === 'es' ? '🎨 Generando imagen con IA...' : '🎨 AI is generating your image...'}
              </div>
              <div className="text-sm text-blue-200">
                {language === 'es' ? 'InkVision está procesando tu solicitud' : 'InkVision is processing your request'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Loading State - Después de generar */}
      {isLoadingGeneratedImage && !isGenerating && (
        <div className="bg-card/60 backdrop-blur-sm rounded-xl border border-border/50 p-6">
          <div className="flex items-center justify-center space-x-4">
            <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center">
              <div className="text-lg font-medium text-green-400 mb-1">
                {language === 'es' ? 'Preparando imagen' : 'Preparing image'}
              </div>
              <div className="text-sm text-muted-foreground">
                {language === 'es' ? 'Imagen generada exitosamente' : 'Image generated successfully'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Latest Generation */}
      {latestImage && (
        <div id="latest-generation" className="bg-card/50 backdrop-blur-sm rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-foreground">{language === 'es' ? 'Última generación' : 'Latest Generation'}</h3>
                <p className="text-sm text-muted-foreground mt-1">{simplifyPrompt(latestImage.prompt)}</p>
                {latestImage.inputImageUrl && (
                  <div className="flex items-center mt-2">
                    <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                      {language === 'es' ? 'Edición' : 'Edit'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                  {language === 'es' ? 'Completo' : 'Complete'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="relative group">
            <OptimizedImage 
              src={latestImage.imageUrl}
              alt={latestImage.prompt}
              className="cursor-pointer transition-transform duration-300 group-hover:scale-105"
              onClick={() => onImageSelect(latestImage)}
              onLoad={onLatestImageLoad}
            />
            
            {/* Image Actions Overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(latestImage);
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(latestImage);
                  }}
                >
                  <Share className="h-4 w-4" />
                </Button>
                {onUseAsReference && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-amber-500/30 backdrop-blur-sm text-white hover:bg-amber-500/50"
                    onClick={async (e) => {
                      e.stopPropagation();
                      console.log('Edit button clicked, imageUrl:', latestImage.imageUrl);
                      try {
                        toast({
                          title: language === 'es' ? "Cargando..." : "Loading...",
                          description: language === 'es' ? "Convirtiendo imagen a base64" : "Converting image to base64",
                        });
                        
                        const base64Image = await fetchImageAsBase64(latestImage.imageUrl);
                        console.log('Base64 conversion complete, calling onUseAsReference');
                        console.log('Base64 length:', base64Image.length);
                        
                        onUseAsReference(base64Image);
                        
                        toast({
                          title: language === 'es' ? "Imagen cargada" : "Image loaded as reference",
                          description: language === 'es' ? "Ya puedes editar esta imagen con nuevas instrucciones" : "You can now edit this image with a new prompt",
                        });
                      } catch (error) {
                        console.error('Error in edit button click:', error);
                        toast({
                          title: language === 'es' ? "Error" : "Error",
                          description: language === 'es' ? "No se pudo cargar la imagen" : "Could not load the image",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageSelect(latestImage);
                  }}
                >
                  <Expand className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-background/30">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
              <div className="flex items-center space-x-4">
                <span>{formatDate(latestImage.createdAt)}</span>
                <span>{latestImage.width}x{latestImage.height}</span>
              </div>
            </div>
            
            {/* Action buttons row */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-muted/50 border-border text-foreground hover:bg-muted px-3 py-1.5 h-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(latestImage);
                  }}
                >
                  <Download className="h-3 w-3 mr-1" />
                  {language === 'es' ? 'Descargar' : 'Download'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-muted/50 border-border text-foreground hover:bg-muted px-3 py-1.5 h-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(latestImage);
                  }}
                >
                  <Share className="h-3 w-3 mr-1" />
                  {language === 'es' ? 'Compartir' : 'Share'}
                </Button>
                {onUseAsReference && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-amber-500/20 border-amber-500/30 text-amber-400 hover:bg-amber-500/30 px-3 py-1.5 h-auto"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        toast({
                          title: language === 'es' ? "Cargando..." : "Loading...",
                          description: language === 'es' ? "Convirtiendo imagen a base64" : "Converting image to base64",
                        });
                        
                        const base64Image = await fetchImageAsBase64(latestImage.imageUrl);
                        onUseAsReference(base64Image);
                        
                        toast({
                          title: language === 'es' ? "Imagen cargada" : "Image loaded as reference",
                          description: language === 'es' ? "Ya puedes editar esta imagen con nuevas instrucciones" : "You can now edit this image with a new prompt",
                        });
                      } catch (error) {
                        console.error('Error converting image:', error);
                        toast({
                          title: language === 'es' ? "Error" : "Error",
                          description: language === 'es' ? "No se pudo cargar la imagen" : "Could not load the image",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    {language === 'es' ? 'Usar como referencia' : 'Use as Reference'}
                  </Button>
                )}
              </div>
              
              <Button
                size="sm"
                variant="outline"
                className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 px-3 py-1.5 h-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteMutation.mutate(latestImage.id);
                }}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                {language === 'es' ? 'Eliminar' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Previous Generations */}
      {previousImages.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {previousImages.map((image) => (
            <div key={image.id} className="bg-card/50 backdrop-blur-sm rounded-xl border border-border overflow-hidden group">
              <div className="relative">
                <OptimizedImage 
                  src={image.imageUrl}
                  alt={image.prompt}
                  className="cursor-pointer transition-transform duration-300 group-hover:scale-105"
                  onClick={() => onImageSelect(image)}
                />
                
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 text-sm p-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(image);
                      }}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    {onUseAsReference && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-amber-500/30 backdrop-blur-sm text-white hover:bg-amber-500/50 text-sm p-2"
                        onClick={async (e) => {
                          e.stopPropagation();
                          console.log('Edit button clicked (previous), imageUrl:', image.imageUrl);
                          try {
                            toast({
                              title: language === 'es' ? "Cargando..." : "Loading...",
                              description: language === 'es' ? "Convirtiendo imagen a base64" : "Converting image to base64",
                            });
                            
                            const base64Image = await fetchImageAsBase64(image.imageUrl);
                            console.log('Base64 conversion complete (previous), calling onUseAsReference');
                            console.log('Base64 length:', base64Image.length);
                            
                            onUseAsReference(base64Image);
                            
                            toast({
                              title: language === 'es' ? "Imagen cargada" : "Image loaded as reference",
                              description: language === 'es' ? "Ya puedes editar esta imagen con nuevas instrucciones" : "You can now edit this image with a new prompt",
                            });
                          } catch (error) {
                            console.error('Error in edit button click (previous):', error);
                            toast({
                              title: language === 'es' ? "Error" : "Error",
                              description: language === 'es' ? "No se pudo cargar la imagen" : "Could not load the image",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 text-sm p-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onImageSelect(image);
                      }}
                    >
                      <Expand className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="p-3">
                <p className="text-sm text-foreground truncate">{simplifyPrompt(image.prompt)}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 mb-3">
                  <span>{formatDate(image.createdAt)}</span>
                  <span>{image.width}x{image.height}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-muted/50 border-border text-foreground hover:bg-muted px-2 py-1 h-auto text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(image);
                      }}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    {onUseAsReference && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-amber-500/20 border-amber-500/30 text-amber-400 hover:bg-amber-500/30 px-2 py-1 h-auto text-xs"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            toast({
                              title: language === 'es' ? "Cargando..." : "Loading...",
                              description: language === 'es' ? "Convirtiendo imagen a base64" : "Converting image to base64",
                            });
                            
                            const base64Image = await fetchImageAsBase64(image.imageUrl);
                            onUseAsReference(base64Image);
                            
                            toast({
                              title: language === 'es' ? "Imagen cargada" : "Image loaded as reference",
                              description: language === 'es' ? "Ya puedes editar esta imagen con nuevas instrucciones" : "You can now edit this image with a new prompt",
                            });
                          } catch (error) {
                            console.error('Error converting image:', error);
                            toast({
                              title: language === 'es' ? "Error" : "Error",
                              description: language === 'es' ? "No se pudo cargar la imagen" : "Could not load the image",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        {language === 'es' ? 'Editar' : 'Edit'}
                      </Button>
                    )}
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 px-2 py-1 h-auto text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(image.id);
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
