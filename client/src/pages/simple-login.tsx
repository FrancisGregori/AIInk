import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import { Link } from "wouter";
import logoPath from "@assets/1Asset 3zzz_1755637024508.png";

export default function SimpleLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // For now, redirect to Replit auth
    window.location.href = '/api/login';
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/login';
  };

  const handleAppleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center">
          {/* Logo */}
          <Link href="/">
            <img 
              src={logoPath} 
              alt="TattooStencilPro" 
              className="h-12 mx-auto mb-6 cursor-pointer hover:opacity-80 transition-opacity"
            />
          </Link>
          
          {/* Subtitle */}
          <p className="text-gray-400 mb-12">
            Log in or sign up
          </p>

          {/* Google Login Button */}
          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white py-6 mb-4"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          {/* Apple Login Button */}
          <Button
            onClick={handleAppleLogin}
            variant="outline"
            className="w-full bg-black border-zinc-700 hover:bg-zinc-800 text-white py-6 mb-6"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="white">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Continue with Apple
          </Button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-black text-gray-500">or</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailSubmit}>
            <div className="relative mb-4">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 py-6 bg-zinc-800 border-zinc-700 text-white placeholder-gray-500 focus:border-zinc-600 focus:ring-0"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-white hover:bg-gray-200 text-black py-6 font-medium"
              disabled={isLoading}
            >
              Continue with email →
            </Button>
          </form>

          {/* Terms */}
          <p className="text-xs text-gray-500 mt-8">
            By signing up, you agree to our<br />
            <Link href="/terms">
              <span className="text-gray-400 hover:text-white cursor-pointer">Terms of Service</span>
            </Link>
            {" & "}
            <Link href="/privacy">
              <span className="text-gray-400 hover:text-white cursor-pointer">Privacy Policy</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}