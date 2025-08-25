import { useState, useEffect, useRef } from 'react';
import { AuthenticatedImage, type ImageVariants } from './AuthenticatedImage';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  onLoad?: () => void;
  onError?: () => void;
  variants?: ImageVariants;
  priority?: boolean; // Nueva prop para imágenes prioritarias
}

export function LazyImage({ 
  src, 
  alt, 
  className, 
  threshold = 0.1,
  rootMargin = '100px',
  onLoad,
  onError,
  variants,
  priority = false
}: LazyImageProps) {
  const [isInView, setIsInView] = useState(priority); // Si es prioritaria, cargar de inmediato
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Si es prioritaria, no usar intersection observer
    if (priority) {
      setIsInView(true);
      return;
    }

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
  }, [threshold, rootMargin, priority]);

  return (
    <div ref={containerRef} className={className}>
      {!isInView ? (
        // Placeholder optimizado mientras no está en viewport
        <div className={`${className} bg-gray-100 dark:bg-gray-800 flex items-center justify-center animate-pulse`}>
          <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 rounded-full" />
        </div>
      ) : (
        <AuthenticatedImage
          src={src}
          alt={alt}
          className={className}
          onLoad={onLoad}
          onError={onError}
          variants={variants}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}
    </div>
  );
}