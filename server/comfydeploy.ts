import { StencilJob, StencilStyle } from "@shared/schema";
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

  // Save processed stencil to protected Object Storage
  async saveStencilToStorage(
    outputUrl: string,
    userId: string,
    style: string
  ): Promise<string> {
    try {
      const objectStorage = new ObjectStorageService();
      
      if (outputUrl.startsWith('data:')) {
        // It's already base64, save directly
        const { imageUrl } = await objectStorage.uploadImageFromBase64(
          outputUrl,
          'stencils',
          userId
        );
        console.log('Stencil saved to protected storage:', imageUrl);
        return imageUrl;
      } else {
        // It's an external URL, download and save
        const { imageUrl } = await objectStorage.uploadImageFromUrl(
          outputUrl,
          'stencils',
          userId
        );
        console.log('Stencil downloaded and saved to protected storage:', imageUrl);
        return imageUrl;
      }
    } catch (error) {
      console.error('Error saving stencil to storage:', error);
      // Return original URL as fallback
      return outputUrl;
    }
  }

  async processImage(
    imageUrl: string,
    style: string | StencilStyle,
    processingOptions?: any,
    userId?: string
  ): Promise<{ runId: string; status: string; outputUrl?: string }> {
    if (!this.apiKey) {
      // Mock processing for development - return immediately
      console.log("Mock processing image (no ComfyDeploy API key):", { imageUrl, style, processingOptions });
      
      // In mock mode, save the original image as a "processed" stencil
      let mockOutputUrl = imageUrl;
      
      // If userId provided, save to protected storage
      if (userId) {
        const styleName = typeof style === 'string' ? style : style.id;
        try {
          mockOutputUrl = await this.saveStencilToStorage(imageUrl, userId, styleName);
        } catch (error) {
          console.error('Failed to save mock stencil to storage:', error);
          // Fallback to original behavior
          mockOutputUrl = imageUrl.includes('?') 
            ? `${imageUrl}&stencil=${styleName}&t=${Date.now()}`
            : `${imageUrl}?stencil=${styleName}&t=${Date.now()}`;
        }
      } else {
        // Original mock behavior for backward compatibility
        const styleName = typeof style === 'string' ? style : style.id;
        mockOutputUrl = imageUrl.includes('?') 
          ? `${imageUrl}&stencil=${styleName}&t=${Date.now()}`
          : `${imageUrl}?stencil=${styleName}&t=${Date.now()}`;
      }
      
      return {
        runId: `mock-${Date.now()}`,
        status: "completed",
        outputUrl: mockOutputUrl,
      };
    }

    try {
      // Check if style is an object (StencilStyle) or string
      const styleConfig = typeof style === 'object' ? style : null;
      const styleName = typeof style === 'string' ? style : style.id;
      
      // Build inputs based on style type
      const inputs: any = {
        input_image: imageUrl, // Correct parameter name for ComfyDeploy
        "fondo transparente": processingOptions?.removeBackground || false,
        line_color: processingOptions?.lineColor || "black",
      };
      
      // If style has promptTemplate (type 'prompt'), use prompt instead of LoRA
      if (styleConfig?.styleType === 'prompt' && styleConfig.promptTemplate) {
        // For prompt-based styles, send the prompt
        inputs.prompt = styleConfig.promptTemplate;
        console.log("Using prompt-based style:", styleName);
      } else {
        // For LoRA-based styles
        inputs.lora_path = LORA_MODELS[styleName] || LORA_MODELS.steven;
        console.log("Using LoRA style:", styleName, "with path:", inputs.lora_path);
      }
      
      const requestBody = {
        deployment_id: this.deploymentId,
        inputs,
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
    style?: string
  ): Promise<{ status: string; outputUrl?: string; error?: string }> {
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
      
      // Get the output image URL from the response
      let outputUrl;
      
      // Check if outputs is an array with results
      if (Array.isArray(data.outputs) && data.outputs.length > 0) {
        // Look for any output with images
        for (const output of data.outputs) {
          console.log('Checking output:', output);
          
          // Check if this output has image data
          if (output.data && output.data.images && Array.isArray(output.data.images)) {
            // Get the first image
            const imageData = output.data.images[0];
            console.log('Found image data:', JSON.stringify(imageData, null, 2));
            
            // The image data might be a URL string or an object with various properties
            if (typeof imageData === 'string') {
              outputUrl = imageData;
            } else if (imageData && typeof imageData === 'object') {
              // Try various common properties
              outputUrl = imageData.url || imageData.image || imageData.path || imageData.filename;
            }
            
            if (outputUrl) {
              console.log('Found image URL:', outputUrl);
              break;
            }
          }
          
          // Also check direct url/image properties
          if (!outputUrl && (output.url || output.image)) {
            outputUrl = output.url || output.image;
          }
        }
      } else if (data.outputs && typeof data.outputs === 'object') {
        // Fallback for object format
        outputUrl = data.outputs.output_image || 
                   data.outputs.image || 
                   data.outputs.image_url;
      }
      
      // Final fallback
      outputUrl = outputUrl || data.output_url;
      
      // If we have an outputUrl and userId, save to protected storage
      if (outputUrl && userId && style) {
        try {
          outputUrl = await this.saveStencilToStorage(outputUrl, userId, style);
        } catch (error) {
          console.error('Failed to save real stencil to storage:', error);
          // Continue with original URL as fallback
        }
      }
      
      return {
        status,
        outputUrl,
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