import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageComparisonProps {
  originalImage: string;
  processedImage: string;
  mode: "side-by-side" | "slider";
}

export default function ImageComparison({ originalImage, processedImage, mode }: ImageComparisonProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (mode !== "slider") return;
    isDragging.current = true;
    handleMouseMove(e);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (mode !== "slider") return;
    isDragging.current = true;
    handleTouchMove(e);
  };

  const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
    if (!isDragging.current || mode !== "slider") return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.min(100, Math.max(0, percentage)));
  };

  const handleTouchMove = (e: React.TouchEvent | TouchEvent) => {
    if (!isDragging.current || mode !== "slider") return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.min(100, Math.max(0, percentage)));
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    if (mode === "slider") {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);
      
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [mode]);

  if (mode === "side-by-side") {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium mb-2 text-gray-400">Original Image</h4>
          <div className="relative bg-gray-100 rounded-lg overflow-hidden">
            <img 
              src={originalImage} 
              alt="Original" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium mb-2 text-gray-400">Result</h4>
          <div className="relative bg-gray-100 rounded-lg overflow-hidden">
            <img 
              src={processedImage} 
              alt="Processed" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative bg-gray-100 rounded-lg overflow-hidden cursor-ew-resize select-none touch-none"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Use the original image to set container dimensions */}
      <img 
        src={originalImage} 
        alt="Original" 
        className="w-full h-auto invisible"
      />
      
      {/* Original Image (Background) - positioned absolutely over invisible image */}
      <img 
        src={originalImage} 
        alt="Original" 
        className="absolute inset-0 w-full h-full object-contain"
      />
      <div className="absolute top-4 left-4 bg-black/70 px-3 py-1 rounded text-sm z-10">
        Original Image
      </div>

      {/* Processed Image (Overlay) - Must be positioned exactly the same */}
      <div 
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img 
          src={processedImage} 
          alt="Processed" 
          className="absolute inset-0 w-full h-full object-contain"
        />
        <div className="absolute top-4 right-4 bg-black/70 px-3 py-1 rounded text-sm z-10">
          Result
        </div>
      </div>

      {/* Slider Line and Handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-20"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
          <ChevronLeft className="absolute -left-1 h-3 w-3 text-black" />
          <ChevronRight className="absolute -right-1 h-3 w-3 text-black" />
        </div>
      </div>
    </div>
  );
}