import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { detectEnvironment } from "./detectEnvironment";

const REPLIT_SIDECAR_ENDPOINT =
  process.env.REPLIT_SIDECAR_ENDPOINT || "http://127.0.0.1:1106";

// Nombre del bucket de object storage. Se puede configurar vía variable de entorno
// para mantenerlo consistente en toda la aplicación.
export const OBJECT_STORAGE_BUCKET =
  process.env.OBJECT_STORAGE_BUCKET ||
  "replit-objstore-12f3cfa6-c32d-4020-8906-8c1a7e0f108b";

// SIEMPRE usar configuración de Replit (funciona en dev y prod)
const isDevelopment = false; // Forzar a usar siempre la configuración de producción

console.log('=== OBJECT STORAGE CONFIG ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('REPLIT_ENVIRONMENT:', process.env.REPLIT_ENVIRONMENT);
console.log('Using Replit Sidecar Config: YES');

// Object storage client - SIEMPRE usar configuración de Replit
// El sidecar funciona tanto en desarrollo como en producción
export const objectStorageClient = new Storage({
  // Configuración universal para Replit
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

console.log('Object Storage Client initialized for:', isDevelopment ? 'DEVELOPMENT' : 'DEPLOYMENT');

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

// Servicio de object storage para manejar imágenes
export class ObjectStorageService {
  private bucketName: string;
  
  constructor() {
    // Usar el bucket configurado
    this.bucketName = OBJECT_STORAGE_BUCKET;
  }

  // Obtener directorio privado
  getPrivateObjectDir(): string {
    return process.env.PRIVATE_OBJECT_DIR || `/${this.bucketName}/.private`;
  }

  // Generar versiones optimizadas de imagen
  private async generateOptimizedVersions(
    imageBuffer: Buffer,
    baseFileName: string,
    userId: string
  ): Promise<{
    variants: Record<string, Record<number, string>>;
    sizes: number[];
  }> {
    const sizes = [400, 800, 1200]; // Diferentes anchos
    const formats = ['webp', 'avif'] as const;
    const variants: Record<string, Record<number, string>> = {
      webp: {},
      avif: {}
    };
    
    const bucket = objectStorageClient.bucket(this.bucketName);
    const timestamp = Date.now();
    const fileId = randomUUID();
    
    for (const format of formats) {
      for (const width of sizes) {
        try {
          // Generar versión optimizada
          let sharpInstance = sharp(imageBuffer)
            .resize(width, null, {
              withoutEnlargement: true,
              fit: 'inside'
            });
          
          // Aplicar formato específico
          if (format === 'webp') {
            sharpInstance = sharpInstance.webp({ quality: 85 });
          } else if (format === 'avif') {
            sharpInstance = sharpInstance.avif({ quality: 80 });
          }
          
          const optimizedBuffer = await sharpInstance.toBuffer();
          
          // Guardar en Object Storage
          const fileName = `.private/optimized/${userId}/${timestamp}_${fileId}_${width}.${format}`;
          const file = bucket.file(fileName);
          
          await file.save(optimizedBuffer, {
            metadata: {
              contentType: format === 'webp' ? 'image/webp' : 'image/avif',
              cacheControl: 'public, max-age=31536000',
            },
          });
          
          // Guardar URL en el objeto de variantes
          variants[format][width] = `/api/images/${encodeURIComponent(fileName)}`;
          
          console.log(`Generated ${format} at ${width}px: ${variants[format][width]}`);
        } catch (error) {
          console.error(`Error generating ${format} at ${width}px:`, error);
        }
      }
    }
    
    return { variants, sizes };
  }

  // Subir imagen desde base64 a Object Storage con versiones optimizadas
  async uploadImageFromBase64(
    base64Data: string,
    folder: 'designs' | 'stencils' | 'thumbnails',
    userId: string,
    generateOptimized: boolean = true
  ): Promise<{ 
    imageUrl: string; 
    thumbnailUrl: string;
    variants?: Record<string, Record<number, string>>;
  }> {
    try {
      console.log(`=== SUBIENDO IMAGEN A OBJECT STORAGE (PRIVADO) ===`);
      console.log(`Carpeta: ${folder}, Usuario: ${userId}`);
      
      // Limpiar el prefijo de base64 si existe
      const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Buffer.from(base64Clean, 'base64');
      
      // Generar ID único para el archivo
      const fileId = randomUUID();
      const timestamp = Date.now();
      // IMPORTANTE: Usar directorio PRIVADO para proteger imágenes de usuarios
      const fileName = `.private/${folder}/${userId}/${timestamp}_${fileId}.png`;
      const thumbnailName = `.private/thumbnails/${userId}/${timestamp}_${fileId}_thumb.png`;
      
      // Subir imagen original
      const bucket = objectStorageClient.bucket(this.bucketName);
      const file = bucket.file(fileName);
      
      await file.save(imageBuffer, {
        metadata: {
          contentType: 'image/png',
          cacheControl: 'public, max-age=31536000', // Cache por 1 año
        },
      });
      
      // Generar y subir miniatura (máximo 400px de ancho)
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(400, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .png({ quality: 85 })
        .toBuffer();
      
      const thumbnailFile = bucket.file(thumbnailName);
      await thumbnailFile.save(thumbnailBuffer, {
        metadata: {
          contentType: 'image/png',
          cacheControl: 'public, max-age=31536000',
        },
      });
      
      // Generar URLs internas que requieren autenticación
      // Estas URLs solo funcionarán con el usuario autenticado
      const imageUrl = `/api/images/${encodeURIComponent(fileName)}`;
      const thumbnailUrl = `/api/images/${encodeURIComponent(thumbnailName)}`;
      
      console.log(`=== IMAGEN SUBIDA EXITOSAMENTE (PRIVADA) ===`);
      console.log(`URL Original: ${imageUrl}`);
      console.log(`URL Miniatura: ${thumbnailUrl}`);
      console.log(`Tamaño original: ${imageBuffer.length} bytes`);
      console.log(`Tamaño miniatura: ${thumbnailBuffer.length} bytes`);
      
      // Generar versiones optimizadas si se solicita
      let variants = undefined;
      if (generateOptimized && folder !== 'thumbnails') {
        try {
          const optimized = await this.generateOptimizedVersions(
            imageBuffer,
            fileName,
            userId
          );
          variants = optimized.variants;
          console.log('Versiones optimizadas generadas:', Object.keys(variants));
        } catch (error) {
          console.error('Error generando versiones optimizadas:', error);
        }
      }
      
      return { imageUrl, thumbnailUrl, variants };
    } catch (error) {
      console.error('Error subiendo imagen a Object Storage:', error);
      throw new Error('Failed to upload image to Object Storage');
    }
  }

  // Subir imagen desde URL externa con versiones optimizadas
  async uploadImageFromUrl(
    sourceUrl: string,
    folder: 'designs' | 'stencils' | 'thumbnails',
    userId: string,
    generateOptimized: boolean = true
  ): Promise<{ 
    imageUrl: string; 
    thumbnailUrl: string;
    variants?: Record<string, Record<number, string>>;
  }> {
    try {
      console.log(`=== DESCARGANDO Y SUBIENDO IMAGEN (PRIVADO) ===`);
      console.log(`URL origen: ${sourceUrl}`);
      
      // Descargar la imagen
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);
      
      // Generar ID único para el archivo
      const fileId = randomUUID();
      const timestamp = Date.now();
      // IMPORTANTE: Usar directorio PRIVADO para proteger imágenes de usuarios
      const fileName = `.private/${folder}/${userId}/${timestamp}_${fileId}.png`;
      const thumbnailName = `.private/thumbnails/${userId}/${timestamp}_${fileId}_thumb.png`;
      
      // Subir imagen original
      const bucket = objectStorageClient.bucket(this.bucketName);
      const file = bucket.file(fileName);
      
      await file.save(imageBuffer, {
        metadata: {
          contentType: 'image/png',
          cacheControl: 'public, max-age=31536000',
        },
      });
      
      // Generar y subir miniatura
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(400, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .png({ quality: 85 })
        .toBuffer();
      
      const thumbnailFile = bucket.file(thumbnailName);
      await thumbnailFile.save(thumbnailBuffer, {
        metadata: {
          contentType: 'image/png',
          cacheControl: 'public, max-age=31536000',
        },
      });
      
      // Generar URLs internas que requieren autenticación
      // Estas URLs solo funcionarán con el usuario autenticado
      const imageUrl = `/api/images/${encodeURIComponent(fileName)}`;
      const thumbnailUrl = `/api/images/${encodeURIComponent(thumbnailName)}`;
      
      console.log(`=== IMAGEN PROCESADA Y SUBIDA (PRIVADA) ===`);
      console.log(`URL Original: ${imageUrl}`);
      console.log(`URL Miniatura: ${thumbnailUrl}`);
      
      // Generar versiones optimizadas si se solicita
      let variants = undefined;
      if (generateOptimized && folder !== 'thumbnails') {
        try {
          const optimized = await this.generateOptimizedVersions(
            imageBuffer,
            fileName,
            userId
          );
          variants = optimized.variants;
          console.log('Versiones optimizadas generadas:', Object.keys(variants));
        } catch (error) {
          console.error('Error generando versiones optimizadas:', error);
        }
      }
      
      return { imageUrl, thumbnailUrl, variants };
    } catch (error) {
      console.error('Error procesando imagen desde URL:', error);
      throw new Error('Failed to process image from URL');
    }
  }

  // Descargar archivo desde Object Storage
  async downloadObject(file: File, res: Response, cacheTtlSec: number = 31536000) {
    try {
      // Obtener metadata del archivo
      const [metadata] = await file.getMetadata();
      
      // Configurar headers apropiados
      res.set({
        "Content-Type": metadata.contentType || "image/png",
        "Content-Length": metadata.size,
        "Cache-Control": `public, max-age=${cacheTtlSec}`,
      });

      // Stream del archivo a la respuesta
      const stream = file.createReadStream();

      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }
}