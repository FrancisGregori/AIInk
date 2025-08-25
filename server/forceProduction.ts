// Forzar modo producción cuando estamos en Replit deployment
export function forceProductionMode() {
  // Si estamos en un deployment de Replit, SIEMPRE usar producción
  if (process.env.REPLIT_ENVIRONMENT === 'production' || 
      (process.env.REPLIT_DOMAINS && process.env.REPLIT_DOMAINS.includes('.replit.app'))) {
    
    // Force production mode for Replit deployment
    process.env.NODE_ENV = 'production';
    return true;
  }
  return false;
}

// Ejecutar inmediatamente al cargar el módulo
forceProductionMode();