import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  signInWithGoogle, 
  signInWithApple,
  signInWithEmail,
  signUpWithEmail,
  logOut,
  onAuthStateChanged,
  getIdToken,
  type User as FirebaseUser
} from '@/lib/firebaseConfig';
import { type User } from '@shared/schema';
import { queryClient } from '@/lib/queryClient';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user data from backend when Firebase user changes
  const fetchUserData = async (fbUser: FirebaseUser) => {
    try {
      const token = await fbUser.getIdToken();

      // Use API URL from environment
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const fullUrl = `${apiUrl}/api/auth/user`;

      console.log('Fetching user from:', fullUrl);

      const response = await fetch(fullUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        // Update query cache
        queryClient.setQueryData(['/api/auth/user'], userData);
      } else {
        setUser(null);
        queryClient.setQueryData(['/api/auth/user'], null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);
      queryClient.setQueryData(['/api/auth/user'], null);
    }
  };

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        await fetchUserData(fbUser);
      } else {
        setUser(null);
        queryClient.setQueryData(['/api/auth/user'], null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Authentication methods
  const handleSignInWithGoogle = async () => {
    try {
      const result = await signInWithGoogle();
      if (result.user) {
        await fetchUserData(result.user);
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  };

  const handleSignInWithApple = async () => {
    try {
      const result = await signInWithApple();
      if (result.user) {
        await fetchUserData(result.user);
      }
    } catch (error: any) {
      console.error('Apple sign-in error:', error);
      throw new Error(error.message || 'Failed to sign in with Apple');
    }
  };

  const handleSignInWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmail(email, password);
      if (result.user) {
        await fetchUserData(result.user);
      }
    } catch (error: any) {
      console.error('Email sign-in error:', error);
      // Provide user-friendly error messages
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      } else {
        throw new Error(error.message || 'Failed to sign in');
      }
    }
  };

  const handleSignUpWithEmail = async (email: string, password: string) => {
    try {
      const result = await signUpWithEmail(email, password);
      if (result.user) {
        await fetchUserData(result.user);
      }
    } catch (error: any) {
      console.error('Email sign-up error:', error);
      // Provide user-friendly error messages
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('An account already exists with this email');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      } else {
        throw new Error(error.message || 'Failed to create account');
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      setUser(null);
      setFirebaseUser(null);
      queryClient.clear();
      // Redirect to home page
      window.location.href = '/';
    } catch (error: any) {
      console.error('Sign-out error:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  };

  const value: AuthContextType = {
    firebaseUser,
    user,
    isLoading,
    isAuthenticated: !!firebaseUser && !!user,
    signInWithGoogle: handleSignInWithGoogle,
    signInWithApple: handleSignInWithApple,
    signInWithEmail: handleSignInWithEmail,
    signUpWithEmail: handleSignUpWithEmail,
    signOut: handleSignOut,
    getToken: getIdToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
}