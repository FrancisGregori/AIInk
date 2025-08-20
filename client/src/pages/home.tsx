import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Image, Palette, Shield, Rocket, Settings, Upload, Cog, Download, Edit, Zap, CheckCircle } from "lucide-react";
import logoPath from "@assets/1Asset 3zzz_1755637024508.png";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <Navigation />
      
      {/* Hero Section */}
      <section id="inicio" className="relative min-h-screen flex items-center justify-center pt-32 overflow-hidden">
        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8 mb-16">
            {/* Main Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              <span className="text-white">
                CREATE PROFESSIONAL DESIGNS
              </span>
              <span className="block text-xl md:text-2xl lg:text-3xl text-gray-400 font-normal mt-2">
                IN SECONDS
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Professional AI tools for tattoo artists. Transform your ideas into professional art.
            </p>
            
            {/* CTA Button */}
            <div className="pt-4">
              <Link href="/design-editor">
                <Button 
                  size="default"
                  className="bg-white text-black px-8 py-3 text-base font-medium rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-lg"
                  data-testid="button-start-creating"
                >
                  Start Free
                </Button>
              </Link>
            </div>
          </div>

          {/* Video/Media Section */}
          <div className="relative max-w-5xl mx-auto">
            <div className="relative bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
              {/* Video Player */}
              <div className="aspect-video relative">
                <video 
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  data-testid="video-demo"
                >
                  <source src="/videos/demo.mp4" type="video/mp4" />
                  <source src="/videos/demo.webm" type="video/webm" />
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 opacity-80">
                        <svg className="w-8 h-8 text-black ml-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                        </svg>
                      </div>
                      <p className="text-gray-300 text-lg font-medium">Your browser doesn't support HTML5 video</p>
                      <p className="text-gray-500 text-sm mt-2">Update your browser to see the demo</p>
                    </div>
                  </div>
                </video>
              </div>
            </div>
          </div>

          {/* Tools Navigation */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-12">
            <Link href="/stencil-tool">
              <Button 
                variant="ghost"
                className="text-gray-300 hover:text-white hover:bg-white/5 px-6 py-3 rounded-lg transition-colors text-base font-medium"
                data-testid="button-stencil-tool"
              >
                <Image className="mr-2 h-4 w-4" />
                Stencil Tool
              </Button>
            </Link>
            <span className="text-gray-600 hidden sm:block text-lg">•</span>
            <Link href="/design-editor">
              <Button 
                variant="ghost"
                className="text-gray-300 hover:text-white hover:bg-white/5 px-6 py-3 rounded-lg transition-colors text-base font-medium"
                data-testid="button-design-editor"
              >
                <Palette className="mr-2 h-4 w-4" />
                Design Editor
              </Button>
            </Link>
          </div>
        </div>
      </section>



      {/* Stencil Tool Section */}
      <section id="stencil" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-6">Stencil Tool</h2>
              <p className="text-base md:text-lg text-light-gray mb-8 leading-relaxed">
                Convert any image into a professional tattoo stencil with AI. 
                Get clean lines with a realistic, hand-drawn finish ready for transfer.
              </p>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center mt-1">
                    <Upload className="text-black h-3 w-3" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Lines-Only Export</h4>
                    <p className="text-light-gray">PNG with transparent background for clean workflow</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center mt-1">
                    <Cog className="text-black h-3 w-3" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Professional Artist Styles</h4>
                    <p className="text-light-gray">Multiple models trained on real tattoo artist techniques</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center mt-1">
                    <Download className="text-black h-3 w-3" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Up to 6K Resolution</h4>
                    <p className="text-light-gray">Export ready for Procreate and transfer paper</p>
                  </div>
                </div>
              </div>
              
              <Link href="/stencil-tool">
                <Button 
                  className="bg-white text-black px-8 py-4 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                  data-testid="button-open-stencil"
                >
                  Open Stencil Tool
                </Button>
              </Link>
            </div>
            
            <div className="relative">
              {/* Mockup interface preview */}
              <div className="bg-dark-gray rounded-2xl border border-medium-gray p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                
                <div className="space-y-4">
                  <div className="h-48 bg-black border-2 border-dashed border-medium-gray rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-light-gray mb-2 mx-auto" />
                      <p className="text-light-gray">Drop your image here</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <button className="bg-medium-gray p-3 rounded text-sm">Model 1</button>
                    <button className="bg-white text-black p-3 rounded text-sm">Model 2</button>
                    <button className="bg-medium-gray p-3 rounded text-sm">Model 3</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Design Editor Section */}
      <section id="flux" className="py-20 bg-dark-gray/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              {/* Mockup interface preview */}
              <div className="bg-dark-gray rounded-2xl border border-medium-gray p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                
                <div className="space-y-4">
                  <div className="h-40 bg-black rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Palette className="h-8 w-8 text-light-gray mb-2 mx-auto" />
                      <p className="text-light-gray">Design Editor</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 bg-black p-3 rounded-lg">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <Bot className="text-black h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-light-gray">Gemini Assistant active</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">Design Editor</h2>
              <p className="text-base md:text-lg text-light-gray mb-8 leading-relaxed">
                AI-powered design editor with integrated Gemini assistant. 
                Create, edit and perfect your designs with intelligent help.
              </p>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center mt-1">
                    <Bot className="text-black h-3 w-3" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">AI Assistant</h4>
                    <p className="text-light-gray">Gemini guides you through every step of the process</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center mt-1">
                    <Edit className="text-black h-3 w-3" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Advanced Editor</h4>
                    <p className="text-light-gray">Professional design tools</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center mt-1">
                    <Zap className="text-black h-3 w-3" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Smart Processing</h4>
                    <p className="text-light-gray">Design-specialized AI model</p>
                  </div>
                </div>
              </div>
              
              <Link href="/design-editor">
                <Button 
                  variant="outline"
                  className="border-medium-gray text-white px-8 py-4 rounded-lg font-medium hover:bg-dark-gray transition-colors"
                  data-testid="button-open-flux"
                >
                  Open Design Editor
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>



      {/* Contact/Footer */}
      <section id="contacto" className="py-20 bg-dark-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6">Ready to get started?</h2>
            <p className="text-xl text-light-gray max-w-2xl mx-auto mb-8">
              Explore our AI tools and transform your creative workflow today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/stencil-tool">
                <Button 
                  className="bg-white text-black px-8 py-4 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                  data-testid="button-try-stencil-footer"
                >
                  Try Stencil Tool
                </Button>
              </Link>
              <Link href="/design-editor">
                <Button 
                  variant="outline"
                  className="border-medium-gray text-white px-8 py-4 rounded-lg font-medium hover:bg-black transition-colors"
                  data-testid="button-try-design-footer"
                >
                  Try Design Editor
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="border-t border-medium-gray pt-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <img 
                src={logoPath} 
                alt="TattooStencilPro" 
                className="h-8 w-auto"
              />
            </div>
            <p className="text-light-gray">
              © 2024 TattooStencilPro. Professional AI tools for tattoo artists.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
