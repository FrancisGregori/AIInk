import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import FluxEditor from "@/components/FluxEditor";
import LoadingModal from "@/components/LoadingModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Bot, Palette, Send, Sparkles, MessageCircle } from "lucide-react";

interface GeminiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface FluxProject {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  createdAt: string;
}

export default function FluxKontext() {
  const [messages, setMessages] = useState<GeminiMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: '¡Hola! Soy tu asistente Gemini. Estoy aquí para ayudarte a crear diseños increíbles con Flux Kontext. ¿En qué proyecto te gustaría trabajar hoy?',
      timestamp: new Date().toISOString(),
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [selectedProject, setSelectedProject] = useState<FluxProject | null>(null);
  const { toast } = useToast();

  // Query for user projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery<FluxProject[]>({
    queryKey: ["/api/flux/projects"],
  });

  // Mutation for sending messages to Gemini
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context: selectedProject ? `Working on project: ${selectedProject.name}` : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Error communicating with Gemini');
      }

      return response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: GeminiMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: (error) => {
      console.error('Gemini chat error:', error);
      toast({
        title: "Error",
        description: "Hubo un error comunicándose con Gemini. Por favor intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation for creating new project with Flux
  const createProjectMutation = useMutation({
    mutationFn: async (data: { prompt: string; name: string }) => {
      const response = await fetch('/api/flux/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error creating project');
      }

      return response.json();
    },
    onSuccess: (project) => {
      setSelectedProject(project);
      toast({
        title: "¡Proyecto creado!",
        description: "Tu nuevo diseño ha sido generado con Flux Kontext.",
      });
    },
    onError: (error) => {
      console.error('Project creation error:', error);
      toast({
        title: "Error",
        description: "Hubo un error creando el proyecto. Por favor intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!userInput.trim()) return;

    const userMessage: GeminiMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    sendMessageMutation.mutate(userInput);
    setUserInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <Palette className="inline-block mr-4 h-12 w-12" />
              Flux Kontext
            </h1>
            <p className="text-xl text-light-gray max-w-2xl mx-auto">
              Editor avanzado de diseños potenciado por IA con asistente Gemini integrado.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Projects Sidebar */}
            <div className="lg:col-span-1">
              <Card className="bg-dark-gray border-medium-gray mb-6">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Proyectos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {projectsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-medium-gray animate-pulse rounded" />
                      ))}
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="text-center py-8">
                      <Palette className="h-12 w-12 text-light-gray mx-auto mb-4" />
                      <p className="text-light-gray text-sm">
                        Aún no tienes proyectos. ¡Crea uno nuevo con ayuda de Gemini!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {projects.map((project) => (
                        <div
                          key={project.id}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedProject?.id === project.id
                              ? 'bg-white text-black'
                              : 'bg-medium-gray hover:bg-light-gray/20'
                          }`}
                          onClick={() => setSelectedProject(project)}
                          data-testid={`project-${project.id}`}
                        >
                          <h4 className="font-medium truncate">{project.name}</h4>
                          <p className="text-xs opacity-80 truncate">{project.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Gemini Chat */}
              <Card className="bg-dark-gray border-medium-gray">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Bot className="mr-2 h-5 w-5" />
                    Asistente Gemini
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-64 overflow-y-auto space-y-3 bg-black p-3 rounded-lg border border-medium-gray">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-2 rounded-lg text-sm ${
                            message.role === 'user'
                              ? 'bg-white text-black'
                              : 'bg-medium-gray text-white'
                          }`}
                          data-testid={`message-${message.id}`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}
                    {sendMessageMutation.isPending && (
                      <div className="flex justify-start">
                        <div className="bg-medium-gray text-white p-2 rounded-lg text-sm">
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Textarea
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Escribe tu mensaje para Gemini..."
                      className="flex-1 bg-medium-gray border-medium-gray text-white resize-none"
                      rows={2}
                      data-testid="textarea-gemini-input"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!userInput.trim() || sendMessageMutation.isPending}
                      className="bg-white text-black hover:bg-gray-100"
                      data-testid="button-send-message"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Editor */}
            <div className="lg:col-span-2">
              {selectedProject ? (
                <FluxEditor project={selectedProject} />
              ) : (
                <Card className="bg-dark-gray border-medium-gray h-full">
                  <CardContent className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <MessageCircle className="h-16 w-16 text-light-gray mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">
                        ¡Habla con Gemini para comenzar!
                      </h3>
                      <p className="text-light-gray mb-6 max-w-md">
                        Describe tu idea de diseño y Gemini te ayudará a crear un proyecto 
                        usando Flux Kontext.
                      </p>
                      <div className="space-y-2 text-sm text-light-gray">
                        <p>Ejemplos de prompts:</p>
                        <ul className="text-left space-y-1">
                          <li>• "Crea un logo minimalista para una empresa de tecnología"</li>
                          <li>• "Diseña un poster moderno para un evento musical"</li>
                          <li>• "Genera un patrón abstracto en colores pasteles"</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      <LoadingModal
        isOpen={createProjectMutation.isPending}
        title="Creando proyecto"
        description="Flux Kontext está generando tu diseño..."
      />
    </div>
  );
}
