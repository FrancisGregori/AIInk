import { useState, useCallback, useRef } from "react";
import { Wand2, Settings, Circle, Globe, Upload, BookOpen } from "lucide-react";
import { Link } from "wouter";
import PromptForm, { type PromptFormRef } from "@/components/prompt-form";
import ImageGallery from "@/components/image-gallery";
import ImageModal from "@/components/image-modal";
import SettingsModal from "@/components/settings-modal";
import ChatAssistant, { type ChatAssistantRef } from "@/components/chat-assistant";
import { UserMenu } from "@/components/user-menu";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { GeneratedImage } from "@shared/schema";

export default function ImageGenerator() {
  const [showSettings, setShowSettings] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingGeneratedImage, setIsLoadingGeneratedImage] = useState(false);
  const [latestImageLoaded, setLatestImageLoaded] = useState(true);
  const { language, setLanguage, t } = useLanguage();
  const { toast } = useToast();
  
  // Refs for PromptForm instances
  const promptFormRefMobile = useRef<PromptFormRef>(null);
  const promptFormRefDesktop = useRef<PromptFormRef>(null);
  const chatAssistantRef = useRef<ChatAssistantRef>(null);

  const { data: images = [], isLoading, isFetching } = useQuery<GeneratedImage[]>({
    queryKey: ["/api/images"],
    refetchInterval: isGenerating ? 3000 : false, // Solo refrescar cuando se está generando
    staleTime: 30000, // Considerar datos válidos por 30 segundos
  });

  const hasApiKey = !!localStorage.getItem("replicate_api_token");
  
  // Callback to apply prompts from the chat assistant
  const handleApplyPrompt = useCallback((prompt: string) => {
    // Apply to both mobile and desktop forms
    promptFormRefMobile.current?.setPrompt(prompt);
    promptFormRefDesktop.current?.setPrompt(prompt);
    
    // Auto-generate image after applying the prompt from InkVision
    setTimeout(() => {
      // Use desktop form first, fall back to mobile
      if (promptFormRefDesktop.current) {
        promptFormRefDesktop.current.generateImage(prompt);
      } else if (promptFormRefMobile.current) {
        promptFormRefMobile.current.generateImage(prompt);
      }
    }, 100); // Small delay to ensure prompt is set before generating
  }, []);
  
  // Callback to open InkVision chat assistant
  const handleOpenInkVision = useCallback(() => {
    chatAssistantRef.current?.open();
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: language === 'es' ? 'Error' : 'Error',
        description: language === 'es' ? 'Por favor selecciona un archivo de imagen válido' : 'Please select a valid image file',
        variant: "destructive",
      });
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Data = e.target?.result as string;
          
          const response = await apiRequest("POST", "/api/upload", {
            imageData: base64Data,
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('Setting referenceImageUrl:', result.imageUrl ? 'YES' : 'NO');
            console.log('Image URL preview:', result.imageUrl ? result.imageUrl.substring(0, 50) : 'none');
            setReferenceImageUrl(result.imageUrl);
            toast({
              title: language === 'es' ? 'Imagen cargada' : 'Image uploaded',
              description: language === 'es' ? 'Ahora puedes usarla como referencia' : 'You can now use it as reference',
            });
          } else {
            throw new Error("Failed to get image URL");
          }
        } catch (uploadError) {
          console.error("Upload error:", uploadError);
          toast({
            title: language === 'es' ? 'Error' : 'Error',
            description: language === 'es' ? 'Error al subir imagen' : 'Failed to upload image',
            variant: "destructive",
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: language === 'es' ? 'Error' : 'Error',
        description: language === 'es' ? 'Error al procesar imagen' : 'Failed to process image',
        variant: "destructive",
      });
    }
  }, [language, toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  return (
    <div 
      className="min-h-screen bg-background text-foreground relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag and Drop Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card/90 border-2 border-dashed border-muted-foreground rounded-xl p-8 text-center">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <div className="text-xl font-semibold text-foreground mb-2">
              {language === 'es' ? 'Suelta la imagen aquí' : 'Drop image here'}
            </div>
            <div className="text-muted-foreground">
              {language === 'es' ? 'Para usar como imagen de referencia' : 'To use as reference image'}
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-2">
            {/* First row with logo and buttons */}
            <div className="flex items-center justify-between">
              {/* Left section - Logo only */}
              <div className="flex items-center">
                <img 
                  src="/attached_assets/1Asset 3zzz.png" 
                  alt="TattooStencilPro Logo" 
                  className="h-8 w-auto"
                />
              </div>
            
              {/* Right section - Navigation buttons */}
              <div className="flex items-center space-x-4">
                {/* Tips Button */}
                <Link href="/tips">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <BookOpen className="h-4 w-4 mr-2" />
                    {language === 'es' ? 'Consejos' : 'Tips'}
                  </Button>
                </Link>

                {/* Language Selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      <Globe className="h-4 w-4 mr-2" />
                      {language === 'es' ? 'ES' : 'EN'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card border-border">
                    <DropdownMenuItem 
                      onClick={() => setLanguage('es')}
                      className="text-foreground hover:bg-muted focus:bg-muted"
                    >
                      {t('spanish')}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setLanguage('en')}
                      className="text-foreground hover:bg-muted focus:bg-muted"
                    >
                      {t('english')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu */}
                <UserMenu />
              </div>
            </div>
            
            {/* Second row - Subtitle */}
            <div className="text-sm font-medium text-foreground text-center mt-1">
              {t('subtitle')}
            </div>
            
            {/* Third row - by Darwin Enriquez */}
            <div className="text-xs text-muted-foreground text-left mt-1">
              by Darwin Enriquez
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile Layout */}
        <div className="block lg:hidden space-y-6">
          {/* Form Section - Non-sticky on mobile */}
          <div className="w-full">
            <PromptForm 
              ref={promptFormRefMobile}
              referenceImageUrl={referenceImageUrl} 
              onGenerationStart={() => setIsGenerating(true)}
              onGenerationEnd={() => setIsGenerating(false)}
              onImageReady={() => {
                setLatestImageLoaded(false);
                setIsLoadingGeneratedImage(true);
              }}
              onReferenceImageChange={(imageUrl) => {
                console.log('ImageGenerator: onReferenceImageChange called with:', imageUrl ? 'YES' : 'NO');
                console.log('ImageGenerator: Image URL length:', imageUrl?.length || 0);
                setReferenceImageUrl(imageUrl);
              }}
              onOpenInkVision={handleOpenInkVision}
            />
          </div>
          
          {/* Gallery Section */}
          <div className="w-full">
            <ImageGallery 
              images={images} 
              isLoading={isLoading}
              isGenerating={isGenerating}
              isLoadingGeneratedImage={isLoadingGeneratedImage}
              onImageSelect={setSelectedImage}
              onUseAsReference={setReferenceImageUrl}
              onLatestImageLoad={() => {
                setIsLoadingGeneratedImage(false);
                setLatestImageLoaded(true);
              }}
            />
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6">
          {/* Input Panel - Sticky */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <PromptForm 
                ref={promptFormRefDesktop}
                referenceImageUrl={referenceImageUrl} 
                onGenerationStart={() => setIsGenerating(true)}
                onGenerationEnd={() => setIsGenerating(false)}
                onImageReady={() => {
                  setLatestImageLoaded(false);
                  setIsLoadingGeneratedImage(true);
                }}
                onReferenceImageChange={(imageUrl) => {
                  console.log('ImageGenerator: onReferenceImageChange called with:', imageUrl ? 'YES' : 'NO');
                  console.log('ImageGenerator: Image URL length:', imageUrl?.length || 0);
                  setReferenceImageUrl(imageUrl);
                }}
                onOpenInkVision={handleOpenInkVision}
              />
            </div>
          </div>

          {/* Gallery */}
          <div className="lg:col-span-2">
            <ImageGallery 
              images={images} 
              isLoading={isLoading}
              isGenerating={isGenerating}
              isLoadingGeneratedImage={isLoadingGeneratedImage}
              onImageSelect={setSelectedImage}
              onUseAsReference={setReferenceImageUrl}
              onLatestImageLoad={() => {
                setIsLoadingGeneratedImage(false);
                setLatestImageLoaded(true);
              }}
            />
          </div>
        </div>
      </main>

      {/* Chat Assistant */}
      <ChatAssistant 
        ref={chatAssistantRef}
        currentImage={referenceImageUrl}
        onApplyPrompt={handleApplyPrompt}
      />

      {/* Modals */}
      <ImageModal 
        image={selectedImage}
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
      />
      
      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}
