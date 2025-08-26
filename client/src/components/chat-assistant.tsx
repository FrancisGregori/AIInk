import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MessageCircle, X, Send, Copy, Image, Sparkles, Download, Edit, Upload, Paperclip, Loader2, ImageIcon, Bot, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  image?: string;
  isAnalyzing?: boolean;
}

interface ChatAssistantProps {
  currentImage?: string;
  onApplyPrompt: (prompt: string) => void;
  language?: "es" | "en";
  embedded?: boolean;
  onImageUpload?: (imageUrl: string, file: File) => void;
  onImageGenerated?: (imageUrl: string, prompt: string) => void;
  isAuthenticated?: boolean;
  onAuthRequired?: () => void;
  modelVariant?: string;
  aspectRatio?: string;
  onModelChange?: (model: string) => void;
  onAspectRatioChange?: (ratio: string) => void;
}

export interface ChatAssistantRef {
  open: () => void;
  addImageMessage: (imageUrl: string) => void;
}

const ChatAssistant = forwardRef<ChatAssistantRef, ChatAssistantProps>(({ currentImage, onApplyPrompt, language = "es", embedded = false, onImageUpload, onImageGenerated, isAuthenticated = false, onAuthRequired, modelVariant = "pro", aspectRatio = "Match Input", onModelChange, onAspectRatioChange }, ref) => {
  const [isOpen, setIsOpen] = useState(embedded);
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastImageAnalyzed, setLastImageAnalyzed] = useState<string>("");
  const [storedImage, setStoredImage] = useState<string>("");
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isScrollingToImage, setIsScrollingToImage] = useState(false);

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
      
      // Set the image as the current stored image
      setStoredImage(base64Image);
      
      // Add image message to chat showing it's loaded
      const imageMessage: Message = {
        id: `image-${Date.now()}`,
        role: 'user',
        content: language === 'es' ? 'Imagen cargada' : 'Image loaded',
        timestamp: new Date(),
        image: base64Image
      };
      
      setMessages(prev => [...prev, imageMessage]);
      
      toast({
        title: language === 'es' ? "Imagen lista" : "Image ready",
        description: language === 'es' ? "Ya puedes editar esta imagen con nuevas instrucciones" : "You can now edit this image with new instructions",
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

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Check authentication before allowing image upload
    if (!isAuthenticated) {
      if (onAuthRequired) {
        onAuthRequired();
      }
      // Reset the input value so same file can be selected again after login
      e.target.value = '';
      return;
    }
    
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setStoredImage(imageUrl);
        
        // Call the parent callback if provided
        if (onImageUpload) {
          onImageUpload(imageUrl, file);
        }
        
        // Add image message to chat
        const imageMessage: Message = {
          id: `image-${Date.now()}`,
          role: 'user',
          content: language === 'es' ? 'Imagen cargada para editar' : 'Image loaded for editing',
          timestamp: new Date(),
          image: imageUrl
        };
        
        setMessages(prev => [...prev, imageMessage]);
        
        toast({
          title: language === 'es' ? "Imagen cargada" : "Image uploaded",
          description: language === 'es' ? "La imagen está lista para editar" : "Image is ready for editing",
        });
      };
      reader.readAsDataURL(file);
    } else if (file) {
      toast({
        title: language === 'es' ? "Archivo no válido" : "Invalid file",
        description: language === 'es' ? "Por favor selecciona una imagen" : "Please select an image file",
        variant: "destructive",
      });
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    // Check authentication before allowing image upload
    if (!isAuthenticated) {
      if (onAuthRequired) {
        onAuthRequired();
      }
      return;
    }
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith("image/"));
    
    if (imageFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setStoredImage(imageUrl);
        
        // Call the parent callback if provided
        if (onImageUpload) {
          onImageUpload(imageUrl, imageFile);
        }
        
        // Add image message to chat
        const imageMessage: Message = {
          id: `image-${Date.now()}`,
          role: 'user',
          content: language === 'es' ? 'Imagen cargada para editar' : 'Image loaded for editing',
          timestamp: new Date(),
          image: imageUrl
        };
        
        setMessages(prev => [...prev, imageMessage]);
        
        toast({
          title: language === 'es' ? "Imagen cargada" : "Image uploaded",
          description: language === 'es' ? "La imagen está lista para editar" : "Image is ready for editing",
        });
      };
      reader.readAsDataURL(imageFile);
    } else if (files.length > 0) {
      toast({
        title: language === 'es' ? "Archivo no válido" : "Invalid file",
        description: language === 'es' ? "Por favor arrastra una imagen" : "Please drag an image file",
        variant: "destructive",
      });
    }
  };
  
  // Function to scroll to bottom - using scrollIntoView for reliability
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto", block: "end" });
    }
  };
  
  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    open: () => {
      setIsOpen(true);
    },
    addImageMessage: (imageUrl: string) => {
      const imageMessage: Message = {
        id: `generated-${Date.now()}`,
        role: 'assistant',
        content: language === 'es' ? '¡Diseño generado! Tu nueva imagen está lista.' : 'Design generated! Your new image is ready.',
        timestamp: new Date(),
        image: imageUrl
      };
      
      // Disable normal auto-scroll temporarily
      setIsScrollingToImage(true);
      setMessages(prev => [...prev, imageMessage]);
      
      // Wait for DOM update and image load before scrolling
      setTimeout(() => {
        // Create a temporary image to detect when it's loaded
        const img = new Image();
        img.onload = () => {
          // Image is loaded, scroll multiple times to ensure it reaches bottom
          setTimeout(() => {
            const messagesContainer = messagesEndRef.current?.parentElement;
            if (messagesContainer) {
              // Force scroll to absolute bottom multiple times
              messagesContainer.scrollTop = messagesContainer.scrollHeight + 1000;
              
              // Second scroll after a brief pause
              setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight + 1000;
              }, 100);
              
              // Third scroll to ensure we're at the bottom
              setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight + 1000;
                // Re-enable normal scroll after image scroll is complete
                setIsScrollingToImage(false);
              }, 500);
            }
          }, 200);
        };
        img.src = imageUrl;
        
        // Fallback scrolls if image takes too long
        setTimeout(() => {
          const messagesContainer = messagesEndRef.current?.parentElement;
          if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight + 1000;
          }
        }, 1000);
        
        // Extra fallback to ensure scroll and re-enable normal scroll
        setTimeout(() => {
          const messagesContainer = messagesEndRef.current?.parentElement;
          if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight + 1000;
          }
          // Ensure we re-enable normal scroll
          setIsScrollingToImage(false);
        }, 3000);
      }, 100);
    }
  }));
  
  // Initialize welcome message
  useEffect(() => {
    const welcomeMessage = language === 'es' 
      ? 'Hola, soy InkVision, tu experto en diseño de tatuajes. Te ayudo a crear prompts técnicos para editar y transformar tu diseño actual.'
      : 'Hi, I\'m InkVision, your tattoo design expert. I help you create technical prompts to edit and transform your current design.';
    
    setMessages([{
      id: '1',
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date()
    }]);
  }, [language]);
  
  // Show tooltip for 5 seconds on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);
  
  // Update stored image when currentImage changes
  useEffect(() => {
    console.log('ChatAssistant received currentImage:', currentImage ? 'YES' : 'NO');
    console.log('CurrentImage preview:', currentImage ? currentImage.substring(0, 50) : 'none');
    if (currentImage) {
      console.log('Updating stored image, length:', currentImage.length);
      setStoredImage(currentImage);
    }
  }, [currentImage]);

  // Auto-scroll to bottom when new messages arrive or chat opens
  useEffect(() => {
    // Don't auto-scroll if we're scrolling to an image
    if (isScrollingToImage) return;
    
    // Use scrollToBottom function with slight delay for DOM update
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  }, [messages, isOpen, isScrollingToImage]);

  // Detect when a new image is loaded and automatically analyze it
  useEffect(() => {
    if (storedImage && storedImage !== lastImageAnalyzed && isOpen) {
      setLastImageAnalyzed(storedImage);
      
      // Automatically analyze the image when opening with a new image
      // Don't disable the input field to allow immediate typing
      analyzeImage();
    }
  }, [storedImage, lastImageAnalyzed, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps
  
  const analyzeImage = async () => {
    // Check authentication before allowing image analysis
    if (!isAuthenticated) {
      if (onAuthRequired) {
        onAuthRequired();
      }
      return;
    }
    
    if (!storedImage) {
      console.log('No image to analyze');
      return;
    }
    
    console.log('Analyzing image, storedImage:', storedImage ? 'exists' : 'null');
    console.log('Image data length:', storedImage?.length || 0);
    
    // Don't set isLoading to true here to allow immediate typing
    // Only show loading indicator in the messages area
    
    // Don't add duplicate image message - it was already added when image was uploaded
    // Just add the analyzing indicator
    
    // Add a message indicating analysis is starting with special flag
    const analyzingMessage: Message = {
      id: `analyzing-${Date.now()}`,
      role: 'assistant',
      content: language === 'es' 
        ? '🔍 Analizando tu imagen...'
        : '🔍 Analyzing your image...',
      timestamp: new Date(),
      isAnalyzing: true // Special flag for analyzing state
    };
    
    setMessages(prev => [...prev, analyzingMessage]);
    
    try {
      // Prepare the message asking for image analysis
      const analysisRequest = language === 'es'
        ? 'Describe detalladamente esta imagen. ¿Qué elementos principales ves? ¿Cuál es la composición, poses, expresiones y estilo?'
        : 'Describe this image in detail. What main elements do you see? What is the composition, poses, expressions and style?';
      
      const apiMessages = [
        { role: 'user' as const, content: analysisRequest }
      ];
      
      console.log('Sending image to chat API, image exists:', !!storedImage);
      console.log('Image preview for analysis:', storedImage ? storedImage.substring(0, 50) : 'none');
      
      // Send request for image analysis
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          image: storedImage
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      // Remove the "analyzing" message and create the real response
      setMessages(prev => prev.filter(msg => msg.id !== analyzingMessage.id));
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Read streaming response
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            
            try {
              const parsed = JSON.parse(data);
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === 'assistant') {
                  lastMessage.content += parsed.content;
                }
                return newMessages;
              });
              // Auto-scroll after state update
              requestAnimationFrame(() => {
                scrollToBottom();
              });
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }
      
      // The backend already provides a contextual question, so we don't need to add another one
      
    } catch (error) {
      console.error('Image analysis error:', error);
      
      // Remove analyzing message
      setMessages(prev => prev.filter(msg => msg.id !== analyzingMessage.id));
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: language === 'es'
          ? '❌ No pude analizar la imagen. Por favor intenta de nuevo o prueba con otra imagen.'
          : '❌ Could not analyze the image. Please try again or try with a different image.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const sendMessage = async () => {
    // Check authentication before allowing chat
    if (!isAuthenticated) {
      if (onAuthRequired) {
        onAuthRequired();
      }
      return;
    }
    
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    
    
    setIsLoading(true);

    try {
      // Prepare messages for API
      const apiMessages = messages.slice(1).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      apiMessages.push({ role: 'user', content: userMessage.content });

      console.log('Sending message with image:', storedImage ? 'yes' : 'no');
      console.log('Image data preview:', storedImage ? storedImage.substring(0, 50) : 'none');
      
      // Send request with streaming
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          image: storedImage
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      // Create assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Read streaming response
      let fullContent = '';
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            
            try {
              const parsed = JSON.parse(data);
              fullContent += parsed.content;
              // Update the last assistant message
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === 'assistant') {
                  lastMessage.content += parsed.content;
                }
                return newMessages;
              });
              // Auto-scroll after state update
              requestAnimationFrame(() => {
                scrollToBottom();
              });
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }
      
      // Check if the response is a prompt and auto-apply it
      if (fullContent && isPromptMessage(fullContent)) {
        // Auto-apply the prompt after a minimal delay to ensure UI updates
        setTimeout(() => {
          applyPrompt(fullContent);
          toast({
            title: language === 'es' ? "✨ Generando imagen..." : "✨ Generating image...",
            description: language === 'es' 
              ? "El prompt se aplicó automáticamente"
              : "The prompt was applied automatically"
          });
        }, 200);
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: language === 'es'
          ? '❌ No pude procesar tu mensaje. Por favor intenta de nuevo.'
          : '❌ Could not process your message. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: language === 'es' ? "Copiado" : "Copied",
      description: language === 'es' 
        ? "El mensaje se ha copiado al portapapeles"
        : "Message copied to clipboard"
    });
  };

  const applyPrompt = async (content: string) => {
    // Check authentication before allowing image generation
    if (!isAuthenticated) {
      if (onAuthRequired) {
        onAuthRequired();
      }
      // Solo mostrar el diálogo, sin mensajes adicionales
      return;
    }
    
    // Apply the prompt to the parent component first
    onApplyPrompt(content);
    
    // Also trigger image generation if we have an image
    if (storedImage) {
      try {
        // Set loading state
        setIsGeneratingImage(true);

        // Call Replicate API with the current image and prompt
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: content,
            inputImageUrl: storedImage, // Send current image as base64
            model: modelVariant, // Use selected model variant
            aspectRatio: aspectRatio // Use the selected aspect ratio from props
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.success && result.imageUrl) {
          // Success toast
          toast({
            title: language === 'es' ? "¡Imagen generada!" : "Image generated!",
            description: language === 'es' 
              ? "La edición se completó exitosamente"
              : "The edit completed successfully"
          });
          
          // Add a new message showing the generated image
          const generatedMessage: Message = {
            id: `generated-${Date.now()}`,
            role: 'assistant',
            content: '', // No text, just the image with actions
            image: result.imageUrl,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, generatedMessage]);
          
          // Clear loading state
          setIsGeneratingImage(false);

          // Call onImageGenerated callback to update currentJob in design-editor
          if (onImageGenerated) {
            onImageGenerated(result.imageUrl, content);
          }

          // También crear un nuevo proyecto para que aparezca en el editor principal
          try {
            // Crear abreviatura del modelo
            const modelAbbr = modelVariant === 'qwen' ? 'Q' : 
                            modelVariant === 'pro' ? 'P' : 
                            modelVariant.charAt(0).toUpperCase();
            
            const projectResponse = await fetch('/api/flux/create', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: content.slice(0, 45) + ` (${modelAbbr})`,
                description: content,
                prompt: content,
                imageUrl: result.imageUrl,
                settings: {
                  aspectRatio: 'match_input_image',
                  modelVariant: modelVariant,
                  referenceImage: storedImage
                },
                userId: "demo-user",
                source: "inkvision"
              }),
            });

            if (projectResponse.ok) {
              // Refrescar la lista de proyectos para que aparezca en el editor
              queryClient.invalidateQueries({ queryKey: ["/api/flux/projects"] });
              console.log('Project created from InkVision successfully');
            }
          } catch (projectError) {
            console.error('Error creating project from InkVision:', projectError);
          }
          
        } else {
          throw new Error(result.details || 'Unknown error');
        }
        
      } catch (error: any) {
        console.error('Error generating image:', error);
        
        // Check if it's an insufficient credits error
        const isCreditsError = error.message?.includes('402') || 
                              error.message?.includes('Insufficient credits') ||
                              error.message?.includes('credits');
        
        // Add appropriate error message to chat
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: isCreditsError 
            ? (language === 'es' 
              ? '⚠️ No tienes créditos suficientes.'
              : '⚠️ Insufficient credits.')
            : (language === 'es'
              ? '❌ No se pudo generar la imagen. Por favor intenta de nuevo.'
              : '❌ Could not generate image. Please try again.'),
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        
        toast({
          title: isCreditsError 
            ? (language === 'es' ? "Créditos insuficientes" : "Insufficient credits")
            : (language === 'es' ? "Error al generar" : "Generation error"),
          description: isCreditsError
            ? (language === 'es' 
              ? "No tienes créditos suficientes."
              : "You don't have enough credits.")
            : (language === 'es' 
              ? "No se pudo generar la imagen."
              : "Could not generate image."),
          variant: "destructive"
        });
      } finally {
        // Always clear the loading state
        setIsGeneratingImage(false);
      }
    } else {
      // No image, just apply the prompt
      toast({
        title: language === 'es' ? "Prompt aplicado" : "Prompt applied",
        description: language === 'es' 
          ? "El prompt se ha aplicado al campo de edición"
          : "The prompt has been applied to the edit field"
      });
    }
  };

  // Function to determine if a message contains a prompt that should have action buttons
  const isPromptMessage = (content: string) => {
    // If the message contains questions, it's not a prompt
    if (content.includes('?') || content.includes('¿')) {
      return false;
    }
    
    // Check if it's a greeting, description, or result message (not a prompt)
    const notPromptPhrases = [
      'hola', 'hi', 'hello', 'bienvenido', 'welcome',
      'soy tu experto', 'soy tu asistente', 'ayudo', 'puedo ayudar',
      'describe', 'descripción', 'esta imagen', 'elementos principales',
      'composición', 'análisis', 'veo que', 'observo',
      // Result messages - these should NOT have buttons
      '✨', 'aquí está', 'here is', 'tu imagen editada', 'your edited image',
      'imagen generada', 'generated image', 'resultado', 'result',
      '🎨', '✅', '❌', 'completado', 'completed', 'listo', 'ready',
      'diseño generado', 'design generated'
    ];
    
    const isNotPrompt = notPromptPhrases.some(phrase => 
      content.toLowerCase().includes(phrase)
    );
    
    if (isNotPrompt) {
      return false;
    }
    
    // If it's a short phrase (likely a modification prompt), show buttons
    const isShortPhrase = content.trim().length > 5 && content.trim().length < 200;
    
    // Check for technical prompt patterns (especially Gemini responses)
    const technicalPromptPatterns = [
      // Gemini generated technical prompts (key indicators)
      'maintaining', 'manteniendo',
      'change the', 'cambiar el', 'cambiar la',
      'add ', 'remove ', 'transform to', 'turn the',
      'rotate ', 'replace ', 'girar ', 'rotar ',
      ', maintaining', ', manteniendo',
      // Standard modification patterns
      'add', 'remove', 'change', 'with', 'make', 'convert',
      'transform', 'edit', 'modify', 'apply', 'generate',
      'increase', 'decrease', 'enhance', 'improve',
      // Spanish  
      'en ', 'con ', 'sin ', 'hacer', 'poner', 'quitar',
      'cambiar', 'convertir', 'transformar', 'aplicar',
      'que se vea', 'mas ', 'más ', 'realista', 'detallado',
      'agregar', 'eliminar', 'mejorar', 'aumentar',
      // Colors and styles
      'blanco', 'negro', 'color', 'estilo', 'fondo',
      'black', 'white', 'style', 'background'
    ];
    
    const hasModification = technicalPromptPatterns.some(pattern => 
      content.toLowerCase().includes(pattern)
    );
    
    // Debug logging
    console.log('isPromptMessage check:', {
      content: content.substring(0, 50),
      isShortPhrase,
      hasModification,
      isNotPrompt,
      result: !isNotPrompt && (isShortPhrase || hasModification)
    });
    
    return isShortPhrase || hasModification;
  };



  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating button with tooltip - solo si no está embedded */}
      {!embedded && !isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          {showTooltip && (
            <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-black text-white text-sm rounded-lg whitespace-nowrap">
              {language === 'es' 
                ? '¡Hola! Soy tu asistente de diseño'
                : 'Hi! I\'m your design assistant'}
              <div className="absolute bottom-0 right-6 transform translate-y-1/2 rotate-45 w-2 h-2 bg-black"></div>
            </div>
          )}
          <Button
            onClick={() => setIsOpen(true)}
            size="lg"
            className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200 bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-600"
            data-testid="button-open-chat"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className={embedded 
          ? `w-full bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl flex flex-col transition-all duration-300 ${
              storedImage ? 'h-[700px]' : 'h-[500px]'
            }`
          : "fixed bottom-0 right-0 w-full md:w-96 h-[600px] bg-background border-l border-t rounded-tl-xl shadow-xl z-50 flex flex-col"
        }>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-zinc-900">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-white" />
              <h3 className="font-semibold text-white">
                InkVision <span className="text-sm text-zinc-400 font-normal">- Asistente IA</span>
              </h3>
            </div>
            {!embedded && (
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="icon"
                className="rounded-full"
                data-testid="button-close-chat"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`relative max-w-[85%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {msg.image && (
                    <>
                      <Dialog>
                        <DialogTrigger asChild>
                          <img 
                            src={msg.image} 
                            alt="Generated" 
                            className="max-w-full h-auto rounded mb-2 max-h-40 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                            data-testid={`img-chat-${msg.id}`}
                          />
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] p-2">
                          <div className="relative">
                            <img
                              src={msg.image}
                              alt="Full size image"
                              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                      {/* Action buttons below the image */}
                      {msg.role === 'assistant' && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white border-0"
                            onClick={() => handleUseAsReference(msg.image!)}
                            data-testid={`button-edit-chat-${msg.id}`}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-zinc-600 hover:bg-zinc-800"
                            onClick={() => downloadImage(msg.image!, `inkvision-${msg.id}.png`)}
                            data-testid={`button-download-chat-${msg.id}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                  <p className={`text-sm whitespace-pre-wrap ${msg.isAnalyzing ? 'animate-pulse' : ''}`}>
                    {msg.content}
                  </p>
                  {msg.role === 'assistant' && msg.content && !msg.isAnalyzing && isPromptMessage(msg.content) && (
                    <div className="mt-3 flex gap-2 justify-end items-center">
                      <Button
                        onClick={() => copyMessage(msg.content)}
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-xs"
                        data-testid={`button-copy-message-${msg.id}`}
                        disabled={isGeneratingImage}
                      >
                        Copiar
                      </Button>
                      <Button
                        onClick={() => applyPrompt(msg.content)}
                        variant="default"
                        size="sm"
                        className="h-7 px-3 rounded-lg bg-white text-black hover:bg-gray-100 text-xs font-medium"
                        data-testid={`button-apply-message-${msg.id}`}
                        disabled={isGeneratingImage || !storedImage}
                      >
                        {language === 'es' ? 'Generar' : 'Generate'}
                      </Button>
                      {isGeneratingImage && (
                        <div className="flex items-center gap-1 text-xs text-white bg-zinc-800 px-2 py-1 rounded-lg">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>{language === 'es' ? 'Generando...' : 'Generating...'}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Indicador de typing cuando el asistente está escribiendo */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-3 max-w-[85%]">
                  <div className="flex items-center gap-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-xs text-zinc-500 ml-2">
                      {language === 'es' ? 'InkVision está escribiendo...' : 'InkVision is typing...'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input area con drag & drop */}
          <div 
            className={`border-t p-4 ${isDragOver ? 'bg-zinc-800/50 border-zinc-400' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Drag overlay */}
            {isDragOver && (
              <div className="absolute inset-0 bg-zinc-800/80 border-2 border-dashed border-zinc-400 rounded-lg flex items-center justify-center z-10">
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-zinc-400" />
                  <p className="text-sm text-zinc-400">
                    {language === 'es' ? 'Suelta la imagen aquí' : 'Drop image here'}
                  </p>
                </div>
              </div>
            )}
            
            {/* Imagen miniatura - movida arriba */}
            {storedImage && (
              <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                <img 
                  src={storedImage} 
                  alt="Loaded image"
                  className="h-8 w-8 object-cover rounded border border-zinc-700"
                />
                <span>{language === 'es' ? 'Imagen cargada' : 'Image loaded'}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStoredImage("");
                    if (onImageUpload) {
                      // Clear the parent state as well
                      const emptyFile = new File([""], "empty.png", { type: "image/png" });
                      onImageUpload("", emptyFile);
                    }
                  }}
                  className="h-6 w-6 p-0 hover:bg-zinc-800"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            {/* Full width container */}
            <div className="space-y-2">
              {/* Textarea with send button only */}
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={language === 'es' 
                    ? "Describe los cambios o arrastra una imagen..."
                    : "Describe changes or drag an image..."}
                  className="w-full min-h-[60px] max-h-[120px] resize-none border border-zinc-600 bg-zinc-800/70 focus:border-zinc-400 focus:bg-zinc-800 transition-colors pr-12"
                  disabled={isLoading}
                  data-testid="textarea-chat-input"
                />
                
                {/* Send button positioned absolutely on the right */}
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="absolute right-2 bottom-2 h-8 w-8 p-0"
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Options chips/badges */}
              <div className="flex flex-wrap gap-2 items-center">
                {/* Upload button first */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-1.5 h-8"
                  data-testid="button-upload-image"
                >
                  <ImageIcon className="h-4 w-4" />
                  <span className="text-sm">
                    {language === 'es' ? 'Cargar imagen' : 'Upload image'}
                  </span>
                </Button>
                
                {/* Model Selection Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 flex items-center justify-center"
                      data-testid="button-model-dropdown"
                    >
                      <Bot className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-40">
                    <DropdownMenuItem 
                      onClick={() => onModelChange?.("pro")}
                      className={modelVariant === "pro" ? "bg-zinc-800" : ""}
                    >
                      Kontext Pro
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onModelChange?.("qwen")}
                      className={modelVariant === "qwen" ? "bg-zinc-800" : ""}
                    >
                      Qwen Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* Aspect Ratio Selection Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 flex items-center justify-center"
                      data-testid="button-aspect-dropdown"
                    >
                      <Square className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-40">
                    {/* Show different options based on model */}
                    {(modelVariant === "qwen" ? 
                      ["Match Input", "1:1", "16:9", "9:16", "4:3", "3:4"] : 
                      ["Match Input", "1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "4:5", "5:4", "21:9", "9:21", "2:1", "1:2"]
                    ).map((ratio) => (
                      <DropdownMenuItem 
                        key={ratio}
                        onClick={() => onAspectRatioChange?.(ratio)}
                        className={aspectRatio === ratio ? "bg-zinc-800" : ""}
                      >
                        {ratio}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      )}
    </>
  );
});

ChatAssistant.displayName = "ChatAssistant";

export default ChatAssistant;