// Script para arreglar imágenes expiradas de Replicate
const { db } = require('./server/db');
const { userGallery } = require('./shared/schema');
const { eq } = require('drizzle-orm');
const { ObjectStorageService, objectStorageClient } = require('./server/objectStorage');

async function fixExpiredImages() {
  console.log('=== ARREGLANDO IMÁGENES EXPIRADAS ===\n');
  
  try {
    // 1. Obtener todas las imágenes con URLs de Replicate
    const items = await db.select()
      .from(userGallery)
      .where(eq(userGallery.type, 'design'))
      .limit(100);
    
    console.log(`Encontradas ${items.length} imágenes en la galería\n`);
    
    let fixed = 0;
    let failed = 0;
    
    for (const item of items) {
      // Solo procesar URLs de Replicate
      if (item.imageUrl && item.imageUrl.includes('replicate.delivery')) {
        console.log(`\nProcesando: ${item.title}`);
        console.log(`URL antigua: ${item.imageUrl.substring(0, 50)}...`);
        
        try {
          // Intentar descargar la imagen
          const response = await fetch(item.imageUrl);
          
          if (response.ok) {
            // La imagen aún existe, guardarla permanentemente
            const imageBuffer = Buffer.from(await response.arrayBuffer());
            
            // Generar nombre único
            const imageId = `${Date.now()}_${item.userId}_${Math.random().toString(36).substring(2, 9)}`;
            const fileName = `designs/${imageId}.png`;
            
            // Subir a Object Storage
            const bucketName = 'replit-objstore-12f3cfa6-c32d-4020-8906-8c1a7e0f108b';
            const bucket = objectStorageClient.bucket(bucketName);
            const file = bucket.file(`.private/${fileName}`);
            
            await file.save(imageBuffer, {
              metadata: {
                contentType: 'image/png',
                cacheControl: 'public, max-age=31536000',
              }
            });
            
            // Actualizar URL en la base de datos
            const permanentUrl = `/objects/${fileName}`;
            
            await db.update(userGallery)
              .set({ 
                imageUrl: permanentUrl,
                thumbnailUrl: permanentUrl 
              })
              .where(eq(userGallery.id, item.id));
            
            console.log(`✅ Guardada permanentemente en: ${permanentUrl}`);
            fixed++;
          } else {
            console.log(`❌ Imagen expirada (404) - no se puede recuperar`);
            failed++;
          }
        } catch (error) {
          console.log(`❌ Error procesando imagen: ${error.message}`);
          failed++;
        }
      }
    }
    
    console.log('\n=== RESUMEN ===');
    console.log(`✅ Arregladas: ${fixed} imágenes`);
    console.log(`❌ Fallidas: ${failed} imágenes (ya expiraron)`);
    console.log('\nNOTA: Las imágenes que ya expiraron no se pueden recuperar.');
    console.log('Las NUEVAS imágenes generadas se guardarán permanentemente.');
    
  } catch (error) {
    console.error('Error en el script:', error);
  }
  
  process.exit(0);
}

// Ejecutar el script
fixExpiredImages();