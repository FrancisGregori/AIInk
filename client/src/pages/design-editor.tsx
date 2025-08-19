import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
import { 
  Sparkles, 
  Send, 
  Download, 
  Image as ImageIcon, 
  Upload,
  Loader2,
  MessageSquare,
  Wand2,
  Settings,
  History,
  Copy,
  Languages,
  Brain,
  Bot,
  User,
  RefreshCw,
  Maximize2,
  Camera,
  Palette,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import Navigation from "@/components/Navigation";
import type { FluxProject, GeminiChat } from "@shared/schema";

interface InkVisionMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

function DesignEditor() {
  const [prompt, setPrompt] = useState<string>("");
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>("1:1");
  const [modelVariant, setModelVariant] = useState<string>("pro");
  const [width, setWidth] = useState<number>(512);
  const [height, setHeight] = useState<number>(512);
  const [language, setLanguage] = useState<"es" | "en">("es");
  const [chatMessages, setChatMessages] = useState<InkVisionMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [comparePosition, setComparePosition] = useState<number>(50);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Translations
  const t = {
    es: {
      title: "Design Editor",
      subtitle: "Editor de diseños con IA",
      prompt: "Descripción del diseño",
      promptPlaceholder: "Describe tu diseño de tatuaje aquí...",
      referenceImage: "Imagen de referencia",
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
      referenceImage: "Reference image",
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
        // Simulate image analysis
        analyzeImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Analyze image with InkVision
  const analyzeImage = (imageData: string) => {
    const analysisMessage: InkVisionMessage = {
      role: "assistant",
      content: language === "es" 
        ? "🎨 He analizado tu imagen de referencia. Detecté elementos que podrían funcionar bien en un diseño de tatuaje. ¿Te gustaría que sugiera algunos estilos basados en esta imagen?"
        : "🎨 I've analyzed your reference image. I detected elements that could work well in a tattoo design. Would you like me to suggest some styles based on this image?",
      timestamp: new Date(),
      suggestions: [
        language === "es" ? "Convertir a estilo blackwork" : "Convert to blackwork style",
        language === "es" ? "Añadir elementos geométricos" : "Add geometric elements",
        language === "es" ? "Crear versión realista" : "Create realistic version",
      ],
    };
    setChatMessages(prev => [...prev, analysisMessage]);
  };

  // Handle chat submission
  const handleChatSubmit = () => {
    if (!chatInput.trim()) return;

    const userMessage: InkVisionMessage = {
      role: "user",
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput("");

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: InkVisionMessage = {
        role: "assistant",
        content: generateAIResponse(chatInput, language),
        timestamp: new Date(),
        suggestions: generateSuggestions(chatInput, language),
      };
      setChatMessages(prev => [...prev, assistantMessage]);
      
      // Auto-scroll to bottom
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 1500);
  };

  // Generate AI response (simulation)
  const generateAIResponse = (input: string, lang: "es" | "en"): string => {
    const responses = {
      es: [
        "Excelente idea para un diseño. Te sugiero combinar elementos orgánicos con líneas geométricas para crear un contraste visual interesante.",
        "Para ese estilo, recomendaría usar trazos gruesos y sombras sólidas. Funcionaría muy bien en el antebrazo o la espalda.",
        "Considera añadir detalles ornamentales para darle más profundidad al diseño. Los patrones repetitivos pueden crear un efecto hipnótico.",
      ],
      en: [
        "Excellent design idea. I suggest combining organic elements with geometric lines to create an interesting visual contrast.",
        "For that style, I'd recommend using thick strokes and solid shadows. It would work great on the forearm or back.",
        "Consider adding ornamental details to give more depth to the design. Repetitive patterns can create a hypnotic effect.",
      ],
    };
    
    const langResponses = responses[lang];
    return langResponses[Math.floor(Math.random() * langResponses.length)];
  };

  // Generate suggestions based on input
  const generateSuggestions = (input: string, lang: "es" | "en"): string[] => {
    const suggestions = {
      es: [
        "Aplicar este estilo al diseño",
        "Ver ejemplos similares",
        "Modificar composición",
        "Cambiar paleta de colores",
      ],
      en: [
        "Apply this style to design",
        "View similar examples",
        "Modify composition",
        "Change color palette",
      ],
    };
    
    return suggestions[lang].slice(0, 3);
  };

  // Apply suggestion to prompt
  const applySuggestion = (suggestion: string) => {
    setPrompt(prev => `${prev} ${suggestion}`.trim());
    // Auto-scroll to generation area and trigger generation
    handleGenerate();
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
    };
    
    createProjectMutation.mutate({ prompt, settings });
  };

  // Update dimensions based on aspect ratio
  useEffect(() => {
    const ratios: { [key: string]: [number, number] } = {
      "1:1": [512, 512],
      "3:4": [384, 512],
      "4:3": [512, 384],
      "16:9": [512, 288],
      "9:16": [288, 512],
    };
    
    const [w, h] = ratios[aspectRatio] || [512, 512];
    setWidth(w);
    setHeight(h);
  }, [aspectRatio]);

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
          {/* Left Sidebar - InkVision Chat */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  {txt.inkVision}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea ref={chatScrollRef} className="h-96 pr-4">
                  <div className="space-y-4">
                    {chatMessages.length === 0 && (
                      <div className="text-center text-zinc-500 py-8">
                        <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">{txt.messagePlaceholder}</p>
                      </div>
                    )}
                    
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
                          {msg.role === "assistant" && <Bot className="h-5 w-5 mt-1 text-zinc-400" />}
                          <div className={`flex-1 rounded-lg p-3 ${
                            msg.role === "user" 
                              ? "bg-zinc-800 ml-8" 
                              : "bg-zinc-900 mr-8"
                          }`}>
                            <p className="text-sm">{msg.content}</p>
                          </div>
                          {msg.role === "user" && <User className="h-5 w-5 mt-1 text-zinc-400" />}
                        </div>
                        
                        {msg.suggestions && (
                          <div className="ml-7 space-y-1">
                            {msg.suggestions.map((sugg, sIdx) => (
                              <Button
                                key={sIdx}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-xs"
                                onClick={() => applySuggestion(sugg)}
                              >
                                <Wand2 className="h-3 w-3 mr-1" />
                                {sugg}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <Separator className="my-3" />
                
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleChatSubmit()}
                    placeholder={txt.messagePlaceholder}
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    onClick={handleChatSubmit}
                    disabled={!chatInput.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Prompt Input */}
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
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 mx-auto text-zinc-500" />
                        <p className="text-sm text-zinc-500">{txt.referenceImage}</p>
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {txt.settings}
                </CardTitle>
              </CardHeader>
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
                  <RadioGroup value={aspectRatio} onValueChange={setAspectRatio} className="mt-2">
                    <div className="grid grid-cols-5 gap-2">
                      {["1:1", "3:4", "4:3", "16:9", "9:16"].map((ratio) => (
                        <div key={ratio} className="flex items-center space-x-1">
                          <RadioGroupItem value={ratio} id={ratio} />
                          <Label htmlFor={ratio} className="text-xs">{ratio}</Label>
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
                      <img
                        src={projects[0].imageUrl || ""}
                        alt="Latest design"
                        className="w-full rounded-lg"
                      />
                      
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
                        <Button size="icon" variant="secondary">
                          <Download className="h-4 w-4" />
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
                      <div key={project.id} className="flex gap-2 p-2 hover:bg-zinc-900 rounded cursor-pointer">
                        <img
                          src={project.imageUrl || ""}
                          alt={project.name}
                          className="w-12 h-12 rounded object-cover"
                        />
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
    </div>
  );
}

export default DesignEditor;