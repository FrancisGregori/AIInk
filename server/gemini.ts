import * as fs from "fs";
import { GoogleGenAI } from "@google/genai";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
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
