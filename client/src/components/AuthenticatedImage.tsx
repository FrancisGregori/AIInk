import { useState, useEffect, useRef } from 'react';

export interface ImageVariants {
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
  const [retryCount, setRetryCount] = useState(0);
  const [currentSrc, setCurrentSrc] = useState(src);
  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);
  const MAX_RETRIES = 3;
  const TIMEOUT_MS = 30000; // Aumentado a 30 segundos

  // Reset loading and error states when the source changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setIsTimeout(false);
    setRetryCount(0);
    setCurrentSrc(src);
    
    // Set timeout for loading
    if (timeoutId.current) clearTimeout(timeoutId.current);
    timeoutId.current = setTimeout(() => {
      console.warn(`Imagen timeout después de ${TIMEOUT_MS}ms:`, src);
      setIsTimeout(true);
      handleError();
    }, TIMEOUT_MS);
    
    return () => {
      if (timeoutId.current) clearTimeout(timeoutId.current);
      if (retryTimeoutId.current) clearTimeout(retryTimeoutId.current);
    };
  }, [src]);

  const handleLoad = () => {
    if (timeoutId.current) clearTimeout(timeoutId.current);
    if (retryTimeoutId.current) clearTimeout(retryTimeoutId.current);
    setIsLoading(false);
    setHasError(false);
    console.log('Imagen cargada exitosamente:', src);
    onLoad?.();
  };

  const handleError = (event?: any) => {
    if (timeoutId.current) clearTimeout(timeoutId.current);
    console.error(`Error al cargar imagen (intento ${retryCount + 1}/${MAX_RETRIES + 1}):`, src);
    
    // Implementar retry con backoff exponencial
    if (retryCount < MAX_RETRIES && !isTimeout) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Max 10 segundos
      console.log(`Reintentando en ${delay}ms...`);
      
      retryTimeoutId.current = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        // Forzar recarga añadiendo timestamp
        const separator = src.includes('?') ? '&' : '?';
        setCurrentSrc(`${src}${separator}_retry=${Date.now()}`);
        setIsLoading(true);
        setHasError(false);
      }, delay);
    } else {
      setIsLoading(false);
      setHasError(true);
      onError?.();
    }
  };

  // Detección mejorada de imágenes públicas vs privadas
  const isPublicCDN = src.startsWith('https://storage.googleapis.com/');
  
  const needsCredentials = (() => {
    // Las imágenes de Google Cloud Storage con /.private/ necesitan credenciales
    if (isPublicCDN && src.includes('/.private/')) {
      return true;
    }
    
    // Otras imágenes de Google Cloud Storage son públicas
    if (isPublicCDN) {
      return false;
    }
    
    try {
      const url = new URL(src, window.location.origin);
      
      // Imágenes públicas no necesitan credenciales
      if (url.pathname.startsWith('/api/public/')) {
        return false;
      }
      
      // Siempre incluir credenciales para rutas API privadas
      if (url.pathname.startsWith('/api/')) {
        return true;
      }
      
      // Para subdominios del mismo dominio base
      const currentHost = window.location.hostname;
      const imageHost = url.hostname;
      
      // Verificar si es el mismo dominio base (ej: *.aiink.com)
      const currentDomain = currentHost.split('.').slice(-2).join('.');
      const imageDomain = imageHost.split('.').slice(-2).join('.');
      
      if (currentDomain === imageDomain) {
        return true;
      }
      
      // Para desarrollo local
      if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
        return true;
      }
      
      return false;
    } catch {
      // Si no es una URL válida, asumir que es una ruta relativa
      return true;
    }
  })();
  
  // Build srcSet from variants
  const buildSrcSet = (sources?: Record<number, string>) => {
    if (!sources) return undefined;
    
    // Añadir retry param si es necesario
    if (retryCount > 0) {
      const entries = Object.entries(sources).map(([w, url]) => {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}_retry=${Date.now()} ${w}w`;
      });
      return entries.join(', ');
    }
    
    return Object.entries(sources).map(([w, url]) => `${url} ${w}w`).join(', ');
  };

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
            src={currentSrc}
            alt={alt}
            className={`w-full h-full object-cover ${isLoading || hasError ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
            loading={loading}
            crossOrigin={isPublicCDN ? undefined : (needsCredentials ? 'use-credentials' : undefined)}
            onLoad={handleLoad}
            onError={handleError}
          />
        </picture>
      ) : (
        // Fallback to regular img element
        <img
          src={currentSrc}
          alt={alt}
          className={`w-full h-full object-cover ${isLoading || hasError ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          loading={loading}
          crossOrigin={needsCredentials ? 'use-credentials' : undefined}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      {(isLoading || hasError) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-gray-100"></div>
              <div className="text-xs text-gray-500">
                {retryCount > 0 ? `Reintentando... (${retryCount}/${MAX_RETRIES})` : 'Cargando...'}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs text-red-500">
                {isTimeout ? 'Tiempo de espera agotado' : 'Error al cargar'}
              </div>
              {retryCount >= MAX_RETRIES && (
                <div className="text-xs text-gray-500">Intentos agotados</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}