import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

interface OptimizedImageProps {
  src: string;
  thumbnailSrc?: string | null;
  alt: string;
  className?: string;
  objectFit?: 'cover' | 'contain';
}

export function OptimizedImage({
  src,
  thumbnailSrc,
  alt,
  className,
  objectFit = 'cover'
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

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(async (entry) => {
          if (entry.isIntersecting) {
            // Carregar thumbnail primeiro se disponível
            if (thumbnailSrc) {
              await loadImage(thumbnailSrc);
              // Depois carregar imagem completa em background
              if (thumbnailSrc !== src) {
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
        rootMargin: '100px',
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
  }, [src, thumbnailSrc]);

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