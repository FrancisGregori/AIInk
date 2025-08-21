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
- TERMINOLOGÍA: Usar "imagen para editar" NO "imagen de referencia" - la app está diseñada para subir y editar imágenes

**REPOSITORIO ORIGINAL:**
- Design Editor original: https://github.com/darwintattoo/FluxKontextAI (clonado en temp_clone/)
- Estado: ✅ Replicate API integrado completamente con InkVision
- Fecha: 2025-08-19 - Botón "Aplicar" conectado y funcionando

## Recent Changes (2025-08-19)
- ✅ Landing page completamente modernizada con diseño profesional inspirado en Freepik
- ✅ Logo real TattooStencilPro integrado correctamente en navegación y footer
- ✅ Tamaños de texto ajustados proporcionalmente (eliminados tamaños exagerados)
- ✅ Espaciado superior corregido en hero section
- ✅ Navegación actualizada con nombres específicos: "Stencil Tool" y "Design Editor"
- ✅ Sección irrelevante "¿Por qué integrar?" eliminada
- ✅ Esquema monocromático respetado sin colores ajenos a la marca
- ✅ Copyright y descripción actualizados para TattooStencilPro

### Performance Optimizations (2025-08-19 Noche)
- ✅ Carga instantánea de trabajos en progreso desde localStorage sin esperar servidor
- ✅ Estado "Processing" aparece inmediatamente al presionar "Generate Stencil"
- ✅ Problema de imagen encogida corregido en recuperación de trabajos
- ✅ PreviewArea optimizado para usar currentJob directo sin retrasos
- ✅ Sistema de trabajos temporales para feedback visual instantáneo

### Anti-Interruption Protection (2025-08-19 Noche)
- ✅ Galería se deshabilita visualmente durante procesamiento activo
- ✅ Elementos de galería muestran cursor "not-allowed" y opacidad 50%
- ✅ Clicks en galería se ignoran silenciosamente cuando hay trabajo en progreso
- ✅ Función loadFromGallery verifica estado de procesamiento antes de ejecutar
- ✅ Protección completa contra interrupciones accidentales de trabajos

### Authentication Updates (2025-08-21 Tarde)
- ✅ Sistema de autenticación simplificado sin referencias a proveedores externos
- ✅ Botones de login genéricos con "Sign In" en lugar de mencionar servicios específicos  
- ✅ Colores consistentes con la marca: negro, blanco, grises, gradiente morado/rosa
- ✅ Eliminados colores ajenos (azul, amarillo) que no pertenecen a la identidad visual
- ✅ Página de auth-landing con diseño profesional manteniendo esquema monocromático
- ✅ Estrellas de testimoniales cambiadas de amarillo a morado para consistencia

### System Stability Fixes (2025-08-20 Madrugada)
- ✅ Eliminado polling duplicado que causaba errores de JSON parsing
- ✅ Corregido QuotaExceededError con limpieza automática de localStorage
- ✅ Implementado límite de 20 trabajos y expiración de 24h para optimizar memoria
- ✅ Manejo robusto de errores con fallback automático para evitar pantallas negras
- ✅ Sistema de persistencia simplificado usando solo localStorage + React Query
- ✅ Aplicación estable sin errores críticos - funcionamiento confirmado por usuario

### Video Integration (2025-08-20 Madrugada)
- ✅ Video hero profesional implementado en landing page (estilo Apple/Tesla)
- ✅ Servidor configurado para servir archivos MP4/WebM estáticos
- ✅ Video demo del usuario integrado exitosamente (12MB MP4, 1920x1080, 30s)
- ✅ Optimizado con moov atom al inicio (faststart) para streaming progresivo
- ✅ Configuración final: autoplay silencioso, loop continuo, sin controles visibles
- ✅ Experiencia inmersiva confirmada por usuario - funciona perfecto

### Interface Redesign (2025-08-20 Tarde)
- ✅ InkVision reubicado al panel principal (donde estaba "Imagen para editar")
- ✅ Chat con carga directa de imágenes (drag & drop + botón clip)
- ✅ Interfaz unificada: chat, imagen y edición en un solo lugar
- ✅ Placeholder actualizado: "Describe cambios o arrastra imagen"
- ✅ Sistema visual de drag & drop con overlay profesional
- ✅ Flujo más intuitivo confirmado por usuario - funciona perfecto

