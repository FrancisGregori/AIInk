import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import ChatAssistant, { ChatAssistantRef } from "@/components/chat-assistant";
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles, 
  Download, 
  Image as ImageIcon, 
  Upload,
  Loader2,
  Settings,
  History,
  Copy,
  Languages,
  RefreshCw,
  Maximize2,
  Camera,
  Palette,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Edit
} from "lucide-react";
import Navigation from "@/components/Navigation";
import type { FluxProject } from "@shared/schema";

function DesignEditor() {
  const [prompt, setPrompt] = useState<string>("");
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>("Match Input");
  const [modelVariant, setModelVariant] = useState<string>("pro");
  const [width, setWidth] = useState<number>(1024);
  const [height, setHeight] = useState<number>(1024);
  const [language, setLanguage] = useState<"es" | "en">("es");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [comparePosition, setComparePosition] = useState<number>(50);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [matchInput, setMatchInput] = useState<boolean>(true); // Default to true for Match Input
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatAssistantRef = useRef<ChatAssistantRef>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Translations
  const t = {
    es: {
      title: "Design Editor",
      subtitle: "Editor de diseños con IA",
      prompt: "Descripción del diseño",
      promptPlaceholder: "Describe tu diseño de tatuaje aquí...",
      referenceImage: "Imagen para editar",
      generate: "Generar diseño",
      regenerate: "Regenerar",
      download: "Descargar",
      share: "Compartir",
      aspectRatio: "Proporción",
      model: "Modelo",
      dimensions: "Dimensiones",
      width: "Ancho",
      height: "Alto",
      inkVision: "InkVision - Asistente IA",
      sendMessage: "Enviar mensaje",
      messagePlaceholder: "Pregunta sobre diseños o solicita ideas...",
      apply: "Aplicar",
      compareMode: "Modo comparación",
      history: "Historial",
      settings: "Configuración",
      analyzing: "Analizando imagen...",
      generating: "Generando diseño...",
      suggestions: "Sugerencias rápidas",
      styles: "Estilos populares",
      traditional: "Tradicional",
      realism: "Realismo",
      geometric: "Geométrico",
      watercolor: "Acuarela",
      blackwork: "Blackwork",
      neoTraditional: "Neo-tradicional",
    },
    en: {
      title: "Design Editor",
      subtitle: "AI Design Editor",
      prompt: "Design description",
      promptPlaceholder: "Describe your tattoo design here...",
      referenceImage: "Image to edit",
      generate: "Generate design",
      regenerate: "Regenerate",
      download: "Download",
      share: "Share",
      aspectRatio: "Aspect ratio",
      model: "Model",
      dimensions: "Dimensions",
      width: "Width",
      height: "Height",
      inkVision: "InkVision - AI Assistant",
      sendMessage: "Send message",
      messagePlaceholder: "Ask about designs or request ideas...",
      apply: "Apply",
      compareMode: "Compare mode",
      history: "History",
      settings: "Settings",
      analyzing: "Analyzing image...",
      generating: "Generating design...",
      suggestions: "Quick suggestions",
      styles: "Popular styles",
      traditional: "Traditional",
      realism: "Realism",
      geometric: "Geometric",
      watercolor: "Watercolor",
      blackwork: "Blackwork",
      neoTraditional: "Neo-traditional",
    }
  };

  const txt = t[language];

  // Quick prompt suggestions
  const promptSuggestions = [
    { es: "Rosa realista en blanco y negro", en: "Realistic black and white rose" },
    { es: "Lobo geométrico minimalista", en: "Minimalist geometric wolf" },
    { es: "Mandala con detalles florales", en: "Mandala with floral details" },
    { es: "Dragón japonés tradicional", en: "Traditional Japanese dragon" },
    { es: "Fénix en acuarela", en: "Watercolor phoenix" },
    { es: "Calavera mexicana ornamental", en: "Ornamental Mexican skull" },
  ];

  // Fetch user's projects
  const { data: projects = [] } = useQuery<FluxProject[]>({
    queryKey: ["/api/flux/projects"],
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: { prompt: string; settings: any }) => {
      return apiRequest("POST", "/api/flux/create", {
        name: data.prompt.slice(0, 50),
        description: data.prompt,
        prompt: data.prompt,
        settings: data.settings,
        userId: "demo-user",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flux/projects"] });
      setIsGenerating(false);
    },
    onError: () => {
      setIsGenerating(false);
    },
  });

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setReferenceImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferencePreview(reader.result as string);
        // Automatically select Match Input when image is loaded
        setAspectRatio("Match Input");
        setMatchInput(true);
      };
      reader.readAsDataURL(file);
    }
  };







  // Handle design generation
  const handleGenerate = () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    
    const settings = {
      aspectRatio,
      modelVariant,
      width,
      height,
      referenceImage: referencePreview,
      matchInput,
    };
    
    createProjectMutation.mutate({ prompt, settings });
  };

  // Handle image download
  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper function to convert image URL to base64 (copied from FluxKontextAI)
  const fetchImageAsBase64 = async (imageUrl: string): Promise<string> => {
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
  };

  // Handle use as reference (copied from FluxKontextAI)
  const handleUseAsReference = async (imageUrl: string) => {
    try {
      toast({
        title: language === 'es' ? "Cargando imagen..." : "Loading image...",
        description: language === 'es' ? "Preparando imagen para editar" : "Preparing image for editing",
      });
      
      const base64Image = await fetchImageAsBase64(imageUrl);
      console.log('Base64 conversion complete, setting as reference');
      console.log('Base64 length:', base64Image.length);
      
      // Set as reference image
      setReferencePreview(base64Image);
      
      // Set default prompt for editing
      setPrompt("Front view looking directly at camera, keep the same composition and elements");
      
      // Set aspect ratio to match input
      setAspectRatio("Match Input");
      setMatchInput(true);
      
      toast({
        title: language === 'es' ? "Imagen cargada para editar" : "Image loaded for editing",
        description: language === 'es' ? "Ya puedes editar esta imagen con nuevas instrucciones" : "You can now edit this image with a new prompt",
      });
    } catch (error) {
      console.error('Error in use as reference:', error);
      toast({
        title: language === 'es' ? "Error" : "Error",
        description: language === 'es' ? "No se pudo cargar la imagen" : "Could not load the image",
        variant: "destructive",
      });
    }
  };

  // Update dimensions based on aspect ratio or match input
  useEffect(() => {
    if (aspectRatio === "Match Input") {
      if (referencePreview) {
        // Get dimensions from reference image
        const img = new Image();
        img.onload = () => {
          // Scale dimensions to fit within Flux Kontext bounds and round to multiples of 32
          const maxDim = 1408; // Max supported by Flux at 2.0MP
          let w = img.width;
          let h = img.height;
          
          // Scale down if needed
          if (w > maxDim || h > maxDim) {
            const scale = maxDim / Math.max(w, h);
            w = Math.round(w * scale);
            h = Math.round(h * scale);
          }
          
          // Round to nearest multiple of 32 (Flux requirement)
          w = Math.round(w / 32) * 32;
          h = Math.round(h / 32) * 32;
          
          // Ensure minimum size of 256
          w = Math.max(256, w);
          h = Math.max(256, h);
          
          setWidth(w);
          setHeight(h);
        };
        img.src = referencePreview;
      } else {
        // No image loaded, use default 1:1
        setWidth(1024);
        setHeight(1024);
      }
    } else {
      // Use predefined aspect ratios with optimal Flux resolutions (1.0MP standard)
      const ratios: { [key: string]: [number, number] } = {
        "1:1": [1024, 1024],     // Square
        "3:2": [1216, 832],      // Classic landscape
        "2:3": [832, 1216],      // Classic portrait
        "4:3": [1152, 896],      // Standard landscape
        "3:4": [896, 1152],      // Standard portrait
        "16:9": [1344, 768],     // Widescreen
        "9:16": [768, 1344],     // Vertical/Mobile
        "21:9": [1408, 608],     // Ultra-wide
        "9:21": [608, 1408],     // Ultra-tall
      };
      
      const [w, h] = ratios[aspectRatio] || [1024, 1024];
      setWidth(w);
      setHeight(h);
    }
  }, [aspectRatio, referencePreview]);
  
  // Reset match input when reference image is removed
  useEffect(() => {
    if (!referencePreview && matchInput) {
      setMatchInput(false);
    }
  }, [referencePreview, matchInput]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl font-bold">{txt.title}</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === "es" ? "en" : "es")}
            >
              <Languages className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-zinc-400">{txt.subtitle}</p>
          <p className="text-sm text-zinc-500 mt-2">by Darwin Enriquez</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - InkVision Chat (movido del flotante) */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <ChatAssistant 
                ref={chatAssistantRef}
                currentImage={referencePreview || undefined}
                onApplyPrompt={(newPrompt) => {
                  setPrompt(newPrompt);
                  // Auto-generate después de aplicar el prompt
                  setTimeout(() => {
                    if (referencePreview) {
                      handleGenerate();
                    }
                  }, 100);
                }}
                language={language}
                embedded={true}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Prompt Input */}
            <Card>
              <CardHeader>
                <CardTitle>{txt.referenceImage}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Reference Image */}
                <div>
                  <Label>{txt.referenceImage}</Label>
                  <div
                    className="mt-2 border-2 border-dashed border-zinc-700 rounded-lg p-4 text-center hover:border-zinc-500 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {referencePreview ? (
                      <div className="space-y-2">
                        <img
                          src={referencePreview}
                          alt="Reference"
                          className="max-h-32 mx-auto rounded"
                        />
                        <p className="text-xs text-zinc-500">{referenceImage?.name}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReferenceImage(null);
                            setReferencePreview(null);
                            setMatchInput(false);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                          className="text-xs"
                        >
                          {language === "es" ? "Eliminar imagen" : "Remove image"}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 mx-auto text-zinc-500" />
                        <p className="text-sm text-zinc-500">{language === 'es' ? 'Sube una imagen para editar' : 'Upload an image to edit'}</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Description Section */}
            <Card>
              <CardHeader>
                <CardTitle>{txt.prompt}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={txt.promptPlaceholder}
                  className="min-h-32"
                />
                
                {/* Quick Suggestions */}
                <div>
                  <Label className="text-xs text-zinc-500 mb-2">{txt.suggestions}</Label>
                  <div className="flex flex-wrap gap-2">
                    {promptSuggestions.map((sugg, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="cursor-pointer hover:bg-zinc-700"
                        onClick={() => setPrompt(sugg[language])}
                      >
                        {sugg[language]}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {txt.generating}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      {txt.generate}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Generation Settings */}
            <Card>
              <Collapsible open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-zinc-900/50 transition-colors">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        {txt.settings}
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isConfigOpen ? 'rotate-180' : ''}`} />
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    {/* Model Selection */}
                    <div>
                      <Label>{txt.model}</Label>
                      <RadioGroup value={modelVariant} onValueChange={setModelVariant} className="mt-2">
                        <div className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="pro" id="pro" />
                            <Label htmlFor="pro">Pro</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="max" id="max" />
                            <Label htmlFor="max">Max</Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Aspect Ratio */}
                    <div>
                      <Label>{txt.aspectRatio}</Label>
                      
                      <RadioGroup 
                        value={aspectRatio} 
                        onValueChange={(value) => {
                          setAspectRatio(value);
                          setMatchInput(value === "Match Input");
                        }}
                        className="mt-2"
                      >
                        <div className="grid grid-cols-3 gap-2">
                          {/* Standard aspect ratios */}
                          {["Match Input", "1:1", "3:2", "2:3", "4:3", "3:4", "16:9", "9:16", "21:9", "9:21"].map((ratio) => (
                            <div key={ratio} className="flex items-center space-x-1">
                              <RadioGroupItem 
                                value={ratio} 
                                id={ratio.replace(/[:\s]/g, '-')} 
                              />
                              <Label 
                                htmlFor={ratio.replace(/[:\s]/g, '-')} 
                                className="text-xs"
                                title={ratio === "Match Input" ? (language === "es" ? "Usar dimensiones de la imagen de referencia" : "Use reference image dimensions") : undefined}
                              >
                                {ratio}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Dimensions Display */}
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Label className="text-xs">{txt.width}</Label>
                        <p className="text-sm font-mono">{width}px</p>
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">{txt.height}</Label>
                        <p className="text-sm font-mono">{height}px</p>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </div>

          {/* Right Sidebar - Results */}
          <div className="lg:col-span-1 space-y-4">
            {/* Latest Design */}
            {projects.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Último diseño</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="relative group">
                      <Dialog>
                        <DialogTrigger asChild>
                          <img
                            src={projects[0].imageUrl || ""}
                            alt="Latest design"
                            className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            data-testid="img-latest-design"
                          />
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] p-2">
                          <div className="relative">
                            <img
                              src={projects[0].imageUrl || ""}
                              alt="Latest design full size"
                              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
                            />
                            <div className="absolute top-2 right-2 flex gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="bg-amber-500/30 backdrop-blur-sm text-white hover:bg-amber-500/50"
                                onClick={() => handleUseAsReference(projects[0].imageUrl || "")}
                                data-testid="button-use-as-reference-modal"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                {language === 'es' ? 'Editar imagen' : 'Edit image'}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => downloadImage(projects[0].imageUrl || "", `design-${projects[0].id}.png`)}
                                data-testid="button-download-modal"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                {language === 'es' ? 'Descargar' : 'Download'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      {/* Image Comparison Slider */}
                      {compareMode && referencePreview && (
                        <div className="absolute inset-0 overflow-hidden rounded-lg">
                          <img
                            src={referencePreview}
                            alt="Original"
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{ clipPath: `inset(0 ${100 - comparePosition}% 0 0)` }}
                          />
                          <div
                            className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
                            style={{ left: `${comparePosition}%` }}
                            onMouseDown={(e) => {
                              const startX = e.clientX;
                              const startPos = comparePosition;
                              
                              const handleMouseMove = (e: MouseEvent) => {
                                const delta = e.clientX - startX;
                                const newPos = Math.max(0, Math.min(100, startPos + (delta / 2)));
                                setComparePosition(newPos);
                              };
                              
                              const handleMouseUp = () => {
                                document.removeEventListener("mousemove", handleMouseMove);
                                document.removeEventListener("mouseup", handleMouseUp);
                              };
                              
                              document.addEventListener("mousemove", handleMouseMove);
                              document.addEventListener("mouseup", handleMouseUp);
                            }}
                          >
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-1">
                              <ChevronLeft className="h-3 w-3 text-black inline" />
                              <ChevronRight className="h-3 w-3 text-black inline" />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button 
                          size="icon" 
                          variant="secondary"
                          onClick={() => downloadImage(projects[0].imageUrl || "", `design-${projects[0].id}.png`)}
                          data-testid="button-download-latest"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="secondary"
                          className="bg-amber-500/30 backdrop-blur-sm text-white hover:bg-amber-500/50"
                          onClick={() => handleUseAsReference(projects[0].imageUrl || "")}
                          data-testid="button-use-as-reference-latest"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="secondary">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        {referencePreview && (
                          <Button 
                            size="icon" 
                            variant="secondary"
                            onClick={() => setCompareMode(!compareMode)}
                          >
                            <Maximize2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-xs text-zinc-500 line-clamp-2">{projects[0].prompt}</p>
                      <p className="text-xs text-zinc-600">{new Date(projects[0].createdAt || "").toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <History className="h-4 w-4" />
                  {txt.history}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {projects.slice(1, 6).map((project) => (
                      <div key={project.id} className="flex gap-2 p-2 hover:bg-zinc-900 rounded">
                        <Dialog>
                          <DialogTrigger asChild>
                            <img
                              src={project.imageUrl || ""}
                              alt={project.name}
                              className="w-12 h-12 rounded object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              data-testid={`img-history-${project.id}`}
                            />
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] p-2">
                            <div className="relative">
                              <img
                                src={project.imageUrl || ""}
                                alt={`${project.name} full size`}
                                className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
                              />
                              <div className="absolute top-2 right-2 flex gap-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="bg-amber-500/30 backdrop-blur-sm text-white hover:bg-amber-500/50"
                                  onClick={() => handleUseAsReference(project.imageUrl || "")}
                                  data-testid={`button-use-as-reference-history-${project.id}`}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  {language === 'es' ? 'Editar imagen' : 'Edit image'}
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => downloadImage(project.imageUrl || "", `design-${project.id}.png`)}
                                  data-testid={`button-download-history-${project.id}`}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  {language === 'es' ? 'Descargar' : 'Download'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs truncate">{project.name}</p>
                          <p className="text-xs text-zinc-600">{new Date(project.createdAt || "").toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Style Examples */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Palette className="h-4 w-4" />
                  {txt.styles}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {[txt.traditional, txt.realism, txt.geometric, txt.watercolor, txt.blackwork, txt.neoTraditional].map((style) => (
                    <Button
                      key={style}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setPrompt(`${style} ${prompt}`.trim())}
                    >
                      {style}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      {/* InkVision ahora está en el sidebar izquierdo */}
    </div>
  );
}

export default DesignEditor;