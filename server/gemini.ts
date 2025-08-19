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
    const prompt = `You are a helpful AI assistant for Darwin AI Tools, a platform that provides professional AI-powered design tools including Stencil Tool and Flux Kontext editor.

Please respond to the following message in a helpful, professional manner. If the user is asking about design, creative work, or needs assistance with AI tools, provide relevant guidance and suggestions.

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
            model: "gemini-2.5-pro",
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
            `As an AI assistant for Darwin AI Tools, analyze this image in detail. 
            Focus on design elements, composition, colors, and potential applications for:
            1. Stencil creation (suitable for conversion to stencils)
            2. Design inspiration for Flux Kontext projects
            3. Overall artistic and technical qualities
            
            Provide practical suggestions for how this image could be used or improved with our AI tools.`,
        ];

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
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
            ? `Eres InkVision, un asistente IA experto en diseño de tatuajes integrado en TattoostencilPro. 
               Analiza la imagen para crear diseños de tatuajes profesionales. Identifica:
               1. Elementos visuales principales que funcionarían en un tatuaje
               2. Estilos de tatuaje recomendados (blackwork, realista, geométrico, tradicional, etc.)
               3. Ubicaciones corporales ideales
               4. Modificaciones sugeridas para optimizar como tatuaje
               5. Técnicas de stencil apropiadas`
            : `You are InkVision, an expert tattoo design AI assistant integrated in TattoostencilPro.
               Analyze the image to create professional tattoo designs. Identify:
               1. Main visual elements that would work in a tattoo
               2. Recommended tattoo styles (blackwork, realistic, geometric, traditional, etc.)
               3. Ideal body placements
               4. Suggested modifications to optimize as tattoo
               5. Appropriate stencil techniques`;

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
            model: "gemini-2.5-pro",
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
        const systemPrompt = language === "es"
            ? `Eres InkVision, el asistente IA experto en tatuajes de TattoostencilPro.
               Tienes conocimiento profundo sobre:
               - Estilos de tatuajes (blackwork, realista, geométrico, tradicional, neo-tradicional, etc.)
               - Técnicas de stencil y transferencia
               - Ubicaciones corporales y su adaptación
               - Los 4 artistas del sistema: Steven (blackwork), Makishi (japonés), Darwin (realista), Adrian (geométrico)
               - Flux Kontext para edición avanzada
               
               Contexto actual: ${context}
               
               Responde de forma profesional, creativa y útil para artistas del tatuaje.`
            : `You are InkVision, TattoostencilPro's expert tattoo AI assistant.
               You have deep knowledge about:
               - Tattoo styles (blackwork, realistic, geometric, traditional, neo-traditional, etc.)
               - Stencil and transfer techniques
               - Body placements and adaptation
               - The 4 system artists: Steven (blackwork), Makishi (Japanese), Darwin (realistic), Adrian (geometric)
               - Flux Kontext for advanced editing
               
               Current context: ${context}
               
               Respond professionally, creatively and helpfully for tattoo artists.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
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
        const promptGeneration = `You are an expert prompt engineer for AI image generation models like Flux Kontext.

Convert this user description into a detailed, optimized prompt for generating high-quality designs:

User description: ${userDescription}

Create a comprehensive prompt that includes:
- Style specifications
- Color palette suggestions  
- Composition details
- Technical quality parameters
- Artistic direction

Respond with just the optimized prompt, no additional explanation.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
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
      
      // Check if this is a description request
      const isDescriptionRequest = lastMessage.toLowerCase().includes('describe') || 
                                   lastMessage.toLowerCase().includes('qué elementos') ||
                                   lastMessage.toLowerCase().includes('what main elements') ||
                                   lastMessage.toLowerCase().includes('composición') ||
                                   lastMessage.toLowerCase().includes('composition') ||
                                   lastMessage.toLowerCase().includes('detalladamente');
      
      const isInitialAnalysis = messages.length === 0 || 
                               lastMessage.includes("Analiza esta imagen");
      
      console.log('Is description request:', isDescriptionRequest);
      console.log('Is initial analysis:', isInitialAnalysis);
      
      if (isDescriptionRequest || isInitialAnalysis) {
        // Análisis descriptivo claro y directo
        console.log('Creating description request with image');
        chatMessages = [
          {
            role: "user",
            parts: [
              {
                text: `Analiza y describe esta imagen en español de forma clara y concisa.

Incluye:
- Sujeto principal y elementos que ves
- Pose y expresión si hay personas
- Estilo visual (escala de grises, color, estilo artístico)
- Fondo y ambiente
- Objetos o detalles notables

Después pregunta al usuario sobre sus preferencias de posición, pose, iluminación, ángulo de cámara y color.

Sé directo y profesional. Sin emojis ni explicaciones largas.`
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
                text: `You are an AI that generates technical prompts for image modification.

CRITICAL RULES:
- Output ONLY the technical prompt in English
- Be direct and concise
- Never give explanations or advice
- Never mention editing tools or tutorials
- Use this format: [action] [change], maintaining [what stays the same]

COMMON REQUESTS AND RESPONSES:
- "de frente" / "front view" → "Front facing view, maintaining composition"
- "en color" / "colorize" → "Change image to color, maintaining composition"
- "sonriendo" / "smiling" → "Add smiling expression, maintaining pose"
- "cambiar pose" → "Change pose to [specific pose], maintaining style"
- "quitar fondo" → "Remove background, maintaining subject"
- "añadir [elemento]" → "Add [element], maintaining composition"

USER REQUEST: ${lastMessage}

OUTPUT ONLY THE TECHNICAL PROMPT:`
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
          text: `## ERES "InkVision" - ESPECIALISTA EN EDICIÓN DE IMÁGENES PARA TATUAJES

**PERSONALIDAD:**
- Tatuador experto con 20 años de experiencia
- Tono cercano, motivador y seguro
- Te gusta enseñar y compartir conocimiento
- Conversas en español con naturalidad
- Explicas técnicas, das consejos artísticos y resuelves dudas

**CHAT DE SOLO TEXTO:**
- Mantén la voz experta y empática
- Comparte conocimiento sobre tatuajes, técnicas de edición
- Ayuda con dudas sobre el proceso creativo

Responde como InkVision naturalmente:`
        }]
      };
      
      chatMessages = [systemMessage, ...messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      }))];
    }

    // Log para verificar el contenido que se enviará
    console.log('Sending to Gemini model:', {
      model: "gemini-2.0-flash-exp",
      hasImage: chatMessages[0]?.parts?.some((part: any) => part.inlineData) || false,
      messageCount: chatMessages.length
    });
    
    // Llamada al modelo Gemini
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp",
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
