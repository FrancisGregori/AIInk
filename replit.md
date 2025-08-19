# TattoostencilPro

## Overview

TattoostencilPro is a professional AI-powered design platform that provides two main creative tools: Stencil Tool for tattoo stencil generation and Flux Kontext for AI-assisted design editing. The application recreates the exact functionality from TattoostencilPro with professional stencil processing capabilities using multiple AI models (Steven, Makishi, Darwin, Adrian). Built as a full-stack web application with React frontend and Express.js backend, featuring real-time job processing, user credit management, and comprehensive gallery display.

## User Preferences

Preferred communication style: Simple, everyday language.
Project landing page: https://tattoostencilpro.app (for project promotion)

**CRITICAL RULES:**
- NO confundir Stencil Tool con Design Editor - son completamente separados
- NO hacer cambios ni agregar funcionalidades sin preguntar primero
- SIEMPRE pedir autorización antes de modificar código
- USAR EXACTAMENTE el código del repositorio original que funciona - NO inventar nuevas implementaciones

**REPOSITORIO ORIGINAL:**
- Design Editor original: https://github.com/darwintattoo/FluxKontextAI (clonado en temp_clone/)
- Estado: ✅ Replicate API integrado completamente con InkVision
- Fecha: 2025-08-19 - Botón "Aplicar" conectado y funcionando

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library with Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom dark theme variables and responsive design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **File Uploads**: Uppy integration for drag-and-drop file handling with AWS S3 support

### Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **API Design**: RESTful API with organized route handlers for different tool functionalities
- **File Processing**: Multer middleware for handling multipart form data and file uploads
- **AI Integration**: Google Gemini API for text generation, sentiment analysis, and image processing
- **Development**: Hot module replacement with Vite integration for seamless development experience

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for database migrations and schema evolution
- **Storage Strategy**: In-memory storage implementation with interfaces for easy database integration
- **File Storage**: Google Cloud Storage integration for persistent file management

### Authentication and Authorization
- **Current State**: Basic user management schema prepared in database
- **User Model**: Username/password based authentication with unique constraints
- **Session Management**: Cookie-based sessions through Express middleware
- **Future Ready**: Infrastructure in place for JWT or session-based authentication

### External Service Integrations
- **AI Services**: Google Gemini 2.5 Flash and Pro models for various AI operations
- **Image Generation**: Replicate API with FLUX.1 Kontext Pro/Max for AI-powered image editing
- **Cloud Storage**: Google Cloud Storage for scalable file management
- **File Upload**: AWS S3 compatibility through Uppy for flexible storage options
- **Development Tools**: Replit-specific plugins for enhanced development experience

### Replicate Integration Status (2025-08-19)
- ✅ REPLICATE_API_TOKEN configurado en environment secrets
- ✅ Endpoint `/api/generate` implementado (copiado exacto del repositorio original)
- ✅ Manejo completo de ReadableStream y AsyncIterator de Replicate
- ✅ InkVision botón "Aplicar" conectado - genera imágenes automáticamente
- ✅ Soporte para FLUX.1 Kontext Pro y Max models
- ✅ Sistema de reintentos para manejar interrupciones
- ✅ Validación con Zod schema y manejo de errores completo

## External Dependencies

### Core Framework Dependencies
- **@google/genai**: Google Gemini AI API client for text and image processing
- **@google-cloud/storage**: Google Cloud Storage SDK for file management
- **@neondatabase/serverless**: Neon database driver for PostgreSQL connections
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect support

### UI and Frontend Libraries
- **@radix-ui/react-***: Comprehensive set of accessible UI primitives
- **@tanstack/react-query**: Server state management and caching solution
- **wouter**: Minimalist routing library for React applications
- **tailwindcss**: Utility-first CSS framework with custom design tokens

### File Upload and Processing
- **@uppy/core**: Core file upload functionality
- **@uppy/dashboard**: File upload interface components
- **@uppy/aws-s3**: AWS S3 integration for cloud storage
- **multer**: Express middleware for handling multipart/form-data

### Development and Build Tools
- **vite**: Modern build tool with hot module replacement
- **tsx**: TypeScript execution environment for Node.js
- **esbuild**: Fast JavaScript bundler for production builds
- **@replit/vite-plugin-***: Replit-specific development enhancements