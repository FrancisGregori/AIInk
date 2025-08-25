import { db } from "./db";
import { stencilStyles } from "@shared/schema";
import { sql } from "drizzle-orm";

const defaultStyles = [
  {
    id: "steven",
    name: "Stiven Hernandez",
    description: "Clean, classic detail",
    comfyDeployWorkflowId: "d7fbc41f-db03-4bb0-a526-c52798f2c5a5",
    loraModel: "flux/stevenstyle.safetensors",
    promptTemplate: null,
    styleType: "lora",
    isActive: true,
    displayOrder: 1,
    previewImageUrl: null
  },
  {
    id: "makishi",
    name: "Andres Makishi",
    description: "Minimalist fine-line",
    comfyDeployWorkflowId: "d7fbc41f-db03-4bb0-a526-c52798f2c5a5",
    loraModel: "flux/MakiStyle.safetensors",
    promptTemplate: null,
    styleType: "lora",
    isActive: true,
    displayOrder: 2,
    previewImageUrl: null
  },
  {
    id: "darwin",
    name: "Darwin Enriquez",
    description: "Clean, detailed lines",
    comfyDeployWorkflowId: "d7fbc41f-db03-4bb0-a526-c52798f2c5a5",
    loraModel: "flux/DarwinStyle.safetensors",
    promptTemplate: null,
    styleType: "lora",
    isActive: true,
    displayOrder: 3,
    previewImageUrl: null
  },
  {
    id: "adrian",
    name: "Adrian Rod",
    description: "Detailed & high-contrast",
    comfyDeployWorkflowId: "d7fbc41f-db03-4bb0-a526-c52798f2c5a5",
    loraModel: "flux/Adrianstyle.safetensors",
    promptTemplate: null,
    styleType: "lora",
    isActive: true,
    displayOrder: 4,
    previewImageUrl: null
  },
  {
    id: "neutral",
    name: "Neutral",
    description: "Simple line basic",
    comfyDeployWorkflowId: "d7fbc41f-db03-4bb0-a526-c52798f2c5a5",
    loraModel: null,
    promptTemplate: "Convert the image into a high-resolution monochrome line-art illustration. Use only crisp, uniform lines—no fills, no shading. Capture and emphasize intricate internal details and fine textures with precise, consistent stroke weight, producing a professional coloring-book style drawing.",
    styleType: "prompt",
    isActive: true,
    displayOrder: 5,
    previewImageUrl: null
  }
];

export async function initializeStyles() {
  console.log("Initializing stencil styles...");
  
  try {
    // Insert or update each style
    for (const style of defaultStyles) {
      await db.insert(stencilStyles)
        .values(style)
        .onConflictDoUpdate({
          target: stencilStyles.id,
          set: {
            name: style.name,
            description: style.description,
            comfyDeployWorkflowId: style.comfyDeployWorkflowId,
            loraModel: style.loraModel,
            promptTemplate: style.promptTemplate,
            styleType: style.styleType,
            isActive: style.isActive,
            displayOrder: style.displayOrder,
          },
        });
    }
    
    console.log("✅ Stencil styles initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing stencil styles:", error);
    throw error;
  }
}