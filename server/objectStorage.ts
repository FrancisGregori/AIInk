import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";
import sharp from "sharp";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// Object storage client para interactuar con el servicio
export const objectStorageClient = new Storage({
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
    this.bucketName = "replit-objstore-12f3cfa6-c32d-4020-8906-8c1a7e0f108b";
  }

  // Obtener directorio privado
  getPrivateObjectDir(): string {
    return process.env.PRIVATE_OBJECT_DIR || `/${this.bucketName}/.private`;
  }

  // Subir imagen desde base64 a Object Storage
  async uploadImageFromBase64(
    base64Data: string,
    folder: 'designs' | 'stencils' | 'thumbnails',
    userId: string
  ): Promise<{ imageUrl: string; thumbnailUrl: string }> {
    try {
      console.log(`=== SUBIENDO IMAGEN A OBJECT STORAGE ===`);
      console.log(`Carpeta: ${folder}, Usuario: ${userId}`);
      
      // Limpiar el prefijo de base64 si existe
      const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Buffer.from(base64Clean, 'base64');
      
      // Generar ID único para el archivo
      const fileId = randomUUID();
      const timestamp = Date.now();
      const fileName = `${folder}/${userId}/${timestamp}_${fileId}.png`;
      const thumbnailName = `thumbnails/${userId}/${timestamp}_${fileId}_thumb.png`;
      
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
      
      // Generar URLs públicas
      const imageUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
      const thumbnailUrl = `https://storage.googleapis.com/${this.bucketName}/${thumbnailName}`;
      
      console.log(`=== IMAGEN SUBIDA EXITOSAMENTE ===`);
      console.log(`URL Original: ${imageUrl}`);
      console.log(`URL Miniatura: ${thumbnailUrl}`);
      console.log(`Tamaño original: ${imageBuffer.length} bytes`);
      console.log(`Tamaño miniatura: ${thumbnailBuffer.length} bytes`);
      
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
    try {
      console.log(`=== DESCARGANDO Y SUBIENDO IMAGEN ===`);
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
      const fileName = `${folder}/${userId}/${timestamp}_${fileId}.png`;
      const thumbnailName = `thumbnails/${userId}/${timestamp}_${fileId}_thumb.png`;
      
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
      
      // Generar URLs públicas
      const imageUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
      const thumbnailUrl = `https://storage.googleapis.com/${this.bucketName}/${thumbnailName}`;
      
      console.log(`=== IMAGEN PROCESADA Y SUBIDA ===`);
      console.log(`URL Original: ${imageUrl}`);
      console.log(`URL Miniatura: ${thumbnailUrl}`);
      
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