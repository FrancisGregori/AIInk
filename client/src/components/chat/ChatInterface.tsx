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

      {/* Upload Image Preview */}
      {showImageUpload && (
        <ImageUpload
          onImageSelect={(file, preview, base64) => {
            setUploadedImage({ file, preview, base64 });
            setShowImageUpload(false);
          }}
          onClose={() => setShowImageUpload(false)}
        />
      )}

      {/* Uploaded Image Preview */}
      {uploadedImage && (
        <div className="px-4 pb-2">
          <div className="relative inline-block">
            <img 
              src={uploadedImage.preview} 
              alt="Uploaded"
              className="h-20 rounded-lg border border-border"
              data-testid="img-preview"
            />
            <button
              onClick={() => setUploadedImage(null)}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center hover:bg-destructive/90"
              data-testid="button-remove-image"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-border px-4 py-4 bg-card">
        <div className="flex items-end space-x-2">
          {/* Image Upload Button */}
          <button
            onClick={() => setShowImageUpload(true)}
            className="mb-1 p-2 hover:bg-accent rounded-lg transition-colors"
            data-testid="button-upload-image"
          >
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Message Input */}
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={uploadedImage ? "Describe how to edit the image..." : "Type a message..."}
              className="resize-none max-h-32"
              rows={1}
              disabled={isLoading}
              data-testid="input-message"
            />
          </div>

          {/* Send Button */}
          <Button 
            onClick={handleSendMessage} 
            disabled={isLoading || (!inputValue.trim() && !uploadedImage)}
            className="mb-1"
            data-testid="button-send"
          >
            {isLoading ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </Button>
        </div>
      </div>
    </main>
  );
}