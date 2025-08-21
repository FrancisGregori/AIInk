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
  Star
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest } from '@/lib/queryClient';

export default function Gallery() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedType, setSelectedType] = useState<'all' | 'stencil' | 'design'>('all');
  const [selectedImage, setSelectedImage] = useState<any>(null);

  // Fetch gallery items
  const { data: galleryItems = [], isLoading } = useQuery({
    queryKey: ['/api/gallery', selectedType],
    queryFn: async () => {
      const params = selectedType !== 'all' ? `?type=${selectedType}` : '';
      const response = await apiRequest('GET', `/api/gallery${params}`);
      return response.json();
    }
  });

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Mi Galería</h1>
          <p className="text-muted-foreground">
            Todos tus diseños y stencils en un solo lugar
          </p>
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

            {/* View toggle */}
            <div className="flex gap-2">
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

          {/* Type filter tabs */}
          <Tabs value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="all">
                Todos ({galleryItems.length})
              </TabsTrigger>
              <TabsTrigger value="stencil">
                Stencils ({galleryItems.filter((i: any) => i.type === 'stencil').length})
              </TabsTrigger>
              <TabsTrigger value="design">
                Diseños ({galleryItems.filter((i: any) => i.type === 'design').length})
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

        {/* Gallery content */}
        {Object.entries(groupedItems).map(([date, items]: [string, any]) => (
          <div key={date} className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {date}
            </h3>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((item: any) => (
                  <Card key={item.id} className="overflow-hidden group">
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="relative aspect-square cursor-pointer">
                          <img
                            src={item.imageUrl}
                            alt={item.title || 'Diseño'}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          {item.isFavorite && (
                            <Heart className="absolute top-2 right-2 w-5 h-5 text-red-500 fill-red-500" />
                          )}
                          <Badge 
                            className="absolute top-2 left-2"
                            variant={item.type === 'stencil' ? 'default' : 'secondary'}
                          >
                            {item.type === 'stencil' ? 'Stencil' : 'Diseño'}
                          </Badge>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <img
                          src={item.imageUrl}
                          alt={item.title || 'Diseño'}
                          className="w-full h-auto"
                        />
                      </DialogContent>
                    </Dialog>
                    <CardContent className="p-3">
                      <h4 className="font-semibold truncate">
                        {item.title || 'Sin título'}
                      </h4>
                      {item.style && (
                        <p className="text-sm text-muted-foreground">
                          Estilo: {item.style}
                        </p>
                      )}
                      <div className="flex gap-1 mt-2">
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