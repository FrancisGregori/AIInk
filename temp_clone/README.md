# TattooStencilPro - AI Tattoo Design Generator

An advanced AI-powered tattoo design generator that leverages cutting-edge image processing to transform tattoo ideation. Built with React, Express, and PostgreSQL.

## Features

- **AI-Powered Generation**: Uses Replicate's FLUX Kontext Pro for high-quality image generation
- **Style Transformations**: Apply various artistic styles while preserving composition
- **Multilingual Support**: Available in English and Spanish
- **High-Quality Output**: Full resolution images without compression
- **Persistent Storage**: PostgreSQL database for image management
- **Responsive Design**: Mobile-first approach with modern UI

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Replicate API account

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database
PGHOST=your_host
PGPORT=5432
PGUSER=your_username
PGPASSWORD=your_password
PGDATABASE=your_database

# Replicate API
REPLICATE_API_TOKEN=r_your_replicate_token_here
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your database:
   ```bash
   npm run db:push
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Getting API Keys

### Replicate API Token
1. Go to [Replicate.com](https://replicate.com)
2. Sign up or log in to your account
3. Navigate to your account settings
4. Generate an API token
5. Copy the token (starts with `r_`)

### Database Setup
The application requires a PostgreSQL database. You can use:
- Local PostgreSQL installation
- Cloud services like Neon, Supabase, or AWS RDS
- The provided Replit database

## Usage

1. Upload a reference image or start with a text prompt
2. Choose your desired artistic style
3. Generate high-quality tattoo designs
4. Browse your generation history in the gallery

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: Replicate FLUX Kontext Pro
- **Image Processing**: Sharp for optimization

## Deployment

The application is ready for deployment on Replit or any Node.js hosting platform. Ensure all environment variables are properly configured in your deployment environment.

## API Endpoints

- `GET /api/images` - Retrieve all generated images
- `GET /api/image/:id` - Get specific image by ID
- `POST /api/generate` - Generate new image
- `POST /api/upload` - Upload reference image
- `DELETE /api/images/:id` - Delete image

## License

All rights reserved.