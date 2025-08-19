import { GoogleGenAI } from "@google/genai";

// Configuración de la API Key
const getGeminiKey = (): string => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return key;
};

// Función principal para chat con Gemini
export async function getChatResponseGemini(
  messages: { role: 'user' | 'assistant', content: string }[],
  imageBase64?: string
): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: getGeminiKey() });
    
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
      
      if (isDescriptionRequest) {
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
                  data: imageBase64,
                  mimeType: "image/jpeg",
                },
              }
            ]
          }
        ];
      } else if (isInitialAnalysis) {
        // Análisis inicial automático - descripción clara y directa
        console.log('Creating initial analysis request with image');
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
                  data: imageBase64,
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
                  data: imageBase64,
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
    const response = await ai.models.generateContent({
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