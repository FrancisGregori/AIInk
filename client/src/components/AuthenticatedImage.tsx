import { useState, useEffect, useRef } from 'react';

interface ImageVariants {
  webp?: Record<number, string>;
  avif?: Record<number, string>;
}

interface AuthenticatedImageProps {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  loading?: 'lazy' | 'eager';
  variants?: ImageVariants;
}

export function AuthenticatedImage({ src, alt, className, onLoad, onError, loading = 'lazy', variants }: AuthenticatedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isTimeout, setIsTimeout] = useState(false);
  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset loading and error states when the source changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setIsTimeout(false);
    timeoutId.current = setTimeout(() => {
      setIsTimeout(true);
      handleError();
    }, 10000);
    return () => {
      if (timeoutId.current) clearTimeout(timeoutId.current);
    };
  }, [src]);

  const handleLoad = () => {
    if (timeoutId.current) clearTimeout(timeoutId.current);
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = (event?: any) => {
    if (timeoutId.current) clearTimeout(timeoutId.current);
    console.error('Fallo al cargar imagen:', src);
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  const url = new URL(src, window.location.origin);
  const isSameOrigin = url.origin === window.location.origin;
  // Solo necesitamos credenciales si es API interno Y origen diferente
  const isInternalAPI = url.pathname.startsWith('/api/images/');
  const needsCredentials = isInternalAPI && !isSameOrigin;
  
  // Build srcSet from variants
  const buildSrcSet = (sources?: Record<number, string>) =>
    sources ? Object.entries(sources).map(([w, url]) => `${url} ${w}w`).join(', ') : undefined;

  return (
    <div className={`relative ${className || ''}`}>
      {variants && (variants.avif || variants.webp) ? (
        // Use picture element with optimized formats
        <picture>
          {variants.avif && (
            <source 
              type="image/avif" 
              srcSet={buildSrcSet(variants.avif)}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          )}
          {variants.webp && (
            <source 
              type="image/webp" 
              srcSet={buildSrcSet(variants.webp)}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          )}
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover ${isLoading || hasError ? 'opacity-0' : 'opacity-100'}`}
            loading={loading}
            crossOrigin={needsCredentials ? 'use-credentials' : undefined}
            onLoad={handleLoad}
            onError={handleError}
          />
        </picture>
      ) : (
        // Fallback to regular img element
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover ${isLoading || hasError ? 'opacity-0' : 'opacity-100'}`}
          loading={loading}
          crossOrigin={needsCredentials ? 'use-credentials' : undefined}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      {(isLoading || hasError) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          {isLoading ? (
            <div className="animate-pulse text-xs text-gray-500">Cargando...</div>
          ) : (
            <div className="text-xs text-red-500">
              {isTimeout ? 'Tiempo de espera agotado' : 'Error al cargar'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}