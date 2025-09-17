import { ObjectStorageService } from "./objectStorage";

// Map style names to LoRA model files
const LORA_MODELS: Record<string, string> = {
  steven: "flux/stevenstyle.safetensors",
  makishi: "flux/MakiStyle.safetensors",
  darwin: "flux/DarwinStyle.safetensors",
  adrian: "flux/Adrianstyle.safetensors",
};

export class ComfyDeployService {
  private apiKey: string;
  private deploymentId: string = "7df83d8e-f274-4d6a-8947-833705e86d9e"; // Single deployment for all styles
  private baseUrl = "https://api.comfydeploy.com/api";

  constructor() {
    this.apiKey = process.env.COMFY_DEPLOY_API_KEY || "";
    
    if (!this.apiKey) {
      console.warn("COMFY_DEPLOY_API_KEY not found. Processing will fail.");
    }
  }

  // Save processed stencil to Object Storage
  async saveStencilToStorage(
    outputUrl: string,
    userId: string,
    style: string,
    storageFolder?: string
  ): Promise<{ imageUrl: string; thumbnailUrl: string }> {
    try {
      const objectStorage = new ObjectStorageService();

      if (outputUrl.startsWith('data:')) {
        // It's already base64, save directly
        const result = await objectStorage.uploadImageFromBase64(
          outputUrl,
          'stencils',
          userId,
          storageFolder
        );
        console.log('Stencil saved to storage:', result.imageUrl);
        console.log('Thumbnail generated:', result.thumbnailUrl);
        return result;
      } else {
        // It's an external URL, download and save
        const result = await objectStorage.uploadImageFromUrl(
          outputUrl,
          'stencils',
          userId,
          storageFolder
        );
        console.log('Stencil downloaded and saved to storage:', result.imageUrl);
        console.log('Thumbnail generated:', result.thumbnailUrl);
        return result;
      }
    } catch (error) {
      console.error('Error saving stencil to storage:', error);
      // Return original URL as fallback
      return { imageUrl: outputUrl, thumbnailUrl: outputUrl };
    }
  }

  async processImage(
    imageUrl: string,
    style: string,
    processingOptions?: any,
    userId?: string,
    storageFolder?: string
  ): Promise<{ runId: string; status: string; outputUrl?: string }> {
    if (!this.apiKey) {
      // Mock processing for development - return immediately
      console.log("Mock processing image (no ComfyDeploy API key):", { imageUrl, style, processingOptions });
      
      // In mock mode, save the original image as a "processed" stencil
      let mockOutputUrl = imageUrl;
      
      // If userId provided, save to storage
      if (userId) {
        try {
          const result = await this.saveStencilToStorage(imageUrl, userId, style, storageFolder);
          mockOutputUrl = result.imageUrl;
        } catch (error) {
          console.error('Failed to save mock stencil to storage:', error);
          // Fallback to original behavior
          mockOutputUrl = imageUrl.includes('?')
            ? `${imageUrl}&stencil=${style}&t=${Date.now()}`
            : `${imageUrl}?stencil=${style}&t=${Date.now()}`;
        }
      } else {
        // Original mock behavior for backward compatibility
        mockOutputUrl = imageUrl.includes('?') 
          ? `${imageUrl}&stencil=${style}&t=${Date.now()}`
          : `${imageUrl}?stencil=${style}&t=${Date.now()}`;
      }
      
      return {
        runId: `mock-${Date.now()}`,
        status: "completed",
        outputUrl: mockOutputUrl,
      };
    }

    try {
      const requestBody = {
        deployment_id: this.deploymentId,
        inputs: {
          input_image: imageUrl, // Correct parameter name for ComfyDeploy
          "fondo transparente": processingOptions?.removeBackground || false,
          line_color: processingOptions?.lineColor || "black",
          lora_path: LORA_MODELS[style] || LORA_MODELS.steven, // Use full LoRA path
        },
      };

      console.log("Sending request to ComfyDeploy:", {
        url: `${this.baseUrl}/run`,
        deployment_id: this.deploymentId,
        inputs: requestBody.inputs,
      });

      // Deploy the workflow with correct parameters for ComfyDeploy
      const deployResponse = await fetch(`${this.baseUrl}/run`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!deployResponse.ok) {
        const errorText = await deployResponse.text();
        console.error("ComfyDeploy API error response:", errorText);
        throw new Error(`ComfyDeploy API error: ${deployResponse.statusText} - ${errorText}`);
      }

      const deployData = await deployResponse.json();
      const runId = deployData.run_id || deployData.id;

      // Return immediately with the run ID
      return {
        runId,
        status: "processing",
      };
    } catch (error) {
      console.error("Error processing with ComfyDeploy:", error);
      throw error;
    }
  }

