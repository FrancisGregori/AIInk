import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sparkles, 
  Upload,
  Loader2,
  Download,
  History,
  Image as ImageIcon,
  Trash2
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import ImageComparison from "@/components/image-comparison";

interface EditHistory {
  id: string;
  prompt: string;
  originalImage: string;
  editedImage: string;
  timestamp: Date;
  strength: number;
}

function DesignEditor() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [editHistory, setEditHistory] = useState<EditHistory[]>([]);
  const [strength, setStrength] = useState([0.75]);
  const [showComparison, setShowComparison] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        setEditedImage(null);
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
        strength: strength[0],
      };
      
      setEditedImage(originalImage); // This would be the actual edited image
      setEditHistory([newEdit, ...editHistory]);
      setIsProcessing(false);
      setShowComparison(true);
      
      toast({
        title: "Edit complete",
        description: "Your image has been successfully edited",
      });
    }, 3000);
  };

  const handleRevertToHistory = (historyItem: EditHistory) => {
    setEditedImage(historyItem.editedImage);
    setEditPrompt(historyItem.prompt);
    setStrength([historyItem.strength]);
    setShowComparison(true);
  };

  const handleReset = () => {
    setOriginalImage(null);
    setEditedImage(null);
    setEditPrompt("");
    setEditHistory([]);
    setStrength([0.75]);
    setShowComparison(false);
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
      
      <div className="max-w-6xl mx-auto px-4 py-8 mt-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3">Design Editor</h1>
          <p className="text-light-gray text-lg">
            Transform your designs with AI-powered editing
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Image Upload and Display */}
          <div className="space-y-4">
            <Card className="bg-dark-gray border-medium-gray">
              <CardHeader>
                <CardTitle className="text-white">Upload Image</CardTitle>
              </CardHeader>
              <CardContent>
                {!originalImage ? (
                  <div
                    className="border-2 border-dashed border-medium-gray rounded-lg p-12 text-center cursor-pointer hover:border-light-gray transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <Upload className="mx-auto h-12 w-12 text-light-gray mb-4" />
                    <p className="text-light-gray mb-2">Click or drag image here</p>
                    <p className="text-sm text-medium-gray">PNG, JPG up to 10MB</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      data-testid="input-image-upload"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {showComparison && editedImage ? (
                      <ImageComparison
                        originalImage={originalImage}
                        processedImage={editedImage}
                        mode="slider"
                      />
                    ) : (
                      <img
                        src={originalImage}
                        alt="Original"
                        className="w-full rounded-lg"
                        data-testid="img-original"
                      />
                    )}
                    
                    <div className="flex gap-2">
                      {editedImage && (
                        <>
                          <Button
                            onClick={() => setShowComparison(!showComparison)}
                            variant="outline"
                            className="flex-1 border-medium-gray text-white hover:bg-dark-gray"
                            data-testid="button-toggle-comparison"
                          >
                            {showComparison ? "Hide" : "Show"} Comparison
                          </Button>
                          <Button
                            onClick={handleDownload}
                            variant="outline"
                            className="border-medium-gray text-white hover:bg-dark-gray"
                            data-testid="button-download"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        onClick={handleReset}
                        variant="outline"
                        className="border-medium-gray text-red-500 hover:bg-dark-gray"
                        data-testid="button-reset"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit History */}
            {editHistory.length > 0 && (
              <Card className="bg-dark-gray border-medium-gray">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Edit History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {editHistory.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-black rounded-lg border border-medium-gray hover:border-light-gray transition-colors cursor-pointer"
                          onClick={() => handleRevertToHistory(item)}
                          data-testid={`history-item-${item.id}`}
                        >
                          <p className="text-sm text-white line-clamp-1">{item.prompt}</p>
                          <p className="text-xs text-medium-gray">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Edit Controls */}
          <div className="space-y-4">
            <Card className="bg-dark-gray border-medium-gray">
              <CardHeader>
                <CardTitle className="text-white">Edit Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="prompt" className="text-light-gray mb-2">
                    Describe what you want to change
                  </Label>
                  <Textarea
                    id="prompt"
                    placeholder="e.g., 'Make it black and white' or 'Add tattoo style shading'"
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    className="min-h-[120px] bg-black border-medium-gray text-white placeholder:text-medium-gray"
                    disabled={!originalImage}
                    data-testid="input-edit-prompt"
                  />
                </div>

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
                    step={0.05}
                    className="[&>span]:bg-white"
                    disabled={!originalImage}
                    data-testid="slider-strength"
                  />
                  <p className="text-xs text-medium-gray">
                    Higher values make more dramatic changes
                  </p>
                </div>

                <Button
                  onClick={handleProcessEdit}
                  disabled={!originalImage || !editPrompt.trim() || isProcessing}
                  className="w-full bg-white text-black hover:bg-gray-200"
                  data-testid="button-apply-edit"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Apply Edit
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* AI Suggestions */}
            <Card className="bg-dark-gray border-medium-gray">
              <CardHeader>
                <CardTitle className="text-white">AI Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    "Convert to black and white stencil",
                    "Add tattoo style shading",
                    "Make it more minimalist",
                    "Transform to geometric design",
                    "Add artistic texture"
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      onClick={() => setEditPrompt(suggestion)}
                      variant="outline"
                      className="w-full justify-start text-left border-medium-gray text-light-gray hover:bg-dark-gray hover:text-white"
                      disabled={!originalImage}
                      data-testid={`suggestion-${suggestion.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DesignEditor;