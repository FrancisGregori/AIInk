import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { chatWithGemini, editImageWithGemini } from "./gemini";

// Request schemas
const chatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.string(),
    content: z.string()
  }))
});

const editImageRequestSchema = z.object({
  prompt: z.string(),
  imageBase64: z.string().optional(),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]).optional(),
  fileUri: z.string().optional()
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/healthz", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = chatRequestSchema.parse(req.body);
      
      if (!messages || messages.length === 0) {
        return res.status(400).json({ 
          error: "Messages array is required and cannot be empty" 
        });
      }

      const latestMessage = messages[messages.length - 1];
      if (!latestMessage.content) {
        return res.status(400).json({ 
          error: "Message content is required" 
        });
      }

      const response = await chatWithGemini(latestMessage.content);
      
      res.json({ text: response });
    } catch (error) {
      console.error("Chat error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request format", 
          details: error.errors 
        });
      }
      
      res.status(500).json({ 
        error: "Failed to process chat request",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Image editing endpoint
  app.post("/api/edit-image", async (req, res) => {
    try {
      const { prompt, imageBase64, mimeType, fileUri } = editImageRequestSchema.parse(req.body);
      
      if (!prompt) {
        return res.status(400).json({ 
          error: "Prompt is required" 
        });
      }

      // Validate that either imageBase64 or fileUri is provided
      if (!imageBase64 && !fileUri) {
        return res.status(400).json({ 
          error: "Either imageBase64 or fileUri must be provided" 
        });
      }

      // Validate imageBase64 format if provided
      if (imageBase64) {
        if (!mimeType) {
          return res.status(400).json({ 
            error: "mimeType is required when using imageBase64" 
          });
        }

        // Basic base64 validation
        try {
          const buffer = Buffer.from(imageBase64, 'base64');
          if (buffer.length > 25 * 1024 * 1024) { // 25MB limit
            return res.status(400).json({ 
              error: "Image size exceeds 25MB limit" 
            });
          }
        } catch {
          return res.status(400).json({ 
            error: "Invalid base64 image data" 
          });
        }
      }

      const response = await editImageWithGemini(prompt, imageBase64, mimeType, fileUri);
      
      res.json(response);
    } catch (error) {
      console.error("Image edit error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request format", 
          details: error.errors 
        });
      }
      
      res.status(500).json({ 
        error: "Failed to process image edit request",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
