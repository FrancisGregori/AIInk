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
}

export function LazyImage({ 
  src, 
  alt, 
  className, 
  threshold = 0.1,
  rootMargin = '100px',
  onLoad,
  onError,
  variants
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

  // Si ya está en vista, renderizar directamente la imagen
  if (isInView) {
    return (
      <AuthenticatedImage
        src={src}
        alt={alt}
        className={className}
        onLoad={onLoad}
        onError={onError}
        loading="lazy"
        variants={variants}
      />
    );
  }

  // Placeholder mientras no está en vista
  return (
    <div ref={containerRef} className={className}>
      <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <div className="animate-pulse text-xs text-gray-500">Cargando...</div>
      </div>
    </div>
  );
}