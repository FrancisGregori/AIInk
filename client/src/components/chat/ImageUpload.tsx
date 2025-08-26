import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  onImageSelect: (image: { file: File; preview: string; base64: string } | null) => void;
  uploadedImage: { file: File; preview: string; base64: string } | null;
  onClose: () => void;
}

export default function ImageUpload({ onImageSelect, uploadedImage, onClose }: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    const maxSize = 25 * 1024 * 1024; // 25MB

    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, WebP, HEIC, or HEIF image.",
        variant: "destructive"
      });
      return false;
    }

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 25MB.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = async (file: File) => {
    if (!validateFile(file)) return;

    try {
      // Create preview URL
      const preview = URL.createObjectURL(file);
      
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data:image/jpeg;base64, prefix
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      onImageSelect({ file, preview, base64 });
      
      toast({
        title: "Image uploaded",
        description: "Your image is ready for editing!"
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to process the image. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemoveImage = () => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage.preview);
    }
    onImageSelect(null);
  };

  return (
    <div className="px-4 pb-4">
      {uploadedImage ? (
        <div className="border border-border rounded-xl p-4 bg-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Imagen Cargada</h3>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveImage}
                data-testid="button-remove-image"
              >
                Quitar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                data-testid="button-close-upload"
              >
                Cerrar
              </Button>
            </div>
          </div>
          <div className="rounded-lg overflow-hidden border border-border bg-muted/20">
            <img 
              src={uploadedImage.preview} 
              alt={uploadedImage.file.name}
              className="w-full h-auto max-h-80 object-contain bg-background"
              data-testid="img-preview"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            {uploadedImage.file.name} • {(uploadedImage.file.size / 1024 / 1024).toFixed(2)} MB
          </p>
          <p className="text-xs text-primary mt-1 text-center font-medium">
            ✨ Lista para editar
          </p>
        </div>
      ) : (
        <div 
          className={`border-2 border-dashed rounded-xl p-6 text-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer ${
            isDragOver ? 'border-primary bg-primary/5' : 'border-border'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          data-testid="dropzone-image"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">Drop your image here or click to browse</p>
              <p className="text-xs text-muted-foreground">Supports JPEG, PNG, WebP, HEIC, HEIF up to 25MB</p>
            </div>
          </div>
          <input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            onChange={handleFileInputChange}
            data-testid="input-file"
          />
        </div>
      )}
    </div>
  );
}
