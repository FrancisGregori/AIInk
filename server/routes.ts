import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { summarizeArticle, analyzeSentiment, analyzeImage, analyzeImageForTattoo, inkVisionChat, streamChatResponseGemini } from "./gemini";
import { insertStencilJobSchema, insertFluxProjectSchema, insertGeminiChatSchema } from "@shared/schema";
import ComfyDeployService from "./comfydeploy";
import { ObjectStorageService } from "./objectStorage";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize services
  const comfyDeploy = new ComfyDeployService();
  const objectStorageService = new ObjectStorageService();
  
  // Serve public objects from object storage
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      await objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error serving public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Stencil Tool Routes
  
  // Get available stencil styles
  app.get("/api/stencil/styles", async (req, res) => {
    try {
      const styles = await storage.getStencilStyles();
      res.json(styles);
    } catch (error) {
      console.error("Error fetching stencil styles:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create a new stencil job
  app.post("/api/stencil/jobs", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const { style = "steven", quality = 90, transparentBg = false } = req.body;
      
      // For now, use a placeholder URL for the uploaded image
      // In production, this would upload to Supabase Storage
      const originalImageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      
      // Create the stencil job
      const job = await storage.createStencilJob({
        userId: "demo-user", // In production, get from auth session
        originalImageUrl,
        style,
        processingOptions: {
          quality: parseInt(quality),
          transparentBg: transparentBg === 'true',
        },
      });

      res.json(job);
    } catch (error) {
      console.error("Error creating stencil job:", error);
      res.status(500).json({ error: "Error processing image" });
    }
  });

  // Get stencil job status
  app.get("/api/stencil/jobs/:id", async (req, res) => {
    try {
      const job = await storage.getStencilJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      // If job has a ComfyDeploy run ID and is still processing, check status
      if (job.comfyDeployRunId && job.status === "processing") {
        try {
          const status = await comfyDeploy.checkRunStatus(job.comfyDeployRunId);
          
          console.log("Polling result for job", job.id, "ComfyDeploy run:", job.comfyDeployRunId);
          console.log("Status from ComfyDeploy:", {
            status: status.status,
            outputUrl: status.outputUrl,
            error: status.error
          });
          
          // Update job based on ComfyDeploy status
          if (status.status === "completed" && status.outputUrl) {
            console.log("Job completed! Updating with URL:", status.outputUrl);
            await storage.updateStencilJob(job.id, {
              status: "completed",
              processedImageUrl: status.outputUrl,
              completedAt: new Date(),
            });
          } else if (status.status === "failed") {
            console.log("Job failed:", status.error);
            await storage.updateStencilJob(job.id, {
              status: "failed",
              errorMessage: status.error || "Processing failed",
            });
          } else {
            console.log("Job still processing, status:", status.status);
          }
          
          // Return the updated job
          const updatedJob = await storage.getStencilJob(req.params.id);
          console.log("Returning updated job:", updatedJob);
          return res.json(updatedJob);
        } catch (error) {
          console.error("Error checking ComfyDeploy status:", error);
          // Return job as-is if we can't check status
        }
      }
      
      res.json(job);
    } catch (error) {
      console.error("Error fetching stencil job:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get user's stencil jobs
  app.get("/api/stencil/jobs", async (req, res) => {
    try {
      const userId = "demo-user"; // In production, get from auth session
      const jobs = await storage.getStencilJobs(userId);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching stencil jobs:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get gallery stencils
  app.get("/api/stencil/gallery", async (req, res) => {
    try {
      const userId = "demo-user"; // In production, get from auth session or null for public
      const limit = parseInt(req.query.limit as string) || 20;
      const stencils = await storage.getGalleryStencils(userId, limit);
      res.json(stencils);
    } catch (error) {
      console.error("Error fetching gallery:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Process stencil with ComfyDeploy
  app.post("/api/stencil/process", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const { style = "steven", userId = "demo-user", processingOptions } = req.body;
      
      // Parse processing options if it's a string
      let options = processingOptions;
      if (typeof processingOptions === 'string') {
        try {
          options = JSON.parse(processingOptions);
        } catch {
          options = {};
        }
      }

      // Upload image to object storage and get public URL
      let publicImageUrl;
      try {
        // Generate unique filename
        const timestamp = Date.now();
        const filename = `stencil-${timestamp}-${req.file.originalname || 'image.png'}`;
        
        // Upload to object storage
        const objectPath = `/replit-objstore-12f3cfa6-c32d-4020-8906-8c1a7e0f108b/public/${filename}`;
        const objectStorageService = new ObjectStorageService();
        
        // Save the file to object storage
        await objectStorageService.uploadPublicFile(req.file.buffer, filename);
        
        // Create public URL for the image
        publicImageUrl = `https://${req.get('host')}/public-objects/${filename}`;
        console.log("Image uploaded to object storage:", publicImageUrl);
      } catch (uploadError) {
        console.error("Error uploading to object storage:", uploadError);
        return res.status(500).json({ error: "Failed to upload image" });
      }
      
      // Create the stencil job
      const job = await storage.createStencilJob({
        userId,
        originalImageUrl: publicImageUrl,
        style,
        processingOptions: options,
      });

      // Start processing with ComfyDeploy
      try {
        const result = await comfyDeploy.processImage(
          publicImageUrl,
          style as any,
          options
        );
        
        // Update job with ComfyDeploy run ID
        await storage.updateStencilJob(job.id, {
          comfyDeployRunId: result.runId,
          status: result.status,
          processedImageUrl: result.outputUrl,
        });

        // Return updated job
        const updatedJob = await storage.getStencilJob(job.id);
        res.json(updatedJob);
      } catch (processError) {
        // If ComfyDeploy fails, return the job with error status
        await storage.updateStencilJob(job.id, {
          status: "failed",
          errorMessage: String(processError),
        });
        
        const updatedJob = await storage.getStencilJob(job.id);
        res.json(updatedJob);
      }
    } catch (error) {
      console.error("Error processing stencil:", error);
      res.status(500).json({ error: "Error processing image" });
    }
  });

  // Flux Kontext Routes
  app.get("/api/flux/projects", async (req, res) => {
    try {
      const projects = await storage.getFluxProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching flux projects:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/flux/create", async (req, res) => {
    try {
      const validation = insertFluxProjectSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid project data", details: validation.error });
      }

      const project = await storage.createFluxProject(validation.data);
      res.json(project);
    } catch (error) {
      console.error("Error creating flux project:", error);
      res.status(500).json({ error: "Error creating project" });
    }
  });

  app.patch("/api/flux/projects/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const project = await storage.updateFluxProject(id, req.body);
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      res.json(project);
    } catch (error) {
      console.error("Error updating flux project:", error);
      res.status(500).json({ error: "Error updating project" });
    }
  });

  app.post("/api/flux/projects/:id/regenerate", async (req, res) => {
    try {
      const { id } = req.params;
      const project = await storage.regenerateFluxProject(id);
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      res.json(project);
    } catch (error) {
      console.error("Error regenerating flux project:", error);
      res.status(500).json({ error: "Error regenerating project" });
    }
  });

  // Gemini Chat Routes
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, context } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Use Gemini to generate response
      const response = await summarizeArticle(message + (context ? `\n\nContext: ${context}` : ''));
      
      // Save chat message
      await storage.saveGeminiChat({
        userId: "demo-user", // In production, get from auth session
        message,
        response,
        role: 'assistant',
      });

      res.json({ response });
    } catch (error) {
      console.error("Error in Gemini chat:", error);
      res.status(500).json({ error: "Error communicating with Gemini" });
    }
  });

  // Image analysis endpoint using Gemini
  app.post("/api/gemini/analyze-image", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Save image temporarily for analysis
      const tempPath = `/tmp/${Date.now()}-${req.file.originalname}`;
      require('fs').writeFileSync(tempPath, req.file.buffer);

      try {
        const analysis = await analyzeImage(tempPath);
        res.json({ analysis });
      } finally {
        // Clean up temporary file
        require('fs').unlinkSync(tempPath);
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
      res.status(500).json({ error: "Error analyzing image" });
    }
  });

  // InkVision API Routes for Design Editor
  
  // Analyze image for tattoo design suggestions
  app.post("/api/inkvision/analyze", async (req, res) => {
    try {
      const { imageBase64, language = "es" } = req.body;
      
      if (!imageBase64) {
        return res.status(400).json({ error: "No image data provided" });
      }

      const result = await analyzeImageForTattoo(imageBase64, language);
      res.json(result);
    } catch (error) {
      console.error("Error in InkVision analysis:", error);
      const { language = "es" } = req.body;
      res.status(500).json({ 
        error: "Error analyzing image",
        analysis: language === "es" 
          ? "No pude analizar la imagen. Por favor intenta con otra."
          : "Could not analyze the image. Please try another one.",
        suggestions: [],
        styles: []
      });
    }
  });

  // InkVision chat endpoint
  app.post("/api/inkvision/chat", async (req, res) => {
    try {
      const { message, context = "", language = "es" } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "No message provided" });
      }

      const result = await inkVisionChat(message, context, language);
      res.json(result);
    } catch (error) {
      console.error("Error in InkVision chat:", error);
      const { language = "es" } = req.body;
      res.status(500).json({ 
        error: "Error processing chat message",
        response: language === "es" 
          ? "Disculpa, no pude procesar tu mensaje. ¿Podrías reformularlo?"
          : "Sorry, I couldn't process your message. Could you rephrase it?",
        suggestions: []
      });
    }
  });

  // Chat streaming endpoint for InkVision assistant
  app.post("/api/chat/stream", async (req, res) => {
    try {
      const { messages, image } = req.body;
      
      console.log('Chat stream request received');
      console.log('Messages count:', messages?.length || 0);
      console.log('Has image:', !!image);
      
      // Set headers for SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      // Get streaming response from Gemini
      const stream = await streamChatResponseGemini(messages, image);
      const reader = stream.getReader();
      
      // Process and send chunks
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Send the chunk directly to the client
        res.write(value);
      }
      
      res.end();
    } catch (error) {
      console.error("Error in chat stream:", error);
      res.write(`data: ${JSON.stringify({ error: "Failed to process chat" })}\n\n`);
      res.end();
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
