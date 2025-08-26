export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  image?: {
    file: File;
    preview: string;
  };
  editedImage?: {
    dataBase64: string;
    mimeType: string;
  };
}
