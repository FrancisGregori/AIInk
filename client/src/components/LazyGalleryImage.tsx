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
  variants
}: LazyGalleryImageProps) {
  const [isInView, setIsInView] = useState(false);
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

  return (
    <div ref={containerRef} className={containerClassName || className}>
      {!isInView ? (
        // Placeholder mientras no está en viewport
        <div className={`${className} bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}>
          <div className="animate-pulse text-xs text-gray-500">...</div>
        </div>
      ) : (
        <AuthenticatedImage
          src={src}
          alt={alt}
          className={className}
          onLoad={onLoad}
          onError={onError}
          variants={variants}
        />
      )}
    </div>
  );
}