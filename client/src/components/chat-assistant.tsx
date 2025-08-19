import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { MessageCircle, X, Send, Copy, Image, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
}

export interface ChatAssistantRef {
  open: () => void;
}

const ChatAssistant = forwardRef<ChatAssistantRef, ChatAssistantProps>(({ currentImage, onApplyPrompt, language = "es" }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastImageAnalyzed, setLastImageAnalyzed] = useState<string>("");
  const [storedImage, setStoredImage] = useState<string>("");
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Function to scroll to bottom - using scrollIntoView for reliability
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto", block: "end" });
    }
  };
  
  // Expose open method via ref
  useImperativeHandle(ref, () => ({
    open: () => {
      setIsOpen(true);
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
    // Use scrollToBottom function with slight delay for DOM update
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  }, [messages, isOpen]);

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
    if (!storedImage) {
      console.log('No image to analyze');
      return;
    }
    
    console.log('Analyzing image, storedImage:', storedImage ? 'exists' : 'null');
    console.log('Image data length:', storedImage?.length || 0);
    
    // Don't set isLoading to true here to allow immediate typing
    // Only show loading indicator in the messages area
    
    // Add user message with the image
    const imageMessage: Message = {
      id: `image-${Date.now()}`,
      role: 'user',
      content: language === 'es' 
        ? 'He subido esta imagen para análisis'
        : 'I uploaded this image for analysis',
      image: storedImage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, imageMessage]);
    
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
      
      // After analysis is complete, add the follow-up question
      const followUpMessage: Message = {
        id: `followup-${Date.now()}`,
        role: 'assistant',
        content: language === 'es'
          ? '¿Qué te gustaría cambiar o modificar en esta imagen?'
          : 'What would you like to change or modify in this image?',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, followUpMessage]);
      
    } catch (error) {
      console.error('Image analysis error:', error);
      
      // Remove analyzing message
      setMessages(prev => prev.filter(msg => msg.id !== analyzingMessage.id));
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: language === 'es'
          ? '❌ Error al analizar la imagen. Por favor verifica que la API key de Gemini esté configurada correctamente.'
          : '❌ Error analyzing image. Please verify that the Gemini API key is configured correctly.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const sendMessage = async () => {
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
      
      // Check if the response contains a technical prompt
      const lastAssistantMessage = messages[messages.length - 1];
      if (lastAssistantMessage && 
          lastAssistantMessage.role === 'assistant' &&
          (lastAssistantMessage.content.includes('maintaining') || 
           lastAssistantMessage.content.includes('Change') ||
           lastAssistantMessage.content.includes('Add') ||
           lastAssistantMessage.content.includes('Remove'))) {
        // Auto-apply the prompt if it looks like a technical prompt
        setTimeout(() => {
          onApplyPrompt(lastAssistantMessage.content);
          toast({
            title: language === 'es' ? "Prompt aplicado" : "Prompt applied",
            description: language === 'es' 
              ? "El prompt se ha aplicado al campo de edición"
              : "The prompt has been applied to the edit field"
          });
        }, 500);
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: language === 'es'
          ? '❌ Error al procesar el mensaje. Verifica la configuración de la API.'
          : '❌ Error processing message. Please check API configuration.',
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

  // Generate technical prompt based on user input
  const generateTechnicalPrompt = (input: string, lang: "es" | "en"): string => {
    const lowerInput = input.toLowerCase();
    
    // Common transformations mapping
    if (lowerInput.includes('frente') || lowerInput.includes('front')) {
      return "Change to front facing view, maintaining composition and style";
    }
    if (lowerInput.includes('color') || lowerInput.includes('colorear')) {
      return "Add vibrant colors, maintaining original composition";
    }
    if (lowerInput.includes('sonri') || lowerInput.includes('smil')) {
      return "Add smiling expression, maintaining pose and style";
    }
    if (lowerInput.includes('quitar fondo') || lowerInput.includes('remove background')) {
      return "Remove background, maintaining subject with transparent background";
    }
    if (lowerInput.includes('realista') || lowerInput.includes('realistic')) {
      return "Change to photorealistic style, maintaining composition";
    }
    if (lowerInput.includes('geometr') || lowerInput.includes('geometric')) {
      return "Change to geometric style with clean lines, maintaining composition";
    }
    if (lowerInput.includes('acuarela') || lowerInput.includes('watercolor')) {
      return "Change to watercolor painting style, maintaining composition";
    }
    
    // Default technical prompt for modifications
    return `Modify image based on: ${input}, maintaining overall composition and quality`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating button with tooltip */}
      {!isOpen && (
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
            className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            data-testid="button-open-chat"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 w-full md:w-96 h-[600px] bg-background border-l border-t rounded-tl-xl shadow-xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600/10 to-pink-600/10">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold">InkVision</h3>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="icon"
              className="rounded-full"
              data-testid="button-close-chat"
            >
              <X className="h-4 w-4" />
            </Button>
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
                    <img 
                      src={msg.image} 
                      alt="Uploaded" 
                      className="max-w-full h-auto rounded mb-2 max-h-40 object-contain"
                    />
                  )}
                  <p className={`text-sm whitespace-pre-wrap ${msg.isAnalyzing ? 'animate-pulse' : ''}`}>
                    {msg.content}
                  </p>
                  {msg.role === 'assistant' && msg.content && !msg.isAnalyzing && (
                    <Button
                      onClick={() => copyMessage(msg.content)}
                      variant="ghost"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background shadow-md"
                      data-testid={`button-copy-message-${msg.id}`}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={language === 'es' 
                  ? "¿Qué cambios quieres hacer?"
                  : "What changes would you like to make?"}
                className="flex-1 min-h-[60px] max-h-[120px] resize-none"
                disabled={isLoading}
                data-testid="textarea-chat-input"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="self-end"
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {storedImage && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Image className="h-3 w-3" />
                <span>{language === 'es' ? 'Imagen cargada' : 'Image loaded'}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
});

ChatAssistant.displayName = "ChatAssistant";

export default ChatAssistant;