import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Eye, EyeOff } from "lucide-react";
import logoPath from "@assets/1Asset 3zzz_1755637024508.png";
import { useState } from "react";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import { useToast } from "@/hooks/use-toast";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language?: "es" | "en";
  toolType: "stencil" | "design";
}

const translations = {
  es: {
    title: "Iniciar sesión o registrarse",
    continueWithGoogle: "Continuar con Google",
    continueWithApple: "Continuar con Apple",
    continueWithEmail: "Continuar con email",
    or: "o",
    emailPlaceholder: "Email",
    terms: "Al registrarte, aceptas nuestros",
    termsOfService: "Términos de Servicio",
    and: "&",
    privacyPolicy: "Política de Privacidad"
  },
  en: {
    title: "Log in or sign up",
    continueWithGoogle: "Continue with Google",
    continueWithApple: "Continue with Apple",
    continueWithEmail: "Continue with email",
    or: "or",
    emailPlaceholder: "Email",
    terms: "By signing up, you agree to our",
    termsOfService: "Terms of Service",
    and: "&",
    privacyPolicy: "Privacy Policy"
  }
};

export function AuthDialog({ open, onOpenChange, language = "en", toolType }: AuthDialogProps) {
  const t = translations[language];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail } = useFirebaseAuth();
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      onOpenChange(false);
      toast({
        title: language === "es" ? "¡Bienvenido!" : "Welcome!",
        description: language === "es" ? "Has iniciado sesión correctamente" : "You have successfully signed in",
      });
    } catch (error: any) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithApple();
      onOpenChange(false);
      toast({
        title: language === "es" ? "¡Bienvenido!" : "Welcome!",
        description: language === "es" ? "Has iniciado sesión correctamente" : "You have successfully signed in",
      });
    } catch (error: any) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || "Failed to sign in with Apple",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" ? "Por favor ingresa email y contraseña" : "Please enter email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        toast({
          title: language === "es" ? "¡Cuenta creada!" : "Account created!",
          description: language === "es" ? "Tu cuenta ha sido creada exitosamente" : "Your account has been created successfully",
        });
      } else {
        await signInWithEmail(email, password);
        toast({
          title: language === "es" ? "¡Bienvenido!" : "Welcome!",
          description: language === "es" ? "Has iniciado sesión correctamente" : "You have successfully signed in",
        });
      }
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="auth-dialog sm:max-w-md bg-black border-zinc-700 p-8" style={{ backgroundColor: '#000000', borderColor: '#3f3f46' }}>
        <VisuallyHidden>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>Authentication dialog</DialogDescription>
        </VisuallyHidden>
        <div className="flex flex-col items-center space-y-6">
          {/* Logo */}
          <img 
            src={logoPath} 
            alt="TattooStencilPro" 
            className="h-12 w-auto"
          />
          
          {/* Title */}
          <h2 className="text-xl text-gray-300 font-normal">
            {t.title}
          </h2>
          
          {/* Google Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full text-white font-normal py-3 px-4 text-base flex items-center justify-center gap-3 rounded-md hover:opacity-90 transition-opacity"
            style={{ 
              backgroundColor: '#3a3a3a',
              border: 'none',
              outline: 'none'
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t.continueWithGoogle}
          </button>
          
          {/* Apple Button */}
          <button
            onClick={handleAppleLogin}
            disabled={isLoading}
            className="w-full text-white font-normal py-3 px-4 text-base flex items-center justify-center gap-3 rounded-md hover:opacity-90 transition-opacity"
            style={{ 
              backgroundColor: '#000000',
              border: '1px solid #4a4a4a',
              outline: 'none'
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            {t.continueWithApple}
          </button>
          
          {/* Or divider */}
          <div className="text-gray-500 text-sm">
            {t.or}
          </div>
          
          {/* Email Input */}
          <div className="w-full relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#808080' }} />
            <input
              type="email"
              placeholder={t.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-white pl-10 py-3 px-4 text-base rounded-md auth-email-input"
              style={{ 
                backgroundColor: '#3a3a3a',
                border: '1px solid #4a4a4a',
                outline: 'none',
                color: '#ffffff'
              }}
              onFocus={(e) => e.target.style.borderColor = '#5a5a5a'}
              onBlur={(e) => e.target.style.borderColor = '#4a4a4a'}
              disabled={isLoading}
            />
          </div>
          
          {/* Password Input (shown after email is entered) */}
          {email && (
            <div className="w-full relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={language === "es" ? "Contraseña" : "Password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-white pl-4 pr-10 py-3 px-4 text-base rounded-md auth-password-input"
                style={{ 
                  backgroundColor: '#3a3a3a',
                  border: '1px solid #4a4a4a',
                  outline: 'none',
                  color: '#ffffff'
                }}
                onFocus={(e) => e.target.style.borderColor = '#5a5a5a'}
                onBlur={(e) => e.target.style.borderColor = '#4a4a4a'}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                style={{ color: '#808080' }}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          )}
          
          {/* Continue with email button */}
          <button
            onClick={handleEmailLogin}
            disabled={isLoading}
            className="w-full text-black font-normal py-3 px-4 text-base rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ 
              backgroundColor: '#ffffff',
              border: 'none',
              outline: 'none'
            }}
          >
            {isLoading ? (language === "es" ? "Cargando..." : "Loading...") : 
             email && password ? 
               (isSignUp ? 
                 (language === "es" ? "Crear cuenta" : "Create account") : 
                 (language === "es" ? "Iniciar sesión" : "Sign in")) : 
               t.continueWithEmail} →
          </button>
          
          {/* Toggle between sign in and sign up */}
          {email && (
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
              disabled={isLoading}
            >
              {isSignUp ? 
                (language === "es" ? "¿Ya tienes cuenta? Inicia sesión" : "Already have an account? Sign in") :
                (language === "es" ? "¿No tienes cuenta? Regístrate" : "Don't have an account? Sign up")}
            </button>
          )}
          
          {/* Terms */}
          <p className="text-xs text-gray-500 text-center">
            {t.terms}<br/>
            <span className="hover:text-gray-300 cursor-pointer">{t.termsOfService}</span> {t.and} <span className="hover:text-gray-300 cursor-pointer">{t.privacyPolicy}</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}