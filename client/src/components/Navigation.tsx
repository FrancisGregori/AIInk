import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Bot, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();

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
                src="/attached_assets/1Asset 3zzz_1755637024508.png" 
                alt="TattooStencilPro" 
                className="h-8 w-auto group-hover:scale-105 transition-transform"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<span class="text-xl font-bold text-white">TattooStencilPro</span>';
                }}
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
              </>
            )}
          </div>
          
          {/* Right Side Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors"
              data-testid="button-nav-pricing"
            >
              Pricing
            </Button>
            <Button
              size="sm"
              className="bg-white text-black hover:bg-gray-100 font-medium px-6"
              data-testid="button-nav-signup"
            >
              Sign Up
            </Button>
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
            <div className="px-2 pt-2 pb-3 space-y-1 bg-black border-t border-dark-gray">
              {location === "/" ? (
                <>
                  <button 
                    onClick={() => scrollToSection("inicio")} 
                    className="block px-3 py-2 text-light-gray hover:text-white transition-colors"
                    data-testid="button-mobile-nav-inicio"
                  >
                    Inicio
                  </button>
                  <button 
                    onClick={() => scrollToSection("stencil")} 
                    className="block px-3 py-2 text-light-gray hover:text-white transition-colors"
                    data-testid="button-mobile-nav-stencil"
                  >
                    Stencil Tool
                  </button>
                  <button 
                    onClick={() => scrollToSection("flux")} 
                    className="block px-3 py-2 text-light-gray hover:text-white transition-colors"
                    data-testid="button-mobile-nav-design"
                  >
                    Design Editor
                  </button>
                  <button 
                    onClick={() => scrollToSection("contacto")} 
                    className="block px-3 py-2 text-light-gray hover:text-white transition-colors"
                    data-testid="button-mobile-nav-contacto"
                  >
                    Contacto
                  </button>
                </>
              ) : (
                <>
                  <Link href="/">
                    <span className="block px-3 py-2 text-light-gray hover:text-white transition-colors cursor-pointer" data-testid="link-mobile-nav-home">
                      Inicio
                    </span>
                  </Link>
                  <Link href="/stencil-tool">
                    <span className="block px-3 py-2 text-light-gray hover:text-white transition-colors cursor-pointer" data-testid="link-mobile-nav-stencil">
                      Stencil Tool
                    </span>
                  </Link>
                  <Link href="/design-editor">
                    <span className="block px-3 py-2 text-light-gray hover:text-white transition-colors cursor-pointer" data-testid="link-mobile-nav-design">
                      Design Editor
                    </span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
