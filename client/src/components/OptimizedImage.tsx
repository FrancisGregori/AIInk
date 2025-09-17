import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

interface OptimizedImageProps {
  src: string;
  thumbnailSrc?: string | null;
  alt: string;
  className?: string;
  objectFit?: 'cover' | 'contain';
  loading?: 'lazy' | 'eager';
  quality?: 'low' | 'medium' | 'high';
}

export function OptimizedImage({
  src,
  thumbnailSrc,
  alt,
  className,
  objectFit = 'cover',
  loading = 'lazy',
  quality = 'medium'
}: OptimizedImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const loadedUrls = useRef<Set<string>>(new Set());

  useEffect(() => {
    let isCancelled = false;

    const loadImage = async (url: string) => {
      // Se já foi carregada, usar cache do navegador
      if (loadedUrls.current.has(url)) {
        setCurrentSrc(url);
        setIsLoading(false);
        return;
      }

      try {
        // Para URLs da API, fazer fetch com autenticação
        if (url.startsWith('/api/')) {
          const response = await apiFetch(url);
          if (!response.ok) throw new Error('Failed to load image');
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);

          if (!isCancelled) {
            setCurrentSrc(objectUrl);
            loadedUrls.current.add(url);
            setIsLoading(false);
          }
        } else {
          // Para outras URLs, carregar diretamente
          const img = new Image();
          img.src = url;

          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });

          if (!isCancelled) {
            setCurrentSrc(url);
            loadedUrls.current.add(url);
            setIsLoading(false);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setError(true);
          setIsLoading(false);
        }
      }
    };

    // If loading is eager, load immediately
    if (loading === 'eager') {
      if (thumbnailSrc) {
        loadImage(thumbnailSrc).then(() => {
          if (thumbnailSrc !== src && !isCancelled) {
            loadImage(src);
          }
        });
      } else {
        loadImage(src);
      }
      return () => {
        isCancelled = true;
      };
    }

    // For lazy loading, use IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(async (entry) => {
          if (entry.isIntersecting) {
            // For gallery view with low quality, just load the main image
            if (quality === 'low') {
              await loadImage(src);
            } else if (thumbnailSrc) {
              // Load thumbnail first if available
              await loadImage(thumbnailSrc);
              // Then load full image in background for high quality
              if (thumbnailSrc !== src && quality === 'high') {
                loadImage(src).then(() => {
                  if (!isCancelled) {
                    setCurrentSrc(src);
                  }
                });
              }
            } else {
              await loadImage(src);
            }
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: quality === 'low' ? '50px' : '100px',
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      isCancelled = true;
      observer.disconnect();
    };
  }, [src, thumbnailSrc, loading, quality]);

  return (
    <div ref={imgRef} className={cn('relative overflow-hidden', className)}>
      {/* Loading placeholder */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400 text-sm">Error loading image</span>
        </div>
      )}

      {/* Image */}
      {currentSrc && !error && (
        <img
          src={currentSrc}
          alt={alt}
          className={cn(
            'w-full h-full transition-opacity duration-500',
            isLoading ? 'opacity-0' : 'opacity-100',
            objectFit === 'contain' ? 'object-contain' : 'object-cover'
          )}
          onLoad={() => setIsLoading(false)}
        />
      )}
    </div>
  );
}