import { Link } from "wouter";
import { useState, useRef, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Palette, Sparkles, RotateCw, Wand2, ArrowRight } from "lucide-react";
import logoPath from "@assets/1Asset 3zzz_1755637024508.png";
import stencilExample1 from "@assets/hub_stencil1.png";
import stencilExample2 from "@assets/hub_stencil2.png";
import stencilExample3 from "@assets/hub_stencil3.png";
import aiEditorImage from "@assets/hub_stencil2.png";

const ToolCard = ({ 
  title, 
  description, 
  icon: Icon, 
  imageUrl, 
  videoUrl, 
  href, 
  isActive = false 
}: {
  title: string;
  description: string;
  icon: any;
  imageUrl?: string;
  videoUrl?: string;
  href?: string;
  isActive?: boolean;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Auto-play video when component mounts
    if (videoUrl && videoRef.current) {
      const playVideo = async () => {
        try {
          await videoRef.current?.play();
          setIsPlaying(true);
        } catch (error) {
          console.log('Autoplay prevented:', error);
        }
      };
      playVideo();
    }
  }, [videoUrl]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoUrl && videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Don't pause video, let it continue playing
  };

  return (
    <Card 
      className={`group relative bg-gradient-to-b from-gray-900/90 to-gray-950/90 border-gray-800 overflow-hidden hover:border-gray-700 transition-all duration-300 ${isActive ? 'card-hover-lift' : ''} animate-card-in`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <div className="relative h-[350px] overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            loop
            muted
            playsInline
            autoPlay
            className="w-full h-full object-cover"
            poster={imageUrl}
          />
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            {/* Default gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
            {/* Icon Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-20 h-20 ${isActive ? 'bg-white/20' : 'bg-gray-500/20'} rounded-full flex items-center justify-center backdrop-blur-sm`}>
                <Icon className={`w-10 h-10 ${isActive ? 'text-white' : 'text-gray-400'}`} />
              </div>
            </div>
          </>
        )}
        
        {/* Overlay gradient for better visibility */}
        <div className={`absolute inset-0 bg-black ${isHovered || isPlaying ? 'bg-opacity-10' : 'bg-opacity-40'} transition-opacity duration-300`} />
        
        {/* Icon on hover */}
        {!isHovered && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-300"
              style={{
                transform: isHovered ? 'rotate(360deg)' : 'rotate(0deg)',
              }}
            >
              <Icon className="w-10 h-10 text-white" />
            </div>
          </div>
        )}
        
        {/* Coming Soon Badge */}
        {!isActive && (
          <div className="absolute top-4 right-4 bg-gray-800 px-3 py-1 rounded-full">
            <span className="text-xs text-gray-400">Coming Soon</span>
          </div>
        )}
      </div>
      
      <div className="p-8 space-y-4">
        <h3 className="text-2xl font-bold text-white">{title}</h3>
        <p className="text-gray-400">
          {description}
        </p>
        {isActive && href ? (
          <Link href={href}>
            <Button 
              className="w-full bg-white text-black hover:bg-gray-100 py-6 text-lg font-semibold rounded-full transition-all duration-300 transform hover:scale-105"
              style={{
                transform: isHovered ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              Try Now
            </Button>
          </Link>
        ) : (
          <Button 
            className="w-full bg-gray-700 text-gray-400 py-6 text-lg font-semibold rounded-full cursor-not-allowed"
            disabled
          >
            Coming Soon
          </Button>
        )}
      </div>
    </Card>
  );
};

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
                poster={stencilExample1}
              >
                <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_9606-7wXjUza5iHfO4woAkktUJemkhAYzvt.MP4" type="video/mp4" />
                Your browser does not support the video tag.
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
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">TOOLS</h2>
            <p className="text-xl text-gray-400">Advanced tools for tattoo artists</p>
          </div>
          
          {/* Tools Grid */}
          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            
            {/* Stencil Generator Card */}
            <div className="animate-card-in animate-card-in-1">
              <ToolCard
                title="Stencil Generator"
                description="Convert designs into hand-drawn style stencils"
                icon={Palette}
                imageUrl="https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
                videoUrl="https://inknationstudio.com/wp-content/uploads/2024/09/video021.mp4"
                href="/stencil-tool"
                isActive={true}
              />
            </div>

            {/* AI Image Editor Card */}
            <div className="animate-card-in animate-card-in-2">
              <ToolCard
                title="AI Image Editor"
                description="Advanced AI-powered tattoo generator and image editor"
                icon={Sparkles}
                imageUrl={aiEditorImage}
                href="/design-editor"
                isActive={true}
              />
            </div>

            {/* Angle and Rotation Modifier Card */}
            <div className="animate-card-in animate-card-in-3">
              <ToolCard
                title="Angle and Rotation Modifier"
                description="Transform the perspective of your 2D designs into any angle"
                icon={RotateCw}
                imageUrl={stencilExample3}
                isActive={false}
              />
            </div>

            {/* Expression Modifier Card */}
            <div className="animate-card-in animate-card-in-4">
              <ToolCard
                title="Expression Modifier"
                description="Adjust facial expressions and positions"
                icon={Wand2}
                imageUrl={stencilExample2}
                isActive={false}
              />
            </div>
            
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
            <div className="text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold">AI-Powered</h3>
              <p className="text-gray-400">
                Advanced AI models trained specifically for tattoo design
              </p>
            </div>
            
            <div className="text-center space-y-4 animate-fade-in-delay-1">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                <Palette className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold">High Resolution</h3>
              <p className="text-gray-400">
                Export designs in 5K-6K resolution for professional use
              </p>
            </div>
            
            <div className="text-center space-y-4 animate-fade-in-delay-2">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                <Wand2 className="w-8 h-8 text-white" />
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