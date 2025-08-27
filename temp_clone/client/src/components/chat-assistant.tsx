import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { MessageCircle, X, Send, Copy, Image, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

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
}

export interface ChatAssistantRef {
  open: () => void;
}

const ChatAssistant = forwardRef<ChatAssistantRef, ChatAssistantProps>(({ currentImage, onApplyPrompt }, ref) => {
  const { language } = useLanguage();
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
      
      // Remove analyzing message and show error
      setMessages(prev => prev.filter(msg => msg.id !== `analyzing-${Date.now()}`));
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: language === 'es'
          ? 'Lo siento, no pude analizar la imagen. Por favor, intenta de nuevo.'
          : 'Sorry, I couldn\'t analyze the image. Please try again.',
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
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: language === 'es' ? "Error" : "Error",
        description: language === 'es' ? "No se pudo enviar el mensaje" : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: language === 'es' ? "Copiado" : "Copied",
      description: language === 'es' ? "Prompt copiado al portapapeles" : "Prompt copied to clipboard",
    });
  };

  const applyPrompt = (text: string) => {
    onApplyPrompt(text);
    
    // Scroll to generation area or latest generation
    setTimeout(() => {
      // First try to scroll to generation area (if generating)
      const generationArea = document.getElementById('generation-area');
      if (generationArea) {
        generationArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // If not generating, scroll to latest generation
        const latestGeneration = document.getElementById('latest-generation');
        if (latestGeneration) {
          latestGeneration.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 100);
    
    toast({
      title: language === 'es' ? "Aplicado" : "Applied",
      description: language === 'es' ? "Prompt aplicado al campo principal" : "Prompt applied to main field",
    });
  };

  const isPromptMessage = (content: string) => {
    // Check if message looks like a technical prompt (in English, contains specific keywords)
    const promptIndicators = [
      'photo of', 'portrait of', 'view of', 'shot of',
      'looking', 'wearing', 'standing', 'sitting',
      'professional photography', 'high resolution',
      'change', 'add', 'remove', 'replace', 'transform',
      'maintaining', 'keeping', 'preserving'
    ];
    
    const lowerContent = content.toLowerCase();
    return promptIndicators.some(indicator => lowerContent.includes(indicator));
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          {/* Animated Tooltip */}
          {showTooltip && (
            <div className="absolute bottom-full mb-2 right-0 animate-fade-in-up">
              <div className="bg-card text-foreground px-4 py-2 rounded-lg shadow-xl border border-border relative">
                <div className="absolute bottom-0 right-8 transform translate-y-full">
                  <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-border"></div>
                </div>
                <p className="text-sm font-medium whitespace-nowrap">
                  {language === 'es' ? '¿Necesitas ayuda con tu prompt?' : 'Need help with your prompt?'}
                </p>
              </div>
            </div>
          )}
          
          {/* Main Button */}
          <button
            onClick={() => setIsOpen(true)}
            className="relative overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-4 py-2 shadow-2xl transition-all hover:scale-105 group flex items-center gap-2 animate-pulse-soft"
            title={language === 'es' ? 'Asistente IA de Diseño' : 'AI Design Assistant'}
          >
            {/* Shimmer overlay */}
            <div className="absolute inset-0 animate-shimmer"></div>
            
            {/* Button content */}
            <div className="relative flex items-center gap-2">
              <div className="relative">
                <MessageCircle className="h-5 w-5" />
                <Sparkles className="h-2.5 w-2.5 absolute -top-0.5 -right-0.5 text-yellow-400 animate-sparkle" />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-semibold text-sm">InkVision</span>
                <span className="text-[10px] opacity-90">
                  {language === 'es' ? 'Asistente IA de Diseño' : 'AI Design Assistant'}
                </span>
              </div>
            </div>
            
            {/* Hover tooltip */}
            <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-card text-foreground px-3 py-1 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-border pointer-events-none">
              {language === 'es' ? 'Crea prompts profesionales' : 'Create professional prompts'}
            </span>
          </button>
        </div>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-card border-2 border-white/80 rounded-xl shadow-2xl flex flex-col ring-4 ring-white/10">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card"></div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">InkVision</h3>
                <p className="text-xs text-muted-foreground">
                  {language === 'es' ? 'Tu experto en tatuajes' : 'Your tattoo expert'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="hover:bg-destructive/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {message.image && (
                        <div className="mb-2">
                          <img 
                            src={message.image} 
                            alt="Uploaded" 
                            className="w-full max-w-[200px] h-auto rounded border border-border/50"
                          />
                        </div>
                      )}
                      {message.isAnalyzing ? (
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap animate-pulse">{message.content}</p>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                    {message.role === 'assistant' && isPromptMessage(message.content) && (
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(message.content)}
                          className="text-xs"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          {language === 'es' ? 'Copiar' : 'Copy'}
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => applyPrompt(message.content)}
                          className="text-xs"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          {language === 'es' ? 'Aplicar' : 'Apply'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce delay-100"></span>
                      <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce delay-200"></span>
                    </div>
                  </div>
                </div>
              )}
              {/* Invisible element for scrolling */}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Current Image Indicator with Preview - Compact Version */}
          {currentImage && (
            <div className="px-4 py-2 border-t border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <img 
                    src={currentImage} 
                    alt="Reference" 
                    className="w-10 h-10 object-cover rounded border border-border/50"
                  />
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-medium text-foreground/80">
                    {language === 'es' ? 'Imagen activa' : 'Active image'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {language === 'es' ? 'Lista para analizar' : 'Ready to analyze'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Input Area - Compact */}
          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  language === 'es' 
                    ? currentImage ? "Describe qué cambios quieres..." : "Escribe tu mensaje..."
                    : currentImage ? "Describe what changes you want..." : "Type your message..."
                }
                className="flex-1 resize-none h-16 text-sm"
                disabled={isLoading}
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="icon"
                className="self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

ChatAssistant.displayName = 'ChatAssistant';

export default ChatAssistant;