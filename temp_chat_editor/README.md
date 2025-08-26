# Gemini Chat & Image Editor

A modern chat interface with Gemini AI integration for text conversations and advanced image editing capabilities.

## Features

- **Text Chat**: Interactive conversations powered by Gemini 2.5 Flash
- **Image Editing**: Upload and edit images using Gemini 2.5 Flash Image Preview
- **Modern UI**: Clean, responsive design with dark/light theme support
- **File Support**: JPEG, PNG, WebP, HEIC, HEIF up to 25MB
- **Real-time**: Live chat experience with typing indicators
- **Download**: Save edited images directly from the chat

## Setup

1. **Environment Variables**
   - Add `GEMINI_API_KEY` to your Replit Secrets
   - Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

2. **Install Dependencies**
   ```bash
   npm install @google/genai
   ```

3. **Run the Application**
   ```bash
   npm run dev
   ```

## API Endpoints

### POST /api/chat
Text conversation endpoint using Gemini 2.5 Flash.

**Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Tell me about machine learning"
    }
  ]
}
