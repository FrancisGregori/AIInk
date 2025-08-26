import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { summarizeArticle, analyzeSentiment, analyzeImage, analyzeImageForTattoo, inkVisionChat, streamChatResponseGemini } from "./gemini";
import { insertStencilJobSchema, insertFluxProjectSchema, insertGeminiChatSchema, userGallery, fluxProjects } from "@shared/schema";
import { db } from "./db";
import { desc, eq, sql } from "drizzle-orm";
import ComfyDeployService from "./comfydeploy";
import Replicate from "replicate";
import { z } from "zod";
import { ObjectStorageService, objectStorageClient, OBJECT_STORAGE_BUCKET } from "./objectStorage";
import Stripe from "stripe";
import { CREDIT_PACKS, getCreditPackByCredits, getPriceId, PRICE_ID_TO_TIER } from "../shared/stripe-config";

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
// Initialize Stripe - will use environment variables when available
let stripe: Stripe | null = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-07-30.basil" as any, // Usar versión más reciente
    });
    console.log("✅ Stripe initialized successfully");
  } else {
    console.warn("⚠️  STRIPE_SECRET_KEY not found - Stripe functionality disabled");
  }
} catch (error) {
  console.error("❌ Failed to initialize Stripe:", error);
}

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
  // Health check endpoints for deployment
  // NOTE: "/" route is handled by Vite/static files to serve the React app
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "healthy", message: "Server is running" });
  });
  
  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "healthy", timestamp: Date.now() });
  });
  
  // Debug endpoint to identify production issues
  app.get("/api/debug/test", async (req, res) => {
    try {
      const response: any = {
        server: "running",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? "configured" : "missing",
      };
      
      // Test simple database query
      try {
        const testQuery = await db.select({ count: sql<number>`count(*)` }).from(userGallery);
        response.database = "connected";
        response.galleryCount = testQuery[0]?.count || 0;
      } catch (dbError: any) {
        response.database = "error";
        response.dbError = dbError.message;
      }
      
      res.json(response);
    } catch (error: any) {
      res.status(500).json({ 
        error: "Debug endpoint failed",
        message: error.message 
      });
    }
  });

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
      const user = await storage.getUser(userId);
      const credits = await storage.getUserCredits(userId);
      
      res.json({
        available: credits,
        monthlyAllowance: user?.monthlyCredits || 10,
        used: user?.creditsUsed || 0,
        subscriptionTier: user?.subscriptionTier || 'free'
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
          const status = await comfyDeploy.checkRunStatus(
            job.comfyDeployRunId,
            userId,
            job.style
          );
          
          console.log("Polling result for job", job.id, "ComfyDeploy run:", job.comfyDeployRunId);
          console.log("Status from ComfyDeploy:", {
            status: status.status,
            outputUrl: status.outputUrl,
            error: status.error
          });
          
          // Update job based on ComfyDeploy status
          if (status.status === "completed" && status.outputUrl) {
            console.log("Job completed! Updating with URL:", status.outputUrl);
            
            // Subir imagen a almacenamiento PÚBLICO
            let publicImageUrl = status.outputUrl;
            let thumbnailUrl = null;
            let variants = status.variants;
            
            try {
              const objectStorage = new ObjectStorageService();
              const uploadResult = await objectStorage.uploadPublicImageFromUrl(
                status.outputUrl,
                'gallery',
                job.userId,
                true // generateOptimized
              );
              publicImageUrl = uploadResult.imageUrl;
              thumbnailUrl = uploadResult.thumbnailUrl;
              variants = uploadResult.variants || status.variants;
              console.log('Imagen subida a CDN público:', publicImageUrl);
            } catch (uploadError) {
              console.error('Error subiendo a Object Storage público:', uploadError);
              // Mantener URL original si falla
            }
            
            await storage.updateStencilJob(job.id, {
              status: "completed",
              processedImageUrl: publicImageUrl,
              completedAt: new Date(),
            });
            
            // Save to gallery when completed
            try {
              await storage.addToGallery({
                userId: job.userId,
                imageUrl: publicImageUrl,
                thumbnailUrl: thumbnailUrl,
                type: 'stencil',
                title: `Stencil - ${job.style}`,
                style: job.style,
                variants: variants, // Save optimized variants
                metadata: {
                  jobId: job.id,
                  processingOptions: job.processingOptions
                }
              });
              console.log("Stencil saved to gallery");
              if (status.variants) {
                console.log("Optimized variants saved:", Object.keys(status.variants));
              }
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
    let creditsDeducted = false;
    const STENCIL_COST = 5;
    let userId = "";
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
      userId = authenticatedUserId;

      // Check if user has enough credits (5 credits for stencil)
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

      // Clean up temp file after creating job
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Could not clean up temp file:', cleanupError);
      }

      // Deduct credits before starting processing
      const deducted = await storage.deductCredits(userId, STENCIL_COST);
      if (!deducted) {
        return res.status(402).json({ error: "Insufficient credits" });
      }
      creditsDeducted = true;

      // Get style configuration from database
      const styleConfig = await storage.getStencilStyle(style);
      
      // Start processing with ComfyDeploy
      try {
        const result = await comfyDeploy.processImage(
          publicImageUrl,
          styleConfig || style,  // Pass full config if available, otherwise just the name
          options,
          userId
        );
        
        // Update job with ComfyDeploy run ID
        await storage.updateStencilJob(job.id, {
          comfyDeployRunId: result.runId,
          status: result.status,
          processedImageUrl: result.outputUrl,
        });

        // Save to gallery
        if (result.outputUrl) {
          try {
            // Subir imagen a almacenamiento PÚBLICO
            let finalImageUrl = result.outputUrl;
            let thumbnailUrl = publicImageUrl;
            let variants = undefined;
            
            try {
              const objectStorage = new ObjectStorageService();
              const uploadResult = await objectStorage.uploadPublicImageFromUrl(
                result.outputUrl,
                'gallery',
                userId,
                true // generateOptimized
              );
              finalImageUrl = uploadResult.imageUrl;
              thumbnailUrl = uploadResult.thumbnailUrl;
              variants = uploadResult.variants;
              console.log('Stencil subido a CDN público:', finalImageUrl);
            } catch (uploadError) {
              console.error('Error subiendo stencil a Object Storage público:', uploadError);
              // Mantener URL original si falla
            }
            
            await storage.addToGallery({
              userId,
              imageUrl: finalImageUrl,
              thumbnailUrl: thumbnailUrl,
              type: 'stencil',
              title: `Stencil - ${style}`,
              style: style,
              metadata: {
                jobId: job.id,
                processingOptions: options
              },
              variants
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
        // If ComfyDeploy fails, refund credits and return the job with error status
        if (creditsDeducted) {
          await storage.addCredits(userId, STENCIL_COST);
          creditsDeducted = false;
        }
        await storage.updateStencilJob(job.id, {
          status: "failed",
          errorMessage: String(processError),
        });

        const updatedJob = await storage.getStencilJob(job.id);
        res.json(updatedJob);
      }
    } catch (error) {
      if (creditsDeducted) {
        await storage.addCredits(userId, STENCIL_COST);
      }
      console.error("Error processing stencil:", error);
      res.status(500).json({ error: "Error processing image" });
    }
  });

  // ENDPOINT ALTERNATIVO - máxima protección
  app.get("/api/flux/projects-safe", async (req: any, res) => {
    res.status(200).json([]);
  });

  // Flux Kontext Routes - ULTRA RESILIENT PUBLIC ACCESS
  app.get("/api/flux/projects", async (req: any, res) => {
    // TOP-LEVEL TRY-CATCH: GARANTIZAR que NUNCA devolvamos 500
    try {
      // GARANTIZAR que SIEMPRE devolvamos 200 con array válido
      // No importa qué error ocurra, nunca devolver 500
      
      let projects: any[] = [];
      
      // Primer intento: usar storage
      try {
        projects = await storage.getFluxProjects();
        console.log(`[FLUX_PROJECTS] Storage returned ${projects.length} projects`);
      } catch (storageError: any) {
        console.error("[FLUX_PROJECTS] Storage error:", storageError?.message || storageError);
        
        // Segundo intento: consulta directa a DB
        try {
          projects = await db.select()
            .from(fluxProjects)
            .orderBy(desc(fluxProjects.createdAt))
            .limit(50);
          console.log(`[FLUX_PROJECTS] DB query returned ${projects.length} projects`);
        } catch (dbError: any) {
          console.error("[FLUX_PROJECTS] DB error:", dbError?.message || dbError);
          
          // Tercer intento: usar array vacío como fallback final
          console.log("[FLUX_PROJECTS] Returning empty array as final fallback");
          projects = [];
        }
      }
      
      // GARANTÍA FINAL: Siempre devolver un array válido con status 200
      if (!Array.isArray(projects)) {
        console.error("[FLUX_PROJECTS] Projects is not an array, returning empty array");
        projects = [];
      }
      
      // Enviar respuesta con status 200 garantizado
      res.status(200).json(projects);
    } catch (criticalError: any) {
      // FALLBACK ABSOLUTO: Si TODO falla, aún así devolver 200 con array vacío
      console.error("[FLUX_PROJECTS] CRITICAL ERROR - Returning empty array:", criticalError?.message || criticalError);
      res.status(200).json([]);
    }
  });

  app.post("/api/flux/create", isAuthenticated, async (req: any, res) => {
    try {
      // SEGURIDAD: Obtener userId del usuario autenticado
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Crear datos del proyecto con campos mínimos requeridos
      const projectData = {
        userId,
        name: req.body.name || 'Untitled Design',
        description: req.body.description || null,
        prompt: req.body.prompt || null,
        imageUrl: req.body.imageUrl || null,
        settings: req.body.settings || null,
        isPublic: false
      };

      console.log('Creating flux project:', projectData);

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

  // Upload image endpoint - sube imágenes a Object Storage y devuelve URL
  app.post("/api/upload", isAuthenticated, upload.single("image"), async (req: any, res) => {
    try {
      // SEGURIDAD: Obtener userId del usuario autenticado
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Convertir el buffer de multer a base64
      const base64Data = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      
      // Subir a Object Storage y obtener URL pública
      const objectStorage = new ObjectStorageService();
      const uploadResult = await objectStorage.uploadPublicImageFromBase64(
        base64Data,
        'gallery', // Usar carpeta gallery para imágenes de referencia
        userId,
        false // No generar versiones optimizadas para referencias
      );

      console.log('=== IMAGEN DE REFERENCIA SUBIDA ===');
      console.log('URL:', uploadResult.imageUrl);
      console.log('Usuario:', userId);

      res.json({
        url: uploadResult.imageUrl,
        thumbnailUrl: uploadResult.thumbnailUrl
      });
    } catch (error) {
      console.error("Error uploading reference image:", error);
      res.status(500).json({ error: "Failed to upload image" });
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
    let creditsDeducted = false;
    const DESIGN_COST = 3;
    let userId = "";
    try {
      console.log("========= /api/generate CALLED =========");
      console.log("Raw request body:", JSON.stringify(req.body, null, 2));
      console.log("Model from body BEFORE parsing:", req.body.model);
      const { prompt, inputImageUrl, width, height, aspectRatio, model } = generateImageSchema.parse(req.body);
      console.log("Model AFTER parsing:", model);
      console.log("========================================");
      
      // Get authenticated user ID
      userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Check if user has enough credits (3 credits for design)
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
        
        // Para Kontext, siempre enviar aspect ratio cuando hay imagen
        if (model !== "qwen") {
          // Mapear "Match Input" del frontend a "match_input_image" para Replicate
          const mappedAspectRatio = aspectRatio === "Match Input" ? "match_input_image" : aspectRatio;
          input.aspect_ratio = mappedAspectRatio || "match_input_image";
          console.log("Aspect ratio set to:", input.aspect_ratio);
        }
      } else {
        // Qwen requiere una imagen, no puede generar desde texto puro
        if (model === "qwen") {
          return res.status(400).json({ 
            error: "Qwen Image Edit requires a reference image. Please upload an image first." 
          });
        }
        // Para generación desde texto con Kontext, usar aspect ratio en lugar de dimensiones
        // Kontext no acepta width/height, solo aspect_ratio
        const mappedAspectRatio = aspectRatio === "Match Input" ? "1:1" : aspectRatio;
        input.aspect_ratio = mappedAspectRatio || "1:1";
        console.log("Aspect ratio for text-only generation:", input.aspect_ratio);
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

      // Deduct credits before starting generation
      const deducted = await storage.deductCredits(userId, DESIGN_COST);
      if (!deducted) {
        return res.status(402).json({ error: "Insufficient credits" });
      }
      creditsDeducted = true;

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
      let imageUrl: string = "";
      
      // Qwen devuelve un array de objetos File con método .url()
      if (model === "qwen" && Array.isArray(output) && output.length > 0) {
        // Qwen returns an array of File objects with url() method
        const file = output[0];
        if (file && typeof file.url === 'function') {
          const urlObject = file.url();
          // Convert URL object to string - THIS IS THE REAL REPLICATE URL
          imageUrl = urlObject.href || urlObject.toString();
          console.log("✅ Qwen output - Real Replicate URL:", imageUrl);
        } else if (typeof file === 'string') {
          // Fallback si ya es string - THIS IS THE REAL REPLICATE URL
          imageUrl = file;
          console.log("✅ Qwen output - Real Replicate URL (direct string):", imageUrl);
        } else {
          console.error("Unexpected Qwen output format:", file);
          throw new Error("Unexpected Qwen output format");
        }
      } else if (typeof output === 'string') {
        // FLUX Kontext returns URL directly - USE THE REAL REPLICATE URL
        imageUrl = output;
        console.log("✅ FLUX Kontext - Real Replicate URL:", imageUrl);
      } else if (Array.isArray(output) && output.length > 0) {
        // Array with URLs - USE THE REAL REPLICATE URL
        imageUrl = output[0];
        console.log("✅ FLUX Kontext (array) - Real Replicate URL:", imageUrl);
      } else if (output && typeof (output as any)[Symbol.asyncIterator] === 'function') {
        // AsyncIterator returns URLs, not streams - handle properly
        console.log("Processing async iterable from Replicate...");
        
        let finalUrl = null;
        try {
          for await (const item of output as any) {
            // The iterator returns URLs, not binary data
            if (typeof item === 'string') {
              finalUrl = item;
              console.log("✅ AsyncIterator returned URL:", finalUrl);
              break;
            }
          }
          
          if (finalUrl) {
            imageUrl = finalUrl;
          } else {
            throw new Error("No URL received from async iterator");
          }
          
        } catch (streamError) {
          console.error("Error reading async iterator:", streamError);
          throw new Error("Failed to read image URL from async iterator");
        }
      } else if (output && 'getReader' in output) {
        // ReadableStream - This is less common, might be binary data
        console.log("Processing ReadableStream from Replicate...");
        
        // Try to read as text first (might be URL)
        const chunks: string[] = [];
        const reader = (output as any).getReader();
        
        try {
          const { done, value } = await reader.read();
          if (!done && value) {
            // Check if it's text (URL) or binary
            const text = new TextDecoder().decode(value);
            if (text.startsWith('http')) {
              imageUrl = text.trim();
              console.log("✅ ReadableStream returned URL:", imageUrl);
            } else {
              // If it's binary data, we should NOT process it
              // Let Object Storage handle the original Replicate URL
              throw new Error("Unexpected binary stream from Replicate - expected URL");
            }
          }
        } catch (streamError) {
          console.error("Error reading stream:", streamError);
          throw new Error("Failed to read image URL from stream");
        } finally {
          reader.releaseLock();
        }
      } else {
        console.error("Unexpected output format from Replicate:", output);
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

      // Devolver la URL de la imagen generada - USAR TAL CUAL
      // Credits already deducted before generation
      
      // Crear abreviatura del modelo
      const modelAbbr = model === 'qwen' ? 'Q' : 
                       model === 'pro' ? 'P' : 
                       model === 'max' ? 'M' : 
                       (model as string).charAt(0).toUpperCase();
      
      // IMPORTANTE: Las URLs de Replicate se borran después de 1 hora
      // Necesitamos descargar y guardar la imagen permanentemente
      console.log('=== DESCARGANDO IMAGEN DE REPLICATE ===');
      console.log('URL temporal de Replicate:', imageUrl);
      
      let permanentImageUrl = imageUrl;
      
      try {
        // 1. Descargar la imagen de Replicate
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image from Replicate: ${imageResponse.status}`);
        }
        
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        console.log(`Downloaded image: ${imageBuffer.length} bytes`);
        
        // 2. Generar nombre único para la imagen
        const imageId = `${Date.now()}_${userId}_${Math.random().toString(36).substring(2, 9)}`;
        const fileName = `designs/${imageId}.png`;
        
        // 3. Subir a Object Storage
        const objectStorageService = new ObjectStorageService();
        const bucketName = 'replit-objstore-12f3cfa6-c32d-4020-8906-8c1a7e0f108b';
        const bucket = objectStorageClient.bucket(bucketName);
        const file = bucket.file(`.private/${fileName}`);
        
        await file.save(imageBuffer, {
          metadata: {
            contentType: 'image/png',
            cacheControl: 'public, max-age=31536000',
          }
        });
        
        // 4. Generar URL permanente
        permanentImageUrl = `/objects/${fileName}`;
        console.log('✅ Imagen guardada permanentemente en:', permanentImageUrl);
        
      } catch (saveError: any) {
        console.error('Error guardando imagen permanentemente:', saveError);
        // Si falla el guardado, usar la URL temporal (mejor que nada)
        console.warn('⚠️ Usando URL temporal de Replicate (se borrará en 1 hora)');
      }
      
      // Save to gallery con URL permanente
      const savedItem = await storage.addToGallery({
        userId,
        imageUrl: permanentImageUrl,  // USAR URL PERMANENTE
        thumbnailUrl: permanentImageUrl, // MISMA URL PARA THUMBNAIL
        type: 'design',
        title: `${prompt.slice(0, 45)} (${modelAbbr})`,
        description: prompt,
        prompt: prompt,
        metadata: {
          model: modelName,
          inputImageUrl: inputImageUrl,
          originalReplicateUrl: imageUrl // Guardar URL original por si acaso
        }
      });
      
      console.log('=== IMAGEN GUARDADA EN GALERÍA ===');
      console.log('ID:', savedItem.id);
      console.log('Título:', savedItem.title);
      
      res.json({
        imageUrl: imageUrl,  // DEVOLVER LA URL ORIGINAL DE REPLICATE
        thumbnailUrl: imageUrl,  // USAR LA MISMA URL
        prompt,
        model: modelName,
        success: true
      });
      
    } catch (error: any) {
      if (creditsDeducted) {
        await storage.addCredits(userId, DESIGN_COST);
      }
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
  
  // Get user gallery - ULTRA RESILIENT PUBLIC ACCESS
  app.get("/api/gallery", async (req: any, res) => {
    // TOP-LEVEL TRY-CATCH: GARANTIZAR que NUNCA devolvamos 500
    try {
      // GARANTIZAR que SIEMPRE devolvamos 200 con array válido
      // No importa qué error ocurra, nunca devolver 500
      
      const type = req.query.type as string;
      let galleryItems: any[] = [];
      
      // Primer intento: consulta directa a DB
      try {
        const items = await db.select()
          .from(userGallery)
          .where(type ? eq(userGallery.type, type) : undefined)
          .orderBy(desc(userGallery.createdAt))
          .limit(50);
        
        galleryItems = items;
        console.log(`[GALLERY] DB query returned ${galleryItems.length} items of type: ${type}`);
      } catch (dbError: any) {
        console.error("[GALLERY] DB error:", dbError?.message || dbError);
        
        // Segundo intento: usar storage si está disponible
        try {
          const userId = ''; // Cadena vacía en lugar de undefined
          const items = await storage.getUserGallery(userId, type, 50, 0);
          galleryItems = items;
          console.log(`[GALLERY] Storage fallback returned ${galleryItems.length} items`);
        } catch (storageError: any) {
          console.error("[GALLERY] Storage fallback error:", storageError?.message || storageError);
          galleryItems = [];
        }
      }
      
      // GARANTÍA FINAL: Siempre devolver un array válido con status 200
      if (!Array.isArray(galleryItems)) {
        console.error("[GALLERY] Items is not an array, returning empty array");
        galleryItems = [];
      }
      
      // Enviar respuesta con status 200 garantizado
      res.status(200).json(galleryItems);
    } catch (criticalError: any) {
      // FALLBACK ABSOLUTO: Si TODO falla, aún así devolver 200 con array vacío
      console.error("[GALLERY] CRITICAL ERROR - Returning empty array:", criticalError?.message || criticalError);
      res.status(200).json([]);
    }
  });
  
  // Add item to gallery (this will be called automatically when generating)
  app.post("/api/gallery", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const { imageUrl, type, title, description, prompt, style, metadata, variants } = req.body;
      
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
        metadata,
        variants
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
  
  // NOTE: Duplicate flux endpoints have been removed and consolidated above

  // Create new flux project (duplicate - keeping for reference only)
  // This endpoint is duplicated above in the Flux Kontext Routes section
  app.post("/api/flux/create-duplicate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const { name, imageUrl, prompt, settings } = req.body;
      
      // Create project in database
      const project = await storage.createFluxProject({
        userId,
        name,
        imageUrl,
        prompt,
        settings
      });
      
      res.json(project);
    } catch (error) {
      console.error("Error creating flux project:", error);
      res.status(500).json({ error: "Failed to create flux project" });
    }
  });

  // PROXY DE REPLICATE ELIMINADO - Las URLs de Replicate deben usarse directamente sin proxy
  // Las imágenes de Replicate son públicas y no necesitan proxy para evitar CORS

  // Endpoint PÚBLICO para servir imágenes de galería (sin autenticación)
  app.get('/api/public/images/:filename(*)', async (req, res) => {
    try {
      const filename = decodeURIComponent(req.params.filename);
      console.log('Sirviendo imagen pública:', filename);
      
      // Solo servir imágenes del directorio público
      if (!filename.startsWith('public/')) {
        return res.status(404).json({ message: "Imagen no encontrada" });
      }
      
      const bucket = objectStorageClient.bucket(OBJECT_STORAGE_BUCKET);
      const file = bucket.file(filename);
      
      // Verificar que el archivo existe
      const [exists] = await file.exists();
      if (!exists) {
        return res.status(404).json({ message: "Imagen no encontrada" });
      }
      
      // Obtener metadata
      const [metadata] = await file.getMetadata();
      
      // Configurar headers para CDN y caching
      res.set({
        'Content-Type': metadata.contentType || 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache agresivo
        'Content-Length': metadata.size,
        'Access-Control-Allow-Origin': '*', // CORS abierto para imágenes públicas
      });
      
      // Stream la imagen
      const stream = file.createReadStream();
      stream.pipe(res);
    } catch (error) {
      console.error('Error sirviendo imagen pública:', error);
      res.status(500).json({ message: "Error al cargar imagen" });
    }
  });

  // Endpoint PRIVADO para servir imágenes privadas con autenticación
  app.get('/api/images/:filename(*)', isAuthenticated, async (req: any, res) => {
    // CORS mejorado para subdominios
    const origin = req.headers.origin;
    if (origin) {
      // Permitir todos los orígenes del mismo dominio base
      const allowedDomains = process.env.ALLOWED_DOMAINS?.split(',') || [];
      const originHost = new URL(origin).hostname;
      const baseDomain = originHost.split('.').slice(-2).join('.');
      
      // Permitir subdominios del mismo dominio o dominios configurados
      if (allowedDomains.some(d => originHost.endsWith(d)) || 
          originHost === 'localhost' || 
          baseDomain === 'aiink.com' ||
          baseDomain === 'replit.app' ||
          baseDomain === 'replit.dev') {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
    }
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Vary', 'Origin');
    
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
      // Las rutas son: .private/designs/{userId}/... o .private/uploads/{userId}/... o .private/thumbnails/{userId}/... o .private/stencils/{userId}/...
      const userPattern = new RegExp(`\\.private/(designs|uploads|thumbnails|stencils)/${userId}/`);
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
      
      // Obtener metadata
      const [metadata] = await file.getMetadata();

      // Detectar Content-Type correcto basado en extensión o metadata
      let contentType = metadata.contentType || 'image/png';

      // Detectar por extensión si metadata no está disponible
      if (!metadata.contentType) {
        if (filename.includes('.webp')) contentType = 'image/webp';
        else if (filename.includes('.avif')) contentType = 'image/avif';
        else if (filename.includes('.jpg') || filename.includes('.jpeg')) contentType = 'image/jpeg';
        else if (filename.includes('.gif')) contentType = 'image/gif';
        else if (filename.includes('.svg')) contentType = 'image/svg+xml';
      }

      // Headers optimizados para rendimiento
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'private, max-age=86400, stale-while-revalidate=604800'); // Cache 1 día, revalidar 7 días
      res.setHeader('X-Content-Type-Options', 'nosniff');

      // ETag y soporte If-None-Match
      const etag = metadata.etag || metadata.md5Hash;
      if (etag) {
        res.setHeader('ETag', etag);
        if (req.headers['if-none-match'] === etag) {
          return res.status(304).end();
        }
      }

      // Stream optimizado con manejo de errores mejorado
      const readStream = file.createReadStream();
      if (metadata.size) {
        res.setHeader('Content-Length', metadata.size);
      }
      
      // Manejo mejorado de errores y limpieza
      readStream.on('error', (error) => {
        console.error('Error en stream de imagen:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error al transmitir imagen' });
        }
        readStream.destroy();
      });
      
      // Limpiar recursos al cerrar conexión
      res.on('close', () => {
        readStream.destroy();
      });
      
      readStream.pipe(res);
    } catch (error) {
      console.error('Error sirviendo imagen privada:', error);
      res.status(404).json({ message: "Imagen no encontrada" });
    }
  });

  // ===============================
  // STRIPE PAYMENT ROUTES
  // ===============================
  
  // Helper function to check if Stripe is available
  const checkStripe = (res: any) => {
    if (!stripe) {
      res.status(503).json({ 
        error: "Payment system temporarily unavailable",
        message: "Stripe no está configurado correctamente" 
      });
      return false;
    }
    return true;
  };

  // STRIPE WEBHOOK - Procesa eventos de pagos completados
  app.post('/api/stripe/webhook', async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ error: "Stripe not configured" });
    }

    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('⚠️ STRIPE_WEBHOOK_SECRET not configured');
      // In development, process the webhook without signature verification
      if (process.env.NODE_ENV === 'development') {
        console.log('Processing webhook in development mode (no signature verification)');
        try {
          const event = JSON.parse(req.body.toString());
          await handleStripeWebhook(event);
          return res.json({ received: true });
        } catch (error) {
          console.error('Error processing webhook:', error);
          return res.status(400).json({ error: 'Webhook processing failed' });
        }
      }
      return res.status(400).json({ error: 'Webhook secret not configured' });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error(`⚠️ Webhook signature verification failed:`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Process the webhook event
    await handleStripeWebhook(event);
    res.json({ received: true });
  });

  // Helper function to handle different webhook events
  async function handleStripeWebhook(event: any) {
    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('💰 Payment succeeded:', {
          id: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          metadata: paymentIntent.metadata
        });

        // Update user credits if this is a credit pack purchase
        if (paymentIntent.metadata?.type === 'credit_pack' && paymentIntent.metadata?.credits) {
          const userId = paymentIntent.metadata.userId;
          const credits = parseInt(paymentIntent.metadata.credits);
          
          try {
            const user = await storage.getUser(userId);
            if (user) {
              const newCredits = (user.credits || 0) + credits;
              await storage.upsertUser({
                ...user,
                credits: newCredits
              });
              console.log(`✅ Added ${credits} credits to user ${userId}. New balance: ${newCredits}`);
            }
          } catch (error) {
            console.error('Error updating user credits:', error);
          }
        }
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        console.log('📅 Subscription event:', {
          type: event.type,
          id: subscription.id,
          status: subscription.status,
          customer: subscription.customer
        });

        // Update user subscription status
        try {
          const user = await storage.getUserByStripeCustomerId(subscription.customer as string);
          
          if (user) {
            // Determine tier from subscription items using centralized mapping
            const priceId = subscription.items?.data?.[0]?.price?.id;
            const tier = priceId ? (PRICE_ID_TO_TIER[priceId] ?? 'basic') : 'basic';
            
            console.log('✅ Mapped price ID to tier:', {
              priceId,
              tier,
              found: priceId ? PRICE_ID_TO_TIER[priceId] !== undefined : false
            });

            await storage.upsertUser({
              ...user,
              stripeSubscriptionId: subscription.id,
              subscriptionTier: tier
            });
            console.log(`✅ Updated subscription for user ${user.id}: ${tier} (${subscription.status})`);
          }
        } catch (error) {
          console.error('Error updating subscription:', error);
        }
        break;

      case 'customer.subscription.deleted':
        const deletedSub = event.data.object;
        console.log('❌ Subscription cancelled:', deletedSub.id);

        // Remove subscription from user
        try {
          const user = await storage.getUserByStripeSubscriptionId(deletedSub.id);
          
          if (user) {
            await storage.upsertUser({
              ...user,
              stripeSubscriptionId: null,
              subscriptionTier: 'free'
            });
            console.log(`✅ Removed subscription for user ${user.id}`);
          }
        } catch (error) {
          console.error('Error removing subscription:', error);
        }
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        console.log('📧 Invoice paid:', {
          id: invoice.id,
          subscription: invoice.subscription,
          amount: invoice.amount_paid / 100
        });
        // Could send receipt email here
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        console.log('⚠️ Invoice payment failed:', {
          id: failedInvoice.id,
          subscription: failedInvoice.subscription
        });
        // Could send payment failure notification here
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  // Credit pack prices are now imported from shared configuration

  // Create payment intent for one-time payments (credit packs)
  app.post("/api/create-payment-intent", isAuthenticated, async (req: any, res) => {
    try {
      if (!checkStripe(res)) return;

      const { credits, type = "credit_pack" } = req.body;
      
      // SECURITY: Validate credit package exists using centralized config
      const pack = getCreditPackByCredits(credits);
      if (!pack) {
        console.error(`Invalid credit package requested: ${credits}`);
        return res.status(400).json({ 
          error: "Invalid credit package",
          message: "El paquete de créditos seleccionado no es válido" 
        });
      }
      
      // SECURITY: Always use server-side validated price (already in cents)
      const amount = pack.price;
      
      console.log('Creating payment intent:', {
        credits: pack.credits,
        amount: amount,
        amountInDollars: amount / 100,
        userId: req.user.claims.sub
      });

      const paymentIntent = await stripe!.paymentIntents.create({
        amount: amount, // Already in cents, no conversion needed
        currency: "usd",
        metadata: {
          userId: req.user.claims.sub,
          type,
          credits: pack.credits.toString()
        }
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ 
        message: "Error creating payment intent: " + error.message 
      });
    }
  });

  // Get or create subscription for subscription plans
  app.post('/api/get-or-create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      if (!checkStripe(res)) return;

      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // If user already has a subscription, return it
      if (user.stripeSubscriptionId) {
        try {
          const subscription = await stripe!.subscriptions.retrieve(user.stripeSubscriptionId);
          
          if (subscription.status === 'active') {
            const latestInvoice = await stripe!.invoices.retrieve(subscription.latest_invoice as string, {
              expand: ['payment_intent']
            });
            
            return res.json({
              subscriptionId: subscription.id,
              status: subscription.status,
              clientSecret: (latestInvoice as any).payment_intent?.client_secret || null,
            });
          }
        } catch (error) {
          console.error("Error retrieving existing subscription:", error);
          // Continue to create new subscription if current one is invalid
        }
      }
      
      if (!user.email) {
        return res.status(400).json({ error: 'No user email on file' });
      }

      // Create or get Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe!.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          metadata: { userId }
        });
        
        stripeCustomerId = customer.id;
        
        // Update user with Stripe customer ID
        await storage.upsertUser({
          ...user,
          stripeCustomerId
        });
      }

      const { plan = "basic", billingPeriod = "monthly" } = req.body;
      
      // Use centralized getPriceId function to get the Stripe price ID
      const priceId = getPriceId(plan, billingPeriod as 'monthly' | 'annual');
      if (!priceId) {
        return res.status(400).json({ error: "Invalid plan or billing period" });
      }

      // Create subscription with proper payment intent handling
      const subscription = await stripe!.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user with subscription info
      await storage.upsertUser({
        ...user,
        stripeCustomerId,
        stripeSubscriptionId: subscription.id,
        subscriptionTier: plan
      });
  
      // Extract clientSecret from the expanded invoice - IMPROVED LOGIC
      let clientSecret = null;
      
      // Check if latest_invoice is expanded
      if (subscription.latest_invoice && typeof subscription.latest_invoice === 'object') {
        const invoice = subscription.latest_invoice as any;
        
        // Check if payment_intent is expanded
        if (invoice.payment_intent) {
          if (typeof invoice.payment_intent === 'string') {
            // If payment_intent is just an ID, retrieve it
            const paymentIntent = await stripe!.paymentIntents.retrieve(invoice.payment_intent);
            clientSecret = paymentIntent.client_secret;
          } else if (typeof invoice.payment_intent === 'object') {
            // If payment_intent is expanded, get client_secret directly
            clientSecret = invoice.payment_intent.client_secret;
          }
        }
      }
      
      // If still no clientSecret, try retrieving the invoice directly
      if (!clientSecret && subscription.latest_invoice) {
        try {
          const invoiceId = typeof subscription.latest_invoice === 'string' 
            ? subscription.latest_invoice 
            : (subscription.latest_invoice as any).id;
            
          const invoice = await stripe!.invoices.retrieve(invoiceId, {
            expand: ['payment_intent']
          });
          
          if ((invoice as any).payment_intent && typeof (invoice as any).payment_intent === 'object') {
            clientSecret = ((invoice as any).payment_intent as any).client_secret;
          }
        } catch (error) {
          console.error('Error retrieving invoice for clientSecret:', error);
        }
      }
      
      // Log for debugging
      console.log('Subscription created:', {
        subscriptionId: subscription.id,
        status: subscription.status,
        hasClientSecret: !!clientSecret,
        plan: plan,
        billingPeriod: billingPeriod
      });
      
      if (!clientSecret) {
        console.error('WARNING: No clientSecret obtained for subscription');
      }
      
      res.json({
        subscriptionId: subscription.id,
        status: subscription.status,
        clientSecret: clientSecret,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ 
        error: "Error creating subscription: " + error.message 
      });
    }
  });

  // Get subscription status
  app.get('/api/subscription/status', isAuthenticated, async (req: any, res) => {
    try {
      if (!checkStripe(res)) return;

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user?.stripeSubscriptionId) {
        return res.json({ status: 'none', tier: 'free' });
      }

      const subscription = await stripe!.subscriptions.retrieve(user.stripeSubscriptionId);
      
      res.json({
        status: subscription.status,
        tier: user.subscriptionTier || 'free',
        currentPeriodEnd: (subscription as any).current_period_end,
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end
      });
    } catch (error: any) {
      console.error("Error getting subscription status:", error);
      res.status(500).json({ error: "Error retrieving subscription status" });
    }
  });

  // Endpoint para servir imágenes desde Object Storage - compatible con URLs antiguas
  // NOTA: Este endpoint es público para permitir que las imágenes se muestren sin autenticación
  app.get(["/objects/:filePath(*)", "/api/images/:filePath(*)"], async (req, res) => {
    let filePath = req.params.filePath;
    
    try {
      // Decodificar URL-encoded paths (por ejemplo: .private%2Fstencils%2F...)
      filePath = decodeURIComponent(filePath);
      
      // Si viene de la ruta /api/images/, buscar en diferentes ubicaciones
      const bucketName = OBJECT_STORAGE_BUCKET;
      const bucket = objectStorageClient.bucket(bucketName);
      
      // Intentar encontrar el archivo en diferentes rutas
      let file;
      let exists = false;
      
      // Si la ruta comienza con .private/, buscar ahí primero
      if (filePath.startsWith('.private/')) {
        file = bucket.file(filePath);
        [exists] = await file.exists();
      }
      
      // Si no existe o no es una ruta .private/, buscar en public/
      if (!exists) {
        // Extraer solo el nombre del archivo de la ruta
        const fileName = filePath.split('/').pop();
        if (fileName) {
          // Buscar en public/ con diferentes patrones
          const possiblePaths = [
            `public/${filePath}`,
            `public/${fileName}`,
            filePath // Ruta directa
          ];
          
          for (const path of possiblePaths) {
            file = bucket.file(path);
            [exists] = await file.exists();
            if (exists) break;
          }
        }
      }
      
      if (!exists || !file) {
        console.log(`Image not found: ${filePath}`);
        return res.status(404).json({ error: "File not found" });
      }
      
      // Obtener metadata del archivo
      const [metadata] = await file.getMetadata();
      
      // Configurar headers de respuesta
      res.set({
        'Content-Type': metadata.contentType || 'application/octet-stream',
        'Content-Length': metadata.size,
        'Cache-Control': 'public, max-age=3600'
      });
      
      // Stream del archivo a la respuesta
      const stream = file.createReadStream();
      stream.pipe(res);
    } catch (error) {
      console.error("Error serving object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
