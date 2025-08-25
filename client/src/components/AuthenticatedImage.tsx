import { useState, useEffect } from 'react';

interface AuthenticatedImageProps {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  loading?: 'lazy' | 'eager';
}

export function AuthenticatedImage({ src, alt, className, onLoad, onError, loading = 'lazy' }: AuthenticatedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Reset loading and error states when the source changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  const isInternalAPI = src.startsWith('/api/images/');

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        crossOrigin={isInternalAPI ? 'use-credentials' : undefined}
        onLoad={handleLoad}
        onError={handleError}
        style={isLoading || hasError ? { display: 'none' } : undefined}
      />
      {isLoading && (
        <div className={`${className} bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}>
          <div className="animate-pulse text-xs text-gray-500">Cargando...</div>
        </div>
      )}
      {hasError && (
        <div className={`${className} bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}>
          <div className="text-xs text-red-500">Error al cargar</div>
        </div>
      )}
    </>
  );
}