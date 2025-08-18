import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image } from "lucide-react";

interface StencilUploaderProps {
  onImageUpload: (file: File) => void;
  previewUrl: string;
}

export default function StencilUploader({ onImageUpload, previewUrl }: StencilUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      onImageUpload(imageFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const clearImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Clear preview would be handled by parent component
  };

  return (
    <div className="space-y-4">
      {!previewUrl ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-white bg-white/5'
              : 'border-medium-gray hover:border-light-gray'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          data-testid="dropzone-upload"
        >
          <Upload className="h-12 w-12 text-light-gray mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            Arrastra tu imagen aquí
          </h3>
          <p className="text-light-gray mb-4">
            O haz clic para seleccionar un archivo
          </p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="border-medium-gray hover:bg-light-gray/20"
            data-testid="button-select-file"
          >
            Seleccionar archivo
          </Button>
        </div>
      ) : (
        <div className="relative">
          <div className="aspect-square bg-black rounded-lg overflow-hidden border border-medium-gray">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
              data-testid="img-preview"
            />
          </div>
          <Button
            onClick={clearImage}
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            data-testid="button-clear-image"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-file-hidden"
      />

      <div className="text-sm text-light-gray">
        <p>Formatos soportados: JPG, PNG, WebP</p>
        <p>Tamaño máximo: 10MB</p>
      </div>
    </div>
  );
}
