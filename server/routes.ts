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
  model: z.enum(["max", "pro"]).optional().default("max"),
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
      const profile = await storage.getUserProfile(userId);
      
      res.json({
        available: credits,
        monthlyAllowance: profile?.monthlyCredits || 10,
        used: profile?.creditsUsed || 0,
        subscriptionTier: profile?.subscriptionTier || 'free'
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

  // Serve temporary images for ComfyDeploy
  app.get("/api/temp-image/:id", (req, res) => {
    const { id } = req.params;
    
    if (!global.tempImages || !global.tempImages.has(id)) {
      return res.status(404).json({ error: "Image not found or expired" });
    }
    
    const imageData = global.tempImages.get(id);
    res.set('Content-Type', imageData.mimeType);
    res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
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

      // Upload image to a temporary public URL for ComfyDeploy
      let publicImageUrl;
      try {
        // For now, we'll use a temporary storage solution
        // ComfyDeploy needs a real public URL, not base64
        const base64 = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype || 'image/png';
        
        // Create a temporary endpoint to serve this image
        const tempImageId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Store temporarily in memory (this will be served by our temp endpoint)
        if (!global.tempImages) {
          global.tempImages = new Map();
        }
        global.tempImages.set(tempImageId, {
          buffer: req.file.buffer,
          mimeType: mimeType,
          createdAt: Date.now()
        });
        
        // Clean up old temp images (older than 1 hour)
        const oneHourAgo = Date.now() - 3600000;
        for (const [id, data] of global.tempImages.entries()) {
          if (data.createdAt < oneHourAgo) {
            global.tempImages.delete(id);
          }
        }
        
        // Create public URL for ComfyDeploy to fetch
        // Use Replit's public domain for production
        const replitDomain = process.env.REPLIT_DOMAINS?.split(',')[0];
        const publicHost = replitDomain || req.get('host') || 'localhost:5000';
        const protocol = replitDomain ? 'https' : (req.protocol || 'https');
        publicImageUrl = `${protocol}://${publicHost}/api/temp-image/${tempImageId}`;
        
        console.log("Image uploaded to temporary URL:", publicImageUrl);
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
          await storage.addToGallery({
            userId,
            imageUrl: result.outputUrl,
            type: 'stencil',
            title: `Stencil - ${style}`,
            style: style,
            metadata: {
              jobId: job.id,
              processingOptions: options
            }
          });
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

  // Delete flux project
  app.delete("/api/flux/projects/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteFluxProject(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      res.json({ success: true, message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting flux project:", error);
      res.status(500).json({ error: "Error deleting project" });
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

  // Replicate FLUX Kontext endpoint - Exact implementation from your original
  app.post("/api/generate", isAuthenticated, async (req: any, res) => {
    try {
      const { prompt, inputImageUrl, width, height, aspectRatio, model } = generateImageSchema.parse(req.body);
      
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

      // Configuración de entrada para FLUX Kontext Max
      const input: any = {
        prompt: prompt,
      };

      // Si hay imagen de entrada, la incluimos
      if (inputImageUrl) {
        console.log("Input image URL received:", inputImageUrl);
        console.log("URL type:", typeof inputImageUrl);
        console.log("URL length:", inputImageUrl.length);
        
        if (inputImageUrl.startsWith('data:')) {
          // Es una imagen base64, usarla directamente
          input.input_image = inputImageUrl;
          console.log("Using base64 image data directly");
        } else {
          // Verificar si es una URL válida antes de enviar a Replicate
          try {
            new URL(inputImageUrl);
            // Es una URL válida, usarla directamente
            input.input_image = inputImageUrl;
            console.log("Using external URL:", inputImageUrl);
          } catch {
            // No es una URL válida, reportar error
            console.error("Invalid image URL format that doesn't match any known pattern:", inputImageUrl);
            return res.status(400).json({ error: "Invalid reference image URL format" });
          }
        }
        
        if (aspectRatio && aspectRatio !== "match_input_image") {
          input.aspect_ratio = aspectRatio;
        }
      } else {
        // Para generación desde texto, usar dimensiones específicas
        input.width = width;
        input.height = height;
      }

      console.log("Final input object for Replicate:", JSON.stringify(input, null, 2));
      
      // Validación final: asegurar que input_image es válido si existe
      if (input.input_image && typeof input.input_image === 'string') {
        if (!input.input_image.startsWith('data:') && !input.input_image.startsWith('http')) {
          console.error("CRITICAL: input_image is not a valid URI or base64:", input.input_image);
          return res.status(400).json({ error: "Reference image format is invalid for Replicate API" });
        }
      }

      // Seleccionar el modelo basado en el parámetro
      const modelName = model === "pro" 
        ? "black-forest-labs/flux-kontext-pro" 
        : "black-forest-labs/flux-kontext-max";
      
      console.log(`Using model: ${modelName}`);

      // Usar el SDK de Replicate con reintentos para manejar interrupciones
      let output;
      let retries = 3;
      
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          console.log(`Generating image (attempt ${attempt}/${retries}) with ${modelName}...`);
          output = await replicate.run(modelName, { input });
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
      
      // Manejar diferentes formatos de output de FLUX Kontext Max - Exacto del repositorio original
      let imageUrl: string;
      let optimizedImageBase64: string = "";
      let thumbnailBase64: string = "";
      
      if (typeof output === 'string') {
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
      
      // Save to gallery
      await storage.addToGallery({
        userId,
        imageUrl,
        type: 'design',
        title: `Design - ${modelName}`,
        description: prompt,
        prompt: prompt,
        metadata: {
          model: modelName,
          inputImageUrl: inputImageUrl
        }
      });
      
      res.json({
        imageUrl,
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
      
      const { type, limit } = req.query;
      const galleryItems = await storage.getUserGallery(
        userId, 
        type as string | undefined,
        limit ? parseInt(limit as string) : undefined
      );
      
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
      
      const updatedItem = await storage.updateGalleryItem(id, updates);
      if (!updatedItem) {
        return res.status(404).json({ error: "Gallery item not found" });
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

  const httpServer = createServer(app);
  return httpServer;
}
