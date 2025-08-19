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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Hardcoded styles with correct descriptions
  const stencilStyles = [
    {
      id: "steven",
      name: "Steven Hernandez",
      description: "Clean, classic detail",
      thumbnail: "/api/placeholder/80/80"
    },
    {
      id: "andres",
      name: "Andres Makishi",
      description: "Minimalist fine-line",
      thumbnail: "/api/placeholder/80/80"
    },
    {
      id: "darwin",
      name: "Darwin Enriquez",
      description: "Clean, detailed lines",
      thumbnail: "/api/placeholder/80/80"
    },
    {
      id: "adrian",
      name: "Adrian Rod",
      description: "Detailed & high-contrast",
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - File Selection and Settings */}
          <div className="space-y-6">
            {/* File Upload Card */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">File Selected</CardTitle>
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
                      Change File
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
                    <p className="text-sm text-zinc-400">Click or drag image here</p>
                    <p className="text-xs text-zinc-500 mt-2">Supports JPG, PNG, GIF up to 10MB</p>
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
                  Stencil Style
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Exclusive AI models trained on each artist's signature lines
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
                <CardTitle className="text-white">Stencil Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* PNG Outline Option */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="png-outline" className="text-white">
                      PNG Outline (No Background)
                    </Label>
                    <Switch
                      id="png-outline"
                      checked={pngOutline}
                      onCheckedChange={setPngOutline}
                    />
                  </div>
                  <p className="text-xs text-zinc-500">Lines only - for easy transfer</p>
                </div>

                {/* Stencil Line Color */}
                <div className="space-y-2">
                  <Label className="text-white">Stencil Line Color</Label>
                  <p className="text-xs text-zinc-500">Pick the line color:</p>
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
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Create Stencil
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
                Reset
              </Button>
            )}
          </div>

          {/* Right Column - Preview */}
          <div className="lg:col-span-2">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Preview</CardTitle>
                  {previewUrl && currentJob?.processedImageUrl && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={compareMode === "side-by-side" ? "default" : "outline"}
                        onClick={() => setCompareMode(compareMode === "side-by-side" ? null : "side-by-side")}
                      >
                        Side by Side
                      </Button>
                      <Button
                        size="sm"
                        variant={compareMode === "slider" ? "default" : "outline"}
                        onClick={() => setCompareMode(compareMode === "slider" ? null : "slider")}
                      >
                        Slider
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
                      <p className="text-zinc-500">No image selected</p>
                    </div>
                  ) : compareMode === "side-by-side" && currentJob?.processedImageUrl ? (
                    // Side by Side Comparison
                    <div className="flex gap-4 w-full">
                      <div className="flex-1">
                        <p className="text-xs text-zinc-400 mb-2 text-center">Original Image</p>
                        <img
                          src={previewUrl}
                          alt="Original"
                          className="w-full rounded-lg"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-zinc-400 mb-2 text-center">Processed Stencil</p>
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
                      <span className="text-sm text-zinc-400">Style:</span>
                      <Badge variant="secondary">{selectedStyle}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-400">Status:</span>
                      <Badge variant={isCompleted ? "default" : "secondary"}>
                        {currentJob.status}
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
                      Download PNG
                    </Button>
                    <p className="text-xs text-zinc-500 text-center">
                      To use in Procreate: Press and hold the stencil image above and select "Copy", then paste it directly into Procreate.
                    </p>
                  </div>
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default StencilTool;