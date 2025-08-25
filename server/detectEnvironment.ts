// Detectar correctamente el entorno en Replit
export function detectEnvironment(): 'production' | 'development' {
  // Si NODE_ENV está configurado, usarlo
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }
  
  if (process.env.NODE_ENV === 'development') {
    return 'development';
  }
  
  // En Replit, si tenemos REPLIT_ENVIRONMENT=production, estamos en producción
  if (process.env.REPLIT_ENVIRONMENT === 'production') {
    return 'production';
  }
  
  // Si estamos en Replit pero no es desarrollo explícito, asumir producción
  if (process.env.REPLIT_DOMAINS && !process.env.NODE_ENV) {
    return 'production';
  }
  
  // Por defecto desarrollo
  return 'development';
}

// Configurar NODE_ENV si no está configurado
export function setupEnvironment() {
  const env = detectEnvironment();
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = env;
  }
  console.log('🔧 Environment Detection:');
  console.log('  NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('  REPLIT_ENVIRONMENT:', process.env.REPLIT_ENVIRONMENT || 'not set');
  console.log('  REPLIT_DOMAINS:', process.env.REPLIT_DOMAINS ? 'configured' : 'not set');
  console.log('  Detected as:', env);
  return env;
}