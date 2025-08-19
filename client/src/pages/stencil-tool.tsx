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
  Palette
} from "lucide-react";
import Navigation from "@/components/Navigation";
import type { StencilStyle, StencilJob } from "@shared/schema";

function StencilTool() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>("steven");
  const [quality, setQuality] = useState<number>(90);
  const [transparentBg, setTransparentBg] = useState<boolean>(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch available styles
  const { data: styles = [] } = useQuery<StencilStyle[]>({
    queryKey: ["/api/stencil/styles"],
  });

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
    mutationFn: async (formData: FormData) => {
      return apiRequest("/api/stencil/jobs", {
        method: "POST",
        body: formData,
      });
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
    formData.append("quality", quality.toString());
    formData.append("transparentBg", transparentBg.toString());

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

  // Copy instructions for Procreate
  const handleCopyInstructions = () => {
    const instructions = `Instrucciones para Procreate:
1. Mantén presionada la imagen del stencil
2. Selecciona "Copiar imagen"
3. Abre Procreate
4. Crea un nuevo lienzo o abre uno existente
5. Toca el icono de llave inglesa > Agregar > Insertar una foto
6. Pega la imagen del stencil
7. Ajusta el tamaño y posición según necesites`;

    navigator.clipboard.writeText(instructions);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Stencil Tool</h1>
          <p className="text-zinc-400">Transforma tus imágenes en stencils profesionales para tatuajes</p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Badge variant="secondary">
              <Zap className="h-3 w-3 mr-1" />
              {galleryItems.length} stencils creados
            </Badge>
            <Badge variant="secondary">
              <Sparkles className="h-3 w-3 mr-1" />
              4 estilos disponibles
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle>1. Sube tu imagen</CardTitle>
                <CardDescription>Arrastra o selecciona una imagen para convertir en stencil</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center hover:border-zinc-500 transition-colors cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <div className="space-y-4">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-w-full max-h-64 mx-auto rounded-lg"
                      />
                      <p className="text-sm text-zinc-400">{selectedFile?.name}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="h-12 w-12 mx-auto text-zinc-500" />
                      <div>
                        <p className="font-medium">Arrastra tu imagen aquí</p>
                        <p className="text-sm text-zinc-500 mt-1">o haz clic para seleccionar</p>
                      </div>
                      <p className="text-xs text-zinc-600">Formatos: JPG, PNG, GIF (máx. 10MB)</p>
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
              </CardContent>
            </Card>

            {/* Style Selection */}
            <Card>
              <CardHeader>
                <CardTitle>2. Elige el estilo</CardTitle>
                <CardDescription>Selecciona el modelo de IA para tu stencil</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedStyle} onValueChange={setSelectedStyle}>
                  <div className="grid grid-cols-2 gap-4">
                    {styles.map((style) => (
                      <div key={style.id} className="relative">
                        <RadioGroupItem
                          value={style.id}
                          id={style.id}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={style.id}
                          className="flex flex-col items-center justify-center rounded-lg border-2 border-zinc-700 p-4 hover:border-zinc-500 cursor-pointer peer-data-[state=checked]:border-white peer-data-[state=checked]:bg-zinc-900 transition-all"
                        >
                          <div className="w-20 h-20 bg-zinc-800 rounded-lg mb-3 flex items-center justify-center">
                            <Palette className="h-8 w-8 text-zinc-400" />
                          </div>
                          <h3 className="font-semibold">{style.name}</h3>
                          <p className="text-xs text-zinc-500 text-center mt-1">{style.description}</p>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Processing Options */}
            <Card>
              <CardHeader>
                <CardTitle>3. Opciones de procesamiento</CardTitle>
                <CardDescription>Ajusta los parámetros para tu stencil</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Calidad</Label>
                    <span className="text-sm text-zinc-400">{quality}%</span>
                  </div>
                  <Slider
                    value={[quality]}
                    onValueChange={(value) => setQuality(value[0])}
                    min={50}
                    max={100}
                    step={10}
                    className="w-full"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="transparent-bg">Fondo transparente</Label>
                    <p className="text-xs text-zinc-500">Elimina el fondo de la imagen</p>
                  </div>
                  <Switch
                    id="transparent-bg"
                    checked={transparentBg}
                    onCheckedChange={setTransparentBg}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleProcess}
                  disabled={!selectedFile || createJobMutation.isPending}
                  className="w-full"
                  size="lg"
                >
                  {createJobMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generar Stencil
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {/* Processing Status */}
            {currentJob && (
              <Card>
                <CardHeader>
                  <CardTitle>Estado del proceso</CardTitle>
                </CardHeader>
                <CardContent>
                  {currentJob.status === "pending" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-yellow-500">
                        <Clock className="h-4 w-4" />
                        <span>En cola...</span>
                      </div>
                      <Progress value={25} className="w-full" />
                    </div>
                  )}
                  
                  {currentJob.status === "processing" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-blue-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Procesando...</span>
                      </div>
                      <Progress value={50} className="w-full" />
                    </div>
                  )}
                  
                  {currentJob.status === "completed" && currentJob.processedImageUrl && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-green-500 mb-3">
                        <CheckCircle className="h-4 w-4" />
                        <span>¡Completado!</span>
                      </div>
                      <img
                        src={currentJob.processedImageUrl}
                        alt="Stencil result"
                        className="w-full rounded-lg"
                      />
                      <div className="space-y-2">
                        <Button
                          onClick={handleDownload}
                          className="w-full"
                          variant="outline"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Descargar
                        </Button>
                        <Button
                          onClick={handleCopyInstructions}
                          className="w-full"
                          variant="secondary"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copiar instrucciones
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {currentJob.status === "failed" && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {currentJob.errorMessage || "Error al procesar la imagen"}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Gallery Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Galería reciente</CardTitle>
                <CardDescription>Tus últimos stencils</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="grid grid-cols-2 gap-2">
                    {galleryItems.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        className="relative group cursor-pointer rounded-lg overflow-hidden"
                      >
                        <img
                          src={item.processedImageUrl || item.originalImageUrl}
                          alt="Gallery item"
                          className="w-full h-32 object-cover hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Badge variant="secondary" className="text-xs">
                            {item.style}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Usage Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Tu uso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Créditos usados</span>
                    <Badge>3 / 10</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Plan</span>
                    <Badge variant="secondary">Gratis</Badge>
                  </div>
                  <Separator />
                  <Button variant="outline" className="w-full" size="sm">
                    <Zap className="mr-2 h-3 w-3" />
                    Mejorar plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default StencilTool;