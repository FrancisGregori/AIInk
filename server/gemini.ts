import * as fs from "fs";
import { GoogleGenAI } from "@google/genai";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
// Get API key helper - read directly from env
const getGeminiKey = (): string => {
  const key = process.env.GEMINI_API_KEY || "";
  console.log("GEMINI_API_KEY status:", key ? `Found (${key.substring(0, 10)}...)` : "Not found");
  if (!key) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return key;
};

// Initialize AI with API key from environment
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function summarizeArticle(text: string): Promise<string> {
    const prompt = `You are a helpful AI assistant.

Message: ${text}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return response.text || "Lo siento, no pude procesar tu mensaje. ¿Podrías intentar reformularlo?";
    } catch (error) {
        console.error("Error generating Gemini response:", error);
        return "Disculpa, estoy experimentando dificultades técnicas. Por favor intenta nuevamente en unos momentos.";
    }
}

export interface Sentiment {
    rating: number;
    confidence: number;
}

export async function analyzeSentiment(text: string): Promise<Sentiment> {
    try {
        const systemPrompt = `You are a sentiment analysis expert. 
Analyze the sentiment of the text and provide a rating
from 1 to 5 stars and a confidence score between 0 and 1.
Respond with JSON in this format: 
{'rating': number, 'confidence': number}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                responseSchema: {
                    type: "object",
                    properties: {
                        rating: { type: "number" },
                        confidence: { type: "number" },
                    },
                    required: ["rating", "confidence"],
                },
            },
            contents: text,
        });

        const rawJson = response.text;

        if (rawJson) {
            const data: Sentiment = JSON.parse(rawJson);
            return data;
        } else {
            throw new Error("Empty response from model");
        }
    } catch (error) {
        console.error("Error analyzing sentiment:", error);
        throw new Error(`Failed to analyze sentiment: ${error}`);
    }
}

export async function analyzeImage(jpegImagePath: string): Promise<string> {
    try {
        const imageBytes = fs.readFileSync(jpegImagePath);

        const contents = [
            {
                inlineData: {
                    data: imageBytes.toString("base64"),
                    mimeType: "image/jpeg",
                },
            },
            `Analyze this image and describe what you see.`,
        ];

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-image-preview",
            contents: contents,
        });

        return response.text || "No pude analizar la imagen. Por favor intenta con otra imagen.";
    } catch (error) {
        console.error("Error analyzing image:", error);
        return "Error analizando la imagen. Verifica que el archivo sea una imagen válida.";
    }
}

// InkVision: Análisis inteligente de imágenes para tatuajes
export async function analyzeImageForTattoo(imageBase64: string, language: "es" | "en" = "es"): Promise<{
    analysis: string;
    suggestions: string[];
    styles: string[];
}> {
    try {
        const systemPrompt = language === "es" 
            ? `Eres InkVision, un asistente IA. Analiza la imagen proporcionada.`
            : `You are InkVision, an AI assistant. Analyze the provided image.`;

        const contents = [
            {
                inlineData: {
                    data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
                    mimeType: "image/jpeg",
                },
            },
            systemPrompt
        ];

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-image-preview",
            contents: contents,
        });

        const text = response.text || "";
        
        // Extraer sugerencias específicas
        const suggestions = language === "es" 
            ? [
                "Convertir a estilo blackwork",
                "Aplicar técnica de sombreado puntillista",
                "Añadir elementos geométricos",
                "Crear versión minimalista",
                "Adaptar para manga completa"
              ]
            : [
                "Convert to blackwork style",
                "Apply dotwork shading technique",
                "Add geometric elements",
                "Create minimalist version",
                "Adapt for full sleeve"
              ];

        const styles = language === "es"
            ? ["Blackwork", "Realista", "Geométrico", "Neo-tradicional", "Minimalista"]
            : ["Blackwork", "Realistic", "Geometric", "Neo-traditional", "Minimalist"];

        return {
            analysis: text,
            suggestions: suggestions.slice(0, 3),
            styles: styles.slice(0, 4)
        };
    } catch (error) {
        console.error("Error in InkVision analysis:", error);
        return {
            analysis: language === "es" 
                ? "No pude analizar la imagen. Por favor intenta con otra."
                : "Could not analyze the image. Please try another one.",
            suggestions: [],
            styles: []
        };
    }
}

