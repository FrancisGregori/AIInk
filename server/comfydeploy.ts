import { StencilJob } from "@shared/schema";

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
      console.warn("ComfyDeploy API key not found. Processing will fail.");
    }
  }

  async processImage(
    imageUrl: string,
    style: string,
    processingOptions?: any
  ): Promise<{ runId: string; status: string; outputUrl?: string }> {
    if (!this.apiKey) {
      // Mock processing for development
      console.log("Mock processing image:", { imageUrl, style, processingOptions });
      return {
        runId: `mock-${Date.now()}`,
        status: "completed",
        outputUrl: imageUrl, // Return original image in mock mode
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

  async checkRunStatus(runId: string): Promise<{ status: string; outputUrl?: string; error?: string }> {
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
        // Get the first output's data
        const firstOutput = data.outputs[0];
        if (firstOutput?.data) {
          // Check for images array (ComfyDeploy structure)
          if (firstOutput.data.images && Array.isArray(firstOutput.data.images) && firstOutput.data.images.length > 0) {
            outputUrl = firstOutput.data.images[0].url;
            console.log("Found image URL in outputs[0].data.images[0].url:", outputUrl);
          } else {
            // Try other possible field names
            outputUrl = firstOutput.data.output_image || 
                       firstOutput.data.image || 
                       firstOutput.data.image_url ||
                       firstOutput.data.url ||
                       firstOutput.data.output;
          }
          
          // Log what we found for debugging
          console.log("Output data structure:", JSON.stringify(firstOutput.data, null, 2));
        }
      } else if (data.outputs && typeof data.outputs === 'object') {
        // Fallback for object format
        outputUrl = data.outputs.output_image || 
                   data.outputs.image || 
                   data.outputs.image_url;
      }
      
      // Final fallback
      outputUrl = outputUrl || data.output_url;
      
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