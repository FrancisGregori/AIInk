#!/bin/bash

# Script de inicio para Replit
# Detecta automáticamente si estamos en desarrollo o producción

if [ "$REPLIT_ENVIRONMENT" = "production" ]; then
  echo "🚀 Starting in PRODUCTION mode"
  export NODE_ENV=production
  # Construir y ejecutar la versión de producción
  npm run build && npm start
else
  echo "🔧 Starting in DEVELOPMENT mode"
  export NODE_ENV=development
  npm run dev
fi