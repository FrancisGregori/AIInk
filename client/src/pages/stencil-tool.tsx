import { useState, useRef } from "react";
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
      return apiRequest("/api/stencil/process", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: (data: StencilJob) => {
      setCurrentJob(data);
      setIsProcessing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/stencil/gallery"] });
    },
    onError: () => {
      setIsProcessing(false);
    },
  });

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
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Stencil Tool</h1>
          <p className="text-zinc-400">Transforma imágenes en stencils profesionales</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Upload & Settings */}
          <div className="space-y-6">
            {/* Upload Card */}
            <Card>
              <CardContent className="p-6">
                <div
                  ref={dropZoneRef}
                  className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center hover:border-zinc-500 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center">
                      <Upload className="h-8 w-8 text-zinc-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Upload Your Image</h3>
                      <p className="text-sm text-zinc-500">
                        Drag and drop your image here, or click to browse
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full max-w-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      Choose File
                    </Button>
                    <p className="text-xs text-zinc-600">
                      Supports JPG, PNG, GIF up to 10MB
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
                  <div className="mt-4 p-3 bg-zinc-900 rounded-lg">
                    <p className="text-sm truncate">{selectedFile.name}</p>
                    <p className="text-xs text-zinc-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Style Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Stencil Style
                  <Info className="h-4 w-4 text-zinc-500" />
                </CardTitle>
                <CardDescription>
                  Exclusive AI models trained on each artist's signature lines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedStyle} onValueChange={setSelectedStyle}>
                  <div className="space-y-3">
                    {styles.map((style) => (
                      <div
                        key={style.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedStyle === style.id 
                            ? "border-white bg-zinc-900" 
                            : "border-zinc-700 hover:border-zinc-500"
                        }`}
                        onClick={() => setSelectedStyle(style.id)}
                      >
                        <RadioGroupItem value={style.id} id={style.id} />
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center overflow-hidden">
                            {style.exampleImage ? (
                              <img 
                                src={style.exampleImage} 
                                alt={style.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-bold">
                                {style.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={style.id} className="font-medium">
                                {style.name}
                              </Label>
                              <CheckCircle2 className="h-4 w-4 text-blue-500" />
                            </div>
                            <p className="text-xs text-zinc-500">{style.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Processing Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Stencil Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* PNG Outline Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="remove-bg">PNG Outline (No Background)</Label>
                    <p className="text-xs text-zinc-500">Lines only - for easy transfer</p>
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

                {/* Line Color Selection */}
                <div>
                  <Label className="mb-3 block">Stencil Line Color</Label>
                  <p className="text-xs text-zinc-500 mb-3">Pick the line color.</p>
                  <div className="grid grid-cols-4 gap-2">
                    {["black", "red", "blue", "green"].map((color) => (
                      <button
                        key={color}
                        onClick={() => 
                          setProcessingOptions(prev => ({ ...prev, lineColor: color as any }))
                        }
                        className={`p-4 rounded-lg border-2 transition-all ${
                          processingOptions.lineColor === color
                            ? "border-white scale-105"
                            : "border-zinc-700 hover:border-zinc-500"
                        }`}
                      >
                        <div 
                          className={`w-8 h-8 rounded-full mx-auto`}
                          style={{ 
                            backgroundColor: color === "black" ? "#000" : color,
                            border: color === "black" ? "2px solid #333" : "none"
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex gap-2">
                <Button
                  onClick={handleProcess}
                  disabled={!selectedFile || isProcessing}
                  className="flex-1"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    "Process Image"
                  )}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="lg"
                  disabled={isProcessing}
                >
                  Reset
                </Button>
              </CardFooter>
            </Card>

            {/* Usage Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Tu Uso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Créditos usados</span>
                    <Badge variant="secondary">12 / 50</Badge>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2">
                    <div className="bg-white h-2 rounded-full" style={{ width: "24%" }} />
                  </div>
                  <p className="text-xs text-zinc-500">
                    38 créditos restantes este mes
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Preview */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Preview</CardTitle>
                  {currentJob && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={viewMode === "preview" ? "default" : "ghost"}
                        onClick={() => setViewMode("preview")}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={viewMode === "sidebyside" ? "default" : "ghost"}
                        onClick={() => setViewMode("sidebyside")}
                      >
                        <Columns className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={viewMode === "slider" ? "default" : "ghost"}
                        onClick={() => setViewMode("slider")}
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {currentJob ? (
                  <div className="space-y-4">
                    {/* View Mode Display */}
                    <div className="relative bg-zinc-900 rounded-lg overflow-hidden" style={{ aspectRatio: "1" }}>
                      {viewMode === "preview" && (
                        <img
                          src={currentJob.processedImageUrl || ""}
                          alt="Processed"
                          className="w-full h-full object-contain"
                        />
                      )}
                      
                      {viewMode === "sidebyside" && (
                        <div className="flex h-full">
                          <div className="flex-1 p-2">
                            <div className="h-full bg-white rounded flex items-center justify-center">
                              <img
                                src={previewUrl || ""}
                                alt="Original"
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                          </div>
                          <div className="flex-1 p-2">
                            <div className="h-full bg-black rounded flex items-center justify-center">
                              <img
                                src={currentJob.processedImageUrl || ""}
                                alt="Processed"
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {viewMode === "slider" && (
                        <div className="relative w-full h-full">
                          <img
                            src={currentJob.processedImageUrl || ""}
                            alt="Processed"
                            className="absolute inset-0 w-full h-full object-contain"
                          />
                          <div
                            className="absolute inset-0 overflow-hidden"
                            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                          >
                            <img
                              src={previewUrl || ""}
                              alt="Original"
                              className="absolute inset-0 w-full h-full object-contain"
                            />
                          </div>
                          <div
                            className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
                            style={{ left: `${sliderPosition}%` }}
                            onMouseDown={(e) => {
                              const startX = e.clientX;
                              const startPos = sliderPosition;
                              
                              const handleMouseMove = (e: MouseEvent) => {
                                const delta = e.clientX - startX;
                                const newPos = Math.max(0, Math.min(100, startPos + (delta / 3)));
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
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-1">
                              <ChevronLeft className="h-3 w-3 text-black inline" />
                              <ChevronRight className="h-3 w-3 text-black inline" />
                            </div>
                          </div>
                          <div className="absolute top-2 left-2 bg-white text-black px-2 py-1 rounded text-xs font-medium">
                            Original Image
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Job Info */}
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500">Style:</span>
                        <span className="font-medium">{currentJob.style}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500">Status:</span>
                        <Badge variant={currentJob.status === "completed" ? "default" : "secondary"}>
                          {currentJob.status === "completed" ? "Completed" : currentJob.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Download Section */}
                    <Card className="bg-zinc-900 border-zinc-800">
                      <CardHeader>
                        <CardTitle className="text-lg">Download</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button
                          onClick={handleDownload}
                          className="w-full"
                          size="lg"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download PNG
                        </Button>
                        
                        <div className="p-3 bg-zinc-800 rounded-lg">
                          <p className="text-xs text-zinc-400 mb-2">To use in Procreate:</p>
                          <p className="text-xs">
                            Press and hold the stencil image above and select "Copy", 
                            then paste it directly into Procreate.
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2"
                            onClick={copyProcreateInstructions}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy Instructions
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : previewUrl ? (
                  <div className="space-y-4">
                    <div className="bg-zinc-900 rounded-lg p-4">
                      <img
                        src={previewUrl}
                        alt="Original"
                        className="w-full h-auto rounded"
                      />
                    </div>
                    <p className="text-center text-sm text-zinc-500">
                      Imagen lista para procesar
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-zinc-600" />
                      <p className="text-zinc-500">No image selected</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Gallery */}
          <div className="space-y-6">
            {/* Recent Gallery */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Galería Reciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  {recentJobs.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {recentJobs.map((job) => (
                        <div
                          key={job.id}
                          className="group cursor-pointer"
                          onClick={() => loadFromGallery(job)}
                        >
                          <div className="relative overflow-hidden rounded-lg bg-zinc-900 aspect-square">
                            <img
                              src={job.processedImageUrl || job.originalImageUrl}
                              alt={`Stencil ${job.style}`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Eye className="h-6 w-6 text-white" />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
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
                      <p className="text-zinc-500 text-sm">No hay trabajos recientes</p>
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