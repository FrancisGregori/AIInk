import { useState, useRef, useEffect } from "react";
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
import { 
  Sparkles, 
  Upload,
  Loader2,
  Download,
  RefreshCw,
  History,
  Eye,
  EyeOff,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Info,
  Wand2,
  Image as ImageIcon,
  Settings,
  Copy,
  Trash2,
  X
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";

interface EditHistory {
  id: string;
  prompt: string;
  originalImage: string;
  editedImage: string;
  timestamp: Date;
  settings: {
    strength: number;
    style: string;
  };
}

function DesignEditor() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [editHistory, setEditHistory] = useState<EditHistory[]>([]);
  const [strength, setStrength] = useState([0.7]);
  const [editStyle, setEditStyle] = useState("auto");
  const [showComparison, setShowComparison] = useState(true);
  const [comparePosition, setComparePosition] = useState(50);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Edit style options
  const editStyles = [
    { id: "auto", name: "Auto", description: "Let AI decide the best approach" },
    { id: "realistic", name: "Realistic", description: "Photorealistic edits" },
    { id: "artistic", name: "Artistic", description: "Creative interpretation" },
    { id: "minimal", name: "Minimal", description: "Subtle changes only" },
    { id: "dramatic", name: "Dramatic", description: "Bold transformations" },
  ];

  // Prompt suggestions
  const promptSuggestions = [
    "Change the background to a sunset",
    "Make it look like a painting",
    "Add tattoo style shading",
    "Convert to black and white sketch",
    "Make it more vibrant and colorful",
    "Transform into geometric art",
    "Add neon glow effects",
    "Make it look vintage",
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        setEditedImage(null);
        setEditHistory([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        setEditedImage(null);
        setEditHistory([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleProcessEdit = async () => {
    if (!originalImage || !editPrompt.trim()) {
      toast({
        title: "Missing information",
        description: "Please upload an image and enter edit instructions",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate processing (replace with actual API call)
    setTimeout(() => {
      const newEdit: EditHistory = {
        id: Date.now().toString(),
        prompt: editPrompt,
        originalImage: originalImage,
        editedImage: originalImage, // This would be the actual edited image from API
        timestamp: new Date(),
        settings: {
          strength: strength[0],
          style: editStyle,
        },
      };
      
      setEditedImage(originalImage); // This would be the actual edited image
      setEditHistory([newEdit, ...editHistory]);
      setIsProcessing(false);
      
      toast({
        title: "Edit complete",
        description: "Your image has been successfully edited",
      });
    }, 3000);
  };

  const handleRevertToHistory = (historyItem: EditHistory) => {
    setEditedImage(historyItem.editedImage);
    setEditPrompt(historyItem.prompt);
    setStrength([historyItem.settings.strength]);
    setEditStyle(historyItem.settings.style);
  };

  const handleReset = () => {
    setOriginalImage(null);
    setEditedImage(null);
    setEditPrompt("");
    setEditHistory([]);
    setStrength([0.7]);
    setEditStyle("auto");
  };

  const handleDownload = () => {
    if (!editedImage) return;
    
    const link = document.createElement("a");
    link.href = editedImage;
    link.download = `edited-design-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8 mt-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3">Design Editor</h1>
          <p className="text-light-gray text-lg">
            Transform your images with AI-powered text instructions
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Upload and Controls */}
          <div className="lg:col-span-1 space-y-4">
            {/* Upload Card */}
            <Card className="bg-dark-gray border-medium-gray">
              <CardHeader>
                <CardTitle className="text-white text-lg">Upload Image</CardTitle>
                <CardDescription className="text-light-gray">
                  Upload an image to start editing
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!originalImage ? (
                  <div
                    className="border-2 border-dashed border-medium-gray rounded-lg p-8 text-center cursor-pointer hover:border-light-gray transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <Upload className="mx-auto h-10 w-10 text-light-gray mb-3" />
                    <p className="text-light-gray mb-1">Click or drag image here</p>
                    <p className="text-sm text-medium-gray">PNG, JPG up to 10MB</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={originalImage}
                      alt="Original"
                      className="w-full rounded-lg"
                    />
                    <Button
                      onClick={() => setOriginalImage(null)}
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit Instructions */}
            <Card className="bg-dark-gray border-medium-gray">
              <CardHeader>
                <CardTitle className="text-white text-lg">Edit Instructions</CardTitle>
                <CardDescription className="text-light-gray">
                  Describe what you want to change
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="e.g., 'Change the background to a sunset' or 'Make it look like a watercolor painting'"
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  className="min-h-[100px] bg-black border-medium-gray text-white placeholder:text-medium-gray"
                  disabled={!originalImage}
                />
                
                {/* Quick Suggestions */}
                <div className="space-y-2">
                  <Label className="text-sm text-light-gray">Quick suggestions:</Label>
                  <div className="flex flex-wrap gap-2">
                    {promptSuggestions.slice(0, 4).map((suggestion) => (
                      <Badge
                        key={suggestion}
                        variant="outline"
                        className="cursor-pointer hover:bg-white hover:text-black transition-colors border-medium-gray text-light-gray"
                        onClick={() => setEditPrompt(suggestion)}
                      >
                        {suggestion}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card className="bg-dark-gray border-medium-gray">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Edit Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Strength Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-light-gray">Edit Strength</Label>
                    <span className="text-sm text-medium-gray">{(strength[0] * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={strength}
                    onValueChange={setStrength}
                    min={0}
                    max={1}
                    step={0.1}
                    className="[&>span]:bg-white"
                    disabled={!originalImage}
                  />
                  <p className="text-xs text-medium-gray">
                    Higher values make more dramatic changes
                  </p>
                </div>

                {/* Style Selection */}
                <div className="space-y-2">
                  <Label className="text-light-gray">Edit Style</Label>
                  <RadioGroup value={editStyle} onValueChange={setEditStyle} disabled={!originalImage}>
                    {editStyles.map((style) => (
                      <div key={style.id} className="flex items-start space-x-2">
                        <RadioGroupItem value={style.id} id={style.id} className="mt-1" />
                        <Label htmlFor={style.id} className="cursor-pointer">
                          <div>
                            <p className="text-white">{style.name}</p>
                            <p className="text-xs text-medium-gray">{style.description}</p>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleProcessEdit}
                  disabled={!originalImage || !editPrompt.trim() || isProcessing}
                  className="w-full bg-white text-black hover:bg-gray-100"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing Edit...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Apply Edit
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Middle Panel - Preview */}
          <div className="lg:col-span-2 space-y-4">
            {/* Preview Area */}
            <Card className="bg-dark-gray border-medium-gray">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white">Preview</CardTitle>
                  <div className="flex gap-2">
                    {editedImage && (
                      <>
                        <Button
                          onClick={() => setShowComparison(!showComparison)}
                          size="sm"
                          variant="outline"
                          className="border-medium-gray"
                        >
                          {showComparison ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          onClick={handleDownload}
                          size="sm"
                          variant="outline"
                          className="border-medium-gray"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {originalImage && (
                      <Button
                        onClick={handleReset}
                        size="sm"
                        variant="outline"
                        className="border-medium-gray text-red-500 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!originalImage && !editedImage ? (
                  <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed border-medium-gray rounded-lg">
                    <ImageIcon className="h-12 w-12 text-medium-gray mb-3" />
                    <p className="text-light-gray">No image uploaded yet</p>
                    <p className="text-sm text-medium-gray mt-1">Upload an image to start editing</p>
                  </div>
                ) : (
                  <div className="relative overflow-hidden rounded-lg">
                    {showComparison && originalImage && editedImage ? (
                      // Comparison View
                      <div className="relative h-[500px]">
                        <div className="absolute inset-0">
                          <img
                            src={originalImage}
                            alt="Original"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div 
                          className="absolute inset-0 overflow-hidden"
                          style={{ clipPath: `inset(0 ${100 - comparePosition}% 0 0)` }}
                        >
                          <img
                            src={editedImage}
                            alt="Edited"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize"
                          style={{ left: `${comparePosition}%` }}
                          draggable
                          onDrag={(e) => {
                            if (e.clientX > 0) {
                              const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                              if (rect) {
                                const newPosition = ((e.clientX - rect.left) / rect.width) * 100;
                                setComparePosition(Math.max(0, Math.min(100, newPosition)));
                              }
                            }
                          }}
                        >
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2">
                            <ChevronLeft className="h-3 w-3 text-black inline" />
                            <ChevronRight className="h-3 w-3 text-black inline" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Single Image View
                      <img
                        src={editedImage || originalImage || ""}
                        alt={editedImage ? "Edited" : "Original"}
                        className="w-full h-[500px] object-contain"
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit History */}
            {editHistory.length > 0 && (
              <Card className="bg-dark-gray border-medium-gray">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Edit History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-3">
                      {editHistory.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-black rounded-lg border border-medium-gray hover:border-light-gray transition-colors cursor-pointer"
                          onClick={() => handleRevertToHistory(item)}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={item.editedImage}
                              alt="History"
                              className="w-12 h-12 rounded object-cover"
                            />
                            <div>
                              <p className="text-sm text-white line-clamp-1">{item.prompt}</p>
                              <p className="text-xs text-medium-gray">
                                {new Date(item.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <RefreshCw className="h-4 w-4 text-light-gray" />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DesignEditor;