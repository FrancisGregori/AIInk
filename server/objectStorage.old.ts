import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";
import sharp from "sharp";

const REPLIT_SIDECAR_ENDPOINT =
  process.env.REPLIT_SIDECAR_ENDPOINT || "http://127.0.0.1:1106";

// Nombre del bucket de object storage. Se puede configurar vía variable de entorno
// para mantenerlo consistente en toda la aplicación.
export const OBJECT_STORAGE_BUCKET =
  process.env.OBJECT_STORAGE_BUCKET ||
  "replit-objstore-12f3cfa6-c32d-4020-8906-8c1a7e0f108b";

// Detectar si estamos en desarrollo
const isDevelopment = process.env.NODE_ENV === "development";
// Detectar si estamos en Replit (tienen un sidecar especial)
const isReplitEnvironment = !!process.env.REPLIT_DEPLOYMENT;

console.log('=== OBJECT STORAGE CONFIG ===');
console.log('Environment:', process.env.NODE_ENV);
console.log('Is Development:', isDevelopment);
console.log('Replit Deployment:', process.env.REPLIT_DEPLOYMENT || 'not set');
console.log('Is Replit Environment:', isReplitEnvironment);

// Object storage client para interactuar con el servicio
let objectStorageClient: Storage;

if (isReplitEnvironment && isDevelopment) {
  // Configuración para DESARROLLO en REPLIT (usando sidecar)
  objectStorageClient = new Storage({
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
} else if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
  // Configuración para desarrollo LOCAL con credenciales explícitas
  try {
    const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS);
    objectStorageClient = new Storage({
      projectId: credentials.project_id || process.env.GOOGLE_CLOUD_PROJECT || "",
      credentials: credentials,
    });
    console.log('Using explicit Google Cloud credentials from environment');
  } catch (error) {
    console.error('Failed to parse GOOGLE_CLOUD_CREDENTIALS:', error);
    // Fallback to default
    objectStorageClient = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT || "",
    });
  }
} else {
  // Configuración para DEPLOYMENT (credenciales automáticas) o desarrollo sin credenciales
  objectStorageClient = new Storage({
    projectId: process.env.GOOGLE_CLOUD_PROJECT || "",
  });
}

export { objectStorageClient };

console.log('Object Storage Client initialized');

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
  private storageAvailable: boolean = true;

  constructor() {
    // Usar el bucket configurado
    this.bucketName = OBJECT_STORAGE_BUCKET;

    // Check if storage is available
    if (!process.env.GOOGLE_CLOUD_CREDENTIALS && !process.env.REPLIT_DEPLOYMENT) {
      console.warn('⚠️ Google Cloud Storage not configured - uploads will return original URLs');
      this.storageAvailable = false;
    }
  }

  // Obtener directorio privado
  getPrivateObjectDir(): string {
    return process.env.PRIVATE_OBJECT_DIR || `/${this.bucketName}/.private`;
  }

  // Subir imagen desde base64 a Object Storage
  async uploadImageFromBase64(
    base64Data: string,
    folder: 'designs' | 'stencils' | 'thumbnails',
    userId: string,
    storagePath?: string // Use storagePath instead of userId for storage organization
  ): Promise<{ imageUrl: string; thumbnailUrl: string }> {
    // If storage is not available in development, return the base64 as-is
    if (!this.storageAvailable) {
      console.log('Storage not available - returning base64 URL as-is');
      return {
        imageUrl: base64Data,
        thumbnailUrl: base64Data
      };
    }

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
      
      // Generar thumbnail optimizado (400x400 para todos os tamanhos de grid)
      // Usar PNG para preservar transparência
      const isStencil = folder === 'stencils';
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(400, 400, {
          fit: isStencil ? 'inside' : 'cover',
          position: 'center',
          withoutEnlargement: true,
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Fundo transparente
        })
        .png({
          compressionLevel: 9, // Máxima compressão PNG
          quality: 95
        })
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
      console.log(`Tamaño original: ${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Tamaño miniatura: ${(thumbnailBuffer.length / 1024).toFixed(2)} KB`);
      
      return { imageUrl, thumbnailUrl };
    } catch (error) {
      console.error('Error subiendo imagen a Object Storage:', error);
      throw new Error('Failed to upload image to Object Storage');
    }
  }

  // Subir imagen desde URL externa
  async uploadImageFromUrl(
    sourceUrl: string,
    folder: 'designs' | 'stencils' | 'thumbnails',
    userId: string
  ): Promise<{ imageUrl: string; thumbnailUrl: string }> {
    // If storage is not available in development, return the URL as-is
    if (!this.storageAvailable) {
      console.log('Storage not available - returning URL as-is');
      return {
        imageUrl: sourceUrl,
        thumbnailUrl: sourceUrl
      };
    }

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
      
      // Generar thumbnail optimizado (400x400)
      const isStencil = folder === 'stencils';
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(400, 400, {
          fit: isStencil ? 'inside' : 'cover',
          position: 'center',
          withoutEnlargement: true,
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Fundo transparente
        })
        .png({
          compressionLevel: 9, // Máxima compressão PNG
          quality: 95
        })
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
      console.log(`Tamaño miniatura: ${(thumbnailBuffer.length / 1024).toFixed(2)} KB`);
      
      return { imageUrl, thumbnailUrl };
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