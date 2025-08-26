# TattoostencilPro

## Overview
TattoostencilPro is a professional AI-powered design platform featuring two main creative tools: Stencil Tool for tattoo stencil generation and Flux Kontext for AI-assisted design editing. It recreates the functionality of the original TattoostencilPro, utilizing multiple AI models (Steven, Makishi, Darwin, Adrian) for stencil processing. This full-stack web application, built with a React frontend and Express.js backend, supports real-time job processing, user credit management, and comprehensive gallery display. The business vision is to provide a leading AI-powered platform for tattoo artists and designers, enhancing creative workflows and expanding market potential through innovative AI tools.

### Recent Updates (2025-08-26)
- **Code Cleanup in Design Editor**: Removed dead code and unused state variables
  - Eliminated unused `referenceImage` state and all its setter calls (6 occurrences)
  - Removed unused `createProjectMutation` block (30 lines)
  - Results in cleaner, more maintainable code with reduced complexity
- **Fixed History Grid Sorting**: Projects now properly sorted by creation date
  - History section displays the 8 most recent designs instead of first 8 unsorted
  - Ensures newer designs always appear in the gallery
- **Fixed Object Storage Image Display**: Resolved issue where images couldn't be displayed due to bucket "public access prevention" restrictions
  - Removed all `file.makePublic()` calls that were failing
  - Changed all public URLs to use API endpoint `/api/public/images/` instead of direct Google Cloud Storage URLs
  - Images now properly served through API endpoints that work with bucket security
- **Fixed Reference Image Uploads**: Reference images now upload to Object Storage instead of being sent as base64
  - Added `/api/upload` endpoint for uploading reference images to Object Storage
  - Modified Design Editor to upload images and use URLs instead of base64 payloads
  - Prevents request size limit issues and improves performance

### Recent Updates (2025-08-24)
- **Neutral Style Added**: Implemented prompt-based "Neutral" style using line-art conversion without LoRA models
- **Dynamic Style Loading**: Updated StyleSelector component to load styles from API instead of hardcoded list
- **Schema Enhancement**: Added support for prompt-based styles alongside LoRA-based styles

### Previous Updates (2025-08-22)
- **InkVision Chat Assistant Enhanced**: Auto-detects and applies technical prompts in English and Spanish without confirmation
- **Smart Prompt Detection**: Recognizes technical patterns like "maintaining", "Change the", "Cambiar el", "manteniendo" 
- **Auto-Translation**: Technical prompts in Spanish/other languages are automatically translated to English
- **Simplified Error Messages**: Credit insufficient errors now show concise message "No tienes créditos suficientes"
- **Fixed Duplicate Questions**: Eliminated duplicate assistant questions when analyzing images

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
- DISEÑO: Mantener interfaz minimalista y profesional sin elementos decorativos innecesarios
- MEMORIA DE COLORES: Eliminar TODA referencia a colores morado/rosa del pasado - la marca NUNCA ha usado esos colores

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript (Vite build tool)
- **UI Components**: Shadcn/ui leveraging Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with a custom dark theme and responsive design
- **State Management**: TanStack Query (React Query) for server state and caching
- **Routing**: Wouter for lightweight client-side routing
- **File Uploads**: Uppy for drag-and-drop file handling, with AWS S3 compatibility.
- **UI/UX Decisions**: Minimalist and professional interface focusing on a monochromatic palette (black, white, greys). Video hero and streamlined workflows (e.g., InkVision integrated into main panel, organized popular styles/editions). Mobile-first considerations for layout and spacing.
- **Pricing Page**: Implemented with defined plans (Basic, Pro, Premium) and a custom "By Invitation" model, along with credit pack options.

### Backend Architecture
- **Framework**: Express.js with TypeScript on Node.js
- **API Design**: RESTful API with organized route handlers.
- **File Processing**: Multer middleware for file uploads.
- **AI Integration**: Google Gemini API for text and image processing.
- **Development**: Hot module replacement for seamless development.

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
- **Gallery Accessibility**: Gallery remains accessible during processing - users can view completed work while new jobs process (2025-08-22).
- **Performance**: Optimized preview area, temporary job system for instant feedback, and limits on stored jobs (20 items, 24h expiration) to prevent `QuotaExceededError`.
- **API Integration**: Replicate API is fully integrated for AI image editing, handling `ReadableStream` and `AsyncIterator`, with retry mechanisms and Zod schema validation.
- **UI/UX Refinements**: Changed terminology ("Manual Prompt," "Ediciones sugeridas"), intelligent detection of questions vs. prompts, loading animations, and optimized gallery display (limited to 2 latest items, portrait layout, daily organization, hover overlays, quick actions).
- **SPA Navigation**: Fixed white flash issue by replacing `window.location.href` with wouter's `setLocation` for instant SPA navigation in tool cards (2025-08-22).
- **Modal Design**: Compact, content-adaptive modals that respect image aspect ratios with minimal padding and streamlined footers (2025-08-22).

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
- **@uppy/aws-s3**: AWS S3 integration.
- **multer**: Express middleware for multipart/form-data.

### AI and Image Generation
- **Google Gemini 2.5 Flash and Pro models**: For various AI operations (text, image processing).
- **Replicate API**: Specifically with FLUX.1 Kontext Pro/Max models for AI-powered image editing.

### Development Tools
- **vite**: Modern build tool.
- **tsx**: TypeScript execution environment.
- **esbuild**: Fast JavaScript bundler.
- **@replit/vite-plugin-***: Replit-specific development enhancements.