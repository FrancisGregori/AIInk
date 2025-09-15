import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Firebase Admin SDK configuration
// You'll need to set up environment variables for production
const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'your-project-id',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'your-client-email',
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || 'your-private-key',
};

// Initialize Firebase Admin only once
let adminApp: any;
try {
  adminApp = initializeApp({
    credential: cert(serviceAccount),
  });
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
}

export const adminAuth = getAuth(adminApp);

// Firebase client configuration (for frontend)
export const firebaseClientConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.FIREBASE_APP_ID || "",
};