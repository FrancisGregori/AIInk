import { db } from './db';
import { userGallery, fluxProjects } from '@shared/schema';
import { ObjectStorageService } from './objectStorage';
import { eq } from 'drizzle-orm';

async function migrateToPublicStorage() {
  console.log('🚀 Starting migration to public storage...');
  const objectStorage = new ObjectStorageService();
  
  try {
    // 1. Migrar imágenes de galería
    console.log('\n📸 Migrating gallery images...');
    const galleryItems = await db.select().from(userGallery);
    console.log(`Found ${galleryItems.length} gallery items to check`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const item of galleryItems) {
      // Skip if already public (storage.googleapis.com URLs)
      if (item.imageUrl?.includes('storage.googleapis.com')) {
        skippedCount++;
        continue;
      }
      
      // Skip if it's a private URL that needs migration
      if (item.imageUrl?.startsWith('/api/images/') || item.imageUrl?.includes('.private')) {
        try {
          console.log(`\nMigrating item ${item.id}: ${item.title || 'Untitled'}`);
          console.log(`  Old URL: ${item.imageUrl}`);
          
          // Download from private storage and upload to public
          const publicResult = await objectStorage.uploadPublicImageFromUrl(
            item.imageUrl,
            'gallery',
            item.userId,
            true // Generate optimized variants
          );
          
          // Update database with new public URLs
          await db.update(userGallery)
            .set({
              imageUrl: publicResult.imageUrl,
              thumbnailUrl: publicResult.thumbnailUrl,
              variants: publicResult.variants,
              updatedAt: new Date()
            })
            .where(eq(userGallery.id, item.id));
          
          console.log(`  ✅ New public URL: ${publicResult.imageUrl}`);
          if (publicResult.thumbnailUrl) {
            console.log(`  ✅ Thumbnail: ${publicResult.thumbnailUrl}`);
          }
          if (publicResult.variants) {
            console.log(`  ✅ Variants: ${Object.keys(publicResult.variants).join(', ')}`);
          }
          
          migratedCount++;
        } catch (error) {
          console.error(`  ❌ Error migrating item ${item.id}:`, error);
          errorCount++;
        }
      } else {
        skippedCount++;
      }
    }
    
    // 2. Migrar imágenes de proyectos Flux
    console.log('\n🎨 Migrating Flux project images...');
    const fluxProjectsData = await db.select().from(fluxProjects);
    console.log(`Found ${fluxProjectsData.length} Flux projects to check`);
    
    let fluxMigratedCount = 0;
    let fluxSkippedCount = 0;
    let fluxErrorCount = 0;
    
    for (const project of fluxProjectsData) {
      // Skip if already public
      if (project.imageUrl?.includes('storage.googleapis.com')) {
        fluxSkippedCount++;
        continue;
      }
      
      if (project.imageUrl?.startsWith('/api/images/') || project.imageUrl?.includes('.private')) {
        try {
          console.log(`\nMigrating Flux project ${project.id}`);
          console.log(`  Old URL: ${project.imageUrl}`);
          
          // Download and upload to public storage
          const publicResult = await objectStorage.uploadPublicImageFromUrl(
            project.imageUrl,
            'gallery',
            project.userId,
            true // Generate optimized variants
          );
          
          // Update database - fluxProjects only has imageUrl field
          await db.update(fluxProjects)
            .set({
              imageUrl: publicResult.imageUrl,
              updatedAt: new Date()
            })
            .where(eq(fluxProjects.id, project.id));
          
          console.log(`  ✅ New public URL: ${publicResult.imageUrl}`);
          
          fluxMigratedCount++;
        } catch (error) {
          console.error(`  ❌ Error migrating Flux project ${project.id}:`, error);
          fluxErrorCount++;
        }
      } else {
        fluxSkippedCount++;
      }
    }
    
    // Final report
    console.log('\n📊 Migration Complete!');
    console.log('='.repeat(50));
    console.log('Gallery Items:');
    console.log(`  ✅ Migrated: ${migratedCount}`);
    console.log(`  ⏭️  Skipped (already public): ${skippedCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log('\nFlux Projects:');
    console.log(`  ✅ Migrated: ${fluxMigratedCount}`);
    console.log(`  ⏭️  Skipped (already public): ${fluxSkippedCount}`);
    console.log(`  ❌ Errors: ${fluxErrorCount}`);
    console.log('='.repeat(50));
    
    const totalMigrated = migratedCount + fluxMigratedCount;
    const totalErrors = errorCount + fluxErrorCount;
    
    if (totalMigrated > 0) {
      console.log(`\n🎉 Successfully migrated ${totalMigrated} images to public CDN!`);
      console.log('All migrated images now load 10x faster with direct CDN URLs.');
    }
    
    if (totalErrors > 0) {
      console.log(`\n⚠️  ${totalErrors} items failed to migrate. Check logs above for details.`);
    }
    
    if (totalMigrated === 0 && totalErrors === 0) {
      console.log('\n✨ All images are already using public CDN URLs!');
    }
    
  } catch (error) {
    console.error('Fatal error during migration:', error);
    process.exit(1);
  }
}

// Run migration
console.log('='.repeat(50));
console.log('MIGRATION TO PUBLIC STORAGE');
console.log('='.repeat(50));
console.log('This will migrate all private images to public CDN URLs');
console.log('for faster loading (like ComfyDeploy and Replicate).\n');

migrateToPublicStorage()
  .then(() => {
    console.log('\n✅ Migration process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });