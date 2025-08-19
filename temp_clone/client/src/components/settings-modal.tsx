import { useState, useEffect } from "react";
import { X, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [apiToken, setApiToken] = useState("");
  const [defaultSize, setDefaultSize] = useState("1024x1024");
  const [autoDownload, setAutoDownload] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Load saved settings
      const savedToken = localStorage.getItem("replicate_api_token") || "";
      const savedSize = localStorage.getItem("default_image_size") || "1024x1024";
      const savedAutoDownload = localStorage.getItem("auto_download") === "true";
      
      setApiToken(savedToken);
      setDefaultSize(savedSize);
      setAutoDownload(savedAutoDownload);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!apiToken.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid Replicate API token",
        variant: "destructive",
      });
      return;
    }

    // Save settings to localStorage
    localStorage.setItem("replicate_api_token", apiToken.trim());
    localStorage.setItem("default_image_size", defaultSize);
    localStorage.setItem("auto_download", autoDownload.toString());

    toast({
      title: "Success",
      description: "Settings saved successfully",
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-foreground">Settings</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label className="text-foreground mb-2">
              Replicate API Token
              <span className="text-muted-foreground ml-1">(Secure)</span>
            </Label>
            <Input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              className="bg-input border-border text-foreground placeholder-muted-foreground focus:ring-ring focus:border-ring"
              placeholder="r8_*********************"
            />
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <Lock className="mr-1 h-3 w-3" />
              Your API key is stored locally and never sent to our servers
            </p>
          </div>

          <div>
            <Label className="text-foreground mb-2">Default Image Size</Label>
            <Select value={defaultSize} onValueChange={setDefaultSize}>
              <SelectTrigger className="bg-input border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="1024x1024">1024x1024 (Square)</SelectItem>
                <SelectItem value="1024x768">1024x768 (Landscape)</SelectItem>
                <SelectItem value="768x1024">768x1024 (Portrait)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-foreground">Auto-download images</Label>
              <p className="text-xs text-muted-foreground">Automatically download generated images</p>
            </div>
            <Switch
              checked={autoDownload}
              onCheckedChange={setAutoDownload}
            />
          </div>
        </div>
        
        <div className="border-t border-border pt-4">
          <div className="flex space-x-3">
            <Button 
              onClick={handleSave}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Save Settings
            </Button>
            <Button 
              onClick={onClose}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
