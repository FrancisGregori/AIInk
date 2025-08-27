import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, ZoomIn, Loader2, Columns, Move, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { StencilJob } from "@shared/schema";
import ImageComparison from "./image-comparison";

interface PreviewAreaProps {
  selectedFile: File | null;
  selectedStyle: string;
  jobId: string | null;
  externalImageUrl?: string | null;
  currentJob?: StencilJob | null;
}

export default function PreviewArea({ selectedFile, selectedStyle, jobId, externalImageUrl, currentJob }: PreviewAreaProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [comparisonMode, setComparisonMode] = useState<"side-by-side" | "slider">("slider");
  const [showZoomModal, setShowZoomModal] = useState(false);

  // Generate preview URL for selected file or use external URL
  useEffect(() => {
    if (externalImageUrl) {
      setPreviewUrl(externalImageUrl);
    } else if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile, externalImageUrl]);

  // Poll for job updates SOLO si no tenemos currentJob directo
  const { data: serverJob, isLoading } = useQuery<StencilJob>({
    queryKey: [`/api/stencil/jobs/${jobId}`],
    enabled: !!jobId && !currentJob,
    refetchInterval: jobId && !currentJob ? 2000 : false, // Poll only if no currentJob
  });

  // Usar currentJob directo o el del servidor
  const job = currentJob || serverJob;

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "completed": return "text-white";
      case "failed": return "text-gray-400";
      case "processing": return "text-gray-300";
      default: return "text-gray-400";
    }
  };

  const isProcessing = job?.status === "processing" || job?.status === "pending";
  const hasProcessedImage = job?.status === "completed" && job?.processedImageUrl;

  return (
    <div className="bg-zinc-900 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Preview</h3>
        <div className="flex items-center gap-2">
          {hasProcessedImage && (
            <>
              {/* Comparison Mode Toggle */}
              <div className="flex bg-zinc-800 rounded-lg p-1">
                <Button
                  size="sm"
                  variant={comparisonMode === "side-by-side" ? "default" : "ghost"}
                  onClick={() => setComparisonMode("side-by-side")}
                  className="h-8 px-3 text-sm"
                >
                  <Columns className="h-4 w-4 mr-2" />
                  Side by Side
                </Button>
                <Button
                  size="sm"
                  variant={comparisonMode === "slider" ? "default" : "ghost"}
                  onClick={() => setComparisonMode("slider")}
                  className="h-8 px-3 text-sm"
                >
                  <Move className="h-4 w-4 mr-2" />
                  Slider
                </Button>
              </div>
            </>
          )}
          <Button
            size="sm"
            variant="secondary"
            className="p-2 h-auto"
            onClick={() => setShowZoomModal(true)}
            disabled={!hasProcessedImage}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Preview Container */}
      {!selectedFile ? (
        <div className="h-[400px] bg-zinc-800 rounded-xl border-2 border-dashed border-zinc-600 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="w-16 h-16 bg-zinc-700 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Eye className="h-8 w-8" />
            </div>
            <p className="text-lg font-medium">No image uploaded</p>
            <p className="text-sm">Upload an image to see the preview</p>
          </div>
        </div>
      ) : hasProcessedImage && job.originalImageUrl && job.processedImageUrl ? (
        // Image comparison view
        <div className="max-h-[400px] overflow-hidden bg-zinc-800 rounded-xl">
          <ImageComparison
            originalImage={job.originalImageUrl}
            processedImage={job.processedImageUrl}
            mode={comparisonMode}
          />
        </div>
      ) : (
        // Single image view (original or processing)
        <div className="h-[400px] bg-zinc-800 rounded-xl border-2 border-dashed border-zinc-600 flex items-center justify-center relative overflow-hidden">
          <img
            src={previewUrl!}
            alt="Original image"
            className="max-h-[400px] w-auto h-auto object-contain rounded-lg"
          />

          {/* Processing Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
                <p className="text-lg font-medium">Processing your stencil...</p>
                <p className="text-sm text-gray-400">This may take a few moments</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview Info */}
      <div className="mt-4 p-4 bg-zinc-800 rounded-xl">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Style:</span>
            <span className="ml-2 font-medium capitalize">
              {selectedFile ? selectedStyle : "--"}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Status:</span>
            <span className={`ml-2 font-medium ${getStatusColor(job?.status)}`}>
              {job?.status ? job.status.charAt(0).toUpperCase() + job.status.slice(1) : "Ready"}
            </span>
          </div>
        </div>
        
        {job?.errorMessage && (
          <div className="mt-3 p-2 bg-red-900/20 border border-red-900/50 rounded text-red-400 text-sm">
            {job.errorMessage}
          </div>
        )}
      </div>

      {/* Zoom Modal */}
      <Dialog open={showZoomModal} onOpenChange={setShowZoomModal}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-white border-zinc-300">
          <DialogTitle className="sr-only">Zoomed Stencil View</DialogTitle>
          <div className="relative bg-white">
            <Button
              onClick={() => setShowZoomModal(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-black hover:bg-zinc-800 text-white"
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
            {job?.processedImageUrl && (
              <div className="p-4 flex items-center justify-center bg-white">
                <img
                  src={job.processedImageUrl}
                  alt="Zoomed stencil"
                  className="max-w-full max-h-[85vh] object-contain"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}