// InkVision: Chat inteligente para diseño de tatuajes
export async function inkVisionChat(
    message: string, 
    context: string = "",
    language: "es" | "en" = "es"
): Promise<{
    response: string;
    suggestions: string[];
}> {
    try {
        const systemPrompt = `Eres InkVision, un asistente IA.
               
               IDIOMA: Detecta automáticamente el idioma del mensaje y responde en ese mismo idioma.
               
               Contexto actual: ${context}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                { text: systemPrompt },
                { text: `Usuario: ${message}` }
            ],
        });

        const responseText = response.text || "";

        // Generar sugerencias contextuales
        const suggestions = language === "es"
            ? [
                "Aplicar este estilo al diseño",
                "Ver ejemplos similares",
                "Modificar composición",
                "Cambiar densidad de líneas"
              ]
            : [
                "Apply this style to design",
                "View similar examples",
                "Modify composition",
                "Change line density"
              ];

        return {
            response: responseText,
            suggestions: suggestions.slice(0, 3)
        };
    } catch (error) {
        console.error("Error in InkVision chat:", error);
        return {
            response: language === "es" 
                ? "Disculpa, no pude procesar tu mensaje. ¿Podrías reformularlo?"
                : "Sorry, I couldn't process your message. Could you rephrase it?",
            suggestions: []
        };
    }
}

export async function generateDesignSuggestions(prompt: string): Promise<string> {
    try {
        const designPrompt = `You are a creative AI assistant specializing in design for Darwin AI Tools platform. 

Based on the following request, provide specific, actionable design suggestions that could be implemented using:
1. Stencil Tool - for converting images to stencils
2. Flux Kontext - for advanced design editing with AI assistance

User request: ${prompt}

Provide practical steps, color suggestions, composition ideas, and specific techniques. Be creative but practical.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: designPrompt,
        });

        return response.text || "No pude generar sugerencias para tu proyecto. ¿Podrías proporcionar más detalles?";
    } catch (error) {
        console.error("Error generating design suggestions:", error);
        return "Error generando sugerencias de diseño. Por favor intenta con una descripción diferente.";
    }
}

