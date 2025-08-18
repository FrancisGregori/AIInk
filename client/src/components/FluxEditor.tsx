import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Download, Save, RefreshCw, Layers, Palette, Settings } from "lucide-react";

interface FluxProject {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  createdAt: string;
}

interface FluxEditorProps {
  project: FluxProject;
}

export default function FluxEditor({ project }: FluxEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [brushSize, setBrushSize] = useState([20]);
  const [opacity, setOpacity] = useState([100]);
  const { toast } = useToast();

  // Mutation for saving changes
  const saveMutation = useMutation({
    mutationFn: async (changes: any) => {
      const response = await fetch(`/api/flux/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(changes),
      });

      if (!response.ok) {
        throw new Error('Error saving changes');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Guardado",
        description: "Los cambios han sido guardados exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: "Hubo un error guardando los cambios.",
        variant: "destructive",
      });
    },
  });

  // Mutation for regenerating design
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/flux/projects/${project.id}/regenerate`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Error regenerating design');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Diseño regenerado",
        description: "Se ha creado una nueva versión de tu diseño.",
      });
    },
    onError: (error) => {
      console.error('Regenerate error:', error);
      toast({
        title: "Error",
        description: "Hubo un error regenerando el diseño.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      brushSize: brushSize[0],
      opacity: opacity[0],
      // Add other editor state here
    });
  };

  const handleDownload = () => {
    if (project.imageUrl) {
      const link = document.createElement('a');
      link.href = project.imageUrl;
      link.download = `${project.name}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleRegenerate = () => {
    regenerateMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <Card className="bg-dark-gray border-medium-gray">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <h3 className="font-semibold text-white">{project.name}</h3>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  size="sm"
                  className="bg-white text-black hover:bg-gray-100"
                  data-testid="button-save-project"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Guardar
                </Button>
                
                <Button
                  onClick={handleRegenerate}
                  disabled={regenerateMutation.isPending}
                  size="sm"
                  variant="outline"
                  className="border-medium-gray hover:bg-light-gray/20"
                  data-testid="button-regenerate-design"
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${regenerateMutation.isPending ? 'animate-spin' : ''}`} />
                  Regenerar
                </Button>
                
                <Button
                  onClick={handleDownload}
                  size="sm"
                  variant="outline"
                  className="border-medium-gray hover:bg-light-gray/20"
                  disabled={!project.imageUrl}
                  data-testid="button-download-design"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Descargar
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setIsEditing(!isEditing)}
                size="sm"
                variant={isEditing ? "default" : "outline"}
                className={isEditing ? "bg-white text-black" : "border-medium-gray hover:bg-light-gray/20"}
                data-testid="button-toggle-edit-mode"
              >
                <Settings className="h-4 w-4 mr-1" />
                {isEditing ? "Vista Previa" : "Editar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Tools Sidebar */}
        {isEditing && (
          <div className="lg:col-span-1">
            <Card className="bg-dark-gray border-medium-gray">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Palette className="mr-2 h-5 w-5" />
                  Herramientas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm text-light-gray mb-2 block">
                    Tamaño del pincel
                  </label>
                  <Slider
                    value={brushSize}
                    onValueChange={setBrushSize}
                    max={100}
                    min={1}
                    step={1}
                    className="w-full"
                    data-testid="slider-brush-size"
                  />
                  <span className="text-xs text-light-gray">{brushSize[0]}px</span>
                </div>

                <div>
                  <label className="text-sm text-light-gray mb-2 block">
                    Opacidad
                  </label>
                  <Slider
                    value={opacity}
                    onValueChange={setOpacity}
                    max={100}
                    min={0}
                    step={1}
                    className="w-full"
                    data-testid="slider-opacity"
                  />
                  <span className="text-xs text-light-gray">{opacity[0]}%</span>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-white">Capas</h4>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between p-2 bg-medium-gray rounded text-sm">
                      <span className="text-white">Fondo</span>
                      <Layers className="h-4 w-4 text-light-gray" />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white text-black rounded text-sm">
                      <span>Principal</span>
                      <Layers className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Canvas Area */}
        <div className={isEditing ? "lg:col-span-3" : "lg:col-span-4"}>
          <Card className="bg-dark-gray border-medium-gray">
            <CardContent className="p-4">
              <div className="aspect-square bg-black rounded-lg border border-medium-gray overflow-hidden relative">
                {project.imageUrl ? (
                  <img
                    src={project.imageUrl}
                    alt={project.name}
                    className="w-full h-full object-cover"
                    data-testid="img-design-canvas"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Palette className="h-16 w-16 text-light-gray mx-auto mb-4" />
                      <p className="text-light-gray">
                        Canvas de diseño
                      </p>
                      <p className="text-sm text-light-gray/60 mt-2">
                        {project.description}
                      </p>
                    </div>
                  </div>
                )}
                
                {isEditing && (
                  <div className="absolute inset-0 bg-white/5 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center text-white">
                      <Settings className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                      <p className="text-sm">Modo de edición activo</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Bar */}
      <Card className="bg-dark-gray border-medium-gray">
        <CardContent className="p-3">
          <div className="flex items-center justify-between text-sm text-light-gray">
            <div className="flex items-center space-x-4">
              <span>Proyecto: {project.name}</span>
              <span>•</span>
              <span>Creado: {new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span>Flux Kontext AI</span>
              <span>•</span>
              <span>Gemini Assistant</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
