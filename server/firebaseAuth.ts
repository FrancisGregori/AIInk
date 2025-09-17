import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { adminAuth } from './firebaseConfig';
import { storage } from './storage';
import type { DecodedIdToken } from 'firebase-admin/auth';

// Extend Express Request to include Firebase user
declare global {
  namespace Express {
    interface Request {
      firebaseUser?: DecodedIdToken;
      userId?: string;
    }
  }
}

/**
 * Middleware to verify Firebase Authentication token
 * Replaces the old isAuthenticated middleware from Replit Auth
 */
export const requireAuth: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Extract the token
    const idToken = authHeader.split('Bearer ')[1];
    
    if (!idToken) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    try {
      // Debug log for Railway
      console.log('[Firebase Auth] Verifying token, length:', idToken.length);

      // Verify the token with Firebase Admin SDK
      const decodedToken = await adminAuth.verifyIdToken(idToken);

      console.log('[Firebase Auth] Token verified successfully for user:', decodedToken.uid);

      // Attach the decoded token to the request
      req.firebaseUser = decodedToken;
      req.userId = decodedToken.uid;
      
      // Ensure user exists in our database
      let user = await storage.getUser(decodedToken.uid);
      
      if (!user) {
        // Create user if doesn't exist
        user = await storage.upsertUser({
          id: decodedToken.uid,
          email: decodedToken.email || '',
          firstName: decodedToken.name?.split(' ')[0] || '',
          lastName: decodedToken.name?.split(' ').slice(1).join(' ') || '',
          profileImageUrl: decodedToken.picture || null,
        });
      }
      
      // Attach user to request for backwards compatibility
      (req as any).user = {
        claims: {
          sub: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name,
          picture: decodedToken.picture,
        }
      };
      
      next();
    } catch (error: any) {
      console.error('[Firebase Auth] Token verification failed:', {
        error: error.message,
        code: error.code,
        projectId: process.env.FIREBASE_PROJECT_ID,
      });

      // Provide more specific error messages
      if (error.code === 'auth/argument-error') {
        return res.status(401).json({ message: 'Invalid token format' });
      } else if (error.code === 'auth/id-token-expired') {
        return res.status(401).json({ message: 'Token has expired' });
      } else if (!adminAuth) {
        return res.status(503).json({ message: 'Authentication service not configured' });
      }

      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
};

/**
 * Optional auth middleware - doesn't require authentication but attaches user if available
 */
export const optionalAuth: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    if (!idToken) {
      return next();
    }

    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      req.firebaseUser = decodedToken;
      req.userId = decodedToken.uid;
      
      // Set user for backwards compatibility
      (req as any).user = {
        claims: {
          sub: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name,
          picture: decodedToken.picture,
        }
      };
    } catch (error) {
      // Token is invalid but we don't block the request
      console.debug('Optional auth: Invalid token provided');
    }
    
    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
};

/**
 * Middleware to check if Firebase Auth is properly configured
 */
export const checkFirebaseConfig = (): boolean => {
  const required = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn('⚠️  Firebase Auth not configured. Missing:', missing.join(', '));
    console.warn('Using development mode without authentication');
    return false;
  }
  
  return true;
};

/**
 * Development mode middleware - allows all requests (for testing only)
 */
export const devAuth: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  // In development, create a mock user
  req.userId = 'dev-user-123';
  (req as any).user = {
    claims: {
      sub: 'dev-user-123',
      email: 'dev@example.com',
      name: 'Dev User',
    }
  };
  next();
};

// Export the appropriate middleware based on configuration
export const isAuthenticated = checkFirebaseConfig() ? requireAuth : devAuth;