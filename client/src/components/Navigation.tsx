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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-dark-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer" data-testid="link-home-nav">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Bot className="text-black h-5 w-5" />
              </div>
              <span className="text-xl font-semibold">TattoostencilPro</span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            {location === "/" ? (
              <>
                <button 
                  onClick={() => scrollToSection("inicio")} 
                  className="text-light-gray hover:text-white transition-colors"
                  data-testid="button-nav-inicio"
                >
                  Inicio
                </button>
                <button 
                  onClick={() => scrollToSection("stencil")} 
                  className="text-light-gray hover:text-white transition-colors"
                  data-testid="button-nav-stencil"
                >
                  Stencil Tool
                </button>
                <button 
                  onClick={() => scrollToSection("flux")} 
                  className="text-light-gray hover:text-white transition-colors"
                  data-testid="button-nav-design"
                >
                  Design Editor
                </button>
                <button 
                  onClick={() => scrollToSection("contacto")} 
                  className="text-light-gray hover:text-white transition-colors"
                  data-testid="button-nav-contacto"
                >
                  Contacto
                </button>
              </>
            ) : (
              <>
                <Link href="/">
                  <span className="text-light-gray hover:text-white transition-colors cursor-pointer" data-testid="link-nav-home">
                    Inicio
                  </span>
                </Link>
                <Link href="/stencil-tool">
                  <span className="text-light-gray hover:text-white transition-colors cursor-pointer" data-testid="link-nav-stencil">
                    Stencil Tool
                  </span>
                </Link>
                <Link href="/design-editor">
                  <span className="text-light-gray hover:text-white transition-colors cursor-pointer" data-testid="link-nav-design">
                    Design Editor
                  </span>
                </Link>
              </>
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
