import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import ImageUpload from "./ImageUpload";
import { sendChatMessage, editImage } from "@/lib/chat-api";
import type { Message } from "@/types/chat";

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{
    file: File;
    preview: string;
    base64: string;
  } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: sendChatMessage,
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: data.text,
        timestamp: new Date()
      }]);
    },
    onError: (error) => {
      toast({
        title: "Chat Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive"
      });
    }
  });

  // Helper function to convert base64 to File
  const base64ToFile = async (base64: string, filename: string = "edited-image.png"): Promise<File> => {
    const response = await fetch(`data:image/png;base64,${base64}`);
    const blob = await response.blob();
    return new File([blob], filename, { type: "image/png" });
  };

  const imageMutation = useMutation({
    mutationFn: editImage,
    onSuccess: async (data) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: "He editado tu imagen. Puedes seguir editándola con nuevas instrucciones:",
        timestamp: new Date(),
        editedImage: {
          dataBase64: data.dataBase64,
          mimeType: data.mimeType
        }
      }]);

      // Convert the edited image back to uploadedImage for further editing
      try {
        const editedFile = await base64ToFile(data.dataBase64, "edited-image.png");
        const editedPreview = URL.createObjectURL(editedFile);
        
        setUploadedImage({
          file: editedFile,
          preview: editedPreview,
          base64: data.dataBase64
        });
      } catch (error) {
        console.error("Error converting edited image:", error);
      }
    },
    onError: (error) => {
      toast({
        title: "Image Edit Error",
        description: error instanceof Error ? error.message : "Failed to edit image",
        variant: "destructive"
      });
    }
  });

  const handleSendMessage = async () => {
    const message = inputValue.trim();
    if (!message && !uploadedImage) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message || "Please edit this image",
      timestamp: new Date(),
      image: uploadedImage ? {
        file: uploadedImage.file,
        preview: uploadedImage.preview
      } : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      if (uploadedImage && message) {
        // Image editing request
        await imageMutation.mutateAsync({
          prompt: message,
          imageBase64: uploadedImage.base64,
          mimeType: uploadedImage.file.type as any
        });
        // Keep the image for further editing, don't clear it
      } else if (message) {
        // Regular chat request
        await chatMutation.mutateAsync({
          messages: [{ role: "user", content: message }]
        });
      }
    } catch (error) {
      // Error handling is done in mutation onError
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
    // Auto-resize
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px';
  };

  const isLoading = chatMutation.isPending || imageMutation.isPending;

  return (
    <main className="flex-1 overflow-hidden flex flex-col">
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6" data-testid="messages-container">
        {messages.length === 0 && (
          <div className="flex justify-center mb-8">
            <div className="bg-muted rounded-xl p-6 max-w-md text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold mb-2">Welcome to Gemini Chat</h2>
              <p className="text-muted-foreground text-sm">Start a conversation or upload an image to edit. I can help you with text conversations and advanced image editing.</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Image Upload Area */}
      {showImageUpload && !uploadedImage && (
        <ImageUpload 
          onImageSelect={setUploadedImage}
          uploadedImage={uploadedImage}
          onClose={() => setShowImageUpload(false)}
        />
      )}

      {/* Chat Input */}
      <div className="border-t border-border bg-card px-4 py-4">
        <div className="flex items-end space-x-3 max-w-4xl mx-auto">
          {/* Image Upload Button or Thumbnail */}
          {uploadedImage ? (
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="relative group">
                <img 
                  src={uploadedImage.preview} 
                  alt="Imagen cargada"
                  className="w-12 h-12 rounded-lg object-cover border border-border"
                  data-testid="img-thumbnail"
                />
                <button
                  onClick={() => {
                    if (uploadedImage) {
                      URL.revokeObjectURL(uploadedImage.preview);
                    }
                    setUploadedImage(null);
                    setShowImageUpload(false);
                  }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                  data-testid="button-remove-thumbnail"
                >
                  ×
                </button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowImageUpload(!showImageUpload)}
              className="flex-shrink-0"
              data-testid="button-image-upload"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </Button>
          )}
          
          {/* Message Input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message or describe how you'd like to edit an image..."
              className="min-h-[44px] max-h-32 resize-none"
              data-testid="input-message"
            />
          </div>
          
          {/* Send Button */}
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || (!inputValue.trim() && !uploadedImage)}
            className="flex-shrink-0"
            data-testid="button-send"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </div>
      </div>
    </main>
  );
}
