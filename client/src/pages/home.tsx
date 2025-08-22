import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Palette, Image, RotateCw, Sparkles, ArrowRight } from "lucide-react";
import logoPath from "@assets/1Asset 3zzz_1755637024508.png";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-20">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/50 to-black pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto text-center space-y-8">
          {/* Main Title with fade-in animation */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight animate-fade-in">
            <span className="block">Revolutionize your Tattoo</span>
            <span className="block">Designs</span>
          </h1>
          
          {/* Subtitle with delay animation */}
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto animate-fade-in-delay-1">
            Professional AI-powered tools for tattoo artists
          </p>
          
          {/* Hero Video Section */}
          <div className="relative max-w-5xl mx-auto mt-12 animate-fade-in-delay-2">
            <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-800">
              {/* Video Background */}
              <video 
                className="w-full h-[600px] object-cover"
                autoPlay
                muted
                loop
                playsInline
                poster={logoPath}
              >
                <source src="/demo-video.mp4" type="video/mp4" />
                <source src="/demo-video.webm" type="video/webm" />
                {/* Fallback image if video doesn't load */}
                <img 
                  src={logoPath}
                  alt="Tattoo Design Preview"
                  className="w-full h-[600px] object-contain bg-gradient-to-br from-gray-800 to-gray-900"
                />
              </video>
              
              {/* Overlay gradient for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
          
          {/* Transform text with animation */}
          <p className="text-lg text-gray-500 mt-8 animate-fade-in-delay-3">
            Transform your ideas into professional art
          </p>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Title */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-blue-500 mb-4">TOOLS</h2>
            <p className="text-xl text-gray-400">Advanced tools for tattoo artists</p>
          </div>
          
          {/* Tools Grid */}
          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            
            {/* Stencil Generator Card */}
            <Card className="group relative bg-gradient-to-b from-gray-900/90 to-gray-950/90 border-gray-800 overflow-hidden hover:border-gray-700 transition-all duration-300 card-hover-lift animate-card-in animate-card-in-1">
              <div className="relative h-[300px] overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                {/* Icon Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Palette className="w-10 h-10 text-blue-400" />
                  </div>
                </div>
                {/* Decorative image background */}
                <div className="absolute inset-0 opacity-20">
                  <img 
                    src={logoPath}
                    alt="Stencil Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              <div className="p-8 space-y-4">
                <h3 className="text-2xl font-bold">Stencil Generator</h3>
                <p className="text-gray-400">
                  Convert designs into hand-drawn style stencils
                </p>
                <Link href="/stencil-tool">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold rounded-full transition-all duration-300 transform hover:scale-105"
                    data-testid="button-stencil-generator"
                  >
                    Try Now
                  </Button>
                </Link>
              </div>
            </Card>

            {/* AI Image Editor Card */}
            <Card className="group relative bg-gradient-to-b from-gray-900/90 to-gray-950/90 border-gray-800 overflow-hidden hover:border-gray-700 transition-all duration-300 card-hover-lift animate-card-in animate-card-in-2">
              <div className="relative h-[300px] overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                {/* Icon Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Sparkles className="w-10 h-10 text-blue-400" />
                  </div>
                </div>
                {/* Decorative image background */}
                <div className="absolute inset-0 opacity-20">
                  <img 
                    src={logoPath}
                    alt="AI Editor Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              <div className="p-8 space-y-4">
                <h3 className="text-2xl font-bold">AI Image Editor</h3>
                <p className="text-gray-400">
                  Advanced AI-powered tattoo generator and image editor
                </p>
                <Link href="/design-editor">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold rounded-full transition-all duration-300 transform hover:scale-105"
                    data-testid="button-ai-editor"
                  >
                    Try Now
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Angle and Rotation Modifier Card (Coming Soon) */}
            <Card className="group relative bg-gradient-to-b from-gray-900/90 to-gray-950/90 border-gray-800 overflow-hidden hover:border-gray-700 transition-all duration-300 opacity-60 card-hover-lift animate-card-in animate-card-in-3">
              <div className="relative h-[300px] overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                {/* Icon Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-gray-500/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <RotateCw className="w-10 h-10 text-gray-400" />
                  </div>
                </div>
                {/* Coming Soon Badge */}
                <div className="absolute top-4 right-4 bg-gray-800 px-3 py-1 rounded-full">
                  <span className="text-xs text-gray-400">Coming Soon</span>
                </div>
                {/* Decorative image background */}
                <div className="absolute inset-0 opacity-10">
                  <img 
                    src={logoPath}
                    alt="Rotation Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              <div className="p-8 space-y-4">
                <h3 className="text-2xl font-bold">Angle and Rotation Modifier</h3>
                <p className="text-gray-400">
                  Transform the perspective of your 2D designs into any angle
                </p>
                <Button 
                  className="w-full bg-gray-700 text-gray-400 py-6 text-lg font-semibold rounded-full cursor-not-allowed"
                  disabled
                >
                  Coming Soon
                </Button>
              </div>
            </Card>

            {/* More Tools Coming Card */}
            <Card className="group relative bg-gradient-to-b from-gray-900/90 to-gray-950/90 border-gray-800 overflow-hidden hover:border-gray-700 transition-all duration-300 card-hover-lift animate-card-in animate-card-in-4">
              <div className="relative h-[300px] overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="flex justify-center space-x-2">
                    <div className="w-12 h-12 bg-gray-700 rounded-full animate-pulse" />
                    <div className="w-12 h-12 bg-gray-700 rounded-full animate-pulse delay-75" />
                    <div className="w-12 h-12 bg-gray-700 rounded-full animate-pulse delay-150" />
                  </div>
                  <p className="text-gray-500 text-lg">More tools in development</p>
                </div>
              </div>
              
              <div className="p-8 space-y-4">
                <h3 className="text-2xl font-bold">More Coming Soon</h3>
                <p className="text-gray-400">
                  We're constantly developing new AI tools for tattoo artists
                </p>
                <Button 
                  className="w-full bg-gray-700 text-gray-400 py-6 text-lg font-semibold rounded-full cursor-not-allowed"
                  disabled
                >
                  Stay Tuned
                </Button>
              </div>
            </Card>
            
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose TattooStencilPro?</h2>
            <p className="text-xl text-gray-400">Professional tools designed for tattoo artists</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold">AI-Powered</h3>
              <p className="text-gray-400">
                Advanced AI models trained specifically for tattoo design
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                <Image className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold">High Resolution</h3>
              <p className="text-gray-400">
                Export designs in 5K-6K resolution for professional use
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                <Palette className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold">Multiple Styles</h3>
              <p className="text-gray-400">
                Choose from various artistic styles for your stencils
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-gray-900">
        <div className="max-w-4xl mx-auto text-center px-4 space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to transform your tattoo workflow?
          </h2>
          <p className="text-xl text-gray-400">
            Join thousands of tattoo artists using our AI tools
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/stencil-tool">
              <Button 
                size="lg"
                className="bg-white text-black hover:bg-gray-100 px-8 py-6 text-lg font-semibold rounded-full transition-all duration-300 transform hover:scale-105"
                data-testid="button-start-free"
              >
                Start Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button 
                size="lg"
                variant="outline"
                className="border-gray-700 text-white hover:bg-gray-900 px-8 py-6 text-lg font-semibold rounded-full transition-all duration-300"
                data-testid="button-view-pricing"
              >
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <img src={logoPath} alt="Logo" className="h-8 w-8" />
              <span className="text-xl font-bold">TattooStencilPro</span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2025 TattooStencilPro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}