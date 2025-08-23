import { useState, useEffect } from 'react';

interface AuthenticatedImageProps {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function AuthenticatedImage({ src, alt, className, onLoad, onError }: AuthenticatedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadImage = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        
        // Check if this is an internal API route that requires authentication
        const isInternalAPI = src.startsWith('/api/images/');
        
        if (isInternalAPI) {
          // Fetch the image with credentials for internal API routes
          const response = await fetch(src, {
            credentials: 'include',
            mode: 'cors',
            cache: 'default'
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          
          if (mounted) {
            setImageSrc(objectUrl);
            setIsLoading(false);
            onLoad?.();
          }
        } else {
          // For external URLs, use direct image loading
          if (mounted) {
            setImageSrc(src);
            setIsLoading(false);
            onLoad?.();
          }
        }
      } catch (error) {
        console.error('Error loading authenticated image:', src, error);
        if (mounted) {
          setHasError(true);
          setIsLoading(false);
          onError?.();
        }
      }
    };

    if (src) {
      loadImage();
    }

    return () => {
      mounted = false;
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [src, onLoad, onError]);

  // Cleanup blob URL when component unmounts
  useEffect(() => {
    return () => {
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  if (isLoading) {
    return (
      <div className={`${className} bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}>
        <div className="animate-pulse text-xs text-gray-500">Cargando...</div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`${className} bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}>
        <div className="text-xs text-red-500">Error al cargar</div>
      </div>
    );
  }

  return <img src={imageSrc} alt={alt} className={className} />;
}