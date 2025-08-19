import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Image, Palette, Shield, Rocket, Settings, Upload, Cog, Download, Edit, Zap, CheckCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <Navigation />
      
      {/* Hero Section */}
      <section id="inicio" className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-indigo-900/20"></div>
        
        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            {/* Main Title */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                CREA DISEÑOS
              </span>
              <span className="block bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                PROFESIONALES
              </span>
              <span className="block text-3xl md:text-4xl lg:text-5xl text-gray-400 font-normal mt-4">
                EN SEGUNDOS
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Herramientas IA profesionales para tatuadores.
              <span className="block mt-2 text-gray-400">
                Transforma tus ideas en arte profesional con tecnología avanzada.
              </span>
            </p>
            
            {/* CTA Button */}
            <div className="pt-8">
              <Link href="/design-editor">
                <Button 
                  size="lg"
                  className="bg-white text-black px-10 py-6 text-lg font-semibold rounded-full hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-xl"
                  data-testid="button-start-creating"
                >
                  Comenzar gratis
                </Button>
              </Link>
            </div>
            
            {/* Secondary Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
              <Link href="/stencil-tool">
                <Button 
                  variant="ghost"
                  className="text-gray-300 hover:text-white hover:bg-white/5 px-6 py-3 rounded-lg transition-colors"
                  data-testid="button-stencil-tool"
                >
                  <Image className="mr-2 h-4 w-4" />
                  Stencil Generator
                </Button>
              </Link>
              <span className="text-gray-600 hidden sm:block">•</span>
              <Link href="/design-editor">
                <Button 
                  variant="ghost"
                  className="text-gray-300 hover:text-white hover:bg-white/5 px-6 py-3 rounded-lg transition-colors"
                  data-testid="button-ai-editor"
                >
                  <Palette className="mr-2 h-4 w-4" />
                  AI Image Editor
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-24 bg-gradient-to-b from-black via-gray-950/50 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                TOOLS
              </span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Advanced tools for tattoo artists
            </p>
          </div>
          
          {/* Tools Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Stencil Generator */}
            <Card className="group relative bg-gradient-to-br from-gray-900/80 via-gray-900/60 to-gray-800/40 border-gray-700/50 hover:border-gray-600/50 transition-all duration-500 hover:transform hover:scale-[1.02] overflow-hidden">
              {/* Background Image/Preview */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-indigo-600/5"></div>
              <div className="absolute top-4 right-4 w-16 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg opacity-50"></div>
              
              <CardContent className="relative p-8">
                <div className="mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                    <Image className="text-white h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white">Stencil Generator</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Convert designs into hand-drawn style stencils
                  </p>
                </div>
                
                <Link href="/stencil-tool">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
                    data-testid="button-stencil-generator"
                  >
                    Try Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            {/* AI Image Editor */}
            <Card className="group relative bg-gradient-to-br from-gray-900/80 via-gray-900/60 to-gray-800/40 border-gray-700/50 hover:border-gray-600/50 transition-all duration-500 hover:transform hover:scale-[1.02] overflow-hidden">
              {/* Background Image/Preview */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 via-teal-600/5 to-cyan-600/5"></div>
              <div className="absolute top-4 right-4 w-16 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg opacity-50"></div>
              
              <CardContent className="relative p-8">
                <div className="mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                    <Palette className="text-white h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white">AI Image Editor</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Advanced AI-powered tattoo generator and image editor
                  </p>
                </div>
                
                <Link href="/design-editor">
                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-emerald-500/25"
                    data-testid="button-ai-image-editor"
                  >
                    Try Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            {/* Expression Modifier - Coming Soon */}
            <Card className="group relative bg-gradient-to-br from-gray-900/40 via-gray-900/30 to-gray-800/20 border-gray-700/30 overflow-hidden">
              {/* Background Image/Preview */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600/5 via-red-600/5 to-pink-600/5"></div>
              <div className="absolute top-4 right-4 w-16 h-12 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg opacity-30"></div>
              
              <CardContent className="relative p-8">
                <div className="mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center mb-4">
                    <Bot className="text-gray-400 h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-300">Expression Modifier</h3>
                  <p className="text-gray-500 leading-relaxed">
                    Adjust facial expressions and positions
                  </p>
                </div>
                
                <Button 
                  disabled
                  className="w-full bg-gray-700 text-gray-400 py-3 rounded-lg font-medium cursor-not-allowed"
                  data-testid="button-expression-modifier"
                >
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stencil Tool Section */}
      <section id="stencil" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Stencil Tool</h2>
              <p className="text-xl text-light-gray mb-8 leading-relaxed">
                Transforma cualquier imagen en un stencil profesional con nuestros algoritmos de IA. 
                Perfecto para artistas, diseñadores y profesionales del tatuaje.
              </p>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center mt-1">
                    <Upload className="text-black h-3 w-3" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Carga Simple</h4>
                    <p className="text-light-gray">Arrastra y suelta tu imagen para comenzar</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center mt-1">
                    <Cog className="text-black h-3 w-3" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Modelos Avanzados</h4>
                    <p className="text-light-gray">Elige entre diferentes algoritmos de procesamiento</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center mt-1">
                    <Download className="text-black h-3 w-3" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Descarga HD</h4>
                    <p className="text-light-gray">Obtén resultados en alta resolución</p>
                  </div>
                </div>
              </div>
              
              <Link href="/stencil-tool">
                <Button 
                  className="bg-white text-black px-8 py-4 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                  data-testid="button-open-stencil"
                >
                  Abrir Stencil Tool
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
                      <p className="text-light-gray">Arrastra tu imagen aquí</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <button className="bg-medium-gray p-3 rounded text-sm">Modelo 1</button>
                    <button className="bg-white text-black p-3 rounded text-sm">Modelo 2</button>
                    <button className="bg-medium-gray p-3 rounded text-sm">Modelo 3</button>
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
                      <p className="text-light-gray">Editor de Diseños</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 bg-black p-3 rounded-lg">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <Bot className="text-black h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-light-gray">Asistente Gemini activo</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Design Editor</h2>
              <p className="text-xl text-light-gray mb-8 leading-relaxed">
                Editor de diseños potenciado por IA con asistente Gemini integrado. 
                Crea, edita y perfecciona tus diseños con ayuda inteligente.
              </p>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center mt-1">
                    <Bot className="text-black h-3 w-3" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Asistente IA</h4>
                    <p className="text-light-gray">Gemini te guía en cada paso del proceso</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center mt-1">
                    <Edit className="text-black h-3 w-3" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Editor Avanzado</h4>
                    <p className="text-light-gray">Herramientas profesionales de diseño</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center mt-1">
                    <Zap className="text-black h-3 w-3" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Procesamiento Inteligente</h4>
                    <p className="text-light-gray">Modelo de IA especializado en diseño</p>
                  </div>
                </div>
              </div>
              
              <Link href="/design-editor">
                <Button 
                  variant="outline"
                  className="border-medium-gray text-white px-8 py-4 rounded-lg font-medium hover:bg-dark-gray transition-colors"
                  data-testid="button-open-flux"
                >
                  Abrir Design Editor
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Benefits */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">¿Por qué integrar?</h2>
            <p className="text-xl text-light-gray max-w-3xl mx-auto leading-relaxed">
              Mantener las herramientas como módulos independientes te permite disfrutar de lo mejor de ambos mundos: 
              funcionalidad especializada con experiencia unificada.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="text-black h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Estabilidad</h3>
              <p className="text-light-gray leading-relaxed">
                Cada herramienta mantiene su funcionalidad independiente sin riesgo de interferencias
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mx-auto mb-4">
                <Rocket className="text-black h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Performance</h3>
              <p className="text-light-gray leading-relaxed">
                Carga selectiva de recursos optimiza el rendimiento y reduce tiempos de espera
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mx-auto mb-4">
                <Settings className="text-black h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Mantenimiento</h3>
              <p className="text-light-gray leading-relaxed">
                Actualizaciones y mejoras pueden realizarse de forma independiente en cada módulo
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact/Footer */}
      <section id="contacto" className="py-20 bg-dark-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6">¿Listo para comenzar?</h2>
            <p className="text-xl text-light-gray max-w-2xl mx-auto mb-8">
              Explora nuestras herramientas de IA y transforma tu flujo de trabajo creativo hoy mismo.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/stencil-tool">
                <Button 
                  className="bg-white text-black px-8 py-4 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                  data-testid="button-try-stencil-footer"
                >
                  Probar Stencil Tool
                </Button>
              </Link>
              <Link href="/design-editor">
                <Button 
                  variant="outline"
                  className="border-medium-gray text-white px-8 py-4 rounded-lg font-medium hover:bg-black transition-colors"
                  data-testid="button-try-design-footer"
                >
                  Probar Design Editor
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="border-t border-medium-gray pt-8 text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Bot className="text-black h-5 w-5" />
              </div>
              <span className="text-xl font-semibold">Darwin AI</span>
            </div>
            <p className="text-light-gray">
              © 2024 Darwin AI Tools. Herramientas profesionales de inteligencia artificial.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
