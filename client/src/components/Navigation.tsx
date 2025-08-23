import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Bot, Menu, X, LogOut, User, CreditCard, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import logoPath from "@assets/1Asset 3zzz_1755637024508.png";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center cursor-pointer group" data-testid="link-home-nav">
              <img 
                src={logoPath} 
                alt="TattooStencilPro" 
                className="h-8 w-auto group-hover:scale-105 transition-transform"
              />
            </div>
          </Link>
          
          {/* Center Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {location === "/" ? (
              <>
                <button 
                  onClick={() => scrollToSection("inicio")} 
                  className="text-gray-300 hover:text-white transition-colors font-medium"
                  data-testid="button-nav-inicio"
                >
                  Home
                </button>
                <Link href="/stencil-tool">
                  <span className="text-gray-300 hover:text-white transition-colors cursor-pointer font-medium" data-testid="link-nav-stencil">
                    Stencil Tool
                  </span>
                </Link>
                <Link href="/design-editor">
                  <span className="text-gray-300 hover:text-white transition-colors cursor-pointer font-medium" data-testid="link-nav-design">
                    Design Editor
                  </span>
                </Link>
                {isAuthenticated && (
                  <Link href="/gallery">
                    <span className="text-gray-300 hover:text-white transition-colors cursor-pointer font-medium" data-testid="link-nav-gallery">
                      Mi Galería
                    </span>
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link href="/">
                  <span className="text-gray-300 hover:text-white transition-colors cursor-pointer font-medium" data-testid="link-nav-home">
                    Home
                  </span>
                </Link>
                <Link href="/stencil-tool">
                  <span className="text-gray-300 hover:text-white transition-colors cursor-pointer font-medium" data-testid="link-nav-stencil">
                    Stencil Tool
                  </span>
                </Link>
                <Link href="/design-editor">
                  <span className="text-gray-300 hover:text-white transition-colors cursor-pointer font-medium" data-testid="link-nav-design">
                    Design Editor
                  </span>
                </Link>
                {isAuthenticated && (
                  <Link href="/gallery">
                    <span className="text-gray-300 hover:text-white transition-colors cursor-pointer font-medium" data-testid="link-nav-gallery">
                      Mi Galería
                    </span>
                  </Link>
                )}
              </>
            )}
          </div>
          
          {/* Right Side Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/pricing">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors"
                data-testid="button-nav-pricing"
              >
                Pricing
              </Button>
            </Link>
            
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profileImageUrl || undefined} alt={`${user.firstName || user.email || 'User'}`} />
                      <AvatarFallback>
                        {(user.firstName || user.email || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : "User"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      {user.subscriptionTier && (
                        <p className="text-xs text-primary mt-1">{user.subscriptionTier} Plan</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Credits: {user.credits || 0} available
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/gallery">
                      <Image className="mr-2 h-4 w-4" />
                      <span>Mi Galería</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/pricing">
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>Upgrade Plan</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => window.location.href = '/api/logout'}
                    className="text-red-600 dark:text-red-400"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button
                  size="sm"
                  className="bg-white text-black hover:bg-gray-100 font-medium px-6"
                  data-testid="button-nav-signin"
                >
                  Sign In
                </Button>
              </Link>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white"
            onClick={() => setIsOpen(!isOpen)}
            data-testid="button-menu-toggle"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-black border-t border-gray-800">
              <Link href="/" onClick={() => setIsOpen(false)}>
                <span className="block px-3 py-2 text-gray-300 hover:text-white transition-colors cursor-pointer" data-testid="link-mobile-nav-home">
                  Home
                </span>
              </Link>
              <Link href="/stencil-tool" onClick={() => setIsOpen(false)}>
                <span className="block px-3 py-2 text-gray-300 hover:text-white transition-colors cursor-pointer" data-testid="link-mobile-nav-stencil">
                  Stencil Tool
                </span>
              </Link>
              <Link href="/design-editor" onClick={() => setIsOpen(false)}>
                <span className="block px-3 py-2 text-gray-300 hover:text-white transition-colors cursor-pointer" data-testid="link-mobile-nav-design">
                  Design Editor
                </span>
              </Link>
              {isAuthenticated && (
                <Link href="/gallery" onClick={() => setIsOpen(false)}>
                  <span className="block px-3 py-2 text-gray-300 hover:text-white transition-colors cursor-pointer" data-testid="link-mobile-nav-gallery">
                    Mi Galería
                  </span>
                </Link>
              )}
              <Link href="/pricing" onClick={() => setIsOpen(false)}>
                <span className="block px-3 py-2 text-gray-300 hover:text-white transition-colors cursor-pointer" data-testid="link-mobile-nav-pricing">
                  Pricing
                </span>
              </Link>
              
              {/* User Menu for Mobile */}
              {isAuthenticated && user ? (
                <>
                  <div className="border-t border-gray-800 mt-2 pt-2">
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium text-white">{user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : "User"}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Créditos: {user.credits || 0}
                      </p>
                    </div>
                  </div>
                  <Link href="/profile" onClick={() => setIsOpen(false)}>
                    <span className="block px-3 py-2 text-gray-300 hover:text-white transition-colors cursor-pointer" data-testid="link-mobile-nav-profile">
                      Perfil
                    </span>
                  </Link>
                  <button 
                    onClick={() => { setIsOpen(false); window.location.href = '/api/logout'; }}
                    className="block w-full text-left px-3 py-2 text-red-400 hover:text-red-300 transition-colors"
                    data-testid="button-mobile-nav-logout"
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  <span className="block px-3 py-2 text-gray-300 hover:text-white transition-colors cursor-pointer" data-testid="link-mobile-nav-login">
                    Iniciar Sesión
                  </span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
