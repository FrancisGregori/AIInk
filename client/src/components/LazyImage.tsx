import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  thumbnailSrc?: string;
  onLoad?: () => void;
}

export function LazyImage({
  src,
  alt,
  className,
  thumbnailSrc,
  onLoad
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Carregar thumbnail primeiro se disponível
            setImageSrc(thumbnailSrc || src);

            // Pré-carregar imagem completa se for thumbnail
            if (thumbnailSrc && thumbnailSrc !== src) {
              const img = new Image();
              img.src = src;
              img.onload = () => {
                setImageSrc(src);
                setImageLoaded(true);
                onLoad?.();
              };
            } else {
              setImageLoaded(true);
              onLoad?.();
            }

            // Desconectar observer após carregar
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Carregar 50px antes de entrar na viewport
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [src, thumbnailSrc, onLoad]);

  return (
    <div ref={imgRef} className={cn('relative overflow-hidden', className)}>
      {!imageSrc && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={cn(
            'w-full h-full transition-opacity duration-300',
            imageLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          onLoad={() => {
            if (!imageLoaded) {
              setImageLoaded(true);
              onLoad?.();
            }
          }}
        />
      )}
    </div>
  );
}