// Test script para verificar que las imágenes se generan y almacenan correctamente

const API_URL = 'http://localhost:5000';

async function testImageGeneration() {
  console.log('=== TESTING IMAGE GENERATION AND STORAGE ===\n');
  
  try {
    // 1. Login primero
    console.log('1. Logging in...');
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'test',
        password: 'test123'
      }),
      credentials: 'include'
    });
    
    if (!loginResponse.ok) {
      console.log('   ⚠️  Login failed - you may need to create a test user first');
      console.log('   Run the app and create a user via the UI');
      return;
    }
    
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('   ✓ Login successful');
    
    // 2. Crear un proyecto de prueba
    console.log('\n2. Creating test project...');
    const projectData = {
      name: 'Test Project ' + Date.now(),
      referenceImageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      prompt: 'Test prompt for image generation',
      targetImageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      maskUrl: null
    };
    
    const projectResponse = await fetch(`${API_URL}/api/flux-projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify(projectData)
    });
    
    if (!projectResponse.ok) {
      const error = await projectResponse.text();
      console.log('   ✗ Failed to create project:', error);
      return;
    }
    
    const project = await projectResponse.json();
    console.log('   ✓ Project created with ID:', project.id);
    console.log('   - Reference Image URL:', project.referenceImageUrl);
    console.log('   - Target Image URL:', project.targetImageUrl);
    
    // 3. Verificar que las URLs son del API y no base64
    console.log('\n3. Verifying image URLs...');
    
    const isReferenceBase64 = project.referenceImageUrl?.startsWith('data:');
    const isTargetBase64 = project.targetImageUrl?.startsWith('data:');
    const isReferenceApi = project.referenceImageUrl?.startsWith('/api/public/images/');
    const isTargetApi = project.targetImageUrl?.startsWith('/api/public/images/');
    
    if (isReferenceBase64 || isTargetBase64) {
      console.log('   ✗ ERROR: Images are still being stored as base64!');
      console.log('   - Reference is base64:', isReferenceBase64);
      console.log('   - Target is base64:', isTargetBase64);
    } else if (isReferenceApi && isTargetApi) {
      console.log('   ✓ SUCCESS: Images are using API URLs!');
      console.log('   - Reference URL:', project.referenceImageUrl);
      console.log('   - Target URL:', project.targetImageUrl);
      
      // 4. Probar que las URLs funcionan
      console.log('\n4. Testing image URLs...');
      
      const referenceTest = await fetch(`${API_URL}${project.referenceImageUrl}`);
      const targetTest = await fetch(`${API_URL}${project.targetImageUrl}`);
      
      console.log('   - Reference Image Status:', referenceTest.status, referenceTest.statusText);
      console.log('   - Target Image Status:', targetTest.status, targetTest.statusText);
      
      if (referenceTest.ok && targetTest.ok) {
        console.log('   ✓ Images are accessible through API!');
      } else {
        console.log('   ✗ Images are not accessible');
      }
    } else {
      console.log('   ? Unexpected URL format');
      console.log('   - Reference URL:', project.referenceImageUrl);
      console.log('   - Target URL:', project.targetImageUrl);
    }
    
    console.log('\n=== TEST COMPLETED ===');
    
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
  }
}

// Ejecutar el test
testImageGeneration();