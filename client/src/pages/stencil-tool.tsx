import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Upload, 
  Download, 
  Image as ImageIcon, 
  Sparkles, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Camera,
  Copy,
  Share2,
  Zap,
  Palette,
  Languages,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from "lucide-react";
import Navigation from "@/components/Navigation";
import type { StencilStyle, StencilJob } from "@shared/schema";

function StencilTool() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>("steven");
  const [pngOutline, setPngOutline] = useState<boolean>(true);
  const [lineColor, setLineColor] = useState<string>("black");
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState<"slider" | "side-by-side" | null>(null);
  const [comparePosition, setComparePosition] = useState<number>(50);
  const [language, setLanguage] = useState<"es" | "en">("es");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Translations
  const t = {
    es: {
      title: "Transformador de Stencils",
      subtitle: "Convierte imágenes en stencils profesionales usando IA",
      process: "Procesar",
      gallery: "Galería",
      history: "Historial",
      uploadImage: "Subir Imagen",
      dragDrop: "Arrastra y suelta tu imagen aquí",
      or: "o",
      selectFile: "Selecciona archivo",
      changeFile: "Cambiar archivo",
      supportedFormats: "Soporta JPG, PNG, GIF hasta 10MB",
      stencilStyle: "Estilo de Stencil",
      exclusiveModels: "Modelos exclusivos de IA entrenados con líneas características de cada artista",
      settings: "Configuración",
      pngOutline: "PNG Outline (Sin Fondo)",
      linesOnly: "Solo líneas - para fácil transferencia",
      lineColorLabel: "Color de línea del stencil",
      pickColor: "Elige el color de línea:",
      createStencil: "Crear Stencil",
      processing: "Procesando...",
      download: "Descargar PNG",
      reset: "Reiniciar",
      preview: "Vista Previa",
      sideBySide: "Lado a lado",
      slider: "Deslizador",
      original: "Original",
      processed: "Procesado",
      status: "Estado",
      style: "Estilo",
      completed: "Completado",
      pending: "Pendiente",
      noImage: "Sin imagen seleccionada",
      procreateInstructions: "Para usar en Procreate: Mantén presionada la imagen del stencil y selecciona 'Copiar', luego pégala directamente en Procreate.",
      recentWork: "Trabajos Recientes",
      yourGallery: "Tu galería de stencils procesados",
      noGalleryItems: "Aún no hay stencils procesados",
      shareLink: "Compartir enlace",
      copyLink: "Copiar enlace",
      downloadAll: "Descargar todo",
      deleteAll: "Eliminar todo",
      credits: "Créditos",
      unlimited: "Ilimitados",
    },
    en: {
      title: "Stencil Transformer",
      subtitle: "Convert images to professional stencils using AI",
      process: "Process",
      gallery: "Gallery",
      history: "History",
      uploadImage: "Upload Image",
      dragDrop: "Drag and drop your image here",
      or: "or",
      selectFile: "Select file",
      changeFile: "Change file",
      supportedFormats: "Supports JPG, PNG, GIF up to 10MB",
      stencilStyle: "Stencil Style",
      exclusiveModels: "Exclusive AI models trained on each artist's signature lines",
      settings: "Settings",
      pngOutline: "PNG Outline (No Background)",
      linesOnly: "Lines only - for easy transfer",
      lineColorLabel: "Stencil Line Color",
      pickColor: "Pick the line color:",
      createStencil: "Create Stencil",
      processing: "Processing...",
      download: "Download PNG",
      reset: "Reset",
      preview: "Preview",
      sideBySide: "Side by Side",
      slider: "Slider",
      original: "Original",
      processed: "Processed",
      status: "Status",
      style: "Style",
      completed: "Completed",
      pending: "Pending",
      noImage: "No image selected",
      procreateInstructions: "To use in Procreate: Press and hold the stencil image above and select 'Copy', then paste it directly into Procreate.",
      recentWork: "Recent Work",
      yourGallery: "Your processed stencils gallery",
      noGalleryItems: "No processed stencils yet",
      shareLink: "Share link",
      copyLink: "Copy link",
      downloadAll: "Download all",
      deleteAll: "Delete all",
      credits: "Credits",
      unlimited: "Unlimited",
    }
  };

  const txt = t[language];

  // Hardcoded styles with correct descriptions
  const stencilStyles = [
    {
      id: "steven",
      name: "Steven Hernandez",
      description: language === "es" ? "Limpio, detalle clásico" : "Clean, classic detail",
      thumbnail: "/api/placeholder/80/80"
    },
    {
      id: "andres",
      name: "Andres Makishi",
      description: language === "es" ? "Minimalista línea fina" : "Minimalist fine-line",
      thumbnail: "/api/placeholder/80/80"
    },
    {
      id: "darwin",
      name: "Darwin Enriquez",
      description: language === "es" ? "Líneas limpias y detalladas" : "Clean, detailed lines",
      thumbnail: "/api/placeholder/80/80"
    },
    {
      id: "adrian",
      name: "Adrian Rod",
      description: language === "es" ? "Detallado y alto contraste" : "Detailed & high-contrast",
      thumbnail: "/api/placeholder/80/80"
    }
  ];

  // Color options for stencil lines
  const colorOptions = [
    { value: "black", label: "Negro", color: "#000000" },
    { value: "red", label: "Rojo", color: "#FF0000" },
    { value: "blue", label: "Azul", color: "#0000FF" },
    { value: "green", label: "Verde", color: "#00FF00" }
  ];

  // Fetch gallery
  const { data: galleryItems = [] } = useQuery<StencilJob[]>({
    queryKey: ["/api/stencil/gallery"],
  });

  // Fetch current job status
  const { data: currentJob } = useQuery<StencilJob>({
    queryKey: currentJobId ? [`/api/stencil/jobs/${currentJobId}`] : [],
    enabled: !!currentJobId,
    refetchInterval: (query) => {
      const job = query.state.data as StencilJob | undefined;
      if (job?.status === "pending" || job?.status === "processing") {
        return 2000; // Poll every 2 seconds
      }
      return false;
    },
  });

  // Create stencil job mutation
  const createJobMutation = useMutation({
    mutationFn: async (formData: FormData): Promise<StencilJob> => {
      const response = await fetch("/api/stencil/jobs", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to create stencil job");
      return response.json();
    },
    onSuccess: (data: StencilJob) => {
      setCurrentJobId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/stencil/gallery"] });
    },
  });

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Process image
  const handleProcess = () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("style", selectedStyle);
    formData.append("pngOutline", pngOutline.toString());
    formData.append("lineColor", lineColor);

    createJobMutation.mutate(formData);
  };

  // Download processed image
  const handleDownload = () => {
    if (!currentJob?.processedImageUrl) return;
    
    const link = document.createElement("a");
    link.href = currentJob.processedImageUrl;
    link.download = `stencil-${selectedStyle}-${Date.now()}.png`;
    link.click();
  };

  // Reset all settings
  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCurrentJobId(null);
    setCompareMode(null);
    setSelectedStyle("steven");
    setLineColor("black");
    setPngOutline(true);
  };

  const isProcessing = currentJob?.status === "pending" || currentJob?.status === "processing";
  const isCompleted = currentJob?.status === "completed";

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
          <div className="flex items-center justify-center gap-2 mt-4">
            <Badge variant="secondary">{txt.credits}: {txt.unlimited}</Badge>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="process" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="process">{txt.process}</TabsTrigger>
            <TabsTrigger value="gallery">{txt.gallery}</TabsTrigger>
            <TabsTrigger value="history">{txt.history}</TabsTrigger>
          </TabsList>

          {/* Process Tab */}
          <TabsContent value="process">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - File Selection and Settings */}
              <div className="space-y-6">
                {/* File Upload Card */}
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-white">{txt.uploadImage}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedFile ? (
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-sm text-zinc-400 truncate">{selectedFile.name}</p>
                          <p className="text-xs text-zinc-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                        </div>
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          variant="secondary"
                          className="w-full"
                        >
                          {txt.changeFile}
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center hover:border-zinc-500 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                      >
                        <Upload className="h-12 w-12 mx-auto text-zinc-500 mb-3" />
                        <p className="text-sm text-zinc-400">{txt.dragDrop}</p>
                        <p className="text-xs text-zinc-500 mt-2">{txt.supportedFormats}</p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </CardContent>
                </Card>

                {/* Stencil Style Selection */}
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      {txt.stencilStyle}
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      {txt.exclusiveModels}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {stencilStyles.map((style) => (
                      <div
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedStyle === style.id
                            ? "bg-zinc-800 border border-zinc-600"
                            : "hover:bg-zinc-800/50"
                        }`}
                      >
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-zinc-700 rounded-lg flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-zinc-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-white">{style.name}</p>
                          <p className="text-xs text-zinc-400">{style.description}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full ${
                          selectedStyle === style.id ? "bg-blue-500" : "bg-zinc-700"
                        }`} />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Stencil Settings */}
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-white">{txt.settings}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* PNG Outline Option */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="png-outline" className="text-white">
                          {txt.pngOutline}
                        </Label>
                        <Switch
                          id="png-outline"
                          checked={pngOutline}
                          onCheckedChange={setPngOutline}
                        />
                      </div>
                      <p className="text-xs text-zinc-500">{txt.linesOnly}</p>
                    </div>

                    {/* Stencil Line Color */}
                    <div className="space-y-2">
                      <Label className="text-white">{txt.lineColorLabel}</Label>
                      <p className="text-xs text-zinc-500">{txt.pickColor}</p>
                      <div className="flex gap-2">
                        {colorOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setLineColor(option.value)}
                            className={`w-12 h-12 rounded-lg border-2 transition-all ${
                              lineColor === option.value
                                ? "border-white scale-110"
                                : "border-zinc-700 hover:border-zinc-500"
                            }`}
                            style={{ backgroundColor: option.color }}
                            aria-label={option.label}
                          />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Create Stencil Button */}
                <Button
                  onClick={handleProcess}
                  disabled={!selectedFile || isProcessing}
                  className="w-full h-14 text-lg bg-white text-black hover:bg-gray-100"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {txt.processing}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      {txt.createStencil}
                    </>
                  )}
                </Button>

                {/* Reset Button */}
                {(selectedFile || currentJob) && (
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="w-full"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {txt.reset}
                  </Button>
                )}
              </div>

              {/* Right Column - Preview */}
              <div className="lg:col-span-2">
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">{txt.preview}</CardTitle>
                      {previewUrl && currentJob?.processedImageUrl && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={compareMode === "side-by-side" ? "default" : "outline"}
                            onClick={() => setCompareMode(compareMode === "side-by-side" ? null : "side-by-side")}
                          >
                            {txt.sideBySide}
                          </Button>
                          <Button
                            size="sm"
                            variant={compareMode === "slider" ? "default" : "outline"}
                            onClick={() => setCompareMode(compareMode === "slider" ? null : "slider")}
                          >
                            {txt.slider}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-zinc-800 rounded-lg p-4 min-h-[500px] flex items-center justify-center">
                      {!previewUrl ? (
                        <div className="text-center">
                          <ImageIcon className="h-16 w-16 mx-auto text-zinc-600 mb-3" />
                          <p className="text-zinc-500">{txt.noImage}</p>
                        </div>
                      ) : compareMode === "side-by-side" && currentJob?.processedImageUrl ? (
                        // Side by Side Comparison
                        <div className="flex gap-4 w-full">
                          <div className="flex-1">
                            <p className="text-xs text-zinc-400 mb-2 text-center">{txt.original}</p>
                            <img
                              src={previewUrl}
                              alt="Original"
                              className="w-full rounded-lg"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-zinc-400 mb-2 text-center">{txt.processed}</p>
                            <img
                              src={currentJob.processedImageUrl}
                              alt="Processed"
                              className="w-full rounded-lg"
                            />
                          </div>
                        </div>
                      ) : compareMode === "slider" && currentJob?.processedImageUrl ? (
                        // Slider Comparison
                        <div className="relative w-full max-w-2xl mx-auto">
                          <img
                            src={currentJob.processedImageUrl}
                            alt="Processed"
                            className="w-full rounded-lg"
                          />
                          <div
                            className="absolute inset-0 overflow-hidden rounded-lg"
                            style={{ clipPath: `inset(0 ${100 - comparePosition}% 0 0)` }}
                          >
                            <img
                              src={previewUrl}
                              alt="Original"
                              className="w-full rounded-lg"
                            />
                          </div>
                          <div
                            className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
                            style={{ left: `${comparePosition}%` }}
                            onMouseDown={(e) => {
                              const startX = e.clientX;
                              const startPos = comparePosition;
                              const parentElement = (e.currentTarget as HTMLElement).parentElement;
                              
                              const handleMouseMove = (e: MouseEvent) => {
                                const delta = e.clientX - startX;
                                const rect = parentElement?.getBoundingClientRect();
                                if (rect) {
                                  const newPos = Math.max(0, Math.min(100, startPos + (delta / rect.width) * 100));
                                  setComparePosition(newPos);
                                }
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
                              <div className="flex items-center">
                                <ChevronLeft className="h-3 w-3 text-black" />
                                <ChevronRight className="h-3 w-3 text-black" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : currentJob?.processedImageUrl ? (
                        // Single Processed Image
                        <img
                          src={currentJob.processedImageUrl}
                          alt="Processed"
                          className="max-w-full max-h-full rounded-lg"
                        />
                      ) : (
                        // Single Original Image
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-w-full max-h-full rounded-lg"
                        />
                      )}
                    </div>

                    {/* Status Information */}
                    {currentJob && (
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-zinc-400">{txt.style}:</span>
                          <Badge variant="secondary">{selectedStyle}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-zinc-400">{txt.status}:</span>
                          <Badge variant={isCompleted ? "default" : "secondary"}>
                            {isCompleted ? txt.completed : txt.pending}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>

                  {/* Download Section */}
                  {isCompleted && (
                    <CardFooter>
                      <div className="w-full space-y-3">
                        <Button
                          onClick={handleDownload}
                          className="w-full bg-white text-black hover:bg-gray-100"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          {txt.download}
                        </Button>
                        <p className="text-xs text-zinc-500 text-center">
                          {txt.procreateInstructions}
                        </p>
                      </div>
                    </CardFooter>
                  )}
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">{txt.recentWork}</CardTitle>
                    <CardDescription className="text-zinc-400">
                      {txt.yourGallery}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      {txt.shareLink}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      {txt.downloadAll}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {galleryItems.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="h-16 w-16 mx-auto text-zinc-600 mb-3" />
                    <p className="text-zinc-500">{txt.noGalleryItems}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {galleryItems.map((item) => (
                      <div key={item.id} className="group relative">
                        <div className="aspect-square bg-zinc-800 rounded-lg overflow-hidden">
                          <img
                            src={item.processedImageUrl || item.originalImageUrl}
                            alt={`Stencil ${item.style}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button size="icon" variant="secondary">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="secondary">
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {item.style}
                          </Badge>
                          <p className="text-xs text-zinc-500 mt-1">
                            {new Date(item.createdAt || "").toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">{txt.history}</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {galleryItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 bg-zinc-800 rounded-lg">
                        <img
                          src={item.processedImageUrl || item.originalImageUrl}
                          alt={`Stencil ${item.style}`}
                          className="w-16 h-16 rounded object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-white">Stencil - {item.style}</p>
                          <p className="text-sm text-zinc-400">
                            {new Date(item.createdAt || "").toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={item.status === "completed" ? "default" : "secondary"}>
                          {item.status}
                        </Badge>
                        <Button size="icon" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default StencilTool;