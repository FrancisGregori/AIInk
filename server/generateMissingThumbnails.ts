import { db } from './db';
import { userGallery } from '@shared/schema';
import { eq, isNull } from 'drizzle-orm';
import { ObjectStorageService } from './objectStorage';

async function generateMissingThumbnails() {
  console.log('🔍 Buscando imagens sem thumbnails...');

  try {
    // Buscar todas as imagens que não têm thumbnail
    const itemsWithoutThumbnails = await db
      .select()
      .from(userGallery)
      .where(isNull(userGallery.thumbnailUrl));

    console.log(`📊 Encontradas ${itemsWithoutThumbnails.length} imagens sem thumbnails`);

    if (itemsWithoutThumbnails.length === 0) {
      console.log('✅ Todas as imagens já têm thumbnails!');
      return;
    }

    const objectStorage = new ObjectStorageService();
    let successCount = 0;
    let errorCount = 0;

    for (const item of itemsWithoutThumbnails) {
      try {
        console.log(`\n🖼️ Processando: ${item.id}`);
        console.log(`   Tipo: ${item.type}`);
        console.log(`   Título: ${item.title}`);

        // Determinar a pasta correta
        const folder = item.type === 'stencil' ? 'stencils' : 'designs';

        // Gerar thumbnail
        let thumbnailUrl = null;

        if (item.imageUrl.startsWith('data:')) {
          // Se for base64
          const uploadResult = await objectStorage.uploadImageFromBase64(
            item.imageUrl,
            folder as any,
            item.userId
          );
          thumbnailUrl = uploadResult.thumbnailUrl;

          // Também atualizar a imageUrl para usar a versão do storage
          await db
            .update(userGallery)
            .set({
              imageUrl: uploadResult.imageUrl,
              thumbnailUrl: uploadResult.thumbnailUrl,
              updatedAt: new Date()
            })
            .where(eq(userGallery.id, item.id));

          console.log(`   ✅ Thumbnail gerada e imageUrl atualizada: ${thumbnailUrl}`);
        } else if (item.imageUrl.startsWith('http')) {
          // Se for URL externa
          const uploadResult = await objectStorage.uploadImageFromUrl(
            item.imageUrl,
            folder as any,
            item.userId
          );
          thumbnailUrl = uploadResult.thumbnailUrl;

          // Atualizar apenas a thumbnail
          await db
            .update(userGallery)
            .set({
              thumbnailUrl: uploadResult.thumbnailUrl,
              updatedAt: new Date()
            })
            .where(eq(userGallery.id, item.id));

          console.log(`   ✅ Thumbnail gerada: ${thumbnailUrl}`);
        } else {
          console.log(`   ⏭️ Pulando - já é uma URL interna: ${item.imageUrl}`);
          continue;
        }

        successCount++;

      } catch (error) {
        console.error(`   ❌ Erro ao processar ${item.id}:`, error);
        errorCount++;
      }

      // Pequena pausa para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📈 Resumo:');
    console.log(`   ✅ Sucesso: ${successCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    console.log(`   📊 Total: ${itemsWithoutThumbnails.length}`);

  } catch (error) {
    console.error('❌ Erro fatal:', error);
  } finally {
    process.exit(0);
  }
}

// Executar
generateMissingThumbnails();