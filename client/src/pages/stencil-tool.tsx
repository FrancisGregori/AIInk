import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import StencilUploader from "@/components/StencilUploader";
import LoadingModal from "@/components/LoadingModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Download, Image, Sparkles } from "lucide-react";

interface StencilModel {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

interface StencilResult {
  id: string;
  imageUrl: string;
  modelUsed: string;
  createdAt: string;
}

export default function StencilTool() {
  const [selectedModel, setSelectedModel] = useState<string>("model-1");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [results, setResults] = useState<StencilResult[]>([]);
  const { toast } = useToast();

  // Query available models
  const { data: models = [], isLoading: modelsLoading } = useQuery<StencilModel[]>({
    queryKey: ["/api/stencil/models"],
  });

  // Mutation for processing image
  const processMutation = useMutation({
    mutationFn: async (data: { image: File; model: string }) => {
      const formData = new FormData();
      formData.append('image', data.image);
      formData.append('model', data.model);

      const response = await fetch('/api/stencil/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error processing image');
      }

      return response.json();
    },
    onSuccess: (result) => {
      setResults(prev => [result, ...prev]);
      toast({
        title: "¡Stencil generado!",
        description: "Tu imagen ha sido convertida exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Processing error:', error);
      toast({
        title: "Error",
        description: "Hubo un error procesando tu imagen. Por favor intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (file: File) => {
    setUploadedImage(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleProcess = () => {
    if (!uploadedImage) {
      toast({
        title: "Error",
        description: "Por favor selecciona una imagen primero.",
        variant: "destructive",
      });
      return;
    }

    processMutation.mutate({
      image: uploadedImage,
      model: selectedModel,
    });
  };

  const downloadResult = (result: StencilResult) => {
    const link = document.createElement('a');
    link.href = result.imageUrl;
    link.download = `stencil-${result.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <Image className="inline-block mr-4 h-12 w-12" />
              Stencil Tool
            </h1>
            <p className="text-xl text-light-gray max-w-2xl mx-auto">
              Transforma cualquier imagen en un stencil profesional usando nuestros modelos de IA avanzados.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload and Controls */}
            <div className="space-y-6">
              <Card className="bg-dark-gray border-medium-gray">
                <CardHeader>
                  <CardTitle className="text-white">Cargar Imagen</CardTitle>
                </CardHeader>
                <CardContent>
                  <StencilUploader 
                    onImageUpload={handleImageUpload}
                    previewUrl={previewUrl}
                  />
                </CardContent>
              </Card>

              {/* Model Selection */}
              <Card className="bg-dark-gray border-medium-gray">
                <CardHeader>
                  <CardTitle className="text-white">Seleccionar Modelo</CardTitle>
                </CardHeader>
                <CardContent>
                  {modelsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 bg-medium-gray animate-pulse rounded" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {models.map((model) => (
                        <Button
                          key={model.id}
                          variant={selectedModel === model.id ? "default" : "outline"}
                          className={`p-3 h-auto ${
                            selectedModel === model.id
                              ? "bg-white text-black"
                              : "bg-medium-gray border-medium-gray text-white hover:bg-light-gray/20"
                          }`}
                          onClick={() => setSelectedModel(model.id)}
                          disabled={!model.active}
                          data-testid={`button-model-${model.id}`}
                        >
                          <div className="text-center">
                            <div className="font-medium">{model.name}</div>
                            <div className="text-xs opacity-80 mt-1">{model.description}</div>
                            {!model.active && (
                              <Badge variant="secondary" className="mt-1">Próximamente</Badge>
                            )}
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Process Button */}
              <Button
                onClick={handleProcess}
                disabled={!uploadedImage || processMutation.isPending}
                className="w-full bg-white text-black py-4 text-lg font-medium hover:bg-gray-100 transition-colors"
                data-testid="button-process-image"
              >
                {processMutation.isPending ? (
                  <>
                    <Sparkles className="mr-2 h-5 w-5 animate-pulse" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generar Stencil
                  </>
                )}
              </Button>
            </div>

            {/* Results */}
            <div className="space-y-6">
              <Card className="bg-dark-gray border-medium-gray">
                <CardHeader>
                  <CardTitle className="text-white">Resultados</CardTitle>
                </CardHeader>
                <CardContent>
                  {results.length === 0 ? (
                    <div className="text-center py-12">
                      <Image className="h-16 w-16 text-light-gray mx-auto mb-4" />
                      <p className="text-light-gray">
                        Los stencils generados aparecerán aquí
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {results.map((result) => (
                        <div
                          key={result.id}
                          className="bg-black border border-medium-gray rounded-lg p-4 hover:border-light-gray transition-colors"
                        >
                          <div className="aspect-square bg-medium-gray rounded-lg mb-4 overflow-hidden">
                            <img
                              src={result.imageUrl}
                              alt="Stencil result"
                              className="w-full h-full object-cover"
                              data-testid={`img-result-${result.id}`}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-light-gray">
                                Modelo: {result.modelUsed}
                              </p>
                              <p className="text-xs text-light-gray">
                                {new Date(result.createdAt).toLocaleString()}
                              </p>
                            </div>
                            
                            <Button
                              onClick={() => downloadResult(result)}
                              variant="outline"
                              size="sm"
                              className="border-medium-gray hover:bg-light-gray/20"
                              data-testid={`button-download-${result.id}`}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Descargar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <LoadingModal
        isOpen={processMutation.isPending}
        title="Generando Stencil"
        description="Nuestro modelo de IA está procesando tu imagen..."
      />
    </div>
  );
}
