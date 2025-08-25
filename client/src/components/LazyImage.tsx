import { useState, useEffect, useRef } from 'react';
import { AuthenticatedImage } from './AuthenticatedImage';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({ 
  src, 
  alt, 
  className, 
  threshold = 0.1,
  rootMargin = '100px',
  onLoad,
  onError 
}: LazyImageProps) {
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          // Once loaded, stop observing
          if (containerRef.current) {
            observer.unobserve(containerRef.current);
          }
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [threshold, rootMargin]);

  return (
    <div ref={containerRef} className={className}>
      {isInView ? (
        <AuthenticatedImage
          src={src}
          alt={alt}
          className={className}
          onLoad={onLoad}
          onError={onError}
          loading="lazy"
        />
      ) : (
        <div className={`${className} bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}>
          <div className="animate-pulse text-xs text-gray-500">...</div>
        </div>
      )}
    </div>
  );
}