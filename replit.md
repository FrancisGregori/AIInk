# TattoostencilPro

## Overview
TattoostencilPro is a professional AI-powered design platform featuring two main creative tools: Stencil Tool for tattoo stencil generation and Flux Kontext for AI-assisted design editing. It recreates the functionality of the original TattoostencilPro, utilizing multiple AI models for stencil processing. This full-stack web application, built with a React frontend and Express.js backend, supports real-time job processing, user credit management, and comprehensive gallery display. The business vision is to provide a leading AI-powered platform for tattoo artists and designers, enhancing creative workflows and expanding market potential through innovative AI tools.

## User Preferences
Preferred communication style: Simple, everyday language in Spanish (español).
Project landing page: https://tattoostencilpro.app (for project promotion)
Default AI model: Qwen Edit (for Design Editor)

**CRITICAL RULES:**
- NO confundir Stencil Tool con Design Editor - son completamente separados
- NO hacer cambios ni agregar funcionalidades sin preguntar primero
- SIEMPRE pedir autorización antes de modificar código
- USAR EXACTAMENTE el código del repositorio original que funciona - NO inventar nuevas implementaciones
- TERMINOLOGÍA: Usar "imagen para editar" NO "imagen de referencia" - la app está diseñada para subir y editar imágenes
- COLORES DE MARCA: **SOLO negro, blanco y grises** - PROHIBIDO usar azul, morado, rosa, rojo, verde, amarillo o CUALQUIER otro color EN ELEMENTOS DE LA MARCA
- EXCEPCIÓN: Los logos de terceros (Google, Facebook, etc.) mantienen sus colores originales
- DISEÑO: Mantener interfaz minimalista y profesional sin elementos decorativos innecesarias
- MEMORIA DE COLORES: Eliminar TODA referencia a colores morado/rosa del pasado - la marca NUNCA ha usado esos colores

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript (Vite build tool)
- **UI Components**: Shadcn/ui leveraging Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with a custom dark theme and responsive design
- **State Management**: TanStack Query (React Query) for server state and caching
- **Routing**: Wouter for lightweight client-side routing
- **File Uploads**: Uppy for drag-and-drop file handling.
- **UI/UX Decisions**: Minimalist and professional interface focusing on a monochromatic palette (black, white, greys). Video hero and streamlined workflows (e.g., InkVision integrated into main panel, organized popular styles/editions). Mobile-first considerations for layout and spacing.
- **Pricing Page**: Implemented with defined plans (Basic, Pro, Premium) and a custom "By Invitation" model, along with credit pack options.

### Backend Architecture
- **Framework**: Express.js with TypeScript on Node.js
- **API Design**: RESTful API with organized route handlers.
- **File Processing**: Multer middleware for file uploads.
- **AI Integration**: Google Gemini API for text and image processing.

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM.
- **Schema Management**: Drizzle Kit for migrations.
- **Storage Strategy**: In-memory storage with interfaces for database integration; Google Cloud Storage for persistent file management.

### Authentication and Authorization
- **Current State**: Basic username/password authentication with unique constraints.
- **Session Management**: Cookie-based sessions via Express middleware.
- **COOKIE_DOMAIN**: debe apuntar al dominio base (por ejemplo, '.aiink.com') incluyendo el punto inicial.
- **Security**: All core AI functionalities (image upload, AI chat, image analysis, design generation, "Apply" button) require user authentication. A freemium model allows free navigation but requires payment for generation.

### System Design Choices
- **Real-time Processing**: Implemented instant loading of in-progress jobs from localStorage and immediate "Processing" status feedback.
- **Gallery Accessibility**: Gallery remains accessible during processing - users can view completed work while new jobs process.
- **Performance**: Optimized preview area, temporary job system for instant feedback, and strict limits on stored jobs. Job data persisted to localStorage now excludes all base64/blob/data URLs and only saves when payload is under ~1MB to prevent `QuotaExceededError`. Jobs older than 6 hours are auto-pruned and maximum 10 jobs retained (reduced from 20). Toast notifications warn users when storage fails.
- **API Integration**: Replicate API is fully integrated for AI image editing, handling `ReadableStream` and `AsyncIterator`, with retry mechanisms and Zod schema validation.
- **UI/UX Refinements**: Changed terminology ("Manual Prompt," "Ediciones sugeridas"), intelligent detection of questions vs. prompts, loading animations, and optimized gallery display.
- **SPA Navigation**: Fixed white flash issue by replacing `window.location.href` with wouter's `setLocation` for instant SPA navigation in tool cards.
- **Modal Design**: Compact, content-adaptive modals that respect image aspect ratios with minimal padding and streamlined footers.
- **Error Handling**: Robust error handling for critical endpoints, ensuring HTTP 200 responses with valid JSON arrays even on total system failure. LocalStorage overflow protection implemented.
- **Permanent Image Storage**: CRITICAL FIX (2025-08-26) - Replicate URLs expire after 1 hour. Implemented automatic download and permanent storage to Google Cloud Storage. All generated images are now saved to `/objects/designs/` with permanent URLs that never expire. This prevents user work loss.

## External Dependencies

### Core Framework Dependencies
- **@google/genai**: Google Gemini AI API client.
- **@google-cloud/storage**: Google Cloud Storage SDK.
- **@neondatabase/serverless**: Neon database driver for PostgreSQL.
- **drizzle-orm**: Type-safe ORM.

### UI and Frontend Libraries
- **@radix-ui/react-***: Accessible UI primitives.
- **@tanstack/react-query**: Server state management.
- **wouter**: Minimalist React routing.
- **tailwindcss**: Utility-first CSS framework.

### File Upload and Processing
- **@uppy/core**: Core file upload.
- **@uppy/dashboard**: File upload interface.
- **@uppy/aws-s3**: AWS S3 integration (for S3 compatible storage).
- **multer**: Express middleware for multipart/form-data.

### AI and Image Generation
- **Google Gemini 2.5 Flash and Pro models**: For various AI operations (text, image processing).
- **Google Gemini 2.0 Flash Preview Image Generation**: For AI-powered image editing in Design Editor (replacing Replicate).
- **Important**: Gemini returns images as base64 data, not URLs. Images are immediately saved to Google Cloud Storage for permanent storage.

### Development Tools
- **vite**: Modern build tool.
- **tsx**: TypeScript execution environment.
- **esbuild**: Fast JavaScript bundler.
- **@replit/vite-plugin-***: Replit-specific development enhancements.