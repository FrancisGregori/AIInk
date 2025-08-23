import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { summarizeArticle, analyzeSentiment, analyzeImage, analyzeImageForTattoo, inkVisionChat, streamChatResponseGemini } from "./gemini";
import { insertStencilJobSchema, insertFluxProjectSchema, insertGeminiChatSchema } from "@shared/schema";
import ComfyDeployService from "./comfydeploy";
import Replicate from "replicate";
import { z } from "zod";
import { ObjectStorageService, objectStorageClient, OBJECT_STORAGE_BUCKET } from "./objectStorage";

// Configure multer for file uploads - SECURE DISK STORAGE
import fs from 'fs';
import path from 'path';

// Ensure temp directory exists
const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: tempDir,
    filename: (req, file, cb) => {
      // Generate unique filename to prevent conflicts
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `upload-${uniqueSuffix}-${file.originalname}`);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1, // Only 1 file per request
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Validation schema for Replicate generation
const generateImageSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  inputImageUrl: z.string().optional().refine((val) => {
    if (!val || val === "") return true; // Allow empty string
    try {
      new URL(val);
      return true;
    } catch {
      // Allow internal API paths and static file paths
      return val.startsWith('/api/image/') || val.startsWith('/images/');
    }
  }, "Invalid URL or file path"),
  width: z.number().optional().default(1024),
  height: z.number().optional().default(1024),
  aspectRatio: z.string().optional().default("match_input_image"),
  model: z.enum(["pro", "qwen"]).optional().default("pro"),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
  
  // Initialize services
  const comfyDeploy = new ComfyDeployService();
  
  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get user credits
  app.get('/api/credits', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const credits = await storage.getUserCredits(userId);
      
      res.json({
        available: credits,
        monthlyAllowance: 10, // Default monthly allowance
        used: 0, // Placeholder for credits used
        subscriptionTier: 'free' // Default tier
      });
    } catch (error) {
      console.error("Error fetching credits:", error);
      res.status(500).json({ message: "Failed to fetch credits" });
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

  // Create a new stencil job - PROTEGIDO CON AUTENTICACIÓN
  app.post("/api/stencil/jobs", isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      // SEGURIDAD: Obtener userId del usuario autenticado
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const { style = "steven", quality = 90, transparentBg = false } = req.body;
      
      // For now, use a placeholder URL for the uploaded image
      // In production, this would upload to Supabase Storage
      const originalImageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      
      // Create the stencil job - usando el userId real
      const job = await storage.createStencilJob({
        userId, // SEGURIDAD: Usar el ID del usuario autenticado
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

  // Get stencil job status - PROTEGIDO CON AUTENTICACIÓN
  app.get("/api/stencil/jobs/:id", isAuthenticated, async (req: any, res) => {
    try {
      // SEGURIDAD: Obtener userId del usuario autenticado
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const job = await storage.getStencilJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      // SEGURIDAD: Verificar que el job pertenece al usuario
      if (job.userId !== userId) {
        console.warn(`[SECURITY] User ${userId} attempted to access job ${job.id} owned by ${job.userId}`);
        return res.status(403).json({ error: "Not authorized to access this job" });
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
            
            // Save to gallery when completed
            try {
              await storage.addToGallery({
                userId: job.userId,
                imageUrl: status.outputUrl,
                thumbnailUrl: null, // No guardar imagen original
                type: 'stencil',
                title: `Stencil - ${job.style}`,
                style: job.style,
                metadata: {
                  jobId: job.id,
                  processingOptions: job.processingOptions
                }
              });
              console.log("Stencil saved to gallery");
            } catch (galleryError) {
              console.error("Error saving to gallery:", galleryError);
              // Don't fail the request if gallery save fails
            }
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
  app.get("/api/stencil/jobs", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const jobs = await storage.getStencilJobs(userId);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching stencil jobs:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get gallery stencils
  app.get("/api/stencil/gallery", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const limit = parseInt(req.query.limit as string) || 20;
      const stencils = await storage.getGalleryStencils(userId, limit);
      res.json(stencils);
    } catch (error) {
      console.error("Error fetching gallery:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Initialize global tempImages with TTL cleanup
  if (!(global as any).tempImages) {
    (global as any).tempImages = new Map();
    
    // Cleanup expired images every 5 minutes
    setInterval(() => {
      const now = Date.now();
      const tempImages = (global as any).tempImages;
      
      for (const [id, data] of tempImages.entries()) {
        // Remove images older than 30 minutes
        if (now - data.timestamp > 30 * 60 * 1000) {
          tempImages.delete(id);
          console.log(`Cleaned up expired temp image: ${id}`);
        }
      }
    }, 5 * 60 * 1000); // Run every 5 minutes
  }

  // Serve temporary images for ComfyDeploy
  app.get("/api/temp-image/:id", (req, res) => {
    const { id } = req.params;
    
    if (!(global as any).tempImages || !(global as any).tempImages.has(id)) {
      return res.status(404).json({ error: "Image not found or expired" });
    }
    
    const imageData = (global as any).tempImages.get(id);
    
    // Check if image has expired (30 minutes TTL)
    if (Date.now() - imageData.timestamp > 30 * 60 * 1000) {
      (global as any).tempImages.delete(id);
      return res.status(404).json({ error: "Image expired" });
    }
    
    res.set('Content-Type', imageData.mimeType);
    res.set('Cache-Control', 'no-store');
    res.send(imageData.buffer);
  });

  // Process stencil with ComfyDeploy
  app.post("/api/stencil/process", isAuthenticated, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Get authenticated user ID
      const authenticatedUserId = (req as any).user?.claims?.sub;
      if (!authenticatedUserId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { style = "steven", processingOptions } = req.body;
      const userId = authenticatedUserId;
      
      // Check if user has enough credits (5 credits for stencil)
      const STENCIL_COST = 5;
      const availableCredits = await storage.getUserCredits(userId);
      
      if (availableCredits < STENCIL_COST) {
        return res.status(402).json({ 
          error: "Insufficient credits",
          required: STENCIL_COST,
          available: availableCredits
        });
      }
      
      // Parse processing options if it's a string
      let options = processingOptions;
      if (typeof processingOptions === 'string') {
        try {
          options = JSON.parse(processingOptions);
        } catch {
          options = {};
        }
      }

      // Convert file to base64 URL for processing
      let publicImageUrl;
      try {
        // Read file from disk and convert to base64 data URL (ComfyDeploy accepts this)
        const fileBuffer = fs.readFileSync(req.file.path);
        const base64 = fileBuffer.toString('base64');
        const mimeType = req.file.mimetype || 'image/png';
        publicImageUrl = `data:${mimeType};base64,${base64}`;
        console.log("Image prepared for processing");
      } catch (uploadError) {
        console.error("Error preparing image:", uploadError);
        return res.status(500).json({ error: "Failed to prepare image" });
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

        // Deduct credits after successful processing
        await storage.deductCredits(userId, STENCIL_COST);

        // Save to gallery
        if (result.outputUrl) {
          try {
            await storage.addToGallery({
              userId,
              imageUrl: result.outputUrl,
              thumbnailUrl: publicImageUrl,
              type: 'stencil',
              title: `Stencil - ${style}`,
              style: style,
              metadata: {
                jobId: job.id,
                processingOptions: options
              }
            });
            console.log("Stencil saved to gallery immediately");
          } catch (galleryError) {
            console.error("Error saving to gallery:", galleryError);
          }
        }

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
  app.get("/api/flux/projects", isAuthenticated, async (req: any, res) => {
    try {
      // SEGURIDAD: Obtener userId del usuario autenticado
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Solo devolver proyectos del usuario autenticado
      console.log(`[DB] Fetching flux projects for user ${userId}`);
      const startTime = Date.now();
      const projects = await storage.getFluxProjects(userId);
      const endTime = Date.now();
      console.log(`Flux projects query took ${endTime - startTime}ms for ${projects.length} items`);
      
      if (endTime - startTime > 5000) {
        console.warn(`🐌 SLOW QUERY DETECTED: flux projects took ${endTime - startTime}ms - investigating...`);
      }
      
      res.json(projects);
    } catch (error) {
      console.error("Error fetching flux projects:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/flux/create", isAuthenticated, async (req: any, res) => {
    try {
      // SEGURIDAD: Obtener userId del usuario autenticado
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const validation = insertFluxProjectSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid project data", details: validation.error });
      }

      // Asegurar que el proyecto se asocia al usuario autenticado
      const projectData = { ...validation.data, userId };
      const project = await storage.createFluxProject(projectData);
      res.json(project);
    } catch (error) {
      console.error("Error creating flux project:", error);
      res.status(500).json({ error: "Error creating project" });
    }
  });

  app.patch("/api/flux/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      // SEGURIDAD: Obtener userId del usuario autenticado
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { id } = req.params;
      
      // Verificar que el proyecto pertenece al usuario
      const existingProject = await storage.getFluxProject(id);
      if (!existingProject || existingProject.userId !== userId) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const project = await storage.updateFluxProject(id, req.body);
      res.json(project);
    } catch (error) {
      console.error("Error updating flux project:", error);
      res.status(500).json({ error: "Error updating project" });
    }
  });

  app.post("/api/flux/projects/:id/regenerate", isAuthenticated, async (req: any, res) => {
    try {
      // SEGURIDAD: Obtener userId del usuario autenticado
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { id } = req.params;
      
      // Verificar que el proyecto pertenece al usuario
      const existingProject = await storage.getFluxProject(id);
      if (!existingProject || existingProject.userId !== userId) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const project = await storage.regenerateFluxProject(id);
      res.json(project);
    } catch (error) {
      console.error("Error regenerating flux project:", error);
      res.status(500).json({ error: "Error regenerating project" });
    }
  });

  // Delete flux project
  app.delete("/api/flux/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      // SEGURIDAD: Obtener userId del usuario autenticado
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { id } = req.params;
      
      // Verificar que el proyecto pertenece al usuario
      const existingProject = await storage.getFluxProject(id);
      if (!existingProject || existingProject.userId !== userId) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const deleted = await storage.deleteFluxProject(id);
      res.json({ success: true, message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting flux project:", error);
      res.status(500).json({ error: "Error deleting project" });
    }
  });

  // Gemini Chat Routes
  app.post("/api/gemini/chat", isAuthenticated, async (req: any, res) => {
    try {
      const { message, context } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Use Gemini to generate response
      const response = await summarizeArticle(message + (context ? `\n\nContext: ${context}` : ''));
      
      // Get authenticated user ID
      const userId = req.user?.claims?.sub || "anonymous";
      
      // Save chat message
      await storage.saveGeminiChat({
        userId,
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

      // Save image temporarily for analysis using disk storage
      const tempPath = req.file.path; // Use the file already saved by multer
      
      try {
        const analysis = await analyzeImage(tempPath);
        res.json({ analysis });
      } finally {
        // Clean up temporary file
        fs.unlinkSync(tempPath);
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
      res.setHeader('Cache-Control', 'no-store');
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

  // Replicate FLUX Kontext endpoint - Exact implementation from your original
  app.post("/api/generate", isAuthenticated, async (req: any, res) => {
    try {
      console.log("========= /api/generate CALLED =========");
      console.log("Raw request body:", JSON.stringify(req.body, null, 2));
      console.log("Model from body BEFORE parsing:", req.body.model);
      const { prompt, inputImageUrl, width, height, aspectRatio, model } = generateImageSchema.parse(req.body);
      console.log("Model AFTER parsing:", model);
      console.log("========================================");
      
      // Get authenticated user ID
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      // Check if user has enough credits (3 credits for design)
      const DESIGN_COST = 3;
      const availableCredits = await storage.getUserCredits(userId);
      
      if (availableCredits < DESIGN_COST) {
        return res.status(402).json({ 
          error: "Insufficient credits",
          required: DESIGN_COST,
          available: availableCredits
        });
      }
      
      const replicateToken = process.env.REPLICATE_API_TOKEN;
      
      if (!replicateToken) {
        return res.status(400).json({ 
          error: "Replicate API token not configured. Please set REPLICATE_API_TOKEN in your environment." 
        });
      }

      const replicate = new Replicate({
        auth: replicateToken,
      });

      // Configuración de entrada basada en el modelo
      let input: any = {};
      
      // Configuración específica para Qwen Image Edit
      if (model === "qwen") {
        input = {
          prompt: prompt,
          output_format: "png",
          output_quality: 95,
          go_fast: true,
          disable_safety_checker: true
        };
      } else {
        // Configuración para FLUX Kontext
        input = {
          prompt: prompt,
          guidance_scale: 2,
          num_inference_steps: 50,
          num_outputs: 1,
          output_format: "png",
          output_quality: 95
        };
      }

      // Si hay imagen de entrada, la incluimos
      if (inputImageUrl) {
        console.log("Input image URL received:", inputImageUrl);
        console.log("URL type:", typeof inputImageUrl);
        console.log("URL length:", inputImageUrl.length);
        
        // Para Qwen, el campo se llama "image", para Kontext es "input_image"
        const imageField = model === "qwen" ? "image" : "input_image";
        
        if (inputImageUrl.startsWith('data:')) {
          // Es una imagen base64, usarla directamente
          input[imageField] = inputImageUrl;
          console.log("Using base64 image data directly");
        } else {
          // Verificar si es una URL válida antes de enviar a Replicate
          try {
            new URL(inputImageUrl);
            // Es una URL válida, usarla directamente
            input[imageField] = inputImageUrl;
            console.log("Using external URL:", inputImageUrl);
          } catch {
            // No es una URL válida, reportar error
            console.error("Invalid image URL format that doesn't match any known pattern:", inputImageUrl);
            return res.status(400).json({ error: "Invalid reference image URL format" });
          }
        }
        
        // Solo para Kontext, manejar aspect ratio
        if (model !== "qwen" && aspectRatio && aspectRatio !== "match_input_image") {
          input.aspect_ratio = aspectRatio;
        }
      } else {
        // Qwen requiere una imagen, no puede generar desde texto puro
        if (model === "qwen") {
          return res.status(400).json({ 
            error: "Qwen Image Edit requires a reference image. Please upload an image first." 
          });
        }
        // Para generación desde texto con Kontext, usar dimensiones específicas
        input.width = width;
        input.height = height;
      }

      // Seleccionar el modelo basado en el parámetro
      console.log("Model parameter received:", model);
      console.log("Model type:", typeof model);
      console.log("Model === 'qwen':", model === "qwen");
      console.log("Model === 'pro':", model === "pro");
      
      let modelName: string;
      if (model === "qwen") {
        modelName = "qwen/qwen-image-edit";
      } else {
        modelName = "black-forest-labs/flux-kontext-pro";
      }
      
      console.log(`Using model: ${modelName}`);
      console.log("Final input object for Replicate:", JSON.stringify(input, null, 2));
      
      // Validación final: asegurar que la imagen es válida si existe
      const imageField = model === "qwen" ? "image" : "input_image";
      if (input[imageField] && typeof input[imageField] === 'string') {
        if (!input[imageField].startsWith('data:') && !input[imageField].startsWith('http')) {
          console.error(`CRITICAL: ${imageField} is not a valid URI or base64:`, input[imageField]);
          return res.status(400).json({ error: "Reference image format is invalid for Replicate API" });
        }
      }

      // Usar el SDK de Replicate con reintentos para manejar interrupciones
      let output;
      let retries = 3;
      
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          console.log(`Generating image (attempt ${attempt}/${retries}) with ${modelName}...`);
          output = await replicate.run(modelName as any, { input });
          break; // Éxito, salir del bucle
        } catch (error: any) {
          console.log(`Attempt ${attempt} failed:`, error.message);
          
          // Si es error de contenido sensible, no reintentar
          if (error.message?.includes("flagged as sensitive")) {
            throw new Error("Content was flagged as sensitive. Please try with a different prompt or image.");
          }
          
          if (attempt === retries || !error.message?.includes("Prediction interrupted")) {
            throw error; // Último intento o error diferente
          }
          
          // Esperar antes del siguiente intento
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
      }
      
      console.log("Replicate output received:", output);
      
      // Manejar diferentes formatos de output según el modelo
      let imageUrl: string;
      let optimizedImageBase64: string = "";
      let thumbnailBase64: string = "";
      
      // Qwen devuelve un array de objetos File con método .url()
      if (model === "qwen" && Array.isArray(output) && output.length > 0) {
        // Qwen returns an array of File objects with url() method
        const file = output[0];
        if (file && typeof file.url === 'function') {
          const urlObject = file.url();
          // Convert URL object to string
          imageUrl = urlObject.href || urlObject.toString();
          console.log("Qwen output URL object:", urlObject);
          console.log("Qwen final URL string:", imageUrl);
        } else if (typeof file === 'string') {
          // Fallback si ya es string
          imageUrl = file;
          console.log("Qwen output URL (direct string):", imageUrl);
        } else {
          console.error("Unexpected Qwen output format:", file);
          throw new Error("Unexpected Qwen output format");
        }
      } else if (typeof output === 'string') {
        imageUrl = output;
      } else if (Array.isArray(output) && output.length > 0) {
        imageUrl = output[0];
      } else if (output && typeof (output as any)[Symbol.asyncIterator] === 'function') {
        // Es un stream iterable - Exacto como en tu repositorio
        console.log("Processing async iterable stream from Replicate...");
        
        const chunks: Buffer[] = [];
        try {
          for await (const chunk of output as any) {
            chunks.push(Buffer.from(chunk));
          }
          
          const imageBuffer = Buffer.concat(chunks);
          console.log("Original image buffer size:", imageBuffer.length);
          
          // Guardar imagen exactamente como la genera Replicate - SIN COMPRESIÓN
          optimizedImageBase64 = imageBuffer.toString('base64');
          thumbnailBase64 = optimizedImageBase64;
          imageUrl = `data:image/png;base64,${optimizedImageBase64}`;
          
          console.log("Image saved without any compression or processing");
          
        } catch (streamError) {
          console.error("Error reading async stream:", streamError);
          throw new Error("Failed to read image stream");
        }
      } else if (output && 'getReader' in output) {
        // Es un ReadableStream estándar - Exacto de tu repositorio
        console.log("Processing ReadableStream from Replicate...");
        
        const chunks: Buffer[] = [];
        const reader = (output as any).getReader();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(Buffer.from(value));
          }
          
          const imageBuffer = Buffer.concat(chunks);
          console.log("Image buffer size:", imageBuffer.length);
          
          // Convertir a base64 data URL
          const base64 = imageBuffer.toString('base64');
          imageUrl = `data:image/png;base64,${base64}`;
          console.log("Created data URL, length:", imageUrl.length);
        } catch (streamError) {
          console.error("Error reading stream:", streamError);
          throw new Error("Failed to read image stream");
        } finally {
          reader.releaseLock();
        }
      } else {
        console.error("Unexpected output format from FLUX Kontext Max:", output);
        return res.status(500).json({ 
          error: "No image URL was generated - unexpected output format" 
        });
      }
      
      if (!imageUrl || typeof imageUrl !== 'string') {
        console.error("Invalid image URL:", imageUrl);
        return res.status(500).json({ 
          error: "No valid image URL was generated" 
        });
      }

      // Devolver la URL de la imagen generada - Igual que tu repositorio
      // Deduct credits after successful generation
      await storage.deductCredits(userId, DESIGN_COST);
      
      // Crear abreviatura del modelo
      const modelAbbr = model === 'qwen' ? 'Q' : 
                       model === 'pro' ? 'P' : 
                       model === 'max' ? 'M' : 
                       (model as string).charAt(0).toUpperCase();
      
      // Subir imagen a Object Storage en lugar de guardar base64
      const objectStorage = new ObjectStorageService();
      let finalImageUrl = imageUrl;
      let thumbnailUrl = null;
      
      try {
        console.log('=== PROCESANDO IMAGEN PARA OBJECT STORAGE ===');
        console.log('Tipo de imagen:', imageUrl.startsWith('data:') ? 'Base64' : 'URL externa');
        
        // Subir la imagen a Object Storage
        if (imageUrl.startsWith('data:')) {
          // Si es base64, subir directamente
          const uploadResult = await objectStorage.uploadImageFromBase64(
            imageUrl,
            'designs',
            userId
          );
          finalImageUrl = uploadResult.imageUrl;
          thumbnailUrl = uploadResult.thumbnailUrl;
        } else {
          // Si es URL externa, descargar y subir
          const uploadResult = await objectStorage.uploadImageFromUrl(
            imageUrl,
            'designs',
            userId
          );
          finalImageUrl = uploadResult.imageUrl;
          thumbnailUrl = uploadResult.thumbnailUrl;
        }
        
        console.log('=== IMAGEN OPTIMIZADA ===');
        console.log('URL final:', finalImageUrl);
        console.log('URL miniatura:', thumbnailUrl);
      } catch (uploadError) {
        console.error('Error subiendo a Object Storage, usando URL original:', uploadError);
        // Si falla, mantener la URL original
      }
      
      // Save to gallery con URLs optimizadas
      const savedItem = await storage.addToGallery({
        userId,
        imageUrl: finalImageUrl,
        thumbnailUrl: thumbnailUrl,
        type: 'design',
        title: `${prompt.slice(0, 45)} (${modelAbbr})`,
        description: prompt,
        prompt: prompt,
        metadata: {
          model: modelName,
          inputImageUrl: inputImageUrl
        }
      });
      
      console.log('=== IMAGEN GUARDADA EN GALERÍA ===');
      console.log('ID:', savedItem.id);
      console.log('Título:', savedItem.title);
      
      res.json({
        imageUrl: finalImageUrl, // Devolver URL optimizada en lugar de base64
        thumbnailUrl: thumbnailUrl,
        prompt,
        model: modelName,
        success: true
      });
      
    } catch (error: any) {
      console.error("DETAILED ERROR in /api/generate:", error);
      console.error("Error stack:", error.stack);
      console.error("Error message:", error.message);
      
      res.status(500).json({ 
        error: "Failed to generate image",
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  });

  // Gallery API Routes
  
  // Get user gallery
  app.get("/api/gallery", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const { type, limit, page } = req.query;
      // Paginación: 50 items por página por defecto, máximo 100
      const requestedLimit = limit ? Math.min(parseInt(limit as string), 100) : 50;
      const requestedPage = page ? Math.max(parseInt(page as string), 1) : 1;
      const offset = (requestedPage - 1) * requestedLimit;
      
      // Iniciar timer para medir performance
      const startTime = Date.now();
      
      const galleryItems = await storage.getUserGallery(
        userId, 
        type as string | undefined,
        requestedLimit,
        offset
      );
      
      // Obtener el total de items para calcular páginas
      const totalItems = await storage.getGalleryItemCount(userId, type as string | undefined);
      
      const queryTime = Date.now() - startTime;
      console.log(`Gallery query took ${queryTime}ms for ${galleryItems.length} items`);
      
      // Cache y metadata de paginación
      const totalCount = totalItems || 0;
      res.set({
        'Cache-Control': 'no-store',
        'X-Total-Count': totalCount.toString(),
        'X-Page': requestedPage.toString(),
        'X-Page-Size': requestedLimit.toString(),
        'X-Total-Pages': Math.ceil(totalCount / requestedLimit).toString(),
        'X-Query-Time': queryTime.toString()
      });
      
      res.json(galleryItems);
    } catch (error) {
      console.error("Error fetching gallery:", error);
      res.status(500).json({ error: "Failed to fetch gallery" });
    }
  });
  
  // Add item to gallery (this will be called automatically when generating)
  app.post("/api/gallery", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const { imageUrl, type, title, description, prompt, style, metadata } = req.body;
      
      if (!imageUrl || !type) {
        return res.status(400).json({ error: "ImageUrl and type are required" });
      }
      
      const galleryItem = await storage.addToGallery({
        userId,
        imageUrl,
        type,
        title,
        description,
        prompt,
        style,
        metadata
      });
      
      res.json(galleryItem);
    } catch (error) {
      console.error("Error adding to gallery:", error);
      res.status(500).json({ error: "Failed to add to gallery" });
    }
  });
  
  // Update gallery item
  app.patch("/api/gallery/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const { id } = req.params;
      const updates = req.body;
      
      // SEGURIDAD: Pasar userId para validar propiedad
      const updatedItem = await storage.updateGalleryItem(id, updates, userId);
      if (!updatedItem) {
        return res.status(404).json({ error: "Gallery item not found or not authorized" });
      }
      
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating gallery item:", error);
      res.status(500).json({ error: "Failed to update gallery item" });
    }
  });
  
  // Delete gallery item
  app.delete("/api/gallery/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const { id } = req.params;
      const deleted = await storage.deleteGalleryItem(id, userId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Gallery item not found or not authorized" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting gallery item:", error);
      res.status(500).json({ error: "Failed to delete gallery item" });
    }
  });
  
  // Toggle favorite
  app.post("/api/gallery/:id/favorite", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const { id } = req.params;
      const toggled = await storage.toggleFavorite(id, userId);
      
      if (!toggled) {
        return res.status(404).json({ error: "Gallery item not found or not authorized" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      res.status(500).json({ error: "Failed to toggle favorite" });
    }
  });

  // ADMIN ROUTES COMPLETELY REMOVED FOR SECURITY
  // Any admin functionality requires proper role-based access control implementation

  // Endpoint seguro para servir imágenes privadas con autenticación
  app.get('/api/images/:filename(*)', isAuthenticated, async (req: any, res) => {
    try {
      const filename = decodeURIComponent(req.params.filename);
      console.log('Sirviendo imagen privada:', filename);
      
      // SEGURIDAD: Verificar que el usuario está autenticado
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }
      
      // SEGURIDAD: Solo servir imágenes del directorio privado
      if (!filename.startsWith('.private/')) {
        return res.status(404).json({ message: "Imagen no encontrada" });
      }
      
      // SEGURIDAD: Verificar que la imagen pertenece al usuario autenticado
      // Las rutas son: .private/designs/{userId}/... o .private/uploads/{userId}/... o .private/thumbnails/{userId}/...
      const userPattern = new RegExp(`\\.private/(designs|uploads|thumbnails)/${userId}/`);
      if (!userPattern.test(filename)) {
        console.warn(`Usuario ${userId} intentó acceder a imagen no autorizada: ${filename}`);
        return res.status(403).json({ message: "No autorizado para ver esta imagen" });
      }
      
      const objectStorage = new ObjectStorageService();
      const bucket = objectStorageClient.bucket(OBJECT_STORAGE_BUCKET);
      const file = bucket.file(filename);
      
      // Verificar que el archivo existe
      const [exists] = await file.exists();
      if (!exists) {
        return res.status(404).json({ message: "Imagen no encontrada" });
      }
      
      // Obtener el archivo y enviarlo
      const [buffer] = await file.download();
      
      // Headers correctos para mostrar imágenes con credenciales
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Length', buffer.length.toString());
      res.setHeader('Cache-Control', 'private, max-age=3600'); // Cache privado por autenticación
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie');
      
      res.end(buffer);
    } catch (error) {
      console.error('Error sirviendo imagen privada:', error);
      res.status(404).json({ message: "Imagen no encontrada" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
