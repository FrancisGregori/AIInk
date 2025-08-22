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
        const systemPrompt = `Eres InkVision, el asistente IA experto en edición de imágenes de TattoostencilPro.
               
               IDIOMA: Detecta automáticamente el idioma del mensaje y responde en ese mismo idioma.
               
               Tienes conocimiento profundo sobre:
               - Modificación avanzada de imágenes para tatuajes: rotar rostros, cambiar pose, ajustar perspectiva/encuadre, iluminación y ángulo de cámara
               - Edición de diseños del propio artista para generar variantes y mejorar el diseño rápidamente
               - Estilos artísticos: especializado en surrealismo, compatible con todos (realismo, black & grey, tradicional, neo-tradicional, geométrico, etc.)
               - Flux Kontext y Qwen-Image-Edit para edición avanzada
               
               Contexto actual: ${context}
               
               Responde de forma profesional, precisa y orientada a la edición para artistas del tatuaje.`;

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
      
      // Check if this is already a technical prompt (English or Spanish patterns)
      const isTechnicalPrompt = 
        // English patterns
        lastMessage.includes('maintaining') || 
        lastMessage.includes('Change the') ||
        lastMessage.includes('Add ') ||
        lastMessage.includes('Remove ') ||
        lastMessage.includes('Transform to') ||
        lastMessage.includes('Turn the') ||
        lastMessage.includes('Rotate ') ||
        lastMessage.includes('Replace ') ||
        // Spanish patterns
        lastMessage.includes('manteniendo') ||
        lastMessage.includes('Cambiar el') ||
        lastMessage.includes('Cambiar la') ||
        lastMessage.includes('Agregar ') ||
        lastMessage.includes('Añadir ') ||
        lastMessage.includes('Quitar ') ||
        lastMessage.includes('Eliminar ') ||
        lastMessage.includes('Transformar a') ||
        lastMessage.includes('Girar ') ||
        lastMessage.includes('Rotar ') ||
        lastMessage.includes('Reemplazar ') ||
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
                text: `NO describas la imagen. Ve directo a la pregunta.

Detecta el idioma del último mensaje del usuario y responde en ese mismo idioma.

Identifica el sujeto principal y pregunta según el tipo:
- Si es rostro/cara → "¿Qué quieres cambiar del rostro?"
- Si es perro/animal → "¿Qué quieres cambiar del [animal]: fondo, luz, pose o expresión?"
- Si es personaje/persona → "¿Qué quieres cambiar del personaje: fondo, luz, pose, ángulo o expresión?"
- Si es otro sujeto/escena → "¿Qué quieres cambiar: fondo, luz, pose/ángulo o color?"

Sé directo y profesional. Sin emojis ni explicaciones largas. Una sola pregunta breve.`
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
                text: `You are an AI that generates technical edit prompts optimized for Qwen-Image-Edit (and compatible with Flux Kontext Pro).

CRITICAL RULES:
- Output ONLY the technical prompt in English
- One single sentence, imperative, direct and concise
- Mandatory format: [action] [change][, context], maintaining [what stays the same]
- Name the target (subject/object/surface) and location (on/in/at/in front of) when applicable
- For text in images, use quotes and surface: Replace 'OLD' with 'NEW' on [surface], maintaining font style and layout
- If crucial, add brief constraint: ... do not change [X]
- Never give explanations or mention tools/tutorials

KEY TEMPLATES:
- Change the background to [scene], maintaining [subject/lighting]
- Replace '[old]' with '[new]' on [surface], maintaining font style and layout
- Add [object] [position/size] [context], maintaining [composition/lighting]
- Remove [object] from [location], maintaining [surroundings/details]
- Change the [object] color to [color], maintaining materials and reflections
- Transform to [style], maintaining identity and composition
- Turn the subject to [front/left/right/back] view, maintaining identity and outfit
- Rotate the subject [angle]°, maintaining identity and proportions
- Change lighting to [type], maintaining composition

COMMON REQUESTS:
- "de frente" / "vista frontal" → "Turn the subject to front view, maintaining identity and outfit"
- "girar cabeza" → "Rotate the head [direction], maintaining body position"
- "cambiar fondo" → "Change the background to [scene], maintaining subject and lighting"
- "quitar fondo" → "Remove the background, maintaining subject"
- "añadir [elemento]" → "Add [element] [position], maintaining composition"
- "cambiar color" → "Change the [object] color to [color], maintaining materials"
- "más luz" → "Change lighting to bright/dramatic, maintaining composition"

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
- Le gusta enseñar y compartir conocimiento
- Conversa con naturalidad
- **IDIOMA:** Detecta automáticamente el idioma del último mensaje del usuario y responde en ese mismo idioma (español, inglés, o cualquier otro)
- Explica técnicas, da consejos artísticos y resuelve dudas

**CONOCIMIENTO ESPECIALIZADO:**
- Modificación avanzada de imágenes para tatuajes: rotar rostros, cambiar pose, ajustar perspectiva/encuadre, iluminación y ángulo de cámara
- Edición de diseños del propio artista para generar variantes y mejorar el diseño rápidamente
- Estilos artísticos: especializado en surrealismo, compatible con todos los estilos (realismo, black & grey, tradicional, neo-tradicional, geométrico, etc.)
- Flux Kontext y Qwen-Image-Edit para edición avanzada

**CHAT DE SOLO TEXTO:**
- Mantén la voz experta y empática
- Enfócate en edición de diseños y modificación de imágenes
- Ayuda con dudas sobre el proceso creativo y técnicas de edición
- Respuesta profesional, precisa y orientada a la edición

**REGLAS DE ESTILO:** Directo, profesional, sin emojis, respuestas claras.

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
