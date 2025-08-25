import { useState, useEffect, useRef } from 'react';

interface LazyGalleryImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  threshold?: number;
  rootMargin?: string;
  onLoad?: () => void;
  onError?: () => void;
  crossOrigin?: 'anonymous' | 'use-credentials';
}

export function LazyGalleryImage({ 
  src, 
  alt, 
  className, 
  containerClassName,
  threshold = 0.01,
  rootMargin = '200px',
  onLoad,
  onError,
  crossOrigin
}: LazyGalleryImageProps) {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isInView) {
          setIsInView(true);
          // Once in view, stop observing
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
  }, [threshold, rootMargin, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
    onError?.();
  };

  const url = src ? new URL(src, window.location.origin) : null;
  const isInternalAPI = url ? url.pathname.startsWith('/api/images/') : false;

  return (
    <div ref={containerRef} className={containerClassName || className}>
      {!isInView ? (
        // Placeholder mientras no está en viewport
        <div className={`${className} bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}>
          <div className="animate-pulse text-xs text-gray-500">...</div>
        </div>
      ) : (
        <>
          {/* Imagen real cuando está en viewport */}
          <img
            src={src}
            alt={alt}
            className={`${className} ${!isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
            loading="lazy"
            crossOrigin={crossOrigin || (isInternalAPI ? 'use-credentials' : undefined)}
            onLoad={handleLoad}
            onError={handleError}
          />
          {!isLoaded && !hasError && (
            <div className={`${className} absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}>
              <div className="animate-pulse text-xs text-gray-500">Cargando...</div>
            </div>
          )}
          {hasError && (
            <div className={`${className} absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}>
              <div className="text-xs text-red-500">Error</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}