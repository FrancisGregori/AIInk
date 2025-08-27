import React, { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { ChevronDown, Wand2, Info, Upload, X, Image, Languages, User, Smile, Camera, Palette, Lightbulb, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface PromptFormProps {
  referenceImageUrl?: string;
  onGenerationStart?: () => void;
  onGenerationEnd?: () => void;
  onImageReady?: () => void;
  onReferenceImageChange?: (imageUrl: string) => void;
  onOpenInkVision?: () => void;
}

export interface PromptFormRef {
  setPrompt: (prompt: string) => void;
  generateImage: (promptOverride?: string) => void;
}

const PromptForm = forwardRef<PromptFormRef, PromptFormProps>(({ referenceImageUrl, onGenerationStart, onGenerationEnd, onImageReady, onReferenceImageChange, onOpenInkVision }, ref) => {
  const [prompt, setPrompt] = useState("Front view looking directly at camera, keep the same composition and elements");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [imageSize, setImageSize] = useState("1024x1024");
  const { language } = useLanguage();
  const [aspectRatio, setAspectRatio] = useState("match_input_image");
  const [inputImageUrl, setInputImageUrl] = useState(referenceImageUrl || "");
  const [inputImageFile, setInputImageFile] = useState<File | null>(null);
  const [generationTimer, setGenerationTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [model, setModel] = useState<"max" | "pro">("pro");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Expose setPrompt and generateImage methods to parent component
  useImperativeHandle(ref, () => ({
    setPrompt: (newPrompt: string) => {
      setPrompt(newPrompt);
    },
    generateImage: (promptOverride?: string) => {
      // Use override prompt if provided, otherwise use current state
      const promptToUse = promptOverride || prompt;
      
      // Trigger generation programmatically
      if (!promptToUse.trim()) {
        toast({
          title: language === 'es' ? "Error" : "Error",
          description: language === 'es' ? "Por favor escribe una descripción" : "Please enter a prompt",
          variant: "destructive",
        });
        return;
      }

      const finalPrompt = promptToUse.trim();
      const [width, height] = inputImageUrl ? [1024, 1024] : imageSize.split('x').map(Number);
      
      console.log("Auto-generating from InkVision with:", {
        prompt: finalPrompt,
        inputImageUrl: inputImageUrl,
        hasInputImage: !!inputImageUrl,
        width,
        height,
        aspectRatio
      });
      
      // Show toast notification for auto-generation
      toast({
        title: language === 'es' ? "🎨 Generando imagen automáticamente" : "🎨 Auto-generating image",
        description: language === 'es' 
          ? "InkVision está procesando tu solicitud..." 
          : "InkVision is processing your request...",
        className: "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0",
        duration: 5000,
      });
      
      generateMutation.mutate({ 
        prompt: finalPrompt, 
        inputImageUrl: inputImageUrl || undefined,
        width, 
        height,
        aspectRatio,
        model
      });
    }
  }));

  // Update inputImageUrl when referenceImageUrl changes
  React.useEffect(() => {
    if (referenceImageUrl) {
      setInputImageUrl(referenceImageUrl);
      setPrompt("Front view looking directly at camera, keep the same composition and elements");
      setAspectRatio("match_input_image"); // Mantener las proporciones de la imagen subida
    }
  }, [referenceImageUrl]);
  const [promptCategory, setPromptCategory] = useState("face_poses");
  
  const promptSuggestions = {
    general: [
      "Convert to bold black and white tattoo stencil style",
      "Transform into traditional American tattoo design", 
      "Add tribal patterns and geometric elements",
      "Create realistic black and gray shading style",
      "Make it minimalist line art tattoo design"
    ],
    face_expressions: [
      "Warm smile",
      "Surprised expression",
      "Serious expression",
      "Playful grin",
      "Peaceful expression",
      "Tired eyes",
      "Joyful laughter",
      "Mysterious smile",
      "Shocked expression",
      "Confident look",
      "Dreamy gaze",
      "Worried expression",
      "Angry expression",
      "Sad expression"
    ],
    face_poses: [
      { icon: "●", text: "Frente", prompt: "Front view looking directly at camera" },
      { icon: "◀", text: "Izquierda", prompt: "Turn head slightly to the left" },
      { icon: "▶", text: "Derecha", prompt: "Turn head slightly to the right" },
      { icon: "▬", text: "Perfil", prompt: "Show complete side profile" },
      { icon: "◗", text: "3/4", prompt: "Three-quarter angle view" },
      { icon: "▲", text: "Arriba", prompt: "Look upward with hopeful gaze" },
      { icon: "▼", text: "Abajo", prompt: "Look down contemplatively" },
      { icon: "↩", text: "Hombro", prompt: "Look over shoulder toward camera" },
      { icon: "◆", text: "Inclinado", prompt: "Create dramatic tilted angle" },
      { icon: "◉", text: "Pensativo", prompt: "Chin resting on hand thoughtfully" },
      { icon: "◐", text: "Soñador", prompt: "Look up and to side with dreamy gaze" },
      { icon: "✦", text: "Dinámico", prompt: "Dynamic asymmetrical pose" }
    ],
    camera_angles: [
      "Bird's eye view",
      "Low angle",
      "Dutch angle",
      "Wide shot",
      "Medium shot",
      "Close-up",
      "Extreme close-up",
      "Over shoulder",
      "Side angle",
      "Three-quarter",
      "Front view",
      "High angle",
      "Eye level",
      "Ground level",
      "Aerial view",
      "Candid angle"
    ],
    style_changes: [
      "Pencil sketch",
      "Hyperrealistic",
      "Art Nouveau",
      "Charcoal drawing",
      "Watercolor",
      "Art Deco",
      "Oil painting",
      "Ink drawing",
      "Manga/Anime",
      "Photography",
      "Impressionist",
      "Minimalist",
      "Vintage engraving",
      "Vector art",
      "3D engraving",
      "Wood engraving"
    ],
    lighting: [
      "Soft light right",
      "Soft light left",
      "Butterfly lighting",
      "Rembrandt lighting",
      "Split lighting",
      "Rim light",
      "Golden hour",
      "Studio lighting",
      "Low-key dramatic",
      "High-key bright",
      "Window light",
      "Hard light",
      "Backlighting",
      "Color gels",
      "Ring light",
      "Three-point"
    ],
    animals: [
      "Make the cat sit upright with perfect posture and alert ears",
      "Change the dog's expression to playful with tongue hanging out happily",
      "Position the bird with wings spread wide in majestic flight",
      "Make the horse rear up on hind legs dramatically against the sky",
      "Show the lion with a regal pose and flowing mane in golden light",
      "Position the elephant with trunk raised high triumphantly",
      "Make the tiger crouch low in a hunting stance with intense focus",
      "Show the wolf howling with head tilted back toward the full moon",
      "Position the eagle perched proudly with piercing, intense gaze",
      "Make the dolphin jump gracefully out of crystal clear blue water",
      "Show the bear standing tall on hind legs intimidatingly",
      "Position the deer grazing peacefully in a sunlit forest clearing",
      "Make the monkey swing playfully from branch to branch",
      "Show the snake coiled elegantly with head raised alertly",
      "Position the owl with head turned almost completely around"
    ]
  };

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: async (data: { 
      prompt: string; 
      inputImageUrl?: string; 
      width?: number; 
      height?: number; 
      aspectRatio?: string; 
      model?: "max" | "pro";
    }) => {
      // Start generation
      onGenerationStart?.();
      
      // Start timer
      setGenerationTimer(0);
      const interval = setInterval(() => {
        setGenerationTimer(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);

      try {
        const response = await apiRequest("POST", "/api/generate", data);
        return response.json();
      } finally {
        // Stop timer
        clearInterval(interval);
        setTimerInterval(null);
      }
    },
    onSuccess: () => {
      toast({
        title: language === 'es' ? "¡Listo!" : "Success",
        description: language === 'es' ? "Tu imagen se ha generado correctamente" : "Image generated successfully!",
      });
      // Force immediate refresh of images
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
      queryClient.refetchQueries({ queryKey: ["/api/images"] });
      setGenerationTimer(0);
      onGenerationEnd?.();
      onImageReady?.(); // Llamar cuando la imagen esté lista para mostrar
    },
    onError: (error: any) => {
      toast({
        title: language === 'es' ? "Error" : "Error",
        description: language === 'es' ? "No se pudo generar la imagen. Por favor intenta de nuevo." : (error.message || "Failed to generate image. Please try again."),
        variant: "destructive",
      });
      setGenerationTimer(0);
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      onGenerationEnd?.();
    },
  });

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: language === 'es' ? "Error" : "Error",
        description: language === 'es' ? "Por favor selecciona un archivo de imagen válido" : "Please select a valid image file",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        
        try {
          // Upload to server to get a proper URL
          const response = await apiRequest("POST", "/api/upload", {
            imageData: result
          });
          
          const data = await response.json();
          
          if (data.imageUrl) {
            console.log('PromptForm: Image uploaded, URL:', data.imageUrl ? 'YES' : 'NO');
            console.log('PromptForm: Image preview:', data.imageUrl.substring(0, 50));
            setInputImageUrl(data.imageUrl);
            setInputImageFile(file);
            setAspectRatio("match_input_image"); // Mantener las proporciones de la imagen subida
            
            // Notify parent component about the new reference image
            if (onReferenceImageChange) {
              onReferenceImageChange(data.imageUrl);
            }
          } else {
            throw new Error("Failed to get image URL");
          }
        } catch (uploadError) {
          console.error("Upload error:", uploadError);
          toast({
            title: "Error",
            description: "Failed to upload image",
            variant: "destructive",
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process image",
        variant: "destructive",
      });
    }
  };

  // Function to detect if text is primarily in Spanish and translate to English
  const translateToEnglish = (text: string): string => {
    // First check for exact phrase matches
    const phraseTranslations: { [key: string]: string } = {
      "Vista frontal": "Front view",
      "Vista de perfil": "Profile view", 
      "Vista lateral": "Side view",
      "Vista de tres cuartos": "Three-quarter view",
      "Vista desde arriba": "Top view",
      "Vista desde abajo": "Bottom view",
      "Ángulo holandés": "Dutch angle",
      "Vista de pájaro": "Bird's eye view",
      "Mirada hacia arriba": "Looking up",
      "Mirada hacia abajo": "Looking down",
      "Sonrisa cálida": "Warm smile",
      "Expresión seria": "Serious expression",
      "Ojos cerrados": "Eyes closed",
      "Mirada pensativa": "Thoughtful gaze",
      "Risa genuina": "Genuine laugh",
      "Expresión melancólica": "Melancholic expression",
      "Cambiar la expresión": "Change the expression",
      "Inclinar la cabeza": "Tilt the head",
      "Mirar hacia arriba con esperanza": "Look upward with hopeful gaze",
      "Mirar hacia abajo pensativo": "Look downward thoughtfully",
      "Ángulo holandés para composición dinámica": "Dutch angle tilt for dynamic, off-kilter composition",
      "Toma desde arriba mirando hacia abajo": "Shot from above looking down"
    };

    // Check for exact phrase matches first
    for (const [spanish, english] of Object.entries(phraseTranslations)) {
      if (text.toLowerCase().includes(spanish.toLowerCase())) {
        return text.replace(new RegExp(spanish, 'gi'), english);
      }
    }

    // Common Spanish words and patterns
    const spanishWords = [
      'el', 'la', 'los', 'las', 'de', 'del', 'en', 'con', 'por', 'para', 'un', 'una', 'y', 'o',
      'que', 'se', 'es', 'son', 'está', 'están', 'tiene', 'tienen', 'hace', 'hacer',
      'cara', 'rostro', 'sonrisa', 'ojos', 'cabello', 'pelo', 'negro', 'blanco', 'gris',
      'tatuaje', 'diseño', 'estilo', 'tradicional', 'realista', 'tribal', 'minimalista',
      'agregar', 'agrega', 'cambiar', 'cambia', 'mostrar', 'muestra', 'crear', 'crea',
      'transformar', 'transforma', 'convertir', 'convierte', 'añadir', 'añade'
    ];

    // Word-by-word translation mappings
    const translations: { [key: string]: string } = {
      // Basic words
      'agregar': 'add',
      'agrega': 'add',
      'añadir': 'add',
      'añade': 'add',
      'cambiar': 'change',
      'cambia': 'change',
      'mostrar': 'show',
      'muestra': 'show',
      'crear': 'create',
      'crea': 'create',
      'transformar': 'transform',
      'transforma': 'transform',
      'convertir': 'convert',
      'convierte': 'convert',
      
      // Body parts and features
      'cara': 'face',
      'rostro': 'face',
      'ojos': 'eyes',
      'ojo': 'eye',
      'sonrisa': 'smile',
      'cabello': 'hair',
      'pelo': 'hair',
      'expresión': 'expression',
      'expresion': 'expression',
      
      // Colors
      'negro': 'black',
      'blanco': 'white',
      'gris': 'gray',
      'azul': 'blue',
      'rojo': 'red',
      'verde': 'green',
      
      // Tattoo styles
      'tatuaje': 'tattoo',
      'diseño': 'design',
      'estilo': 'style',
      'tradicional': 'traditional',
      'realista': 'realistic',
      'tribal': 'tribal',
      'minimalista': 'minimalist',
      
      // Animals
      'cuervo': 'raven',
      'cuervos': 'ravens',
      'águila': 'eagle',
      'lobo': 'wolf',
      'león': 'lion',
      'serpiente': 'snake',
      
      // Positions/directions
      'arriba': 'above',
      'abajo': 'below',
      'encima': 'on top',
      'debajo': 'underneath',
      'al lado': 'beside',
      'alrededor': 'around',
      
      // Conjunctions and prepositions
      'y': 'and',
      'con': 'with',
      'sin': 'without',
      'en': 'in',
      'sobre': 'on',
      'bajo': 'under',
      'entre': 'between',
      'hacia': 'towards',
      'desde': 'from',
      'hasta': 'until',
      'para': 'for',
      'por': 'by',
      'de': 'of',
      'del': 'of the',
      'un': 'a',
      'una': 'a',
      'el': 'the',
      'la': 'the',
      'los': 'the',
      'las': 'the'
    };

    // Check if the text contains Spanish words
    const words = text.toLowerCase().split(/\s+/);
    const spanishWordCount = words.filter(word => spanishWords.includes(word)).length;
    const isSpanish = spanishWordCount > words.length * 0.3; // If more than 30% are Spanish words

    if (!isSpanish) {
      return text; // Return original if not detected as Spanish
    }

    // Perform basic translation
    let translatedText = text.toLowerCase();
    
    // Replace whole words only
    Object.entries(translations).forEach(([spanish, english]) => {
      const regex = new RegExp(`\\b${spanish}\\b`, 'gi');
      translatedText = translatedText.replace(regex, english);
    });

    return translatedText;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast({
        title: language === 'es' ? "Error" : "Error",
        description: language === 'es' ? "Por favor escribe una descripción" : "Please enter a prompt",
        variant: "destructive",
      });
      return;
    }

    // Don't auto-translate anymore, user controls this with the translate button
    const finalPrompt = prompt.trim();

    const [width, height] = inputImageUrl ? [1024, 1024] : imageSize.split('x').map(Number);
    
    console.log("About to generate with:", {
      prompt: finalPrompt,
      inputImageUrl: inputImageUrl,
      hasInputImage: !!inputImageUrl,
      width,
      height,
      aspectRatio
    });
    
    generateMutation.mutate({ 
      prompt: finalPrompt, 
      inputImageUrl: inputImageUrl || undefined,
      width, 
      height,
      aspectRatio,
      model
    });
  };

  return (
    <div 
      className="bg-card/50 backdrop-blur-sm rounded-xl border border-border p-4 lg:sticky lg:top-24"
    >
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Generate Image</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main Prompt Input */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label htmlFor="prompt" className="text-foreground">
              {language === 'es' ? '¿Qué quieres cambiar?' : 'What do you want to change?'}
            </Label>
            {onOpenInkVision && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onOpenInkVision}
                className="bg-amber-500/20 border-amber-500/30 text-amber-400 hover:bg-amber-500/30 flex items-center gap-2 px-3 py-1"
              >
                <div className="relative">
                  <MessageCircle className="h-3.5 w-3.5" />
                  <Sparkles className="h-2 w-2 absolute -top-0.5 -right-0.5 text-yellow-400" />
                </div>
                <span className="text-xs font-medium">InkVision</span>
              </Button>
            )}
          </div>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="w-full bg-input border-border text-foreground placeholder-muted-foreground focus:ring-ring focus:border-ring resize-none"
            placeholder={inputImageUrl ? 
              (language === 'es' ? "Describe los cambios que quieres hacer..." : "Describe the changes you want to make...") : 
              (language === 'es' ? "Describe la imagen que quieres generar..." : "Describe the image you want to generate...")
            }
            required
          />
        </div>

        {/* Input Image Upload */}
        <div>
          <Label className="text-foreground mb-2">
            Reference Image (Optional)
          </Label>
          <div className="space-y-3">
            {inputImageUrl ? (
              <div className="relative">
                <div className="w-full max-h-80 overflow-hidden rounded-lg border border-border">
                  <img 
                    src={inputImageUrl} 
                    alt="Input reference" 
                    className="w-full h-auto object-contain"
                    loading="eager"
                    style={{ maxHeight: '320px' }}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setInputImageUrl("");
                    setInputImageFile(null);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Image className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">
                  {language === 'es' 
                    ? 'Arrastra una imagen aquí o haz clic para subirla' 
                    : 'Drag an image here or click to upload'
                  }
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(file);
                      // Reset the input so the same file can be selected again if needed
                      e.target.value = '';
                    }
                  }}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose Image
                </Button>
              </div>
            )}
          </div>
        </div>



        {/* Advanced Parameters */}
        <div className="space-y-4">
          <button 
            type="button" 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-sm text-slate-400 hover:text-slate-300 transition-colors"
          >
            <span>{language === 'es' ? 'Opciones adicionales' : 'Additional Options'}</span>
            <ChevronDown className={`w-4 h-4 transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>
          
          {showAdvanced && (
            <div className="space-y-4">
              {/* AI Model Selection */}
              <div>
                <Label className="text-foreground mb-2">AI Model</Label>
                <Select value={model} onValueChange={(value: "max" | "pro") => setModel(value)}>
                  <SelectTrigger className="w-full bg-input border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="max">FLUX Kontext Max (Default - More Reliable)</SelectItem>
                    <SelectItem value="pro">FLUX Kontext Pro (Faster Processing)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {model === "max" 
                    ? (language === 'es' ? 'Modelo por defecto con mejor calidad' : 'Default model with better quality')
                    : (language === 'es' ? 'Modelo más rápido para procesamiento' : 'Faster model for processing')
                  }
                </p>
              </div>

              {!inputImageUrl && (
                <div>
                  <Label className="text-foreground mb-2">Image Size</Label>
                  <Select value={imageSize} onValueChange={setImageSize}>
                    <SelectTrigger className="w-full bg-input border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="1024x1024">1024x1024 (Square)</SelectItem>
                      <SelectItem value="1024x768">1024x768 (Landscape)</SelectItem>
                      <SelectItem value="768x1024">768x1024 (Portrait)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {inputImageUrl && (
                <div>
                  <Label className="text-foreground mb-2">Aspect Ratio</Label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger className="w-full bg-input border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="match_input_image">Match Input Image</SelectItem>
                      <SelectItem value="1:1">1:1 (Square)</SelectItem>
                      <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                      <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                      <SelectItem value="4:3">4:3 (Classic)</SelectItem>
                      <SelectItem value="3:4">3:4 (Portrait)</SelectItem>
                      <SelectItem value="3:2">3:2 (Photo)</SelectItem>
                      <SelectItem value="2:3">2:3 (Photo Portrait)</SelectItem>
                      <SelectItem value="4:5">4:5 (Instagram)</SelectItem>
                      <SelectItem value="5:4">5:4 (Instagram Landscape)</SelectItem>
                      <SelectItem value="21:9">21:9 (Ultrawide)</SelectItem>
                      <SelectItem value="9:21">9:21 (Ultrawide Portrait)</SelectItem>
                      <SelectItem value="2:1">2:1 (Panoramic)</SelectItem>
                      <SelectItem value="1:2">1:2 (Tall)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Generate Button */}
        <Button 
          type="submit" 
          disabled={generateMutation.isPending}
          className={`w-full font-semibold py-3 transition-all duration-200 ${
            generateMutation.isPending 
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white animate-pulse' 
              : 'bg-primary hover:bg-primary/90 text-primary-foreground'
          }`}
        >
          <div className="flex items-center justify-center space-x-3">
            {generateMutation.isPending ? (
              <>
                {/* Enhanced Loading Animation */}
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-semibold animate-pulse">
                    {language === 'es' ? 'Generando imagen...' : 'Generating image...'}
                  </span>
                  <span className="text-xs text-white/80 font-mono">
                    {Math.floor(generationTimer / 60)}:{String(generationTimer % 60).padStart(2, '0')} • {Math.round((generationTimer / 120) * 100)}%
                  </span>
                </div>
              </>
            ) : (
              <>
                <Wand2 className="mr-1 h-5 w-5" />
                <span className="text-base">{language === 'es' ? 'Generar Imagen' : 'Generate Image'}</span>
              </>
            )}
          </div>
        </Button>




      </form>
      
      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex flex-wrap gap-2 mb-3">
          {/* Face Poses Button */}
          <button
            type="button"
            onClick={() => setPromptCategory(promptCategory === 'face_poses' ? '' : 'face_poses')}
            className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              promptCategory === 'face_poses' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'bg-muted/50 hover:bg-muted text-foreground'
            }`}
          >
            <User className="h-3.5 w-3.5 mr-1.5" />
            {language === 'es' ? 'Posiciones' : 'Poses'}
          </button>

          {/* Expressions Button */}
          <button
            type="button"
            onClick={() => setPromptCategory(promptCategory === 'face_expressions' ? '' : 'face_expressions')}
            className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              promptCategory === 'face_expressions' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'bg-muted/50 hover:bg-muted text-foreground'
            }`}
          >
            <Smile className="h-3.5 w-3.5 mr-1.5" />
            {language === 'es' ? 'Expresiones' : 'Expressions'}
          </button>

          {/* Angles Button */}
          <button
            type="button"
            onClick={() => setPromptCategory(promptCategory === 'camera_angles' ? '' : 'camera_angles')}
            className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              promptCategory === 'camera_angles' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'bg-muted/50 hover:bg-muted text-foreground'
            }`}
          >
            <Camera className="h-3.5 w-3.5 mr-1.5" />
            {language === 'es' ? 'Vistas' : 'Angles'}
          </button>

          {/* Styles Button */}
          <button
            type="button"
            onClick={() => setPromptCategory(promptCategory === 'style_changes' ? '' : 'style_changes')}
            className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              promptCategory === 'style_changes' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'bg-muted/50 hover:bg-muted text-foreground'
            }`}
          >
            <Palette className="h-3.5 w-3.5 mr-1.5" />
            {language === 'es' ? 'Estilos' : 'Styles'}
          </button>

          {/* Lighting Button */}
          <button
            type="button"
            onClick={() => setPromptCategory(promptCategory === 'lighting' ? '' : 'lighting')}
            className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              promptCategory === 'lighting' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'bg-muted/50 hover:bg-muted text-foreground'
            }`}
          >
            <Lightbulb className="h-3.5 w-3.5 mr-1.5" />
            {language === 'es' ? 'Iluminación' : 'Lighting'}
          </button>
        </div>

        {/* Dropdown Content */}
        {promptCategory === 'face_poses' && (
              <div className="mt-2 p-2 bg-background/70 rounded-lg border border-border/50">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-24 overflow-y-auto">
                  {promptSuggestions.face_poses.map((pose: any, index: number) => (
                    <button
                      key={index}
                      type="button"
                      className="flex flex-col items-center p-2 bg-muted/50 hover:bg-muted rounded text-xs text-foreground hover:text-foreground transition-colors"
                      onClick={() => {
                        const newPrompt = inputImageUrl 
                          ? `${pose.prompt}, keep the same composition and elements`
                          : pose.prompt;
                        setPrompt(newPrompt);
                        setPromptCategory('');
                      }}
                      title={pose.prompt}
                    >
                      <span className="text-lg mb-1">{pose.icon}</span>
                      <span className="text-center leading-tight">
                        {language === 'es' ? 
                          pose.text : 
                          pose.text
                            .replace('Frente', 'Front')
                            .replace('Izquierda', 'Left')
                            .replace('Derecha', 'Right')
                            .replace('Perfil', 'Profile')
                            .replace('Arriba', 'Up')
                            .replace('Abajo', 'Down')
                            .replace('Hombro', 'Shoulder')
                            .replace('Inclinado', 'Tilted')
                            .replace('Pensativo', 'Thinking')
                            .replace('Soñador', 'Dreamy')
                            .replace('Dinámico', 'Dynamic')
                        }
                      </span>
                    </button>
                  ))}
                </div>
              </div>
        )}

        {promptCategory === 'face_expressions' && (
          <div className="mt-2 p-2 bg-background/70 rounded-lg border border-border/50">
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
              {promptSuggestions.face_expressions.map((suggestion, index) => {
                const translatedSuggestion = language === 'es' ? 
                  suggestion
                    .replace('Warm smile', 'Sonrisa cálida')
                    .replace('Surprised expression', 'Sorprendido')
                    .replace('Serious expression', 'Serio')
                    .replace('Playful grin', 'Juguetón')
                    .replace('Peaceful expression', 'Tranquilo')
                    .replace('Tired eyes', 'Cansado')
                    .replace('Joyful laughter', 'Risa alegre')
                    .replace('Mysterious smile', 'Misterioso')
                    .replace('Shocked expression', 'Asombrado')
                    .replace('Confident look', 'Confiado')
                    .replace('Dreamy gaze', 'Soñador')
                    .replace('Worried expression', 'Preocupado')
                    .replace('Angry expression', 'Enojado')
                    .replace('Sad expression', 'Triste')
                  : suggestion;
                
                return (
                  <button
                    key={index}
                    type="button"
                    className="px-3 py-1.5 bg-muted/50 hover:bg-muted rounded text-xs text-foreground hover:text-foreground transition-colors whitespace-nowrap"
                    onClick={() => {
                      const newPrompt = inputImageUrl 
                        ? `${suggestion}, keep the same composition and elements`
                        : suggestion;
                      setPrompt(newPrompt);
                      setPromptCategory('');
                    }}
                  >
                    {translatedSuggestion}
                  </button>
                );
              })}
            </div>
          </div>
        )}
            
        {promptCategory === 'camera_angles' && (
          <div className="mt-2 p-2 bg-background/70 rounded-lg border border-border/50">
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {promptSuggestions.camera_angles.map((suggestion, index) => {
                    const translatedSuggestion = language === 'es' ? 
                      suggestion
                        .replace("Bird's eye view", 'Vista aérea')
                        .replace('Low angle', 'Ángulo bajo')
                        .replace('Dutch angle', 'Ángulo holandés')
                        .replace('Wide shot', 'Plano general')
                        .replace('Medium shot', 'Plano medio')
                        .replace('Close-up', 'Primer plano')
                        .replace('Extreme close-up', 'Primerísimo plano')
                        .replace('Over shoulder', 'Sobre hombro')
                        .replace('Side angle', 'Ángulo lateral')
                        .replace('Three-quarter', 'Tres cuartos')
                        .replace('Front view', 'Vista frontal')
                        .replace('High angle', 'Ángulo alto')
                        .replace('Eye level', 'Nivel de ojos')
                        .replace('Ground level', 'Nivel del suelo')
                        .replace('Aerial view', 'Vista aérea')
                        .replace('Candid angle', 'Ángulo natural')
                      : suggestion;
                    
                    return (
                      <button
                        key={index}
                        type="button"
                        className="px-3 py-1.5 bg-muted/50 hover:bg-muted rounded text-xs text-foreground hover:text-foreground transition-colors whitespace-nowrap"
                        onClick={() => {
                          const newPrompt = inputImageUrl 
                            ? `${suggestion}, keep the same composition and elements`
                            : suggestion;
                          setPrompt(newPrompt);
                          setPromptCategory('');
                        }}
                      >
                        {translatedSuggestion}
                      </button>
                    );
              })}
            </div>
          </div>
        )}

        {promptCategory === 'style_changes' && (
          <div className="mt-2 p-2 bg-background/70 rounded-lg border border-border/50">
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {promptSuggestions.style_changes.map((suggestion, index) => {
                    const translatedSuggestion = language === 'es' ? 
                      suggestion
                        .replace('Pencil sketch', 'Boceto a lápiz')
                        .replace('Hyperrealistic', 'Hiperrealista')
                        .replace('Art Nouveau', 'Art Nouveau')
                        .replace('Charcoal drawing', 'Carboncillo')
                        .replace('Watercolor', 'Acuarela')
                        .replace('Art Deco', 'Art Deco')
                        .replace('Oil painting', 'Óleo')
                        .replace('Ink drawing', 'Tinta')
                        .replace('Manga/Anime', 'Manga/Anime')
                        .replace('Photography', 'Fotografía')
                        .replace('Impressionist', 'Impresionista')
                        .replace('Minimalist', 'Minimalista')
                        .replace('Vintage engraving', 'Grabado vintage')
                        .replace('Vector art', 'Arte vectorial')
                        .replace('3D engraving', 'Grabado 3D')
                        .replace('Wood engraving', 'Grabado en madera')
                      : suggestion;
                    
                    return (
                      <button
                        key={index}
                        type="button"
                        className="px-3 py-1.5 bg-muted/50 hover:bg-muted rounded text-xs text-foreground hover:text-foreground transition-colors whitespace-nowrap"
                        onClick={() => {
                          const newPrompt = inputImageUrl 
                            ? `${suggestion}, keep the same composition and elements`
                            : suggestion;
                          setPrompt(newPrompt);
                          setPromptCategory('');
                        }}
                      >
                        {translatedSuggestion}
                      </button>
                    );
              })}
            </div>
          </div>
        )}
            
        {promptCategory === 'lighting' && (
          <div className="mt-2 p-2 bg-background/70 rounded-lg border border-border/50">
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {promptSuggestions.lighting.map((suggestion, index) => {
                    const translatedSuggestion = language === 'es' ? 
                      suggestion
                        .replace('Soft light right', 'Luz suave derecha')
                        .replace('Soft light left', 'Luz suave izquierda')
                        .replace('Butterfly lighting', 'Luz mariposa')
                        .replace('Rembrandt lighting', 'Luz Rembrandt')
                        .replace('Split lighting', 'Luz dividida')
                        .replace('Rim light', 'Luz de contorno')
                        .replace('Golden hour', 'Hora dorada')
                        .replace('Studio lighting', 'Luz de estudio')
                        .replace('Low-key dramatic', 'Dramático oscuro')
                        .replace('High-key bright', 'Brillante claro')
                        .replace('Window light', 'Luz de ventana')
                        .replace('Hard light', 'Luz dura')
                        .replace('Backlighting', 'Contraluz')
                        .replace('Color gels', 'Geles de color')
                        .replace('Ring light', 'Luz anular')
                        .replace('Three-point', 'Tres puntos')
                      : suggestion;
                    
                    return (
                      <button
                        key={index}
                        type="button"
                        className="px-3 py-1.5 bg-muted/50 hover:bg-muted rounded text-xs text-foreground hover:text-foreground transition-colors whitespace-nowrap"
                        onClick={() => {
                          const newPrompt = inputImageUrl 
                            ? `${suggestion}, keep the same composition and elements`
                            : suggestion;
                          setPrompt(newPrompt);
                          setPromptCategory('');
                        }}
                      >
                        {translatedSuggestion}
                      </button>
                    );
              })}
            </div>
          </div>
        )}
      </div>
      

    </div>
  );
});

PromptForm.displayName = "PromptForm";

export default PromptForm;
