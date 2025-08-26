// Test simple para verificar que Object Storage funciona después del fix
import { ObjectStorageService } from './server/objectStorage.js';

async function testUpload() {
  console.log('=== TESTING OBJECT STORAGE AFTER FIX ===\n');
  
  const objectStorage = new ObjectStorageService();
  
  // Crear una imagen de prueba simple (1x1 pixel rojo)
  const testBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
  
  try {
    console.log('1. Uploading test image to Object Storage...');
    const result = await objectStorage.uploadPublicImageFromBase64(
      testBase64,
      'test',
      'test-user',
      false
    );
    
    console.log('\n2. Upload Results:');
    console.log('   - Image URL:', result.imageUrl);
    console.log('   - Thumbnail URL:', result.thumbnailUrl);
    
    // Verificar que las URLs son del API y no base64
    if (result.imageUrl.startsWith('/api/public/images/')) {
      console.log('\n✓ SUCCESS: Image URL is using API endpoint!');
    } else if (result.imageUrl.startsWith('data:')) {
      console.log('\n✗ ERROR: Image is still base64!');
    } else {
      console.log('\n? Unexpected URL format:', result.imageUrl);
    }
    
    // Probar que la URL funciona
    console.log('\n3. Testing if image is accessible...');
    const testUrl = `http://localhost:5000${result.imageUrl}`;
    const response = await fetch(testUrl);
    console.log('   - Status:', response.status, response.statusText);
    
    if (response.ok) {
      console.log('   ✓ Image is accessible through API!');
    } else {
      console.log('   ✗ Image is not accessible');
    }
    
    console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
    
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testUpload();