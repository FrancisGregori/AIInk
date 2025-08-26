#!/usr/bin/env tsx
// Script de inicio inteligente que detecta el entorno

import { spawn } from 'child_process';

// Detectar si estamos en producción basándonos en REPLIT_ENVIRONMENT
const isProduction = process.env.REPLIT_ENVIRONMENT === 'production';

console.log('🔍 Detecting environment...');
console.log('  REPLIT_ENVIRONMENT:', process.env.REPLIT_ENVIRONMENT || 'not set');
console.log('  Detected as:', isProduction ? 'PRODUCTION' : 'DEVELOPMENT');

if (isProduction) {
  console.log('🚀 Starting in PRODUCTION mode');
  process.env.NODE_ENV = 'production';
  
  // Primero construir
  console.log('📦 Building for production...');
  const build = spawn('npm', ['run', 'build'], { stdio: 'inherit' });
  
  build.on('close', (code) => {
    if (code !== 0) {
      console.error('❌ Build failed');
      process.exit(code || 1);
    }
    
    console.log('✅ Build successful, starting server...');
    // Luego iniciar en producción
    const start = spawn('npm', ['run', 'start'], { stdio: 'inherit' });
    
    start.on('close', (code) => {
      process.exit(code);
    });
  });
} else {
  console.log('🔧 Starting in DEVELOPMENT mode');
  process.env.NODE_ENV = 'development';
  
  // Iniciar en desarrollo
  const dev = spawn('tsx', ['server/index.ts'], { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' }
  });
  
  dev.on('close', (code) => {
    process.exit(code);
  });
}