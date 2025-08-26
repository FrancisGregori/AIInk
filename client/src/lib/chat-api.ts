import { apiRequest } from "./queryClient";

export interface ChatMessage {
  role: string;
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
}

export interface ChatResponse {
  text: string;
}

export interface ImageEditRequest {
  prompt: string;
  imageBase64?: string;
  mimeType?: "image/jpeg" | "image/png" | "image/webp" | "image/heic" | "image/heif";
  fileUri?: string;
}

export interface ImageEditResponse {
  mimeType: string;
  dataBase64: string;
}

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await apiRequest("POST", "/api/chat", request);
  return response.json();
}

export async function editImage(request: ImageEditRequest): Promise<ImageEditResponse> {
  const response = await apiRequest("POST", "/api/edit-image", request);
  return response.json();
}