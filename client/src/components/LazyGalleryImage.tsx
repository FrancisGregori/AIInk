import { useState, useEffect, useRef } from 'react';
import { AuthenticatedImage, type ImageVariants } from './AuthenticatedImage';

interface LazyGalleryImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  threshold?: number;
  rootMargin?: string;
  onLoad?: () => void;
  onError?: () => void;
  variants?: ImageVariants;
  priority?: boolean;
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
  variants,
  priority = false
}: LazyGalleryImageProps) {
  const [isInView, setIsInView] = useState(priority);
  const [hasLoaded, setHasLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Si es prioritaria o ya cargó, no usar observer
    if (priority || hasLoaded) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isInView) {
          setIsInView(true);
          setHasLoaded(true);
          // Once in view, stop observing
          if (containerRef.current) {
            observer.unobserve(containerRef.current);
          }
        }
      },
      {
        threshold,
        rootMargin,
        // Optimización: usar root null para viewport
        root: null
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
  }, [threshold, rootMargin, isInView, priority, hasLoaded]);

  // Precargar imagen cuando esté cerca del viewport
  useEffect(() => {
    if (isInView && !priority) {
      // Precargar la imagen principal
      const img = new Image();
      img.src = src;
      
      // Precargar variantes si existen
      if (variants?.webp) {
        Object.values(variants.webp).forEach(url => {
          const variantImg = new Image();
          variantImg.src = url;
        });
      }
    }
  }, [isInView, src, variants, priority]);

  return (
    <div ref={containerRef} className={containerClassName || className}>
      {!isInView ? (
        // Placeholder optimizado con skeleton
        <div className={`${className} bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 animate-pulse flex items-center justify-center`}>
          <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
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