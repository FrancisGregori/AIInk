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
import PreviewArea from "@/components/preview-area";
import StyleSelector from "@/components/style-selector";
import ImageUploader from "@/components/image-uploader";
import type { StencilJob, StencilStyle } from "@shared/schema";

interface ProcessingOptions {
  removeBackground: boolean;
  lineColor: "black" | "red" | "blue" | "green";
}

function StencilTool() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>("steven");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentJob, setCurrentJob] = useState<StencilJob | null>(null);
  const [processingOptions, setProcessingOptions] = useState<ProcessingOptions>({
    removeBackground: true,
    lineColor: "black"
  });
  const queryClient = useQueryClient();
  
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

  // Handle file selection with auto-scroll
  const handleFileSelectWithScroll = (file: File | null) => {
    setSelectedFile(file);
    if (file) {
      setCurrentJob(null);
      // Auto-scroll to style section when image is loaded
      setTimeout(() => {
        styleSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };



  // Process image with auto-scroll to preview
  const handleProcess = () => {
    if (!selectedFile || !selectedStyle) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("style", selectedStyle);
    formData.append("userId", "demo-user");
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

  // Load job from gallery
  const loadFromGallery = (job: StencilJob) => {
    setCurrentJob(job);
    setSelectedStyle(job.style);
    // Set a fake file to enable preview
    const fakeFile = new File([""], "loaded-image.png", { type: "image/png" });
    setSelectedFile(fakeFile);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-1">Stencil Tool</h1>
          <p className="text-zinc-400 text-sm">Transform images into professional tattoo stencils</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          {/* Left Column - Upload & Settings */}
          <div className="xl:col-span-2 lg:col-span-2 space-y-4">
            {/* Image Upload with Drag & Drop */}
            <ImageUploader
              selectedFile={selectedFile}
              onFileSelect={handleFileSelectWithScroll}
            />

            {/* Style Selection - Visual */}
            <div ref={styleSectionRef}>
              <StyleSelector
                selectedStyle={selectedStyle}
                onStyleChange={setSelectedStyle}
              />
            </div>

            {/* Processing Settings - Compact */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Processing Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* PNG Outline Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="remove-bg" className="text-sm">Remove Background</Label>
                    <p className="text-xs text-zinc-500">PNG with transparent background</p>
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
                  <Label className="text-sm mb-2 block">Stencil Color</Label>
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
                        <span>Processing... this may take up to 40 seconds</span>
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
                        Generating Stencil...
                      </>
                    ) : (
                      "Generate Stencil"
                    )}
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    size="sm"
                    disabled={isProcessing}
                  >
                    Clear
                  </Button>
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