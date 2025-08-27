import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verificar el token con Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }
    
    // Agregar información del usuario a la request
    req.userId = user.id;
    req.userEmail = user.email;
    
    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
}

// Middleware opcional - no bloquea si no hay autenticación
export async function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth header received:', authHeader ? 'Present' : 'Missing');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      console.log('Token length:', token?.length);
      
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (error) {
        console.log('Error verifying token:', error.message);
      }
      
      if (user) {
        req.userId = user.id;
        req.userEmail = user.email;
        console.log('User authenticated:', user.email);
      } else {
        console.log('No user found for token');
      }
    }
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    // Si hay error, continuar sin autenticación
    next();
  }
}