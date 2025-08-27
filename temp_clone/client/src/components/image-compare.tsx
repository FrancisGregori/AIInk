import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageCompareProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export default function ImageCompare({ 
  beforeImage, 
  afterImage, 
  beforeLabel = 'Antes', 
  afterLabel = 'Después' 
}: ImageCompareProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchend', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="relative w-full h-full">
      <div 
        ref={containerRef}
        className="relative w-full h-full overflow-hidden select-none cursor-ew-resize"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        {/* After Image (Background) */}
        <div className="absolute inset-0">
          <img 
            src={afterImage} 
            alt={afterLabel}
            className="w-full h-full object-contain"
            draggable={false}
          />
        </div>

        {/* Before Image (Foreground with clip) */}
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img 
            src={beforeImage} 
            alt={beforeLabel}
            className="w-full h-full object-contain"
            draggable={false}
          />
        </div>

        {/* Slider Line */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
        >
          {/* Slider Handle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-white rounded-full p-2 shadow-xl flex items-center justify-center">
              <ChevronLeft className="w-4 h-4 text-gray-700" />
              <div className="w-px h-6 bg-gray-400 mx-1" />
              <ChevronRight className="w-4 h-4 text-gray-700" />
            </div>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm font-medium">
          {beforeLabel}
        </div>
        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm font-medium">
          {afterLabel}
        </div>
      </div>
    </div>
  );
}