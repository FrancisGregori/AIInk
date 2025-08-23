import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useJobs } from "@/contexts/JobContext";
import { useJobRecovery } from "@/hooks/useJobRecovery";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "@/components/auth-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  Download, 
  Loader2, 
  RefreshCw, 
  CreditCard,
  Info,
  Clock,
  CheckCircle2,
  Copy,
  Eye,
  Columns,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";
import Navigation from "@/components/Navigation";
import PreviewArea from "@/components/preview-area";
import StyleSelector from "@/components/style-selector";
import ImageUploader from "@/components/image-uploader";
import { CreditsDisplay, CreditsRequirement } from "@/components/credits-display";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { StencilJob, StencilStyle } from "@shared/schema";

interface ProcessingOptions {
  removeBackground: boolean;
  lineColor: "black" | "red" | "blue" | "green";
}

function StencilTool() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>("steven");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentJob, setCurrentJob] = useState<StencilJob | null>(null);
  const [recoveredImageUrl, setRecoveredImageUrl] = useState<string | null>(null);
  const [showFullGallery, setShowFullGallery] = useState(false);
  const [processingOptions, setProcessingOptions] = useState<ProcessingOptions>({
    removeBackground: true,
    lineColor: "black"
  });
  // Estado para el modal de galería
  const [galleryModal, setGalleryModal] = useState<{
    open: boolean;
    job: StencilJob | null;
  }>({ open: false, job: null });
  
  const queryClient = useQueryClient();
  const { addJob, updateJob, getJob } = useJobs();
  const { activeJobsOfType } = useJobRecovery('stencil');

  // Recuperar trabajo en progreso - CARGA INSTANTÁNEA desde localStorage
  useEffect(() => {
    const activeStencilJobs = activeJobsOfType.filter(job => job.status === 'processing');
    if (activeStencilJobs.length > 0 && !currentJob) {
      const latestJob = activeStencilJobs[0];
      
      // CARGAR INMEDIATAMENTE desde localStorage sin esperar servidor
      setCurrentJob(latestJob as unknown as StencilJob);
      setSelectedStyle(latestJob.style || "steven");
      if (latestJob.status === 'processing') {
        setIsProcessing(true);
      }
      // Configurar la imagen recuperada INMEDIATAMENTE
      if (latestJob.originalImageUrl) {
        setRecoveredImageUrl(latestJob.originalImageUrl);
        const fakeFile = new File([""], "recovered-image.png", { type: "image/png" });
        setSelectedFile(fakeFile);
      }
      
      // Después actualizar desde servidor en segundo plano
      fetch(`/api/stencil/jobs/${latestJob.id}`)
        .then(res => res.json())
        .then(serverJob => {
          if (serverJob.status !== latestJob.status || serverJob.processedImageUrl !== latestJob.processedImageUrl) {
            setCurrentJob(serverJob);
            if (serverJob.status === 'completed') {
              setIsProcessing(false);
            }
          }
        })
        .catch(console.error);
    }
  }, [activeJobsOfType, currentJob]);
  

  
  // Refs for scroll behavior
  const styleSectionRef = useRef<HTMLDivElement>(null);
  const previewSectionRef = useRef<HTMLDivElement>(null);

  // Fetch stencil styles
  const { data: styles = [] } = useQuery<StencilStyle[]>({
    queryKey: ["/api/stencil/styles"],
  });

  // Fetch user's recent jobs (gallery)
  const { data: recentJobs = [] } = useQuery<StencilJob[]>({
    queryKey: ["/api/stencil/gallery"],
    refetchInterval: isProcessing ? 5000 : false, // Solo polling si hay trabajo activo
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    staleTime: 10000, // Datos frescos por 10 segundos
    gcTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  // Process image mutation
  const processImageMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/stencil/process", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Failed to process image');
      }
      return response.json();
    },
    onSuccess: async (data: StencilJob) => {
      setCurrentJob(data);

      // Register job in global context
      addJob({
        id: data.id,
        status: data.status as 'processing' | 'completed' | 'failed',
        type: 'stencil',
        originalImageUrl: data.originalImageUrl || undefined,
        processedImageUrl: data.processedImageUrl || undefined,
        style: data.style || undefined,
        startedAt: data.startedAt ? (typeof data.startedAt === 'string' ? data.startedAt : data.startedAt.toISOString()) : new Date().toISOString(),
        completedAt: data.completedAt ? (typeof data.completedAt === 'string' ? data.completedAt : data.completedAt.toISOString()) : undefined,
        errorMessage: data.errorMessage || undefined
      });

      // Only set processing to false if job is completed or failed
      if (data.status === "completed" || data.status === "failed") {
        setIsProcessing(false);
      }

      if (data.processedImageUrl) {
        try {
          await apiRequest('POST', '/api/gallery', {
            imageUrl: data.processedImageUrl,
            type: 'stencil',
            title: `Stencil - ${data.style || selectedStyle}`,
          });
          queryClient.invalidateQueries({ queryKey: ['/api/gallery'] });
        } catch (error) {
          console.error('Failed to add image to gallery:', error);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/stencil/gallery"] });
    },
    onError: () => {
      setIsProcessing(false);
    },
  });
  
  // Poll for job status when processing
  useEffect(() => {
    if (!currentJob || (currentJob.status !== "processing" && currentJob.status !== "pending")) {
      return;
    }
    
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/stencil/jobs/${currentJob.id}`);
        if (response.ok) {
          const updatedJob = await response.json();
          setCurrentJob(updatedJob);
          
          // Update job in global context
          updateJob(updatedJob.id, {
            status: updatedJob.status as 'processing' | 'completed' | 'failed',
            processedImageUrl: updatedJob.processedImageUrl || undefined,
            completedAt: updatedJob.completedAt ? (typeof updatedJob.completedAt === 'string' ? updatedJob.completedAt : updatedJob.completedAt.toISOString()) : undefined,
            errorMessage: updatedJob.errorMessage || undefined
          });
          
          if (updatedJob.status === "completed" || updatedJob.status === "failed") {
            setIsProcessing(false);
            queryClient.invalidateQueries({ queryKey: ["/api/stencil/gallery"] });
            queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error("Error polling job status:", error);
      }
    }, 1000); // Poll cada 1 segundo para actualización más rápida
    
    return () => clearInterval(interval);
  }, [currentJob, queryClient, updateJob]);

  // Handle file selection with auto-scroll
  const handleFileSelectWithScroll = (file: File | null) => {
    setSelectedFile(file);
    if (file) {
      setCurrentJob(null);
      setRecoveredImageUrl(null); // Limpiar imagen recuperada cuando se selecciona nueva
      // Auto-scroll to style section when image is loaded
      setTimeout(() => {
        styleSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };



  // Process image with auto-scroll to preview
  const handleProcess = () => {
    if (!selectedFile || !selectedStyle) return;

    // Check authentication before processing
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }

    // MOSTRAR INMEDIATAMENTE el estado de procesamiento
    setIsProcessing(true);
    
    // Crear un trabajo temporal inmediatamente para mostrar en el preview
    const tempJob: StencilJob = {
      id: 'temp-' + Date.now(),
      userId: user?.id as string,
      originalImageUrl: '',
      processedImageUrl: null,
      style: selectedStyle,
      status: 'processing',
      comfyDeployRunId: null,
      processingOptions: processingOptions,
      errorMessage: null,
      startedAt: new Date(),
      completedAt: null,
      createdAt: new Date()
    };
    setCurrentJob(tempJob);

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("style", selectedStyle);
    formData.append("userId", user?.id as string);
    formData.append("processingOptions", JSON.stringify(processingOptions));

    processImageMutation.mutate(formData);
    
    // Auto-scroll to preview section when processing starts
    setTimeout(() => {
      previewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Reset all
  const handleReset = () => {
    setSelectedFile(null);
    setCurrentJob(null);
    setRecoveredImageUrl(null);
    setSelectedStyle("steven");
    setProcessingOptions({
      removeBackground: true,
      lineColor: "black"
    });
  };

  // Download processed image
  const handleDownload = () => {
    if (!currentJob?.processedImageUrl) return;
    
    const link = document.createElement("a");
    link.href = currentJob.processedImageUrl;
    link.download = `stencil-${currentJob.style}-${Date.now()}.png`;
    link.click();
  };

  // Copy instructions for Procreate
  const copyProcreateInstructions = () => {
    const instructions = `To use in Procreate:
Press and hold the stencil image above and select "Copy", then paste it directly into Procreate.`;
    navigator.clipboard.writeText(instructions);
  };

  // Abrir modal de galería - SIEMPRE permitido
  const openGalleryModal = (job: StencilJob) => {
    // No hay restricción - el usuario puede ver la galería incluso mientras procesa
    setGalleryModal({ open: true, job });
  };
  
  // Descargar imagen desde modal
  const handleDownloadFromModal = (job: StencilJob) => {
    if (!job?.processedImageUrl) return;
    
    const link = document.createElement("a");
    link.href = job.processedImageUrl;
    link.download = `stencil-${job.style}-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <main className="container mx-auto px-4 py-20 max-w-7xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-4 mb-2">
            <h1 className="text-3xl font-bold">Stencil Tool</h1>
          </div>
          <p className="text-zinc-400 text-sm">Transform images into professional tattoo stencils</p>
        </div>



        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          {/* Left Column - Upload & Settings */}
          <div className="xl:col-span-2 lg:col-span-2 space-y-4">
            {/* Image Upload with Drag & Drop */}
            <ImageUploader
              selectedFile={selectedFile}
              onFileSelect={handleFileSelectWithScroll}
              externalPreview={recoveredImageUrl}
            />

            {/* Style Selection - Visual */}
            <div ref={styleSectionRef}>
              <StyleSelector
                selectedStyle={selectedStyle}
                onStyleChange={setSelectedStyle}
              />
            </div>

            {/* Stencil Settings - Exact from GitHub */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Stencil Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* PNG Outline Toggle */}
                <div className="bg-zinc-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="remove-bg" className="text-sm font-medium">PNG Outline (No Background)</Label>
                      <p className="text-xs text-zinc-400 mt-1">Lines only - for easy transfer</p>
                    </div>
                    <Switch
                      id="remove-bg"
                      checked={processingOptions.removeBackground}
                      onCheckedChange={(checked) => 
                        setProcessingOptions(prev => ({ ...prev, removeBackground: checked }))
                      }
                    />
                  </div>
                </div>

                {/* Line Color Selection */}
                <div className="bg-zinc-800 rounded-lg p-4">
                  <Label className="text-sm font-medium block mb-1">Stencil Line Color</Label>
                  <p className="text-xs text-zinc-400 mb-3">Pick the line color.</p>
                  <div className="grid grid-cols-4 gap-2">
                    {["black", "red", "blue", "green"].map((color) => (
                      <button
                        key={color}
                        onClick={() => 
                          setProcessingOptions(prev => ({ ...prev, lineColor: color as any }))
                        }
                        className={`p-4 rounded-lg border-2 transition-all ${
                          processingOptions.lineColor === color
                            ? "border-white bg-zinc-700"
                            : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
                        }`}
                      >
                        <div 
                          className={`w-8 h-8 rounded-full mx-auto`}
                          style={{ 
                            backgroundColor: color === "black" ? "transparent" : color,
                            border: color === "black" ? "2px solid #fff" : "none"
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="pt-3">
                <div className="w-full space-y-3">
                  {selectedFile && <CreditsRequirement cost={5} action="stencil" />}
                  <div className="flex gap-2">
                    <Button
                    onClick={handleProcess}
                    disabled={!selectedFile || isProcessing}
                    className="flex-1 bg-white hover:bg-gray-100 text-black font-semibold"
                    size="default"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Stencil...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Stencil
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    size="default"
                    disabled={isProcessing}
                    className="bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-700"
                  >
                    Clear
                  </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>

            {/* Usage Info - Compact */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Your Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-400">Credits used</span>
                    <Badge variant="secondary" className="text-xs">12 / 50</Badge>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5">
                    <div className="bg-white h-1.5 rounded-full" style={{ width: "24%" }} />
                  </div>
                  <p className="text-xs text-zinc-500">
                    38 credits remaining
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Preview (Adaptive) */}
          <div className="xl:col-span-2 lg:col-span-2" ref={previewSectionRef}>
            <PreviewArea 
              selectedFile={selectedFile}
              selectedStyle={selectedStyle}
              jobId={currentJob?.id || null}
              externalImageUrl={recoveredImageUrl}
              currentJob={currentJob}
            />
            
            {/* Download Section */}
            {currentJob?.status === "completed" && currentJob.processedImageUrl && (
              <Card className="mt-4">
                <CardContent className="p-4">
                  <Button
                    onClick={handleDownload}
                    className="w-full mb-2"
                    size="sm"
                  >
                    <Download className="mr-2 h-3 w-3" />
                    Download PNG
                  </Button>
                  
                  <div className="text-xs text-zinc-400 space-y-1">
                    <p>Procreate: Press & hold image → Copy → Paste</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={copyProcreateInstructions}
                    >
                      <Copy className="h-2.5 w-2.5 mr-1" />
                      Copy tip
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Gallery */}
          <div className="xl:col-span-1 lg:col-span-1">
            {/* Gallery Header with Toggle */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Galería de Stencils
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFullGallery(!showFullGallery)}
                    className="text-xs"
                  >
                    {showFullGallery ? 'Ver menos' : `Ver todos (${recentJobs.length})`}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recentJobs.length > 0 ? (
                  <div className="space-y-6">
                    {/* Mobile: Always 2 columns, Desktop: Responsive */}
                    <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 lg:gap-4">
                      {(showFullGallery ? recentJobs : recentJobs.slice(0, 8)).map((job) => {
                        // Galería siempre accesible, incluso durante procesamiento
                        return (
                        <div
                          key={job.id}
                          className="group cursor-pointer"
                          onClick={() => openGalleryModal(job)}
                        >
                          <div className="relative overflow-hidden rounded-lg bg-[#f5f5f5] aspect-[3/4]">
                            <img
                              src={job.processedImageUrl || job.originalImageUrl}
                              alt={`Stencil ${job.style}`}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                            />
                          </div>
                        </div>
                        );
                      })}
                    </div>
                    
                    {/* Load More Button - only show when not in full gallery mode and there are more items */}
                    {!showFullGallery && recentJobs.length > 8 && (
                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          onClick={() => setShowFullGallery(true)}
                          className="text-sm"
                        >
                          Load More ({recentJobs.length - 8} más)
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-zinc-500 text-sm">No hay trabajos recientes</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <AuthDialog 
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        language="es"
        toolType="stencil"
      />
      
      {/* Modal para ver imágenes de la galería */}
      <Dialog 
        open={galleryModal.open} 
        onOpenChange={(open) => setGalleryModal({ open, job: open ? galleryModal.job : null })}
      >
        <DialogContent className="sm:max-w-fit p-0 bg-zinc-900 border-zinc-800 overflow-hidden">
          <DialogTitle className="sr-only">Stencil Gallery Preview</DialogTitle>
          <DialogDescription className="sr-only">
            Preview of your completed stencil from the gallery
          </DialogDescription>
          
          {galleryModal.job && (
            <div className="flex flex-col">
              {/* Imagen principal - tamaño compacto */}
              <div className="relative bg-[#f5f5f5] flex items-center justify-center p-3">
                <img
                  src={galleryModal.job.processedImageUrl || galleryModal.job.originalImageUrl}
                  alt={`Stencil ${galleryModal.job.style}`}
                  className="max-w-[400px] max-h-[55vh] w-auto h-auto object-contain"
                />
              </div>
              
              {/* Footer con información y acciones */}
              <div className="bg-zinc-900 p-3 border-t border-zinc-800">
                {/* Información compacta */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold capitalize text-white truncate">
                      {galleryModal.job.style} Style
                    </h3>
                    <p className="text-xs text-zinc-400">
                      {new Date(galleryModal.job.createdAt || "").toLocaleString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  {/* Botón de descarga compacto */}
                  <Button
                    onClick={() => handleDownloadFromModal(galleryModal.job!)}
                    className="bg-white text-black hover:bg-zinc-200 h-8 px-3 text-sm"
                  >
                    <Download className="mr-1 h-3 w-3" />
                    Descargar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default StencilTool;