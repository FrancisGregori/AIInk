import { Storage } from "@google-cloud/storage";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
const BUCKET_NAME = "replit-objstore-12f3cfa6-c32d-4020-8906-8c1a7e0f108b";

// Configurar cliente de Object Storage
const storage = new Storage({
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

async function testObjectStorage() {
  try {
    console.log("=== TESTING OBJECT STORAGE ===");
    console.log("Bucket:", BUCKET_NAME);
    
    const bucket = storage.bucket(BUCKET_NAME);
    
    // Crear un archivo de prueba
    const testFileName = `public/test/${Date.now()}_test.txt`;
    const file = bucket.file(testFileName);
    
    console.log("\n1. Uploading test file:", testFileName);
    await file.save("Test content from TattoostencilPro", {
      metadata: {
        contentType: "text/plain",
        cacheControl: "public, max-age=3600",
      },
    });
    
    console.log("2. Making file public...");
    try {
      await file.makePublic();
      console.log("   ✓ File made public successfully");
    } catch (err) {
      console.log("   ✗ Error making file public:", err.message);
    }
    
    // Verificar que existe
    const [exists] = await file.exists();
    console.log("3. File exists:", exists);
    
    // Obtener metadata
    const [metadata] = await file.getMetadata();
    console.log("4. File metadata:");
    console.log("   - Name:", metadata.name);
    console.log("   - ContentType:", metadata.contentType);
    console.log("   - Size:", metadata.size);
    
    // Generar URL pública
    const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${testFileName}`;
    console.log("\n5. Public URL:", publicUrl);
    
    // Intentar acceder a la URL
    console.log("6. Testing public URL access...");
    try {
      const response = await fetch(publicUrl);
      console.log("   - Status:", response.status);
      console.log("   - Status Text:", response.statusText);
      if (response.ok) {
        const content = await response.text();
        console.log("   - Content:", content);
        console.log("   ✓ Public URL is accessible!");
      } else {
        console.log("   ✗ Public URL is not accessible");
      }
    } catch (err) {
      console.log("   ✗ Error accessing public URL:", err.message);
    }
    
    // Limpiar archivo de prueba
    console.log("\n7. Cleaning up test file...");
    await file.delete();
    console.log("   ✓ Test file deleted");
    
    console.log("\n=== TEST COMPLETED ===");
    
  } catch (error) {
    console.error("\n✗ Test failed:", error.message);
    console.error("Stack:", error.stack);
  }
}

testObjectStorage();