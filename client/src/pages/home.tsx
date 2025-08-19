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
      <section id="inicio" className="min-h-screen flex items-center justify-center pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              TattoostencilPro
              <span className="block text-light-gray">Herramientas Profesionales</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-light-gray max-w-3xl mx-auto leading-relaxed">
              Transforma tus ideas en realidad con nuestras potentes herramientas de inteligencia artificial. 
              Diseño moderno, resultados profesionales.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Link href="/stencil">
                <Button 
                  className="bg-white text-black px-8 py-4 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                  data-testid="button-explore-stencil"
                >
                  <Image className="mr-2 h-5 w-5" />
                  Explorar Stencil Tool
                </Button>
              </Link>
              <Link href="/flux">
                <Button 
                  variant="outline" 
                  className="border-medium-gray text-white px-8 py-4 rounded-lg font-medium hover:bg-dark-gray transition-colors"
                  data-testid="button-try-flux"
                >
                  <Palette className="mr-2 h-5 w-5" />
                  Probar Flux Kontext
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Overview */}
      <section className="py-20 bg-dark-gray/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Nuestras Herramientas</h2>
            <p className="text-xl text-light-gray max-w-2xl mx-auto">
              Dos potentes aplicaciones de IA diseñadas para transformar tu flujo de trabajo creativo
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Stencil Tool Card */}
            <Card className="bg-black border-medium-gray hover:border-light-gray transition-colors">
              <CardContent className="p-8">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-4">
                    <Image className="text-black text-2xl h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Transformador de Stencils</h3>
                  <p className="text-light-gray text-lg leading-relaxed">
                    Convierte cualquier imagen en un stencil profesional usando modelos de IA avanzados. 
                    Perfecto para diseño de tatuajes y arte vectorial.
                  </p>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="text-white w-5 h-5" />
                    <span className="text-light-gray">Múltiples modelos de IA</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="text-white w-5 h-5" />
                    <span className="text-light-gray">Preview en tiempo real</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="text-white w-5 h-5" />
                    <span className="text-light-gray">Descarga en alta calidad</span>
                  </div>
                </div>
                
                <Link href="/stencil">
                  <Button 
                    className="w-full bg-white text-black py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                    data-testid="button-use-stencil"
                  >
                    Usar Stencil Tool
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            {/* Flux Kontext Card */}
            <Card className="bg-black border-medium-gray hover:border-light-gray transition-colors">
              <CardContent className="p-8">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-4">
                    <Palette className="text-black text-2xl h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Editor Flux Kontext</h3>
                  <p className="text-light-gray text-lg leading-relaxed">
                    Editor avanzado de diseños con integración de IA. Incluye asistente Gemini para 
                    una experiencia de diseño completamente intuitiva.
                  </p>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="text-white w-5 h-5" />
                    <span className="text-light-gray">Asistente Gemini integrado</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="text-white w-5 h-5" />
                    <span className="text-light-gray">Editor visual avanzado</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="text-white w-5 h-5" />
                    <span className="text-light-gray">Flujo de trabajo optimizado</span>
                  </div>
                </div>
                
                <Link href="/flux">
                  <Button 
                    variant="outline"
                    className="w-full border-medium-gray text-white py-3 rounded-lg font-medium hover:bg-dark-gray transition-colors"
                    data-testid="button-use-flux"
                  >
                    Usar Flux Kontext
                  </Button>
                </Link>
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
              
              <Link href="/stencil">
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

      {/* Flux Kontext Section */}
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
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Flux Kontext</h2>
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
                    <h4 className="font-semibold mb-1">Flux Kontext</h4>
                    <p className="text-light-gray">Modelo de IA especializado en diseño</p>
                  </div>
                </div>
              </div>
              
              <Link href="/flux">
                <Button 
                  variant="outline"
                  className="border-medium-gray text-white px-8 py-4 rounded-lg font-medium hover:bg-dark-gray transition-colors"
                  data-testid="button-open-flux"
                >
                  Abrir Flux Kontext
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
              <Link href="/stencil">
                <Button 
                  className="bg-white text-black px-8 py-4 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                  data-testid="button-try-stencil-footer"
                >
                  Probar Stencil Tool
                </Button>
              </Link>
              <Link href="/flux">
                <Button 
                  variant="outline"
                  className="border-medium-gray text-white px-8 py-4 rounded-lg font-medium hover:bg-black transition-colors"
                  data-testid="button-try-flux-footer"
                >
                  Probar Flux Kontext
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
