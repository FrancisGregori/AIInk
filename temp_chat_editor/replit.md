# Overview

This is a modern chat interface application that integrates with Google's Gemini AI for both text conversations and advanced image editing capabilities. The application provides a real-time chat experience powered by Gemini 2.5 Flash for text interactions and Gemini 2.5 Flash Image Preview for image editing tasks. Users can upload images (JPEG, PNG, WebP, HEIC, HEIF up to 25MB), chat with the AI, and receive edited images directly within the chat interface. The application features a clean, responsive design with dark/light theme support and includes download functionality for edited images.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with shadcn/ui components for consistent design
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: React Query (TanStack Query) for server state management and React hooks for local state
- **Type Safety**: Full TypeScript implementation across the codebase

## Backend Architecture
- **Server**: Express.js with TypeScript in ESM format
- **API Design**: RESTful endpoints with proper error handling and validation
- **Request Handling**: JSON parsing with 25MB limit to support large image uploads
- **File Processing**: Base64 encoding for image data transmission
- **Validation**: Zod schemas for request validation and type safety

## Key Endpoints
- **POST /api/chat**: Text conversation endpoint using Gemini 2.5 Flash
- **POST /api/edit-image**: Image editing endpoint using Gemini 2.5 Flash Image Preview
- **GET /healthz**: Health check endpoint

## Data Storage
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema**: User management system with username/password authentication
- **Configuration**: Drizzle Kit for migrations and schema management
- **Connection**: Neon Database serverless adapter for PostgreSQL connectivity

## Authentication & Security
- **Session Management**: Connect-pg-simple for PostgreSQL-backed session storage
- **Environment Variables**: Secure API key management through Replit Secrets
- **Input Validation**: File type and size validation for image uploads
- **Error Handling**: Comprehensive error handling with proper status codes

# External Dependencies

## AI Integration
- **Google Generative AI**: Official @google/genai SDK for Gemini API integration
- **Models**: 
  - gemini-2.5-flash for text conversations
  - gemini-2.5-flash-image-preview for image editing
- **API Key**: GEMINI_API_KEY stored securely in environment variables

## Database Services
- **Neon Database**: Serverless PostgreSQL database hosting
- **Connection**: @neondatabase/serverless for database connectivity

## UI & Styling
- **Radix UI**: Complete set of accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography

## Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Static type checking and enhanced developer experience
- **Drizzle**: Type-safe ORM with PostgreSQL dialect support
- **ESBuild**: Fast JavaScript bundler for production builds

## File Processing
- **File API**: Browser File API for image upload handling
- **Base64 Encoding**: Image data conversion for API transmission
- **MIME Type Validation**: Support for JPEG, PNG, WebP, HEIC, HEIF formats