### Layout Optimization (2025-08-20 Tarde)
- ✅ InkVision movido al centro superior como elemento principal
- ✅ Estilos Populares reubicados al panel izquierdo como botones verticales
- ✅ Descripción del diseño simplificada debajo de InkVision
- ✅ Flujo optimizado: Estilos → InkVision → Descripción → Resultados
- ✅ Organización final aprobada por usuario - "me gusta mucho"

### UI Polish (2025-08-20 Tarde)
- ✅ Miniatura de imagen 32x32px implementada en chat
- ✅ Botón X para eliminar imagen cargada fácilmente
- ✅ Visualización profesional con bordes redondeados
- ✅ Sincronización perfecta entre chat y editor principal
- ✅ Usuario confirma: "se ve muy bien"

### Pricing Page Implementation (2025-08-21 Tarde)
- ✅ Página de precios profesional creada con planes definidos
- ✅ Basic ($11.99) - 200 créditos/mes, 40 stencils, 66 diseños
- ✅ Pro ($19.99) - 500 créditos/mes, 100 stencils, 166 diseños
- ✅ Premium ($39.99) - 1,000 créditos/mes, 200 stencils, 333 diseños
- ✅ Modelo personalizado rediseñado como servicio exclusivo "By Invitation"
- ✅ Custom Model: Solo 5 artistas/mes, requiere calificación, $299 inversión única
- ✅ Messaging premium: "Transform your unique tattoo artistry into a personalized AI model"
- ✅ Paquetes de créditos adicionales (100, 250, 500, 1000)
- ✅ Toggle mensual/anual con 17% descuento
- ✅ Sistema de créditos: Stencil 5cr, Editor 3cr, AI 0cr
- ✅ Rollover 50% créditos, Auto Top-Up con 3% descuento
- ✅ Navegación agregada a página de precios
- ✅ Usuario confirma: "quedó muy bien"

### Mobile Layout & Spacing Fixes (2025-08-20 Noche)
- ✅ InkVision reordenado para aparecer primero en móvil (order-1)
- ✅ Estilos Populares movido después de InkVision en móvil (order-2)
- ✅ Espaciado superior aumentado a py-20 en ambas herramientas
- ✅ Títulos ahora completamente visibles sin cortes
- ✅ Usuario confirma: "quedó muy bien"

### API Integration Fix (2025-08-21 Madrugada)
- ✅ Corregido error en botón "Generar diseño" - ahora usa `inputImageUrl` como InkVision
- ✅ Agregado `aspectRatio: 'match_input_image'` para mantener proporciones
- ✅ Verificado contra código original de GitHub para asegurar compatibilidad
- ✅ Generación de imágenes funciona correctamente desde ambos puntos
- ✅ Usuario confirma: "ahora si funciona"

### UI/UX Improvements (2025-08-21)
- ✅ Cambió "Descripción del diseño" a "Manual Prompt" para mayor claridad
- ✅ Actualizó "Estilos populares" a "Ediciones sugeridas" con categorías organizadas
- ✅ Implementó categorías de edición del repositorio original: Pose changes, Lighting, Styles, Camera angles
- ✅ Prompts de ediciones sugeridas siempre se envían en inglés a la API (mejor compatibilidad)
- ✅ InkVision ahora solo muestra botones Copiar/Aplicar para prompts reales, no para preguntas
- ✅ Detección inteligente: mensajes con "?" o "¿" se identifican como preguntas
- ✅ Animación de carga en botón "Aplicar" con spinner y texto "Generando..."
- ✅ Mensaje de carga eliminado del chat por redundancia - solo animación en botón
- ✅ Cuadro "Diseño completado" funciona desde InkVision con callback onImageGenerated
- ✅ Botones Copiar/Aplicar ocultos en mensajes de confirmación (no son prompts)
- ✅ Click en imagen de "Diseño completado" ahora abre modal en lugar de nueva pestaña (evita about:blank)

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
- ✅ Imágenes generadas aparecen tanto en InkVision chat como en editor principal
- ✅ Modal de zoom implementado - imágenes clickeables para ver en tamaño completo

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