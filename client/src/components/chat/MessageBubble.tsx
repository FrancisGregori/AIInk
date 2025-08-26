import { Button } from "@/components/ui/button";
import type { Message } from "@/types/chat";

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  const downloadImage = (dataBase64: string, filename: string = "edited-image.png") => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${dataBase64}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isUser) {
    return (
      <div className="flex justify-end fade-in" data-testid={`message-user-${message.id}`}>
        <div className="bg-primary text-primary-foreground rounded-2xl px-4 py-3 max-w-xs md:max-w-md lg:max-w-lg">
          <p className="text-sm">{message.content}</p>
          {message.image && (
            <div className="mt-3 rounded-lg overflow-hidden border border-primary-foreground/20">
              <img 
                src={message.image.preview} 
                alt="Uploaded image" 
                className="w-full h-auto"
                data-testid={`img-user-upload-${message.id}`}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start fade-in" data-testid={`message-assistant-${message.id}`}>
      <div className="flex items-start space-x-3 max-w-xs md:max-w-md lg:max-w-lg">
        <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-accent-foreground" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832L14 10.202a1 1 0 000-1.732l-4.445-2.832z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="bg-card border border-border rounded-2xl px-4 py-3">
          <p className="text-sm mb-3">{message.content}</p>
          
          {message.editedImage && (
            <div className="relative rounded-lg overflow-hidden border border-border group">
              <img 
                src={`data:${message.editedImage.mimeType};base64,${message.editedImage.dataBase64}`}
                alt="Edited image" 
                className="w-full h-auto"
                data-testid={`img-edited-${message.id}`}
              />
              
              {/* Download overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  onClick={() => downloadImage(message.editedImage!.dataBase64)}
                  className="bg-white text-black hover:bg-gray-100"
                  size="sm"
                  data-testid={`button-download-${message.id}`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}