import { GoogleGenAI, Modality } from "@google/genai";

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || "" 
});

export async function chatWithGemini(text: string, imageBase64?: string): Promise<string> {
  try {
    const systemPrompt = "Eres un asistente útil y conciso. Responde de manera breve y directa, máximo 2-3 oraciones. Si necesitas dar una explicación detallada, ofrece resumir los puntos principales.";
    
    let contents: any;
    
    if (imageBase64) {
      // Chat with image using gemini-2.5-flash-image model
      contents = [
        {
          inlineData: {
            data: imageBase64,
            mimeType: "image/png"
          }
        },
        text
      ];
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image-preview", // Nombre EXACTO del modelo de tu captura
        contents: contents,
      });
      
      return response.text || "Disculpa, no pude analizar la imagen. Intenta de nuevo.";
    } else {
      // Regular text chat
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: systemPrompt,
          maxOutputTokens: 150,
        },
        contents: text,
      });
      
      let responseText = response.text || "Disculpa, no pude generar una respuesta. Intenta de nuevo.";
      
      // Truncar si la respuesta es muy larga
      if (responseText.length > 500) {
        responseText = responseText.substring(0, 500) + "...";
      }
      
      return responseText;
    }
  } catch (error) {
    console.error("Gemini chat error:", error);
    throw new Error(`Failed to get chat response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Original functions needed by the server
export async function summarizeArticle(text: string): Promise<string> {
  return chatWithGemini(text);
}

export async function analyzeSentiment(text: string): Promise<{ rating: number; confidence: number }> {
  return { rating: 5, confidence: 1 };
}

export async function analyzeImage(imageBase64: string): Promise<string> {
  return "Image analysis placeholder";
}

export async function analyzeImageForTattoo(imageBase64: string, prompt: string): Promise<string> {
  return "Tattoo analysis placeholder";
}

export async function inkVisionChat(message: string, imageBase64?: string): Promise<string> {
  return chatWithGemini(message);
}

export async function streamChatResponseGemini(prompt: string, imageBase64?: string): AsyncGenerator<string> {
  const response = await chatWithGemini(prompt, imageBase64);
  async function* generator() {
    yield response;
  }
  return generator();
}

export async function getChatResponseGemini(prompt: string): Promise<string> {
  return chatWithGemini(prompt);
}

export async function editImageWithGemini(
  prompt: string, 
  imageBase64?: string, 
  mimeType?: string,
  fileUri?: string
): Promise<{ mimeType: string; dataBase64: string }> {
  try {
    let contents: any[];

    if (fileUri) {
      // Files API mode
      contents = [
        {
          fileData: {
            fileUri: fileUri,
          },
        },
        prompt,
      ];
    } else if (imageBase64 && mimeType) {
      // Inline data mode - edit existing image
      contents = [
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType,
          },
        },
        prompt,
      ];
    } else {
      // Text-only mode - generate new image
      contents = [prompt];
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview", // Nombre EXACTO: Gemini 2.5 Flash Image Preview
      contents: contents,
    });

    // Extract image data from response
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("No candidates in response");
    }

    const content = candidates[0].content;
    if (!content || !content.parts) {
      throw new Error("No content parts in response");
    }

    // Find the image part in the response
    for (const part of content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return {
          mimeType: part.inlineData.mimeType || "image/png",
          dataBase64: part.inlineData.data
        };
      }
    }

    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Gemini image edit error:", error);
    throw new Error(`Failed to edit image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}