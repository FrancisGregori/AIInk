// Script para limpiar imágenes base64 problemáticas de la galería
// y verificar que las nuevas imágenes se guarden correctamente

import { db } from './server/db.js';
import { userGallery } from './shared/schema.js';
import { eq, like } from 'drizzle-orm';

async function cleanBase64Images() {
  console.log('=== LIMPIANDO IMÁGENES BASE64 DE LA GALERÍA ===');
  
  try {
    // Buscar todas las imágenes que empiezan con data:image (base64)
    const base64Images = await db
      .select()
      .from(userGallery)
      .where(like(userGallery.imageUrl, 'data:image%'))
      .limit(100);
    
    console.log(`Encontradas ${base64Images.length} imágenes en base64`);
    
    if (base64Images.length > 0) {
      // Mostrar algunas para verificar
      console.log('\nPrimeras 3 imágenes base64 encontradas:');
      base64Images.slice(0, 3).forEach((img, i) => {
        console.log(`${i + 1}. ID: ${img.id}`);
        console.log(`   Título: ${img.title}`);
        console.log(`   URL (primeros 100 chars): ${img.imageUrl.substring(0, 100)}...`);
        console.log(`   Creada: ${img.createdAt}`);
        console.log('---');
      });
      
      // Preguntar si eliminar
      console.log('\n⚠️  ADVERTENCIA: Estas imágenes base64 están causando problemas de rendimiento.');
      console.log('Se recomienda eliminarlas para que los usuarios generen nuevas imágenes con URLs correctas.');
      console.log('Las nuevas generaciones usarán URLs de Replicate directamente.\n');
      
      // Eliminar imágenes base64 problemáticas
      console.log('\nEliminando imágenes base64...');
      for (const img of base64Images) {
        await db.delete(userGallery).where(eq(userGallery.id, img.id));
        console.log(`✓ Eliminada imagen ${img.id}`);
      }
      console.log(`\n✅ ${base64Images.length} imágenes base64 eliminadas exitosamente`);
    } else {
      console.log('✅ No se encontraron imágenes base64. La galería está limpia.');
    }
    
    // Verificar imágenes con URLs correctas
    console.log('\n=== VERIFICANDO IMÁGENES CON URLs CORRECTAS ===');
    const urlImages = await db
      .select()
      .from(userGallery)
      .where(like(userGallery.imageUrl, 'http%'))
      .limit(5);
    
    console.log(`\nEncontradas ${urlImages.length} imágenes con URLs HTTP:`);
    urlImages.forEach((img, i) => {
      console.log(`${i + 1}. ID: ${img.id}`);
      console.log(`   URL: ${img.imageUrl}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

cleanBase64Images();