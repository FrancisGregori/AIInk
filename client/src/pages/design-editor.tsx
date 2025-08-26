import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "@/components/auth-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import ChatAssistant, { ChatAssistantRef } from "@/components/chat-assistant";
import { useToast } from "@/hooks/use-toast";
import { useJobs } from "@/contexts/JobContext";
import { useJobRecovery } from "@/hooks/useJobRecovery";
import { 
  Sparkles, 
  Download, 
  Image as ImageIcon, 
  Upload,
  Loader2,
  Settings,
  History,
  Copy,
  Languages,
  RefreshCw,
  Maximize2,
  Camera,
  Palette,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Edit,
  Clock,
  Trash2,
  Grid3X3,
  LayoutGrid
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { CreditsDisplay, CreditsRequirement } from "@/components/credits-display";
import type { FluxProject, StencilJob } from "@shared/schema";
import { LazyImage } from "@/components/LazyImage";

function DesignEditor() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [prompt, setPrompt] = useState<string>("");
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>("Match Input");
  const [modelVariant, setModelVariant] = useState<string>("qwen");
  const [width, setWidth] = useState<number>(1024);
  const [height, setHeight] = useState<number>(1024);
  const [language, setLanguage] = useState<"es" | "en">("es");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [comparePosition, setComparePosition] = useState<number>(50);
  // Removed isConfigOpen and isPromptOpen - no longer needed
  const [matchInput, setMatchInput] = useState<boolean>(true); // Default to true for Match Input
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatAssistantRef = useRef<ChatAssistantRef>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeJobs, addJob, updateJob, removeJob, getJob } = useJobs();
  // const { activeJobsOfType } = useJobRecovery('design'); // Disabled to avoid duplicate polling

  // Estado para trabajo actual y persistencia
  const [currentJob, setCurrentJob] = useState<any>(null);
  const [recoveredImageUrl, setRecoveredImageUrl] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState<'small' | 'large'>('small');
  
  // Suggested edit prompts organized by category
  const editSuggestions = {
    poseChanges: [
      { es: "Vista frontal directa a cámara", en: "Front view looking directly at camera" },
      { es: "Girar cabeza ligeramente a la izquierda", en: "Turn head slightly to the left" },
      { es: "Girar cabeza ligeramente a la derecha", en: "Turn head slightly to the right" },
      { es: "Perfil completo lateral", en: "Show complete side profile" },
      { es: "Vista de tres cuartos", en: "Three-quarter angle view" },
      { es: "Mirar hacia arriba con esperanza", en: "Look upward with hopeful gaze" },
      { es: "Mirar hacia abajo pensativo", en: "Look down contemplatively" },
      { es: "Mirar sobre el hombro", en: "Look over shoulder toward camera" },
    ],
    lightingChanges: [
      { es: "Luz suave desde la derecha", en: "Soft light from right" },
      { es: "Luz suave desde la izquierda", en: "Soft light from left" },
      { es: "Iluminación mariposa", en: "Butterfly lighting" },
      { es: "Iluminación Rembrandt", en: "Rembrandt lighting" },
      { es: "Hora dorada", en: "Golden hour" },
      { es: "Luz dramática baja", en: "Low-key dramatic" },
      { es: "Luz de ventana", en: "Window light" },
      { es: "Contraluz", en: "Backlighting" },
    ],
    styleChanges: [
      { es: "Dibujo a lápiz", en: "Pencil sketch" },
      { es: "Hiperrealista", en: "Hyperrealistic" },
      { es: "Acuarela", en: "Watercolor" },
      { es: "Tinta", en: "Ink drawing" },
      { es: "Óleo", en: "Oil painting" },
      { es: "Minimalista", en: "Minimalist" },
      { es: "Grabado vintage", en: "Vintage engraving" },
      { es: "Arte vectorial", en: "Vector art" },
    ],
    cameraAngles: [
      { es: "Vista aérea", en: "Bird's eye view" },
      { es: "Ángulo bajo", en: "Low angle" },
      { es: "Ángulo holandés", en: "Dutch angle" },
      { es: "Plano medio", en: "Medium shot" },
      { es: "Primer plano", en: "Close-up" },
      { es: "Nivel de ojos", en: "Eye level" },
      { es: "Nivel del suelo", en: "Ground level" },
    ],
  };

  // Recuperar trabajo en progreso al cargar la página - CON LIMPIEZA Y AUTENTICACIÓN
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      activeJobs
        .filter(job => job.type === 'design')
        .forEach(job => removeJob(job.id));
      return;
    }

    // Limpiar trabajos colgados viejos primero
    activeJobs.forEach(job => {
      if (job.type === 'design' && job.status === 'processing' && job.startedAt) {
        const startTime = new Date(job.startedAt).getTime();
        const timeDiff = (Date.now() - startTime) / 1000 / 60;
        if (timeDiff > 5) {
          updateJob(job.id, {
            status: 'failed',
            errorMessage: 'Timeout - proceso interrumpido',
            completedAt: new Date().toISOString()
          });
        }
      }
    });

    // Buscar trabajo activo válido o el último completado
    const activeJob = activeJobs.find(job => job.status === 'processing' && job.type === 'design');

    if (activeJob) {
      console.log('Design job recovery: Found active job', activeJob.id);
      setCurrentJob(activeJob);
      setIsGenerating(true);

      if (activeJob.originalImageUrl) {
        setRecoveredImageUrl(activeJob.originalImageUrl);
        setReferencePreview(activeJob.originalImageUrl);
      }

      if (activeJob.style) {
        setPrompt(activeJob.style);
      }
    } else {
      const completedJobs = activeJobs
        .filter(job => job.status === 'completed' && job.type === 'design')
        .sort((a, b) => new Date(b.completedAt || b.startedAt || 0).getTime() - new Date(a.completedAt || a.startedAt || 0).getTime());

      if (completedJobs.length > 0) {
        const latestJob = completedJobs[0];
        console.log('Design job recovery: Loading latest completed job', latestJob.id);
        setCurrentJob(latestJob);

        if (latestJob.originalImageUrl) {
          setReferencePreview(latestJob.originalImageUrl);
        }

        if (latestJob.style) {
          setPrompt(latestJob.style);
        }
      }
    }
  }, [user, isLoading, activeJobs, removeJob, updateJob]); // Ejecutar cuando cambie el usuario o el estado de carga

  // Persist job changes using JobContext helpers
  useEffect(() => {
    if (!currentJob) return;

    const persist = () => {
      const sanitized = (({ originalImageUrl, processedImageUrl, ...rest }) => rest)(currentJob);
      if (getJob(currentJob.id)) {
        updateJob(currentJob.id, sanitized);
      } else {
        addJob({ ...sanitized, type: 'design' });
      }
    };

    const timeoutId = setTimeout(persist, 100);
    return () => clearTimeout(timeoutId);
  }, [currentJob?.id, currentJob?.status, addJob, updateJob, getJob]);

  // Verificar si el trabajo actual se completó - usando JobContext
  useEffect(() => {
    if (!currentJob || currentJob.status !== 'processing') return;

    const checkJobStatus = () => {
      const job = getJob(currentJob.id);
      
      if (job) {
        // Si el trabajo cambió de estado en JobContext
        if (job.status !== currentJob.status) {
          setCurrentJob(job);
          
          if (job.status === 'completed') {
            setIsGenerating(false);
            
            // Actualizar la vista con la imagen generada
            if (chatAssistantRef.current && job.processedImageUrl) {
              chatAssistantRef.current.addImageMessage(job.processedImageUrl);
            }
            
            toast({
              title: language === 'es' ? "¡Diseño completado!" : "Design completed!",
              description: language === 'es' ? "Tu diseño se ha generado exitosamente" : "Your design has been generated successfully",
            });
          } else if (job.status === 'failed') {
            setIsGenerating(false);
            toast({
              title: "Error",
              description: job.errorMessage || "Error generating design",
              variant: "destructive",
            });
          }
        }
      }
      
      // También invalidar queries para actualizar el historial y créditos
      queryClient.invalidateQueries({ queryKey: ["/api/flux/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    };

    const checkInterval = setInterval(checkJobStatus, 1000); // Verificar cada 1 segundo para actualización más rápida

    return () => clearInterval(checkInterval);
  }, [currentJob?.id, currentJob?.status, queryClient, language, toast, getJob]); // Dependencias específicas



  // Translations
  const t = {
    es: {
      title: "Design Editor",
      subtitle: "Editor de diseños con IA",
      prompt: "Manual Prompt",
      promptPlaceholder: "Describe tu diseño de tatuaje aquí...",
      referenceImage: "Imagen para editar",
      generate: "Generar diseño",
      regenerate: "Regenerar",
      download: "Descargar",
      share: "Compartir",
      aspectRatio: "Proporción",
      model: "Modelo",
      dimensions: "Dimensiones",
      width: "Ancho",
      height: "Alto",
      inkVision: "InkVision - Asistente IA",
      sendMessage: "Enviar mensaje",
      messagePlaceholder: "Pregunta sobre diseños o solicita ideas...",
      apply: "Aplicar",
      compareMode: "Modo comparación",
      history: "Historial",
      settings: "Configuración",
      analyzing: "Analizando imagen...",
      generating: "Generando diseño...",
      suggestions: "Ediciones sugeridas",
      poseChanges: "Cambios de pose",
      lightingChanges: "Iluminación",
      styleChanges: "Estilos",
      cameraAngles: "Ángulos de cámara",
      expressions: "Expresiones",
    },
    en: {
      title: "Design Editor",
      subtitle: "AI Design Editor",
      prompt: "Manual Prompt",
      promptPlaceholder: "Describe your tattoo design here...",
      referenceImage: "Image to edit",
      generate: "Generate design",
      regenerate: "Regenerate",
      download: "Download",
      share: "Share",
      aspectRatio: "Aspect ratio",
      model: "Model",
      dimensions: "Dimensions",
      width: "Width",
      height: "Height",
      inkVision: "InkVision - AI Assistant",
      sendMessage: "Send message",
      messagePlaceholder: "Ask about designs or request ideas...",
      apply: "Apply",
      compareMode: "Compare mode",
      history: "History",
      settings: "Settings",
      analyzing: "Analyzing image...",
      generating: "Generating design...",
      suggestions: "Suggested edits",
      poseChanges: "Pose changes",
      lightingChanges: "Lighting",
      styleChanges: "Styles",
      cameraAngles: "Camera angles",
      expressions: "Expressions",
    }
  };

  const txt = t[language];

  // Fetch user's projects (moved before useEffect to avoid initialization error)
  const { data: projectsData, error: projectsError } = useQuery<FluxProject[]>({
    queryKey: ["/api/flux/projects"],
    queryFn: async (ctx) => {
      try {
        const result = await getQueryFn<FluxProject[]>({ on401: "returnNull" })(ctx);
        return result || [];
      } catch (err: unknown) {
        console.error("GET /api/flux/projects failed:", err);
        return [];
      }
    },
    initialData: [],
    enabled: !!isAuthenticated, // Convertir a booleano
    staleTime: 0,              // permite refetch inmediato tras login
    retry: 1,                  // Solo reintentar una vez
  });
  
  // Fallback a galería si flux/projects está vacío, falla o devuelve null
  const shouldUseGallery = isAuthenticated && 
    (!projectsData || !Array.isArray(projectsData) || projectsData.length === 0 || projectsError);
  
  const { data: galleryData } = useQuery<any[]>({
    queryKey: ["/api/gallery", { type: "design" }],
    queryFn: async () => {
      try {
        const response = await fetch('/api/gallery?type=design');
        if (!response.ok) {
          console.error('Gallery fetch failed:', response.status);
          return [];
        }
        const data = await response.json();
        // Transform gallery data to match FluxProject format if needed
        return data.map((item: any) => ({
          id: item.id,
          imageUrl: item.imageUrl || item.url,
          thumbnailUrl: item.thumbnailUrl,
          prompt: item.prompt || item.description,
          name: item.title || item.name,
          createdAt: item.createdAt,
          settings: item.settings || {}
        }));
      } catch (err) {
        console.error("GET /api/gallery?type=design failed:", err);
        return [];
      }
    },
    enabled: !!shouldUseGallery,
    initialData: [],
    staleTime: 0,
  });
  
  // Usar projectsData si tiene datos, sino usar galleryData
  const projects: FluxProject[] = (projectsData && Array.isArray(projectsData) && projectsData.length > 0 
    ? projectsData 
    : (Array.isArray(galleryData) ? galleryData : [])) || [];
  // Ordenar proyectos por fecha de creación (más reciente primero)
  const sortedProjects = [...projects].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA; // Orden descendente (más reciente primero)
  });

  useEffect(() => {
    if (isAuthenticated) {
      queryClient.invalidateQueries({ queryKey: ["/api/flux/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gallery", { type: "design" }] });
    }
  }, [isAuthenticated, queryClient]);

  // Verificar automáticamente cuando se actualiza la lista de proyectos
  useEffect(() => {
    if (!currentJob || currentJob.status !== 'processing' || !projects.length) return;

    const completedProject = projects.find((p: any) => p.id === currentJob.id);
    if (completedProject && completedProject.imageUrl && !completedProject.imageUrl.includes('placeholder')) {
      console.log('Design job completed, updating state');
      setIsGenerating(false);
      updateJob(currentJob.id, {
        status: 'completed',
        processedImageUrl: completedProject.imageUrl,
        completedAt: new Date().toISOString()
      });
      setCurrentJob({
        ...currentJob,
        status: 'completed',
        processedImageUrl: completedProject.imageUrl
      });
      
      toast({
        title: "Diseño completado",
        description: "Tu imagen ha sido generada exitosamente",
      });
    }
  }, [projects, currentJob, updateJob, toast]);

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const response = await fetch(`/api/flux/projects/${projectId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete project');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flux/projects'] });
      toast({
        title: language === 'es' ? 'Imagen eliminada' : 'Image deleted',
        description: language === 'es' ? 'La imagen se ha eliminado correctamente' : 'The image has been deleted successfully',
      });
    },
    onError: () => {
      toast({
        title: language === 'es' ? 'Error' : 'Error',
        description: language === 'es' ? 'No se pudo eliminar la imagen' : 'Could not delete the image',
        variant: 'destructive',
      });
    },
  });

  // Handle file selection - Subir a Object Storage en lugar de base64
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      // Mostrar estado de carga
      toast({
        title: language === 'es' ? "Subiendo imagen..." : "Uploading image...",
        description: language === 'es' ? "Por favor espera" : "Please wait",
      });
      
      const formData = new FormData();
      formData.append("image", file);
      
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Upload failed");
        }
        
        const data = await res.json();
        setReferencePreview(data.url); // Usar la URL de Object Storage en lugar de base64
        
        // Automatically select Match Input when image is loaded
        setAspectRatio("Match Input");
        setMatchInput(true);
        
        toast({
          title: language === 'es' ? "Imagen subida" : "Image uploaded",
          description: language === 'es' ? "Lista para usar" : "Ready to use",
        });
      } catch (error) {
        console.error("Error uploading image:", error);
        toast({
          title: language === 'es' ? "Error al subir" : "Upload failed",
          description: language === 'es' ? 'No se pudo subir la imagen. Intenta de nuevo.' : 'Could not upload the image. Please try again.',
          variant: "destructive",
        });
        // Limpiar el estado si falla
        setReferencePreview(null);
      }
    }
  };







  // Handle design generation
  const handleGenerate = async () => {
    // Check authentication before generating
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }

    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: language === 'es' ? "Por favor ingresa una descripción del diseño" : "Please enter a design description",
        variant: "destructive",
      });
      return;
    }
    
    // Validate image requirement for Qwen model
    if (modelVariant === 'qwen' && !referencePreview) {
      toast({
        title: language === 'es' ? "Imagen requerida" : "Image required",
        description: language === 'es' 
          ? "Qwen Image Edit necesita una imagen para editar. Por favor sube una imagen primero."
          : "Qwen Image Edit requires an image to edit. Please upload an image first.",
        variant: "destructive",
      });
      return;
    }
    
    if (!referencePreview) {
      toast({
        title: "Error", 
        description: language === 'es' ? "Por favor carga una imagen para editar. Puedes cargarla en InkVision o usar el botón de cargar archivo." : "Please load an image to edit. You can upload it in InkVision or use the file upload button.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Create temporary job entry for instant feedback
      const tempJobId = `temp_${Date.now()}`;
      const tempJob: StencilJob = {
        id: tempJobId,
        status: 'processing',
        originalImageUrl: referencePreview,
        processedImageUrl: null,
        errorMessage: null,
        style: prompt.slice(0, 30),
        startedAt: new Date(),
        completedAt: null,
        userId: 'temp-user',
        createdAt: new Date(),
        comfyDeployRunId: null,
        processingOptions: {}
      };
      
      setCurrentJob(tempJob);
      // Convert StencilJob to Job format for addJob
      addJob({
        id: tempJobId,
        status: 'processing',
        type: 'design',
        originalImageUrl: referencePreview,
        processedImageUrl: undefined,
        style: prompt.slice(0, 30),
        startedAt: new Date().toISOString(),
        errorMessage: undefined
      });
      
      // Call the same API that InkVision uses
      console.log('Sending to generate API:', {
        hasPrompt: !!prompt,
        hasImage: !!referencePreview,
        imageLength: referencePreview?.length || 0,
        model: modelVariant
      });
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          inputImageUrl: referencePreview, // Changed from imageData to inputImageUrl like InkVision
          model: modelVariant, // Send 'pro', 'max', or 'qwen'
          aspectRatio: aspectRatio // Use the selected aspect ratio instead of hardcoding
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Generated image data:', data);
      const { imageUrl, thumbnailUrl } = data;

      // Update chat assistant with the generated image
      if (chatAssistantRef.current && imageUrl) {
        chatAssistantRef.current.addImageMessage(imageUrl);
      }
      
      // FIRST: Save to gallery (most important - ensures persistence)
      await apiRequest("POST", "/api/gallery", {
        imageUrl,
        thumbnailUrl,
        type: "design",
        title: prompt.slice(0, 50),
        description: prompt,
        prompt,
        style: modelVariant,
      });
      
      // SECOND: Try to create project for history (optional - can fail)
      const projectData = {
        name: prompt.slice(0, 50),
        description: prompt,
        prompt: prompt,
        settings: {
          aspectRatio,
          modelVariant,
          width,
          height,
          ...(referencePreview ? { referenceImageUrl: referencePreview } : {}),
          matchInput,
          thumbnailUrl,
        },
        userId: (user as any)?.id || "anonymous",
        imageUrl: imageUrl // Usar la URL pública optimizada devuelta por el servidor
      };
      
      try {
        await apiRequest("POST", "/api/flux/create", projectData);
      } catch (err: unknown) {
        console.error("POST /api/flux/create failed, but image is saved in gallery:", err);
        // Continue - image is already saved to gallery
      }
      
      // Update job status with the processed image URL
      const completedJob = {
        ...tempJob,
        status: 'completed' as const,
        completedAt: new Date().toISOString(),
        processedImageUrl: imageUrl,
        originalImageUrl: referencePreview, // Mantener la imagen original
        startedAt: typeof tempJob.startedAt === 'string' ? tempJob.startedAt : new Date().toISOString(), // Ensure startedAt is string
        errorMessage: tempJob.errorMessage || undefined // Convert null to undefined
      };
      
      updateJob(tempJobId, completedJob);
      setCurrentJob(completedJob);
      
      // Invalidate projects query to refresh history
      queryClient.invalidateQueries({ queryKey: ["/api/flux/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gallery", { type: "design" }] });
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: language === 'es' ? "¡Diseño generado!" : "Design generated!",
        description: language === 'es' ? "Tu nuevo diseño está listo y se ha guardado en tu galería" : "Your new design is ready and has been saved to your gallery",
      });
      
    } catch (error) {
      console.error('Error generating design:', error);
      
      // Update job as failed
      if (currentJob) {
        const failedJob = {
          ...currentJob,
          status: 'failed' as const,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date().toISOString()
        };
        updateJob(currentJob.id, failedJob);
        setCurrentJob(failedJob);
        
        // Keep error visible until next generation
      }
      
      toast({
        title: "Error",
        description: language === 'es' ? "Error al generar el diseño. Inténtalo de nuevo." : "Error generating design. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle image download
  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper function to convert image URL to base64 (copied from FluxKontextAI)
  const fetchImageAsBase64 = async (imageUrl: string): Promise<string> => {
    try {
      console.log('fetchImageAsBase64 called with:', imageUrl);
      
      // If it's already a base64 string, return it
      if (imageUrl.startsWith('data:')) {
        console.log('Already base64, returning as is');
        return imageUrl;
      }
      
      // Fetch the image from the API
      console.log('Fetching image from:', imageUrl);
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('Blob size:', blob.size);
      
      // Convert blob to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          console.log('Converted to base64, length:', result.length);
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error fetching image as base64:', error);
      throw error;
    }
  };

  // Handle use as reference (copied from FluxKontextAI)
  const handleUseAsReference = async (imageUrl: string) => {
    try {
      toast({
        title: language === 'es' ? "Cargando imagen..." : "Loading image...",
        description: language === 'es' ? "Preparando imagen para editar" : "Preparing image for editing",
      });
      
      const base64Image = await fetchImageAsBase64(imageUrl);
      console.log('Base64 conversion complete, setting as reference');
      console.log('Base64 length:', base64Image.length);
      
      // Set as reference image
      setReferencePreview(base64Image);
      
      // Set default prompt for editing
      setPrompt("Front view looking directly at camera, keep the same composition and elements");
      
      // Set aspect ratio to match input
      setAspectRatio("Match Input");
      setMatchInput(true);
      
      toast({
        title: language === 'es' ? "Imagen cargada para editar" : "Image loaded for editing",
        description: language === 'es' ? "Ya puedes editar esta imagen con nuevas instrucciones" : "You can now edit this image with a new prompt",
      });
    } catch (error) {
      console.error('Error in use as reference:', error);
      toast({
        title: language === 'es' ? "Error" : "Error",
        description: language === 'es' ? "No se pudo cargar la imagen" : "Could not load the image",
        variant: "destructive",
      });
    }
  };

  // Update dimensions based on aspect ratio or match input
  useEffect(() => {
    if (aspectRatio === "Match Input") {
      if (referencePreview) {
        // Get dimensions from reference image
        const img = new Image();
        img.onload = () => {
          // Scale dimensions to fit within Flux Kontext bounds and round to multiples of 32
          const maxDim = 1408; // Max supported by Flux at 2.0MP
          let w = img.width;
          let h = img.height;
          
          // Scale down if needed
          if (w > maxDim || h > maxDim) {
            const scale = maxDim / Math.max(w, h);
            w = Math.round(w * scale);
            h = Math.round(h * scale);
          }
          
          // Round to nearest multiple of 32 (Flux requirement)
          w = Math.round(w / 32) * 32;
          h = Math.round(h / 32) * 32;
          
          // Ensure minimum size of 256
          w = Math.max(256, w);
          h = Math.max(256, h);
          
          setWidth(w);
          setHeight(h);
        };
        img.src = referencePreview;
      } else {
        // No image loaded, use default 1:1
        setWidth(1024);
        setHeight(1024);
      }
    } else {
      // Use predefined aspect ratios with optimal Flux resolutions
      const ratios: { [key: string]: [number, number] } = {
        "1:1": [1024, 1024],     // Square
        "16:9": [1344, 768],     // Widescreen
        "9:16": [768, 1344],     // Vertical/Mobile
        "4:3": [1152, 896],      // Standard landscape
        "3:4": [896, 1152],      // Standard portrait
        "3:2": [1216, 832],      // Classic landscape
        "2:3": [832, 1216],      // Classic portrait
        "4:5": [896, 1120],      // Portrait
        "5:4": [1120, 896],      // Landscape
        "21:9": [1408, 608],     // Ultra-wide
        "9:21": [608, 1408],     // Ultra-tall
        "2:1": [1344, 672],      // Panoramic
        "1:2": [672, 1344],      // Tall
      };
      
      const [w, h] = ratios[aspectRatio] || [1024, 1024];
      setWidth(w);
      setHeight(h);
    }
  }, [aspectRatio, referencePreview]);
  
  // Reset match input when reference image is removed
  useEffect(() => {
    if (!referencePreview && matchInput) {
      setMatchInput(false);
    }
  }, [referencePreview, matchInput]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <main className="container mx-auto px-4 py-20 max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl font-bold">{txt.title}</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === "es" ? "en" : "es")}
            >
              <Languages className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-zinc-400">{txt.subtitle}</p>
        </div>



        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Estilos Populares (con order-2 en móvil para aparecer después) */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="sticky top-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    {txt.suggestions}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Pose Changes */}
                  <div>
                    <Label className="text-xs mb-2">{txt.poseChanges}</Label>
                    <div className="space-y-2">
                      {editSuggestions.poseChanges.slice(0, 3).map((sugg, idx) => (
                        <Button
                          key={`pose-${idx}`}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-left h-auto p-2"
                          onClick={() => setPrompt(sugg.en)}
                        >
                          <div className="text-xs truncate">
                            {sugg[language]}
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Lighting Changes */}
                  <div>
                    <Label className="text-xs mb-2">{txt.lightingChanges}</Label>
                    <div className="space-y-2">
                      {editSuggestions.lightingChanges.slice(0, 3).map((sugg, idx) => (
                        <Button
                          key={`light-${idx}`}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-left h-auto p-2"
                          onClick={() => setPrompt(sugg.en)}
                        >
                          <div className="text-xs truncate">
                            {sugg[language]}
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Style Changes */}
                  <div>
                    <Label className="text-xs mb-2">{txt.styleChanges}</Label>
                    <div className="space-y-2">
                      {editSuggestions.styleChanges.slice(0, 3).map((sugg, idx) => (
                        <Button
                          key={`style-${idx}`}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-left h-auto p-2"
                          onClick={() => setPrompt(sugg.en)}
                        >
                          <div className="text-xs truncate">
                            {sugg[language]}
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content (con order-1 en móvil para aparecer primero) */}
          <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
            {/* InkVision Chat (movido arriba, donde estaba "Descripción del diseño") */}
            <Card>
              <CardContent className="p-0">
                <ChatAssistant 
                  ref={chatAssistantRef}
                  currentImage={referencePreview || undefined}
                  onApplyPrompt={(newPrompt) => {
                    setPrompt(newPrompt);
                    // Auto-generar cuando InkVision aplique un prompt
                    setTimeout(() => {
                      handleGenerate();
                    }, 100); // Pequeño delay para asegurar que el prompt se actualice
                  }}
                  language={language}
                  embedded={true}
                  isAuthenticated={isAuthenticated}
                  onAuthRequired={() => setShowAuthDialog(true)}
                  modelVariant={modelVariant}
                  aspectRatio={aspectRatio}
                  onModelChange={setModelVariant}
                  onAspectRatioChange={(ratio) => {
                    setAspectRatio(ratio);
                    setMatchInput(ratio === "Match Input");
                  }}
                  onImageUpload={(imageUrl, _file) => {
                    // Manejar carga de imagen desde el chat
                    setReferencePreview(imageUrl);
                    setAspectRatio("Match Input");
                    setMatchInput(true);
                  }}
                  onImageGenerated={(imageUrl, prompt) => {
                    // Cuando InkVision genera una imagen, crear un job para mostrar el cuadro
                    const tempJobId = `job-${Date.now()}`;
                    const tempJob: StencilJob = {
                      id: tempJobId,
                      status: 'completed' as const,
                      originalImageUrl: referencePreview || '',
                      processedImageUrl: imageUrl,
                      style: prompt,
                      errorMessage: null,
                      startedAt: new Date(),
                      completedAt: new Date(),
                      userId: 'temp-user',
                      createdAt: new Date(),
                      comfyDeployRunId: null,
                      processingOptions: {}
                    };
                    setCurrentJob(tempJob);
                  }}
                />
              </CardContent>
            </Card>

            {/* Manual Prompt section removed - now integrated into InkVision chat */}

            {/* Generation Settings section removed - now integrated into InkVision chat */}
          </div>

          {/* Right Sidebar - Results (con order-3 para aparecer último) */}
          <div className="lg:col-span-1 space-y-4 order-3 lg:order-3">
            {/* Estado del trabajo actual - Mostrar siempre si hay trabajo en progreso */}
            {currentJob && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    {currentJob.status === 'processing' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Procesando diseño...
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4" />
                        Diseño completado
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Imagen original o resultado */}
                    <div className="relative group">
                      {currentJob.status === 'completed' && currentJob.processedImageUrl ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <div className="relative cursor-pointer group">
                              <LazyImage
                                src={currentJob.processedImageUrl}
                                alt="Processed design"
                                className="w-full rounded-lg transition-all group-hover:opacity-90"
                              />
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] p-2">
                            <div className="relative">
                              <LazyImage
                                src={currentJob.processedImageUrl}
                                alt="Full size design"
                                className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
                              />
                              <div className="absolute top-2 right-2">
                                <Button
                                  size="sm"
                                  onClick={() => downloadImage(currentJob.processedImageUrl!, `design-${currentJob.id}.png`)}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  {language === 'es' ? 'Descargar' : 'Download'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : recoveredImageUrl ? (
                        <div className="relative">
                          <LazyImage
                            src={recoveredImageUrl}
                            alt="Processing..."
                            className="w-full rounded-lg opacity-75"
                          />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                            <div className="text-center">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                              <p className="text-xs text-zinc-300 mb-2">Generando...</p>
                              {/* Botón para cancelar trabajo colgado */}
                              <button
                                onClick={() => {
                                  // Limpiar trabajo de localStorage
                                  const storageKey = 'tattoo-stencil-jobs';
                                  const stored = localStorage.getItem(storageKey);
                                  if (stored) {
                                    try {
                                      const jobs = JSON.parse(stored);
                                      const cleanedJobs = jobs.filter((j: any) => j.id !== currentJob?.id);
                                      localStorage.setItem(storageKey, JSON.stringify(cleanedJobs));
                                    } catch (error) {
                                      console.error('Error canceling:', error);
                                    }
                                  }
                                  
                                  // Resetear estado
                                  setCurrentJob(null);
                                  setIsGenerating(false);
                                  setReferencePreview('');
                                  setRecoveredImageUrl('');
                                  
                                  toast({
                                    title: language === 'es' ? "Proceso cancelado" : "Process canceled",
                                    description: language === 'es' ? "El diseño fue cancelado correctamente" : "The design was canceled successfully",
                                  });
                                }}
                                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                              >
                                {language === 'es' ? 'Cancelar' : 'Cancel'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-32 bg-zinc-900 rounded-lg flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      )}
                    </div>
                    
                    {/* Información del trabajo */}
                    {currentJob.style && (
                      <div>
                        <Label className="text-xs text-zinc-500">Prompt</Label>
                        <p className="text-xs text-zinc-300 break-words">{currentJob.style}</p>
                      </div>
                    )}
                    
                    {/* Botones de acción */}
                    {currentJob.status === 'completed' && currentJob.processedImageUrl && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => downloadImage(currentJob.processedImageUrl, `design-${currentJob.id}.png`)}
                          className="flex-1"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Descargar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUseAsReference(currentJob.processedImageUrl)}
                          className="flex-1"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Removed Latest Design section per user request */}

            {/* History - Mobile Optimized Gallery */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <History className="h-4 w-4" />
                    {txt.history}
                  </CardTitle>
                </div>
                
                {/* Grid Size Toggle */}
                <div className="flex items-center justify-center bg-zinc-800 rounded-lg p-1">
                  <Button
                    variant={gridSize === 'small' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setGridSize('small')}
                    className={`h-8 px-3 ${gridSize === 'small' 
                      ? 'bg-white text-black hover:bg-gray-100' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
                    }`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={gridSize === 'large' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setGridSize('large')}
                    className={`h-8 px-3 ${gridSize === 'large' 
                      ? 'bg-white text-black hover:bg-gray-100' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Grid con tamaño dinámico */}
                  <div className={`grid gap-3 lg:gap-4 ${
                    gridSize === 'small' 
                      ? 'grid-cols-2 lg:grid-cols-2' 
                      : 'grid-cols-1 lg:grid-cols-1'
                  }`}>
                    {sortedProjects.slice(0, 8).map((project) => (
                    <Dialog key={project.id}>
                      <DialogTrigger asChild>
                        <div className="relative group cursor-pointer">
                          <LazyImage
                            src={(project.settings as any)?.thumbnailUrl || project.imageUrl || ""}
                            alt={project.name}
                            className="w-full aspect-[3/4] rounded-lg object-cover transition-opacity"
                          />
                        </div>
                      </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] p-4">
                          <div className="space-y-4">
                            <div className="relative">
                              <LazyImage
                                src={project.imageUrl || ""}
                                alt={`${project.name} full size`}
                                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                              />
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm font-medium">{project.name}</p>
                              <p className="text-xs text-zinc-400">{new Date(project.createdAt || "").toLocaleDateString()}</p>
                              <div className="flex gap-2 pt-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="flex-1"
                                  onClick={() => handleUseAsReference(project.imageUrl || "")}
                                  data-testid={`button-use-as-reference-history-${project.id}`}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  {language === 'es' ? 'Editar' : 'Edit'}
                                </Button>
                                <Button
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => downloadImage(project.imageUrl || "", `design-${project.id}.png`)}
                                  data-testid={`button-download-history-${project.id}`}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  {language === 'es' ? 'Descargar' : 'Download'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    if (confirm(language === 'es' ? '¿Estás seguro de que quieres eliminar esta imagen?' : 'Are you sure you want to delete this image?')) {
                                      deleteProjectMutation.mutate(project.id);
                                    }
                                  }}
                                  data-testid={`button-delete-history-${project.id}`}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  {language === 'es' ? 'Eliminar' : 'Delete'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ))}
                  </div>
                  
                  {/* Load More Button - show when there are more than 8 projects */}
                  {projects.length > 8 && (
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Navigate to main gallery to see all projects
                          window.location.href = '/gallery';
                        }}
                        className="text-sm"
                      >
                        Ver todos ({projects.length} diseños)
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>


          </div>
        </div>
      </main>
      
      {/* InkVision ahora está en el sidebar izquierdo */}
      
      <AuthDialog 
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        language={language}
        toolType="design"
      />
    </div>
  );
}

export default DesignEditor;