  async checkRunStatus(
    runId: string,
    userId?: string,
    style?: string,
    storageFolder?: string
  ): Promise<{ status: string; outputUrl?: string; thumbnailUrl?: string; error?: string }> {
    if (!this.apiKey || runId.startsWith("mock-")) {
      return {
        status: "completed",
        outputUrl: "/api/placeholder/400/400", // Placeholder in mock mode
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/run/${runId}`, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`ComfyDeploy API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log("ComfyDeploy FULL response:", JSON.stringify(data, null, 2));
      console.log("ComfyDeploy status response:", {
        runId,
        status: data.status,
        outputs: data.outputs,
      });
      
      // Map ComfyDeploy status to our status
      let status = data.status?.toLowerCase() || "processing";
      if (status === "success" || status === "completed") {
        status = "completed";
      }
      
      // Get the output image URLs from the response
      let outputUrl;
      let thumbnailUrl;

      // Check if outputs is an array with results
      if (Array.isArray(data.outputs) && data.outputs.length > 0) {
        // Look for any output with images
        const allImages = [];

        for (const output of data.outputs) {
          console.log('Checking output:', output);

          // Check if this output has image data
          if (output.data && output.data.images && Array.isArray(output.data.images)) {
            // Collect all images
            for (const imageData of output.data.images) {
              console.log('Found image data:', JSON.stringify(imageData, null, 2));

              let imageUrl;
              // The image data might be a URL string or an object with various properties
              if (typeof imageData === 'string') {
                imageUrl = imageData;
              } else if (imageData && typeof imageData === 'object') {
                // Try various common properties
                imageUrl = imageData.url || imageData.image || imageData.path || imageData.filename;
              }

              if (imageUrl) {
                allImages.push(imageUrl);
                console.log('Found image URL:', imageUrl);
              }
            }
          }

          // Also check direct url/image properties
          if (output.url || output.image) {
            allImages.push(output.url || output.image);
          }
        }

        // If we found multiple images, use the first as main and second as thumbnail
        // Or use the last as thumbnail if it's smaller (ComfyUI sometimes outputs thumbnails last)
        if (allImages.length > 1) {
          outputUrl = allImages[0];
          thumbnailUrl = allImages[allImages.length - 1]; // Use last image as thumbnail
          console.log(`Found ${allImages.length} images, using first as main and last as thumbnail`);
        } else if (allImages.length === 1) {
          outputUrl = allImages[0];
          console.log('Found only 1 image, will generate thumbnail later');
        }
      } else if (data.outputs && typeof data.outputs === 'object') {
        // Fallback for object format
        outputUrl = data.outputs.output_image ||
                   data.outputs.image ||
                   data.outputs.image_url;

        // Check if there's a separate thumbnail field
        thumbnailUrl = data.outputs.thumbnail ||
                      data.outputs.thumb ||
                      data.outputs.thumbnail_url;
      }

      // Final fallback
      outputUrl = outputUrl || data.output_url;
      thumbnailUrl = thumbnailUrl || data.thumbnail_url;

      // If we have an outputUrl and userId, save to storage
      if (outputUrl && userId && style) {
        try {
          // If we already have a separate thumbnail from ComfyDeploy, save both
          if (thumbnailUrl && thumbnailUrl !== outputUrl) {
            console.log('ComfyDeploy returned separate thumbnail, saving both images');
            // Save main image
            const mainResult = await this.saveStencilToStorage(outputUrl, userId, style, storageFolder);
            // Save thumbnail
            const thumbResult = await this.saveStencilToStorage(thumbnailUrl, userId, `${style}_thumb`, storageFolder);

            outputUrl = mainResult.imageUrl;
            thumbnailUrl = thumbResult.imageUrl; // Use the saved thumbnail URL directly
          } else {
            // No separate thumbnail, let storage service generate it
            const result = await this.saveStencilToStorage(outputUrl, userId, style, storageFolder);
            outputUrl = result.imageUrl;
            thumbnailUrl = result.thumbnailUrl;
          }
        } catch (error) {
          console.error('Failed to save real stencil to storage:', error);
          // Continue with original URL as fallback
        }
      }

      return {
        status,
        outputUrl,
        thumbnailUrl,
        error: data.error,
      };
    } catch (error) {
      console.error("Error checking ComfyDeploy status:", error);
      throw error;
    }
  }

  // Upload image to ComfyDeploy's storage
  async uploadImage(imageBuffer: Buffer, filename: string): Promise<string> {
    if (!this.apiKey) {
      // Return a placeholder URL in mock mode
      return `/api/uploads/${filename}`;
    }

    try {
      const formData = new FormData();
      const blob = new Blob([imageBuffer], { type: 'image/png' });
      formData.append('file', blob, filename);

      const response = await fetch(`${this.baseUrl}/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`ComfyDeploy upload error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Error uploading to ComfyDeploy:", error);
      throw error;
    }
  }
}

export default ComfyDeployService;