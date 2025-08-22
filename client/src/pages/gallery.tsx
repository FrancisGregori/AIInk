import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  Heart, 
  Download, 
  Trash2, 
  Grid3x3, 
  List,
  Image as ImageIcon,
  Clock,
  Star,
  ArrowLeft,
  X,
  RefreshCw
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';

export default function Gallery() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [imageSize, setImageSize] = useState<'small' | 'medium' | 'large'>('small'); // Por defecto pequeño
  const [selectedType, setSelectedType] = useState<'all' | 'stencil' | 'design'>('all');
  const [selectedImage, setSelectedImage] = useState<any>(null);

  // Fetch gallery items - ULTRA OPTIMIZADO
  const { data: allGalleryItems = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/gallery'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/gallery?limit=15');
      return response.json();
    },
    // MÁXIMA OPTIMIZACIÓN DE CACHE
    refetchOnMount: 'always', // Siempre refrescar para datos actualizados
    refetchOnWindowFocus: false, // NO refrescar al cambiar de ventana
    staleTime: 60000, // Datos frescos por 1 minuto
    gcTime: 10 * 60 * 1000, // Mantener en cache por 10 minutos
    refetchInterval: false, // NO actualizar automáticamente
    enabled: true // Siempre habilitado
  });

  // Filter items based on selected type
  const galleryItems = selectedType === 'all' 
    ? allGalleryItems 
    : allGalleryItems.filter((item: any) => item.type === selectedType);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/gallery/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gallery'] });
      toast({
        title: "Eliminado",
        description: "El diseño ha sido eliminado de tu galería",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el diseño",
        variant: "destructive",
      });
    }
  });

  // Toggle favorite mutation
  const favoriteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('POST', `/api/gallery/${id}/favorite`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gallery'] });
    }
  });

  // Filter items based on search
  const filteredItems = galleryItems.filter((item: any) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      item.title?.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      item.prompt?.toLowerCase().includes(searchLower) ||
      item.style?.toLowerCase().includes(searchLower)
    );
  });

  // Group items by date
  const groupedItems = filteredItems.reduce((acc: any, item: any) => {
    const date = new Date(item.createdAt).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {});

  const handleDownload = async (imageUrl: string, title?: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = title ? `${title}.png` : 'design.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Descargado",
        description: "El diseño ha sido descargado exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo descargar el diseño",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al Inicio
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => window.history.back()}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Mi Galería</h1>
              <p className="text-muted-foreground">
                Todos tus diseños y stencils en un solo lugar
              </p>
            </div>
            {allGalleryItems.length > 0 && (
              <div className="text-right">
                <p className="text-2xl font-bold">{galleryItems.length}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedType === 'all' 
                    ? `${galleryItems.length} ${galleryItems.length === 1 ? 'creación' : 'creaciones'}`
                    : `${galleryItems.length} ${selectedType === 'stencil' ? 'stencil' : 'diseño'}${galleryItems.length !== 1 ? 's' : ''}`
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por título, descripción o estilo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* View toggle, size controls and refresh */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                title="Actualizar galería"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              
              {/* Controles de tamaño con iconos */}
              <div className="flex gap-1 border-l pl-2">
                <Button
                  variant={imageSize === 'small' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setImageSize('small')}
                  title="Vista compacta (más rápida)"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="3" height="3" fill="currentColor"/>
                    <rect x="5" y="1" width="3" height="3" fill="currentColor"/>
                    <rect x="9" y="1" width="3" height="3" fill="currentColor"/>
                    <rect x="13" y="1" width="3" height="3" fill="currentColor"/>
                    <rect x="1" y="5" width="3" height="3" fill="currentColor"/>
                    <rect x="5" y="5" width="3" height="3" fill="currentColor"/>
                    <rect x="9" y="5" width="3" height="3" fill="currentColor"/>
                    <rect x="13" y="5" width="3" height="3" fill="currentColor"/>
                    <rect x="1" y="9" width="3" height="3" fill="currentColor"/>
                    <rect x="5" y="9" width="3" height="3" fill="currentColor"/>
                    <rect x="9" y="9" width="3" height="3" fill="currentColor"/>
                    <rect x="13" y="9" width="3" height="3" fill="currentColor"/>
                  </svg>
                </Button>
                <Button
                  variant={imageSize === 'medium' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setImageSize('medium')}
                  title="Vista normal"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="5" height="5" fill="currentColor"/>
                    <rect x="8" y="1" width="5" height="5" fill="currentColor"/>
                    <rect x="1" y="8" width="5" height="5" fill="currentColor"/>
                    <rect x="8" y="8" width="5" height="5" fill="currentColor"/>
                  </svg>
                </Button>
                <Button
                  variant={imageSize === 'large' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setImageSize('large')}
                  title="Vista ampliada"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="7" height="7" fill="currentColor"/>
                    <rect x="9" y="1" width="7" height="7" fill="currentColor"/>
                  </svg>
                </Button>
              </div>
              
              {/* Vista grid/list */}
              <div className="flex gap-1 border-l pl-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Type filter tabs */}
          <Tabs value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="all">
                Todos ({allGalleryItems.length})
              </TabsTrigger>
              <TabsTrigger value="stencil">
                Stencils ({allGalleryItems.filter((i: any) => i.type === 'stencil').length})
              </TabsTrigger>
              <TabsTrigger value="design">
                Diseños ({allGalleryItems.filter((i: any) => i.type === 'design').length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Empty state */}
        {filteredItems.length === 0 && (
          <div className="text-center py-20">
            <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm ? 'No se encontraron resultados' : 'Tu galería está vacía'}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? 'Intenta con otros términos de búsqueda' 
                : 'Comienza generando tu primer diseño o stencil'}
            </p>
          </div>
        )}

        {/* Gallery content - Organized by day */}
        {Object.entries(groupedItems).map(([date, items]: [string, any]) => (
          <div key={date} className="mb-10">
            {/* Date header with improved styling */}
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

            {viewMode === 'grid' ? (
              <div className={`grid gap-4 ${
                imageSize === 'small' 
                  ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8' 
                  : imageSize === 'medium'
                  ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
                  : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
              }`}>
                {items.map((item: any) => (
                  <Card key={item.id} className="overflow-hidden group hover:shadow-xl transition-all">
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className={`relative cursor-pointer ${
                          imageSize === 'small' 
                            ? 'aspect-square' 
                            : imageSize === 'medium'
                            ? 'aspect-[3/4]'
                            : 'aspect-[3/4]'
                        } ${item.type === 'stencil' ? 'bg-[#f5f5f5]' : 'bg-zinc-900'}`}>
                          <img
                            src={item.imageUrl} 
                            alt={item.title || 'Diseño'}
                            loading="lazy"
                            className={`w-full h-full ${item.type === 'stencil' ? 'object-contain' : 'object-cover'} transition-transform group-hover:scale-105`}
                          />
                          {/* Overlay on hover - solo mostrar en tamaños medianos y grandes */}
                          {imageSize !== 'small' && (
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="absolute bottom-0 left-0 right-0 p-3">
                                <p className="text-white text-sm font-semibold truncate">
                                  {item.title || 'Sin título'}
                                </p>
                                <p className="text-white/70 text-xs">
                                  {new Date(item.createdAt).toLocaleTimeString('es-ES', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                          )}
                          {/* Badges - ajustar tamaño según la vista */}
                          {item.isFavorite && imageSize !== 'small' && (
                            <Heart className="absolute top-2 right-2 w-4 h-4 text-red-500 fill-red-500 drop-shadow-lg" />
                          )}
                          {imageSize !== 'small' && (
                            <Badge 
                              className="absolute top-2 left-2 text-xs"
                              variant={item.type === 'stencil' ? 'default' : 'secondary'}
                            >
                              {item.type === 'stencil' ? 'Stencil' : 'Diseño'}
                            </Badge>
                          )}
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-5xl">
                        <div className="space-y-4">
                          <img
                            src={item.imageUrl}
                            alt={item.title || 'Diseño'}
                            className="w-full h-auto max-h-[80vh] object-contain"
                          />
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="text-lg font-semibold">{item.title || 'Sin título'}</h3>
                              {item.style && (
                                <p className="text-sm text-muted-foreground">Estilo: {item.style}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => favoriteMutation.mutate(item.id)}
                              >
                                <Heart className={`w-4 h-4 mr-1 ${item.isFavorite ? 'fill-current text-red-500' : ''}`} />
                                Favorito
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleDownload(item.imageUrl, item.title)}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Descargar
                              </Button>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    {/* Quick actions bar */}
                    <CardContent className="p-2 bg-card/50">
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            favoriteMutation.mutate(item.id);
                          }}
                        >
                          <Heart className={`w-3 h-3 ${item.isFavorite ? 'fill-current text-red-500' : ''}`} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(item.imageUrl, item.title);
                          }}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => deleteMutation.mutate(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item: any) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex gap-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <img
                            src={item.imageUrl}
                            alt={item.title || 'Diseño'}
                            className="w-20 h-20 object-cover rounded cursor-pointer"
                          />
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <img
                            src={item.imageUrl}
                            alt={item.title || 'Diseño'}
                            className="w-full h-auto"
                          />
                        </DialogContent>
                      </Dialog>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold flex items-center gap-2">
                              {item.title || 'Sin título'}
                              {item.isFavorite && (
                                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                              )}
                            </h4>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.description}
                              </p>
                            )}
                            <div className="flex gap-2 mt-2">
                              <Badge variant={item.type === 'stencil' ? 'default' : 'secondary'}>
                                {item.type === 'stencil' ? 'Stencil' : 'Diseño'}
                              </Badge>
                              {item.style && (
                                <Badge variant="outline">{item.style}</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => favoriteMutation.mutate(item.id)}
                            >
                              <Heart className={`w-4 h-4 ${item.isFavorite ? 'fill-current text-red-500' : ''}`} />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => handleDownload(item.imageUrl, item.title)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => deleteMutation.mutate(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}