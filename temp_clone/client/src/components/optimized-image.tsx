import { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  onLoad?: () => void;
}

export default function OptimizedImage({ src, alt, className = "", onClick, onLoad }: OptimizedImageProps) {
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [fullImageLoaded, setFullImageLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const imgRef = useRef<HTMLDivElement>(null);
  
  // Use proxy for Supabase images to avoid CORS issues
  const getProxiedUrl = (originalUrl: string) => {
    if (originalUrl.includes('supabase.co')) {
      return `/api/proxy-image?url=${encodeURIComponent(originalUrl)}`;
    }
    return originalUrl;
  };

  // Generate thumbnail URL
  const getThumbnailUrl = (originalUrl: string) => {
    // Si es una URL base64, usar directamente
    if (originalUrl.startsWith('data:image')) {
      return originalUrl;
    }
    // Para URLs de archivos antiguos
    if (originalUrl.includes('/images/')) {
      const filename = originalUrl.split('/images/')[1];
      return `/images/thumb_${filename}`;
    }
    return originalUrl;
  };

  const thumbnailUrl = getThumbnailUrl(src);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            // Simular progreso de carga
            const interval = setInterval(() => {
              setLoadingProgress(prev => {
                if (prev >= 90) {
                  clearInterval(interval);
                  return prev;
                }
                return prev + Math.random() * 15;
              });
            }, 150);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Log image info for debugging
  useEffect(() => {
    if (src) {
      if (src.startsWith('data:image')) {
        console.log('Loading base64 image, size:', src.length, 'bytes');
      } else if (src.includes('supabase')) {
        console.log('Loading Supabase image:', src);
      } else {
        console.log('Loading image from:', src);
      }
    }
  }, [src]);

  return (
    <div className={`relative ${className}`} ref={imgRef} onClick={onClick}>
      {/* Solo imagen de alta calidad en tamaño original */}
      {isInView && (
        <img 
          src={getProxiedUrl(src)}
          alt={alt}
          className={`w-auto h-auto max-w-full transition-opacity duration-500 ${
            fullImageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => {
            console.log('Image loaded successfully:', src.includes('supabase') ? 'Supabase image via proxy' : 'Other image');
            setFullImageLoaded(true);
            setLoadingProgress(100);
            onLoad?.();
          }}
          onError={(e) => {
            console.error('Error loading image:', getProxiedUrl(src));
            console.error('Error details:', e);
          }}
          loading="lazy"
          decoding="async"
        />
      )}
      
      {/* Loading indicator mientras carga la imagen generada */}
      {isInView && !fullImageLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-green-500/20 via-green-600/20 to-emerald-600/20 backdrop-blur-sm min-h-[300px] border-2 border-green-400/30 rounded-lg">
          <div className="relative mb-4">
            <div className="animate-spin w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-200 mb-2">
              Cargando imagen generada...
            </div>
            <div className="text-sm text-green-300/80 mb-3">
              La imagen se procesó correctamente
            </div>
            <div className="w-40 bg-green-800/50 rounded-full h-3 border border-green-500/30">
              <div 
                className="bg-green-400 h-3 rounded-full transition-all duration-500 ease-out shadow-lg shadow-green-400/50"
                style={{ width: `${Math.min(loadingProgress, 100)}%` }}
              />
            </div>
            <div className="text-xs text-green-300 mt-2 font-mono">
              {Math.round(loadingProgress)}% completado
            </div>
          </div>
        </div>
      )}
      
      {/* Placeholder cuando no está en vista */}
      {!isInView && (
        <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 min-h-[300px] w-full">
          <div className="text-gray-500 dark:text-gray-400">Imagen</div>
        </div>
      )}
    </div>
  );
}
