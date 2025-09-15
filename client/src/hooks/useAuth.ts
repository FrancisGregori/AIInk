import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";

// This hook now wraps the Firebase auth context for backwards compatibility
// All existing components using useAuth will continue to work
export function useAuth() {
  const { user, isLoading, isAuthenticated } = useFirebaseAuth();
  
  return {
    user,
    isLoading,
    isAuthenticated,
  };
}