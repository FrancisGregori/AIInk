# TattooStencilPro - AI Tattoo Design Generator

## Overview

TattooStencilPro is an AI-powered tattoo design generator that transforms user inputs into professional tattoo stencils using advanced image processing technology. The application leverages Replicate's FLUX Kontext Pro model for high-quality image generation, allowing users to create, modify, and customize tattoo designs through an intuitive web interface. The platform supports both text-based prompts and reference image uploads, offering style transformations while preserving original composition elements. Features an AI chat assistant "InkVision" powered by Google Gemini that analyzes uploaded images and helps users generate optimized prompts through natural language conversation.

## User Preferences

Preferred communication style: Simple, everyday language.
Language preference: Spanish interface with bilingual support (Spanish/English).
Design preferences: Professional, expensive-looking interface with black, gray, and white color scheme. No emojis or casual elements.

## Recent Changes (January 17, 2025)

### Google Authentication Integration
- **Problem**: User requested Google sign-in functionality to match other apps in their ecosystem
- **Solution**:
  - Added `signInWithGoogle` method to auth context using Supabase OAuth provider
  - Integrated Google sign-in button in both login and signup tabs
  - Professional Google logo SVG with proper brand colors
  - Loading states and disabled states for better UX
- **Components Updated**: 
  - `client/src/contexts/auth-context.tsx`: Added Google OAuth method
  - `client/src/components/auth-form.tsx`: Added Google sign-in buttons with divider
- **Result**: Users can now sign in with Google using their existing Supabase OAuth configuration

### UI Header Updates (January 16, 2025)
- **Problem**: Header branding text positioning and organization needed improvement
- **Solution**:
  - Removed "Impulsado por FLUX Kontext PRO AI" and "Impulsado por Gemini AI" branding text
  - Reorganized header into three distinct lines:
    - Line 1: Logo and navigation buttons
    - Line 2: "Transforma tus ideas en arte profesional" centered
    - Line 3: "by Darwin Enriquez" aligned left
  - Improved responsive design with cleaner visual organization
- **Result**: Cleaner, more professional header layout with better mobile responsiveness and clear visual hierarchy

### Fixed Supabase Storage Bucket Configuration
- **Problem**: Images weren't displaying due to missing "renders" bucket in Supabase Storage
- **Solution**: 
  - Created new "tattoo-renders" bucket with public access permissions
  - Implemented dynamic bucket detection and fallback system
  - Added server-side proxy endpoint `/api/proxy-image` for handling CORS
  - Added frontend filter to exclude broken images from old "renders" bucket
- **Components Updated**: 
  - `server/lib/supabase.ts`: Added bucket creation and management logic
  - `server/routes.ts`: Updated to use dynamic STORAGE_BUCKET variable
  - `client/src/components/optimized-image.tsx`: Uses proxy for Supabase URLs
  - `client/src/components/image-gallery.tsx`: Filters out images from non-existent "renders" bucket
- **Result**: All images display correctly from "tattoo-renders" bucket, broken images are hidden

## System Architecture

### Frontend Architecture
- **Framework**: React 18+ with TypeScript for type safety and modern development practices
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: Radix UI primitives with shadcn/ui components for accessible, customizable interface elements
- **Styling**: Tailwind CSS with custom design tokens and dark theme support
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Internationalization**: Custom context-based solution supporting English and Spanish languages
- **UI/UX Design**: 
  - Sticky sidebar navigation for desktop with compact form controls
  - Simplified prompt suggestions with short, clear descriptions
  - Professional black, gray, and white monochromatic color scheme
  - Bilingual interface with Spanish as primary language
  - Reduced vertical spacing for better navigation flow
  - InkVision chat assistant with automatic scroll during responses and analysis
  - Enhanced animation feedback with bouncing dots during image analysis
  - Compact 40x40px reference image preview in chat for optimal visibility
  - Auto-generation feature: clicking "Aplicar" in InkVision automatically generates image with suggested prompt
  - Auto-scroll behavior: clicking "Aplicar" in InkVision smoothly scrolls to generation area
  - Image comparison slider: Interactive before/after comparison for edited images with drag-to-reveal functionality

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules for modern JavaScript features
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Architecture**: RESTful endpoints with structured error handling and request/response logging
- **File Handling**: Custom image storage system with local file system fallback for reliability
- **Image Processing**: Integration with Replicate API for AI-powered image generation

### Data Storage Solutions
- **Primary Database**: PostgreSQL for structured data persistence
- **Connection Pool**: Neon serverless with optimized connection pooling (max 3 connections for free tier compatibility)
- **Image Storage**: Hybrid approach using local file system with base64 fallback for resilience
- **Session Management**: Connect-pg-simple for PostgreSQL-backed session storage

### Authentication and Authorization
- **Session-based Authentication**: Server-side session management with PostgreSQL storage
- **API Security**: Request validation using Zod schemas for type-safe input handling
- **CORS Configuration**: Configured for cross-origin requests with credential support

## External Dependencies

### AI Services
- **Replicate API**: FLUX Kontext Pro model for high-quality image generation with configurable parameters (width, height, aspect ratio, model selection)
- **API Configuration**: Supports both "max" and "pro" model variants with customizable generation parameters

### Database Services
- **Neon PostgreSQL**: Cloud-native PostgreSQL database with serverless scaling
- **Connection Management**: WebSocket-based connections optimized for serverless environments

### Development Tools
- **Vite Plugins**: Runtime error overlay and development cartographer for enhanced debugging
- **Code Quality**: TypeScript strict mode with comprehensive type checking
- **Build Process**: ESBuild for server bundling and Vite for client optimization

### UI/UX Libraries
- **Component Library**: Extensive Radix UI ecosystem for accessible primitives
- **Icons**: Lucide React for consistent iconography
- **Animations**: Class Variance Authority for component variants and styling
- **Form Handling**: React Hook Form with Hookform Resolvers for validation

### Deployment Configuration
- **Static Assets**: Optimized serving of images and attached assets
- **Environment Variables**: Comprehensive configuration for database, API tokens, and deployment settings
- **Build Optimization**: Separate client and server builds with asset optimization