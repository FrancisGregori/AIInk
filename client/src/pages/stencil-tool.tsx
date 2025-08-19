import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
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
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";
import Navigation from "@/components/Navigation";
import type { StencilJob, StencilStyle } from "@shared/schema";

interface ProcessingOptions {
  removeBackground: boolean;
  lineColor: "black" | "red" | "blue" | "green";
}

function StencilTool() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>("steven");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentJob, setCurrentJob] = useState<StencilJob | null>(null);
  const [processingOptions, setProcessingOptions] = useState<ProcessingOptions>({
    removeBackground: true,
    lineColor: "black"
  });
  const [viewMode, setViewMode] = useState<"preview" | "sidebyside" | "slider">("preview");
  const [sliderPosition, setSliderPosition] = useState(50);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch stencil styles
  const { data: styles = [] } = useQuery<StencilStyle[]>({
    queryKey: ["/api/stencil/styles"],
  });

  // Fetch user's recent jobs (gallery)
  const { data: recentJobs = [] } = useQuery<StencilJob[]>({
    queryKey: ["/api/stencil/gallery"],
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
    onSuccess: (data: StencilJob) => {
      setCurrentJob(data);
      // Only set processing to false if job is completed or failed
      if (data.status === "completed" || data.status === "failed") {
        setIsProcessing(false);
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
          
          if (updatedJob.status === "completed" || updatedJob.status === "failed") {
            setIsProcessing(false);
            queryClient.invalidateQueries({ queryKey: ["/api/stencil/gallery"] });
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error("Error polling job status:", error);
      }
    }, 3000); // Poll every 3 seconds (up to 40 seconds wait)
    
    return () => clearInterval(interval);
  }, [currentJob, queryClient]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setCurrentJob(null);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add("border-white");
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove("border-white");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove("border-white");
    }
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setCurrentJob(null);
    }
  };

  // Process image
  const handleProcess = () => {
    if (!selectedFile || !selectedStyle) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("style", selectedStyle);
    formData.append("userId", "demo-user");
    formData.append("processingOptions", JSON.stringify(processingOptions));

    processImageMutation.mutate(formData);
  };

  // Reset all
  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCurrentJob(null);
    setViewMode("preview");
    setSliderPosition(50);
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

  // Load job from gallery
  const loadFromGallery = (job: StencilJob) => {
    setCurrentJob(job);
    setPreviewUrl(job.originalImageUrl);
    setSelectedStyle(job.style);
    setViewMode("sidebyside");
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-1">Stencil Tool</h1>
          <p className="text-zinc-400 text-sm">Transforma imágenes en stencils profesionales</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          {/* Left Column - Upload & Settings */}
          <div className="xl:col-span-2 lg:col-span-2 space-y-4">
            {/* Upload Card - More compact */}
            <Card>
              <CardContent className="p-4">
                <div
                  ref={dropZoneRef}
                  className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center hover:border-zinc-500 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center">
                      <Upload className="h-6 w-6 text-zinc-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">Upload Your Image</h3>
                      <p className="text-xs text-zinc-500 mt-1">
                        Drag and drop or click to browse
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full max-w-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      Choose File
                    </Button>
                    <p className="text-xs text-zinc-600">
                      JPG, PNG, GIF up to 10MB
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {selectedFile && (
                  <div className="mt-3 p-2 bg-zinc-900 rounded-lg">
                    <p className="text-xs truncate">{selectedFile.name}</p>
                    <p className="text-xs text-zinc-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Style Selection - Compact */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  Stencil Style
                  <Info className="h-3 w-3 text-zinc-500" />
                </CardTitle>
                <CardDescription className="text-xs">
                  AI models trained on each artist's lines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedStyle} onValueChange={setSelectedStyle}>
                  <div className="grid grid-cols-2 gap-2">
                    {styles.map((style) => (
                      <div
                        key={style.id}
                        className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                          selectedStyle === style.id 
                            ? "border-white bg-zinc-900" 
                            : "border-zinc-700 hover:border-zinc-500"
                        }`}
                        onClick={() => setSelectedStyle(style.id)}
                      >
                        <RadioGroupItem value={style.id} id={style.id} className="h-3 w-3" />
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center overflow-hidden">
                            <span className="text-xs font-bold">
                              {style.name.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <Label htmlFor={style.id} className="text-xs font-medium truncate">
                                {style.name}
                              </Label>
                              <CheckCircle2 className="h-3 w-3 text-blue-500 flex-shrink-0" />
                            </div>
                            <p className="text-xs text-zinc-500 truncate">{style.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Processing Settings - Compact */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Stencil Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* PNG Outline Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="remove-bg" className="text-sm">PNG Outline</Label>
                    <p className="text-xs text-zinc-500">No background</p>
                  </div>
                  <Switch
                    id="remove-bg"
                    checked={processingOptions.removeBackground}
                    onCheckedChange={(checked) => 
                      setProcessingOptions(prev => ({ ...prev, removeBackground: checked }))
                    }
                  />
                </div>

                <Separator />

                {/* Line Color Selection - Compact */}
                <div>
                  <Label className="text-sm mb-2 block">Line Color</Label>
                  <div className="grid grid-cols-4 gap-1">
                    {["black", "red", "blue", "green"].map((color) => (
                      <button
                        key={color}
                        onClick={() => 
                          setProcessingOptions(prev => ({ ...prev, lineColor: color as any }))
                        }
                        className={`p-2 rounded border transition-all ${
                          processingOptions.lineColor === color
                            ? "border-white"
                            : "border-zinc-700 hover:border-zinc-500"
                        }`}
                      >
                        <div 
                          className={`w-6 h-6 rounded-full mx-auto`}
                          style={{ 
                            backgroundColor: color === "black" ? "#000" : color,
                            border: color === "black" ? "1px solid #333" : "none"
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col gap-2 pt-3">
                {isProcessing && (
                  <Alert className="bg-zinc-900 border-zinc-700">
                    <AlertDescription className="text-xs">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Procesando... puede tardar hasta 40 segundos</span>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex gap-2 w-full">
                  <Button
                    onClick={handleProcess}
                    disabled={!selectedFile || isProcessing}
                    className="flex-1"
                    size="sm"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Process"
                    )}
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    size="sm"
                    disabled={isProcessing}
                  >
                    Reset
                  </Button>
                </div>
              </CardFooter>
            </Card>

            {/* Usage Info - Compact */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Tu Uso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-400">Créditos usados</span>
                    <Badge variant="secondary" className="text-xs">12 / 50</Badge>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5">
                    <div className="bg-white h-1.5 rounded-full" style={{ width: "24%" }} />
                  </div>
                  <p className="text-xs text-zinc-500">
                    38 créditos restantes
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Preview (Adaptive) */}
          <div className="xl:col-span-2 lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Preview</CardTitle>
                  {currentJob && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant={viewMode === "preview" ? "default" : "ghost"}
                        onClick={() => setViewMode("preview")}
                        className="h-7 px-2"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant={viewMode === "sidebyside" ? "default" : "ghost"}
                        onClick={() => setViewMode("sidebyside")}
                        className="h-7 px-2"
                      >
                        <Columns className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant={viewMode === "slider" ? "default" : "ghost"}
                        onClick={() => setViewMode("slider")}
                        className="h-7 px-2"
                      >
                        <SlidersHorizontal className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {currentJob ? (
                  <div className="space-y-3">
                    {/* View Mode Display - Adaptive height */}
                    <div className="relative bg-zinc-900 rounded-lg overflow-hidden">
                      {viewMode === "preview" && (
                        <img
                          src={currentJob.processedImageUrl || ""}
                          alt="Processed"
                          className="w-full h-auto object-contain"
                        />
                      )}
                      
                      {viewMode === "sidebyside" && (
                        <div className="flex gap-2">
                          <div className="flex-1 bg-white rounded p-1">
                            <img
                              src={previewUrl || ""}
                              alt="Original"
                              className="w-full h-auto object-contain"
                            />
                          </div>
                          <div className="flex-1 bg-black rounded p-1">
                            <img
                              src={currentJob.processedImageUrl || ""}
                              alt="Processed"
                              className="w-full h-auto object-contain"
                            />
                          </div>
                        </div>
                      )}
                      
                      {viewMode === "slider" && (
                        <div className="relative">
                          <img
                            src={currentJob.processedImageUrl || ""}
                            alt="Processed"
                            className="w-full h-auto"
                          />
                          <div
                            className="absolute inset-0 overflow-hidden"
                            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                          >
                            <img
                              src={previewUrl || ""}
                              alt="Original"
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          </div>
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize"
                            style={{ left: `${sliderPosition}%` }}
                            onMouseDown={(e) => {
                              const startX = e.clientX;
                              const startPos = sliderPosition;
                              const container = e.currentTarget.parentElement;
                              if (!container) return;
                              const containerWidth = container.offsetWidth;
                              
                              const handleMouseMove = (e: MouseEvent) => {
                                const delta = e.clientX - startX;
                                const deltaPercent = (delta / containerWidth) * 100;
                                const newPos = Math.max(0, Math.min(100, startPos + deltaPercent));
                                setSliderPosition(newPos);
                              };
                              
                              const handleMouseUp = () => {
                                document.removeEventListener("mousemove", handleMouseMove);
                                document.removeEventListener("mouseup", handleMouseUp);
                              };
                              
                              document.addEventListener("mousemove", handleMouseMove);
                              document.addEventListener("mouseup", handleMouseUp);
                            }}
                          >
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-0.5">
                              <ChevronLeft className="h-2 w-2 text-black inline" />
                              <ChevronRight className="h-2 w-2 text-black inline" />
                            </div>
                          </div>
                          <div className="absolute top-2 left-2 bg-white text-black px-1.5 py-0.5 rounded text-xs">
                            Original
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Job Info - Compact */}
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-zinc-500">Style:</span>
                        <span className="font-medium">{currentJob.style}</span>
                      </div>
                      <Badge 
                        variant={currentJob.status === "completed" ? "default" : "secondary"}
                        className="text-xs h-5"
                      >
                        {currentJob.status === "completed" ? "Completed" : currentJob.status}
                      </Badge>
                    </div>

                    {/* Download Section - Compact */}
                    <div className="bg-zinc-900 rounded-lg p-3">
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
                    </div>
                  </div>
                ) : previewUrl ? (
                  <div className="space-y-2">
                    <div className="bg-zinc-900 rounded-lg p-2">
                      <img
                        src={previewUrl}
                        alt="Original"
                        className="w-full h-auto rounded"
                      />
                    </div>
                    <p className="text-center text-xs text-zinc-500">
                      Imagen lista para procesar
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-zinc-600" />
                      <p className="text-sm text-zinc-500">No image selected</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Gallery */}
          <div className="xl:col-span-1 lg:col-span-1">
            {/* Recent Gallery - Compact */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Galería Reciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-2">
                  {recentJobs.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2">
                      {recentJobs.map((job) => (
                        <div
                          key={job.id}
                          className="group cursor-pointer"
                          onClick={() => loadFromGallery(job)}
                        >
                          <div className="relative overflow-hidden rounded-lg bg-zinc-900 aspect-video">
                            <img
                              src={job.processedImageUrl || job.originalImageUrl}
                              alt={`Stencil ${job.style}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Eye className="h-5 w-5 text-white" />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-1.5">
                              <p className="text-xs font-medium truncate">{job.style}</p>
                              <p className="text-xs text-zinc-400">
                                {new Date(job.createdAt || "").toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-zinc-500 text-xs">No hay trabajos recientes</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default StencilTool;