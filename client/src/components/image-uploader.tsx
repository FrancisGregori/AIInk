import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ImageUploaderProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
}

export default function ImageUploader({ selectedFile, onFileSelect }: ImageUploaderProps) {
  const { toast } = useToast();
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      toast({
        title: "Invalid file",
        description: "Please upload a valid image file (JPG, PNG, GIF) under 10MB",
        variant: "destructive",
      });
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      onFileSelect(file);
      toast({
        title: "Image uploaded",
        description: `Selected ${file.name}`,
      });
    }
  }, [onFileSelect, toast]);

  // Create preview URL when file changes
  useEffect(() => {
    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
      
      // Cleanup
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreview(null);
    }
  }, [selectedFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  });

  return (
    <div 
      {...getRootProps()}
      className={`bg-zinc-900 rounded-2xl p-6 border-2 border-dashed border-zinc-700 hover:border-zinc-500 transition-colors cursor-pointer ${
        isDragActive ? 'drag-over' : ''
      }`}
    >
      <input {...getInputProps()} />
      <div className="text-center">
        <div className="w-16 h-16 bg-zinc-700 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
          {preview ? (
            <img 
              src={preview} 
              alt="Uploaded image preview" 
              className="w-full h-full object-cover"
            />
          ) : (
            <CloudUpload className="h-8 w-8 text-gray-400" />
          )}
        </div>
        
        {selectedFile ? (
          <>
            <h3 className="text-xl font-semibold mb-2">File Selected</h3>
            <p className="text-gray-400 mb-2">{selectedFile.name}</p>
            <p className="text-sm text-gray-500 mb-6">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </>
        ) : (
          <>
            <h3 className="text-xl font-semibold mb-2">Upload Your Image</h3>
            <p className="text-gray-400 mb-6">
              {isDragActive ? "Drop the image here" : "Drag and drop your image here, or click to browse"}
            </p>
          </>
        )}
        
        <div className="space-y-3">
          <Button 
            type="button"
            className="w-full bg-white text-black hover:bg-gray-200"
          >
            {selectedFile ? "Change File" : "Choose File"}
          </Button>
          <p className="text-sm text-gray-400">Supports JPG, PNG, GIF up to 10MB</p>
        </div>
      </div>
    </div>
  );
}