export async function generateFluxPrompt(userDescription: string): Promise<string> {
    try {
        const promptGeneration = `Generate an image prompt based on: ${userDescription}

Respond with just the prompt, no explanation.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: promptGeneration,
        });

        return response.text || "Create a modern, professional design with clean composition and balanced colors";
    } catch (error) {
        console.error("Error generating Flux prompt:", error);
        return "Create a modern, professional design with clean composition and balanced colors";
    }
}

// Chat functions for InkVision assistant
export async function getChatResponseGemini(
  messages: { role: 'user' | 'assistant', content: string }[],
  imageBase64?: string
): Promise<string> {
  try {
    const genAI = new GoogleGenAI({ apiKey: getGeminiKey() });
    
    // Log para verificar que la imagen llega
    console.log('Image base64 received:', imageBase64 ? `Yes (${imageBase64.length} chars)` : 'No');
    
    let chatMessages: any[] = [];
    
    if (imageBase64) {
      // Para conversaciones con imagen
      const lastMessage = messages[messages.length - 1]?.content || "";
      console.log('Last message received:', lastMessage);
      
      // Check if this is already a technical prompt (English or Spanish patterns)
      const isTechnicalPrompt = 
        // English patterns
        lastMessage.includes('maintaining') || 
        lastMessage.includes('Change the') ||
        lastMessage.includes('Change ') ||
        lastMessage.includes(' to ') || // Detecta "Change X to Y"
        lastMessage.includes('Add ') ||
        lastMessage.includes('Remove ') ||
        lastMessage.includes('Transform to') ||
        lastMessage.includes('Turn the') ||
        lastMessage.includes('Rotate ') ||
        lastMessage.includes('Replace ') ||
        lastMessage.includes('Make ') ||
        lastMessage.includes('Create ') ||
        // Spanish patterns
        lastMessage.includes('manteniendo') ||
        lastMessage.includes('Cambiar el') ||
        lastMessage.includes('Cambiar la') ||
        lastMessage.includes('Cambiar ') ||
        lastMessage.includes(' a ') || // Detecta "Cambiar X a Y"
        lastMessage.includes('Agregar ') ||
        lastMessage.includes('Añadir ') ||
        lastMessage.includes('Quitar ') ||
        lastMessage.includes('Eliminar ') ||
        lastMessage.includes('Transformar a') ||
        lastMessage.includes('Girar ') ||
        lastMessage.includes('Rotar ') ||
        lastMessage.includes('Reemplazar ') ||
        lastMessage.includes('Hacer ') ||
        lastMessage.includes('Crear ') ||
        // Common technical structure indicators
        lastMessage.includes(', maintaining') ||
        lastMessage.includes(', manteniendo');
      
      // Check if this is a description request
      const isDescriptionRequest = lastMessage.toLowerCase().includes('describe') || 
                                   lastMessage.toLowerCase().includes('qué elementos') ||
                                   lastMessage.toLowerCase().includes('what main elements') ||
                                   lastMessage.toLowerCase().includes('composición') ||
                                   lastMessage.toLowerCase().includes('composition') ||
                                   lastMessage.toLowerCase().includes('detalladamente');
      
      const isInitialAnalysis = messages.length === 0 || 
                               lastMessage.includes("Analiza esta imagen");
      
      console.log('Is technical prompt:', isTechnicalPrompt);
      console.log('Is description request:', isDescriptionRequest);
      console.log('Is initial analysis:', isInitialAnalysis);
      
      // Si el usuario ya envió un prompt técnico, aplicarlo directamente
      if (isTechnicalPrompt) {
        console.log('User provided technical prompt, applying directly');
        // Si ya está en inglés con formato correcto, devolver tal cual
        chatMessages = [
          {
            role: "user",
            parts: [
              {
                text: `The user provided this technical prompt: "${lastMessage}"

If it's already in perfect English technical format, return it EXACTLY as is.
If it's in another language or needs minor formatting, translate/adjust to English keeping the technical structure.

OUTPUT ONLY THE TECHNICAL PROMPT (no explanations):`
              },
              {
                inlineData: {
                  data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
                  mimeType: "image/jpeg",
                },
              }
            ]
          }
        ];
      } else if (isDescriptionRequest || isInitialAnalysis) {
        // Pregunta directa sin descripción
        console.log('Creating direct question with image');
        chatMessages = [
          {
            role: "user",
            parts: [
              {
                text: `Analiza la imagen y pregunta qué modificación desea el usuario.`
              },
              {
                inlineData: {
                  data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
                  mimeType: "image/jpeg",
                },
              }
            ]
          }
        ];
      } else {
        // Cualquier solicitud de modificación - genera prompt técnico directo
        chatMessages = [
          {
            role: "user",
            parts: [
              {
                text: `Generate a technical edit prompt based on this request: ${lastMessage}

Output only the technical prompt in English.`
              },
              {
                inlineData: {
                  data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
                  mimeType: "image/jpeg",
                },
              }
            ]
          }
        ];
      }
    } else {
      // Para conversaciones solo de texto
      const systemMessage = {
        role: "user",
        parts: [{
          text: `Eres InkVision, un asistente IA.

IDIOMA: Detecta automáticamente el idioma del último mensaje del usuario y responde en ese mismo idioma.

Responde de forma profesional y clara.`
        }]
      };
      
      chatMessages = [systemMessage, ...messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      }))];
    }

    // Log para verificar el contenido que se enviará
    console.log('Sending to Gemini model:', {
      model: "gemini-2.5-flash",
      hasImage: chatMessages[0]?.parts?.some((part: any) => part.inlineData) || false,
      messageCount: chatMessages.length
    });
    
    // Llamada al modelo Gemini
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: chatMessages,
    });

    return response.text || "Error generating response";
  } catch (error: any) {
    console.error('Gemini error:', error);
    throw new Error(`Gemini API error: ${error.message}`);
  }
}

// Implementación de Streaming (Respuestas en tiempo real)
export async function streamChatResponseGemini(
  messages: { role: 'user' | 'assistant', content: string }[],
  imageBase64?: string
): Promise<ReadableStream<Uint8Array>> {
  try {
    const response = await getChatResponseGemini(messages, imageBase64);
    
    // Crear un stream que envía la respuesta por partes
    return new ReadableStream({
      start(controller) {
        const chunks = response.split(' ');
        let index = 0;
        
        const sendChunk = () => {
          if (index < chunks.length) {
            const chunk = chunks[index] + ' ';
            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify({ content: chunk })}\n\n`
              )
            );
            index++;
            setTimeout(sendChunk, 50); // Simula streaming
          } else {
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
            controller.close();
          }
        };
        
        sendChunk();
      }
    });
  } catch (error: any) {
    console.error('Gemini streaming error:', error);
    throw error;
  }
}
