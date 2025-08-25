// Forzar modo producción cuando estamos en Replit deployment
export function forceProductionMode() {
  // Si estamos en un deployment de Replit, SIEMPRE usar producción
  if (process.env.REPLIT_ENVIRONMENT === 'production' || 
      (process.env.REPLIT_DOMAINS && process.env.REPLIT_DOMAINS.includes('.replit.app'))) {
    
    console.log('⚠️ FORCING PRODUCTION MODE - Detected Replit deployment');
    process.env.NODE_ENV = 'production';
    
    // Verificar que se aplicó
    console.log('✅ NODE_ENV set to:', process.env.NODE_ENV);
    return true;
  }
  return false;
}

// Ejecutar inmediatamente al cargar el módulo
forceProductionMode();