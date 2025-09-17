// Simplified gallery with horizontal layout for desktop
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Download,
  Heart,
  Trash2,
  RefreshCw,
  Clock,
  Filter,
  ChevronDown,
  Loader2,
  Grid3x3,
  Grid2x2,
  LayoutGrid,
  Globe,
  Lock
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

import { useToast } from '@/hooks/use-toast';
import { OptimizedImage } from '@/components/OptimizedImage';
import { apiRequest } from '@/lib/queryClient';
import { apiFetch } from '@/lib/api';
import { normalizeImageUrl, getThumbnailUrl } from '@/lib/imageUtils';
import Navigation from '@/components/Navigation';

export default function Gallery() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [imageSize, setImageSize] = useState<'small' | 'medium' | 'large'>('small');
  const [selectedType, setSelectedType] = useState<'all' | 'stencil' | 'design'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [allLoadedItems, setAllLoadedItems] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const itemsPerPage = 20;
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);

  // Fetch gallery items
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['/api/gallery', currentPage, selectedType, itemsPerPage],
    queryFn: async () => {
      const typeParam = selectedType === 'all' ? '' : `&type=${selectedType}`;
      const response = await apiRequest('GET', `/api/gallery?limit=${itemsPerPage}&page=${currentPage}${typeParam}`);
      return await response.json();
    },
  });

  // Update items when data changes
  React.useEffect(() => {
    if (data && Array.isArray(data)) {
      // Log para verificar se thumbnails estão presentes
      console.log('Gallery items loaded:', data.map(item => ({
        id: item.id,
        hasThumbnail: !!item.thumbnailUrl,
        thumbnailUrl: item.thumbnailUrl,
        imageUrl: item.imageUrl
      })));

      if (currentPage === 1) {
        setAllLoadedItems(data);
      } else {
        setAllLoadedItems(prev => [...prev, ...data]);
      }
      // Update hasMore based on returned items
      setHasMore(data.length === itemsPerPage);
    }
  }, [data, currentPage, itemsPerPage]);

  // Filter items by search term
  const filteredItems = allLoadedItems.filter(item =>
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.style?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group items by date
  const groupedItems = filteredItems.reduce((groups, item) => {
    const date = new Date(item.createdAt).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {});

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/gallery/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gallery'] });
      toast({
        title: "Imagen eliminada",
        description: "La imagen se ha eliminado correctamente."
      });
    }
  });

  const favoriteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('POST', `/api/gallery/${id}/favorite`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gallery'] });
    }
  });

  const togglePrivacyMutation = useMutation({
    mutationFn: async ({ id, isPublic }: { id: string; isPublic: boolean }) => {
      const response = await apiFetch(`/api/gallery/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublic }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        throw new Error('Failed to update privacy');
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/gallery'] });
      toast({
        title: variables.isPublic ? "Imagen pública" : "Imagen privada",
        description: variables.isPublic
          ? "La imagen ahora es visible públicamente"
          : "La imagen ahora es privada"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la privacidad",
        variant: "destructive"
      });
    }
  });

  const handleDownload = async (imageUrl: string, title?: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = title ? `${title}.png` : 'imagen.png';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      toast({
        title: "Error al descargar",
        description: "No se pudo descargar la imagen. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  };

  if (isLoading && currentPage === 1) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6 pt-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">Galería de Stencils</h1>
            <p className="text-muted-foreground">
              Explora y administra tus diseños generados
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-start sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar diseños..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 min-w-[200px]"
              />
            </div>

            <Select value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="stencil">Stencils</SelectItem>
                <SelectItem value="design">Diseños</SelectItem>
              </SelectContent>
            </Select>

            {/* Size selector with grid icons */}
            <div className="flex items-center gap-1 p-1 bg-card border rounded-lg">
              <Button
                variant={imageSize === 'small' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setImageSize('small')}
                className="h-8 w-8 p-0"
                data-testid="button-size-small"
                title="Pequeño (8 columnas)"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={imageSize === 'medium' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setImageSize('medium')}
                className="h-8 w-8 p-0"
                data-testid="button-size-medium"
                title="Mediano (6 columnas)"
              >
                <Grid2x2 className="h-4 w-4" />
              </Button>
              <Button
                variant={imageSize === 'large' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setImageSize('large')}
                className="h-8 w-8 p-0"
                data-testid="button-size-large"
                title="Grande (4 columnas)"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {filteredItems.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">
              No se encontraron resultados
            </h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? 'Intenta con otros términos de búsqueda' 
                : 'Comienza generando tu primer diseño o stencil'}
            </p>
          </div>
        )}

        {/* Gallery content */}
        {Object.entries(groupedItems).map(([date, items]: [string, any]) => (
          <div key={date} className="mb-10">
            {/* Date header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px bg-border flex-1" />
              <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold">{date}</span>
                <Badge variant="secondary" className="ml-2">
                  {items.length} {items.length === 1 ? 'diseño' : 'diseños'}
                </Badge>
              </div>
              <div className="h-px bg-border flex-1" />
            </div>

            {/* Unified grid layout for all screen sizes */}
            <div>
              <div className={`grid gap-3 sm:gap-4 ${
                imageSize === 'small' 
                  ? 'grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8' 
                  : imageSize === 'medium'
                  ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
                  : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
              }`}>
                {items.map((item: any) => (
                  <Card key={item.id} className="overflow-hidden group transition-all">
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className={`relative cursor-pointer ${
                          imageSize === 'small'
                            ? 'aspect-square'
                            : imageSize === 'medium'
                            ? 'aspect-[3/4]'
                            : 'aspect-[3/4]'
                        } ${item.type === 'stencil' ? 'bg-[#f5f5f5]' : 'bg-zinc-900'}`}>
                          <OptimizedImage
                            src={getThumbnailUrl(item.imageUrl, item.thumbnailUrl)}
                            thumbnailSrc={null}
                            alt={item.title || 'Diseño'}
                            objectFit={item.type === 'stencil' ? 'contain' : 'cover'}
                            className="w-full h-full transition-transform group-hover:scale-105"
                            loading="lazy"
                            quality="low"
                          />
                          {/* Privacy indicator */}
                          <div className="absolute top-2 right-2 z-10">
                            <div className="bg-black/60 backdrop-blur-sm rounded-full p-1.5">
                              {item.isPublic ? (
                                <Globe className="h-3 w-3 text-white" />
                              ) : (
                                <Lock className="h-3 w-3 text-white" />
                              )}
                            </div>
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-fit p-0 bg-zinc-900 border-zinc-800 overflow-hidden">
                        <DialogTitle className="sr-only">Vista de Imagen</DialogTitle>
                        <DialogDescription className="sr-only">
                          Vista ampliada de tu {item.type === 'stencil' ? 'stencil' : 'diseño'}
                        </DialogDescription>
                        
                        <div className="flex flex-col">
                          <div className={`relative ${item.type === 'stencil' ? 'bg-[#f5f5f5]' : 'bg-zinc-900'} flex items-center justify-center p-3`}>
                            <img
                              src={normalizeImageUrl(item.imageUrl)}
                              alt={item.title || 'Diseño'}
                              className="max-w-[400px] max-h-[55vh] w-auto h-auto object-contain"
                            />
                          </div>
                          
                          <div className="bg-zinc-900 p-3 border-t border-zinc-800">
                            <div className="flex flex-col gap-3">
                              {/* Privacy Toggle */}
                              <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-zinc-700 rounded-lg">
                                    {item.isPublic ? (
                                      <Globe className="h-5 w-5 text-green-400" />
                                    ) : (
                                      <Lock className="h-5 w-5 text-amber-400" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-white">
                                      {item.isPublic ? 'Imagen Pública' : 'Imagen Privada'}
                                    </p>
                                    <p className="text-xs text-zinc-400">
                                      {item.isPublic
                                        ? 'Visible para todos'
                                        : 'Solo visible para ti'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={item.isPublic || false}
                                    onCheckedChange={(checked) =>
                                      togglePrivacyMutation.mutate({
                                        id: item.id,
                                        isPublic: checked
                                      })
                                    }
                                    disabled={togglePrivacyMutation.isPending}
                                    className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-zinc-600"
                                  />
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  {item.type !== 'stencil' && (
                                    <h3 className="text-sm font-semibold truncate">{item.title || 'Sin título'}</h3>
                                  )}
                                  {item.style && item.type !== 'stencil' && (
                                    <p className="text-xs text-zinc-400">Estilo: {item.style}</p>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8"
                                    onClick={() => favoriteMutation.mutate(item.id)}
                                  >
                                    <Heart className={`w-3 h-3 ${item.isFavorite ? 'fill-current text-red-500' : ''}`} />
                                  </Button>
                                  <Button
                                    onClick={() => handleDownload(item.imageUrl, item.title)}
                                    className="bg-white text-black hover:bg-zinc-200 h-8 px-3 text-sm"
                                  >
                                    <Download className="mr-1 h-3 w-3" />
                                    Descargar
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      if (confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
                                        deleteMutation.mutate(item.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ))}
        
        {/* Load More Button */}
        <div ref={loadMoreRef} className="flex justify-center mt-8 mb-4">
          {hasMore && !isFetching && filteredItems.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="px-8 py-2"
              data-testid="button-load-more"
            >
              Cargar más imágenes
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          )}
          
          {isFetching && (
            <div className="flex items-center">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Cargando más imágenes...
            </div>
          )}
        </div>
        
        {/* End message */}
        {!hasMore && filteredItems.length > 0 && !isFetching && (
          <div className="text-center text-muted-foreground py-4">
            <p>Ya has visto todas las imágenes disponibles</p>
            <p className="text-sm">Total: {filteredItems.length} imágenes</p>
          </div>
        )}
      </div>
    </div>
  );
}