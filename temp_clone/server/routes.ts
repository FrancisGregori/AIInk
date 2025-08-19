import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

import { z } from "zod";
import Replicate from "replicate";
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';

import { db } from "./db";
import { generatedImages } from "@shared/schema";
import { desc } from "drizzle-orm";
import { streamChatResponseGemini } from "./services/gemini";
import { supabaseAdmin, STORAGE_BUCKET } from "./lib/supabase";
import { authMiddleware, optionalAuthMiddleware, type AuthRequest } from "./middleware/auth";

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
  // Serve static images from public directory
  app.use('/images', express.static(join(process.cwd(), 'public', 'images')));
  // Serve individual images (converts base64 to binary for better performance)
  app.get("/api/image/:id", async (req, res) => {
    try {
      const imageId = parseInt(req.params.id);
      console.log(`Image request for ID: ${imageId} from ${req.headers.host}`);
      
      const image = await storage.getGeneratedImage(imageId);
      
      if (!image || !image.imageUrl) {
        console.log(`Image not found for ID: ${imageId}`);
        return res.status(404).json({ error: "Image not found" });
      }

      // If it's a base64 data URL, convert to binary
      if (image.imageUrl.startsWith('data:image/')) {
        const base64Data = image.imageUrl.split(',')[1];
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        console.log(`Serving binary image for ID: ${imageId}, size: ${imageBuffer.length} bytes`);
        
        res.set({
          'Content-Type': 'image/png',
          'Content-Length': imageBuffer.length,
          'Cache-Control': 'public, max-age=31536000',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cross-Origin-Resource-Policy': 'cross-origin'
        });
        
        return res.send(imageBuffer);
      }
      
      // If it's a regular URL, redirect
      console.log(`Redirecting to URL for ID: ${imageId}`);
      res.redirect(image.imageUrl);
    } catch (error) {
      console.error("Error serving image:", error);
      res.status(500).json({ error: "Failed to serve image" });
    }
  });

  // Proxy endpoint for Supabase images to avoid CORS issues
  app.get("/api/proxy-image", async (req, res) => {
    try {
      const imageUrl = req.query.url as string;
      
      if (!imageUrl) {
        return res.status(400).json({ error: "Image URL required" });
      }
      
      // Validate that it's a Supabase URL for security
      if (!imageUrl.includes('supabase.co')) {
        return res.status(400).json({ error: "Invalid image URL" });
      }
      
      console.log("Proxying Supabase image:", imageUrl);
      
      // Fetch the image from Supabase - public URLs don't need auth
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch image from Supabase:", response.status);
        console.error("Error details:", errorText);
        console.error("URL attempted:", imageUrl);
        return res.status(response.status).json({ error: "Failed to fetch image", details: errorText });
      }
      
      const buffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'image/png';
      
      res.set({
        'Content-Type': contentType,
        'Content-Length': buffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      });
      
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("Error proxying image:", error);
      res.status(500).json({ error: "Failed to proxy image" });
    }
  });

  // Database health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      console.log("Testing database connection...");
      console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
      
      // Simple query to test connection
      const result = await db.select().from(generatedImages).limit(1);
      
      res.json({ 
        status: "healthy",
        database: "connected",
        images_count: result.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Database health check failed:", error);
      res.status(500).json({
        status: "unhealthy", 
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  });

  // Get all generated images (PRIVATE - only for authenticated users)
  app.get("/api/images", optionalAuthMiddleware, async (req: AuthRequest, res) => {
    try {
      console.log("=== /api/images endpoint ===");
      console.log("Headers received:", req.headers.authorization ? 'Auth header present' : 'No auth header');
      console.log("req.userId:", req.userId);
      console.log("req.userEmail:", req.userEmail);
      
      // IMPORTANTE: Solo usuarios autenticados pueden ver imágenes
      if (!req.userId) {
        console.log("No authenticated user - returning empty gallery");
        return res.json([]); // Galería vacía para usuarios no autenticados
      }
      
      console.log("Fetching images for user:", req.userId);
      
      // Buscar imágenes del usuario en Supabase - SOLO LAS DEL USUARIO AUTENTICADO
      const { data: galleryImages, error } = await supabaseAdmin
        .from('user_images')
        .select('*')
        .eq('user_id', req.userId) // IMPORTANTE: Solo imágenes del usuario actual
        .in('app_source', ['ai', 'editor']) // Mostrar tanto AI como editadas
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (error) {
        console.error("Error fetching from Supabase:", error);
        return res.json([]); // Si hay error, retornar galería vacía
      }
      
      if (galleryImages && galleryImages.length > 0) {
        const lightweightImages = galleryImages.map((image: any) => ({
          id: image.id,
          prompt: image.description || 'Sin descripción', // La columna se llama 'description'
          width: 1024, // Usar valores por defecto ya que no hay metadata
          height: 1024,
          createdAt: image.created_at,
          imageUrl: image.image_url,
          appSource: image.app_source // Incluir el tipo de imagen
        }));
        
        console.log(`Returning ${lightweightImages.length} images from Supabase for user ${req.userId}`);
        return res.json(lightweightImages);
      }
      
      // Si no hay imágenes, retornar array vacío
      console.log("No images found for user");
      res.json([]);
    } catch (error) {
      console.error("DETAILED ERROR in /api/images:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      console.error("Error message:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ 
        error: "Failed to fetch images",
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : 'Internal server error'
      });
    }
  });

  // Upload image file
  app.post("/api/upload", async (req, res) => {
    try {
      const { imageData } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ error: "No image data provided" });
      }

      // Return the base64 data URL directly for Replicate API
      res.json({ imageUrl: imageData });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // Generate new image using Replicate API
  app.post("/api/generate", optionalAuthMiddleware, async (req: AuthRequest, res) => {
    try {
      const { prompt, inputImageUrl, width, height, aspectRatio, model } = generateImageSchema.parse(req.body);
      
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
        
        // Si la URL es de la API interna (/api/image/id), cargar desde base de datos
        if (inputImageUrl.startsWith('/api/image/')) {
          try {
            const imageId = parseInt(inputImageUrl.split('/').pop() || '0');
            const image = await storage.getGeneratedImage(imageId);
            
            if (image && image.imageData) {
              // Asegurar que imageData tiene el prefijo correcto
              const imageData = image.imageData.startsWith('data:') 
                ? image.imageData 
                : `data:image/png;base64,${image.imageData}`;
              input.input_image = imageData;
              console.log("Loaded image from database for ID:", imageId);
            } else if (image) {
              // La imagen existe pero no tiene imageData - obtener desde el disco directamente
              console.log("Image exists but missing imageData, loading from file system for ID:", imageId);
              try {
                const imagePath = join(process.cwd(), 'public', 'images', `${imageId}.png`);
                if (existsSync(imagePath)) {
                  const imageBuffer = readFileSync(imagePath);
                  const base64Data = imageBuffer.toString('base64');
                  input.input_image = `data:image/png;base64,${base64Data}`;
                  console.log("Successfully loaded image data from file system");
                } else {
                  throw new Error("Image file not found on disk");
                }
              } catch (fileError) {
                console.error("Error loading image from file system:", fileError);
                return res.status(400).json({ error: "Failed to retrieve reference image from storage" });
              }
            } else {
              console.error("Image not found in database for ID:", imageId);
              return res.status(400).json({ error: "Reference image not found" });
            }
          } catch (error) {
            console.error("Error loading image from database:", error);
            return res.status(400).json({ error: "Failed to load reference image" });
          }
        }
        // Si la URL es local (empieza con /images/), convertir a base64
        else if (inputImageUrl.startsWith('/images/')) {
          try {
            const imagePath = join(process.cwd(), 'public', inputImageUrl);
            if (existsSync(imagePath)) {
              const imageBuffer = readFileSync(imagePath);
              const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
              input.input_image = base64Image;
              console.log("Converted local image to base64");
            } else {
              console.error("Local image file not found:", imagePath);
              return res.status(400).json({ error: "Reference image not found" });
            }
          } catch (error) {
            console.error("Error reading local image:", error);
            return res.status(400).json({ error: "Failed to process reference image" });
          }
        } else if (inputImageUrl.startsWith('data:')) {
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
      
      // Manejar diferentes formatos de output de FLUX Kontext Max
      let imageUrl: string;
      let optimizedImageBase64: string = "";
      let thumbnailBase64: string = "";
      
      if (typeof output === 'string') {
        imageUrl = output;
      } else if (Array.isArray(output) && output.length > 0) {
        imageUrl = output[0];
      } else if (output && typeof (output as any)[Symbol.asyncIterator] === 'function') {
        // Es un stream iterable
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

          // Guardar en base de datos local
          const savedImage = await storage.createGeneratedImage({
            prompt,
            imageUrl: imageUrl as string,
            imageData: optimizedImageBase64,
            thumbnailData: thumbnailBase64,
            inputImageUrl,
            width: inputImageUrl ? 1024 : width,
            height: inputImageUrl ? 1024 : height,
            aspectRatio,
            cost: "0.05",
          });
          
          // Si el usuario está autenticado, también guardar en Supabase
          if (req.userId) {
            try {
              console.log("Saving to Supabase for user:", req.userId);
              
              // Subir imagen al storage de Supabase
              const fileName = `${req.userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
              const { data: uploadData, error: uploadError } = await supabaseAdmin
                .storage
                .from(STORAGE_BUCKET)
                .upload(fileName, imageBuffer, {
                  contentType: 'image/png',
                  upsert: false
                });
                
              if (uploadError) {
                console.error("Error uploading to Supabase storage:", uploadError);
                throw uploadError;
              }
              
              // Obtener la URL pública
              const { data: { publicUrl } } = supabaseAdmin
                .storage
                .from(STORAGE_BUCKET)
                .getPublicUrl(fileName);
              
              console.log("Image uploaded to Supabase storage:", publicUrl);
              
              // Determinar app_source basado en si es una imagen editada o generada desde cero
              const appSource = inputImageUrl ? 'editor' : 'ai';
              const { error } = await supabaseAdmin
                .from('user_images')
                .insert({
                  user_id: req.userId,
                  app_source: appSource,
                  image_url: publicUrl, // Usar la URL pública del storage
                  description: prompt, // La columna se llama 'description', no 'prompt'
                  is_public: false // Marcar como privada por defecto
                });
                
              if (error) {
                console.error("Error saving to Supabase gallery:", error);
              } else {
                console.log("Image saved to Supabase gallery for user:", req.userId);
              }
            } catch (supabaseError) {
              console.error("Failed to save to Supabase:", supabaseError);
              // No fallar la request si Supabase falla
            }
          }
          
          return res.json(savedImage);
        } catch (streamError) {
          console.error("Error reading async stream:", streamError);
          throw new Error("Failed to read image stream");
        }
      } else if (output && 'getReader' in output) {
        // Es un ReadableStream estándar
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

      // Para casos donde no se procesa stream (URL directa) - descargar y guardar
      if (typeof output === 'string' || Array.isArray(output)) {
        try {
          // Descargar la imagen desde la URL para obtener los datos base64
          const imageResponse = await fetch(imageUrl);
          if (imageResponse.ok) {
            const imageBuffer = await imageResponse.arrayBuffer();
            const base64Data = Buffer.from(imageBuffer).toString('base64');
            
            const savedImage = await storage.createGeneratedImage({
              prompt,
              imageUrl: imageUrl as string,
              imageData: base64Data,
              thumbnailData: base64Data,
              inputImageUrl,
              width: inputImageUrl ? 1024 : width,
              height: inputImageUrl ? 1024 : height,
              aspectRatio,
              cost: "0.05",
            });
            
            // Si el usuario está autenticado, también guardar en Supabase
            if (req.userId) {
              try {
                console.log("Saving to Supabase for user:", req.userId);
                
                // Subir imagen al storage de Supabase
                const fileName = `${req.userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
                const { data: uploadData, error: uploadError } = await supabaseAdmin
                  .storage
                  .from('renders')
                  .upload(fileName, Buffer.from(imageBuffer), {
                    contentType: 'image/png',
                    upsert: false
                  });
                  
                if (uploadError) {
                  console.error("Error uploading to Supabase storage:", uploadError);
                  throw uploadError;
                }
                
                // Obtener la URL pública
                const { data: { publicUrl } } = supabaseAdmin
                  .storage
                  .from('renders')
                  .getPublicUrl(fileName);
                
                console.log("Image uploaded to Supabase storage:", publicUrl);
                
                // Determinar app_source basado en si es una imagen editada o generada desde cero
                const appSource = inputImageUrl ? 'editor' : 'ai';
                const { error } = await supabaseAdmin
                  .from('user_images')
                  .insert({
                    user_id: req.userId,
                    app_source: appSource,
                    image_url: publicUrl, // Usar la URL pública del storage
                    description: prompt, // La columna se llama 'description', no 'prompt'
                    is_public: false // Marcar como privada por defecto
                  });
                  
                if (error) {
                  console.error("Error saving to Supabase gallery:", error);
                } else {
                  console.log("Image saved to Supabase gallery for user:", req.userId);
                }
              } catch (supabaseError) {
                console.error("Failed to save to Supabase:", supabaseError);
              }
            }
            
            res.json(savedImage);
          } else {
            throw new Error("Failed to download generated image");
          }
        } catch (downloadError) {
          console.error("Error downloading image:", downloadError);
          // Fallback: guardar sin datos base64
          const savedImage = await storage.createGeneratedImage({
            prompt,
            imageUrl: imageUrl as string,
            imageData: "",
            thumbnailData: "",
            inputImageUrl,
            width: inputImageUrl ? 1024 : width,
            height: inputImageUrl ? 1024 : height,
            aspectRatio,
            cost: "0.05",
          });
          
          res.json(savedImage);
        }
      }
      
    } catch (error) {
      console.error("Error generating image:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: error.errors 
        });
      }
      
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to generate image" 
      });
    }
  });

  // Cleanup broken images from non-existent "renders" bucket
  app.delete('/api/cleanup-broken-images', authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      console.log("Cleaning up broken images for user:", req.userId);
      
      // Delete images from the non-existent "renders" bucket
      const { data: deletedImages, error } = await supabaseAdmin
        .from('user_images')
        .delete()
        .eq('user_id', req.userId)
        .like('image_url', '%/renders/%')
        .select();
      
      if (error) {
        console.error("Error deleting broken images:", error);
        return res.status(500).json({ error: "Failed to cleanup images" });
      }

      const count = deletedImages?.length || 0;
      console.log(`Deleted ${count} broken images for user ${req.userId}`);
      
      res.json({ 
        success: true, 
        message: `Eliminated ${count} broken images`,
        deletedCount: count 
      });
    } catch (error) {
      console.error("Error in cleanup:", error);
      res.status(500).json({ error: "Failed to cleanup images" });
    }
  });

  // Chat endpoint with Gemini
  app.post('/api/chat/stream', async (req, res) => {
    const { messages, image } = req.body;
    
    console.log('Chat stream request received');
    console.log('Has messages:', !!messages);
    console.log('Has image:', !!image);
    console.log('Image type:', typeof image);
    
    try {
      // Convert image to base64 if needed
      let imageBase64: string | undefined;
      
      if (image) {
        console.log('Received image data URL length:', image.length);
        console.log('Image preview:', image.substring(0, 50));
        
        // Remove data URL prefix to get pure base64
        if (image.startsWith('data:')) {
          const base64Match = image.match(/^data:image\/[a-z]+;base64,(.+)$/);
          if (base64Match && base64Match[1]) {
            imageBase64 = base64Match[1];
            console.log('Extracted base64 length:', imageBase64?.length || 0);
          } else {
            console.error('Failed to extract base64 from data URL');
          }
        } else {
          // Assume it's already pure base64
          imageBase64 = image;
          console.log('Using raw image as base64');
        }
      } else {
        console.log('No image in request body');
      }
      
      console.log('Image base64 received:', imageBase64 ? 'Yes' : 'No');
      const stream = await streamChatResponseGemini(messages, imageBase64);
      
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      const reader = stream.getReader();
      const pump = async () => {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          return;
        }
        res.write(value);
        await pump();
      };
      
      await pump();
    } catch (error) {
      console.error('Chat stream error:', error);
      res.status(500).json({ error: 'Failed to generate response' });
    }
  });

  // Servir imagen completa por ID
  app.get("/api/images/:id/full", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid image ID" });
      }
      
      const image = await storage.getGeneratedImage(id);
      
      if (!image || !image.imageData) {
        return res.status(404).json({ error: "Image not found" });
      }
      
      // Convertir base64 a buffer y servir como imagen
      const imageBuffer = Buffer.from(image.imageData, 'base64');
      
      res.set({
        'Content-Type': 'image/jpeg',
        'Content-Length': imageBuffer.length,
        'Cache-Control': 'public, max-age=3600'
      });
      
      res.send(imageBuffer);
    } catch (error) {
      console.error("Error serving full image:", error);
      res.status(500).json({ error: "Failed to serve image" });
    }
  });

  // Delete an image
  app.delete("/api/images/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid image ID" });
      }
      
      if (!req.userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      console.log(`Attempting to delete image ${id} for user ${req.userId}`);
      
      // Primero verificar que la imagen pertenece al usuario
      const { data: image, error: fetchError } = await supabaseAdmin
        .from('user_images')
        .select('*')
        .eq('id', id)
        .eq('user_id', req.userId)
        .single();
        
      if (fetchError) {
        console.log("Error fetching image:", fetchError);
        console.log(`Image ID ${id} not found for user ${req.userId}`);
        
        // Intentar buscar si existe para otro usuario (solo para diagnóstico)
        const { data: anyImage } = await supabaseAdmin
          .from('user_images')
          .select('user_id')
          .eq('id', id)
          .single();
          
        if (anyImage) {
          console.log(`Image ${id} exists but belongs to different user: ${anyImage.user_id}`);
        } else {
          console.log(`Image ${id} does not exist in database`);
        }
        
        return res.status(404).json({ error: "Image not found" });
      }
      
      if (!image) {
        console.log("Image not found or doesn't belong to user");
        return res.status(404).json({ error: "Image not found" });
      }
      
      // Si la imagen tiene una URL de storage, intentar eliminar el archivo
      if (image.image_url && image.image_url.includes('storage/v1/object/public/')) {
        try {
          // Extraer el path del archivo del URL
          const urlParts = image.image_url.split('/storage/v1/object/public/');
          if (urlParts.length > 1) {
            const [bucketAndPath] = urlParts[1].split('/');
            const filePath = urlParts[1].substring(bucketAndPath.length + 1);
            
            console.log(`Attempting to delete file from storage: ${filePath}`);
            
            // Intentar eliminar de tattoo-renders primero
            const { error: deleteError } = await supabaseAdmin
              .storage
              .from('tattoo-renders')
              .remove([filePath]);
              
            if (deleteError) {
              console.log("Could not delete file from storage (might be using old renders bucket):", deleteError);
              // No fallar si no se puede eliminar el archivo del storage
            } else {
              console.log("File deleted from storage successfully");
            }
          }
        } catch (storageError) {
          console.error("Error deleting from storage:", storageError);
          // Continuar con la eliminación del registro aunque falle el storage
        }
      }
      
      // Eliminar el registro de la base de datos
      const { error: deleteError } = await supabaseAdmin
        .from('user_images')
        .delete()
        .eq('id', id)
        .eq('user_id', req.userId);
        
      if (deleteError) {
        console.error("Error deleting image from database:", deleteError);
        return res.status(500).json({ error: "Failed to delete image" });
      }
      
      console.log(`Image ${id} deleted successfully for user ${req.userId}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting image:", error);
      res.status(500).json({ error: "Failed to delete image" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
