import { StencilJob } from "@shared/schema";

interface ComfyDeployWorkflow {
  steven: string;
  makishi: string;
  darwin: string;
  adrian: string;
}

// ComfyDeploy workflow IDs for each stencil style
const WORKFLOW_IDS: ComfyDeployWorkflow = {
  steven: "workflow_steven_id", // Replace with actual workflow ID
  makishi: "workflow_makishi_id", // Replace with actual workflow ID
  darwin: "workflow_darwin_id", // Replace with actual workflow ID
  adrian: "workflow_adrian_id", // Replace with actual workflow ID
};

export class ComfyDeployService {
  private apiKey: string;
  private baseUrl = "https://api.comfydeploy.com/v1";

  constructor() {
    this.apiKey = process.env.COMFY_DEPLOY_API_KEY || "";
    if (!this.apiKey) {
      console.warn("ComfyDeploy API key not found. Processing will fail.");
    }
  }

  async processImage(
    imageUrl: string,
    style: keyof ComfyDeployWorkflow,
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
      // Deploy the workflow
      const deployResponse = await fetch(`${this.baseUrl}/deploy`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workflow_id: WORKFLOW_IDS[style],
          inputs: {
            image_url: imageUrl,
            remove_background: processingOptions?.removeBackground || true,
            line_color: processingOptions?.lineColor || "black",
          },
        }),
      });

      if (!deployResponse.ok) {
        throw new Error(`ComfyDeploy API error: ${deployResponse.statusText}`);
      }

      const deployData = await deployResponse.json();
      const runId = deployData.run_id;

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

  async checkStatus(runId: string): Promise<{ status: string; outputUrl?: string }> {
    if (!this.apiKey || runId.startsWith("mock-")) {
      return {
        status: "completed",
        outputUrl: "/api/placeholder/400/400", // Placeholder in mock mode
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/status/${runId}`, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`ComfyDeploy API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        status: data.status,
        outputUrl: data.outputs?.image_url,
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