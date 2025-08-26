import { GoogleGenAI } from "@google/genai";

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || "" 
});

export async function chatWithGemini(text: string): Promise<string> {
  try {
    const systemPrompt = "Eres un asistente útil y conciso. Responde de manera breve y directa, máximo 2-3 oraciones. Si necesitas dar una explicación detallada, ofrece resumir los puntos principales.";
    
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
  } catch (error) {
    console.error("Gemini chat error:", error);
    throw new Error(`Failed to get chat response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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
      // Inline data mode
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
      throw new Error("Either fileUri or imageBase64 with mimeType must be provided");
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
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
          mimeType: "image/png",
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
