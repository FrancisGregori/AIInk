import { Link, useLocation } from "wouter";
import { useState, useRef, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Palette, Sparkles, RotateCw, Wand2, ArrowRight, Pen, Edit3, Bot, PenTool, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
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
  const [, setLocation] = useLocation();

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
    if (videoUrl && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleClick = () => {
    if (videoUrl && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <motion.div
      className="bg-gray-900 rounded-lg overflow-hidden flex flex-col border border-gray-800"
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div className="relative h-48 overflow-hidden">
        {videoUrl ? (
          <video 
            ref={videoRef}
            src={videoUrl}
            loop
            muted
            playsInline
            autoPlay
            className="w-full h-full object-cover"
            preload="auto"
            poster={imageUrl}
          />
        ) : (
          <img 
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        )}
        <div className={`absolute inset-0 bg-black ${isHovered || isPlaying ? 'bg-opacity-20' : 'bg-opacity-50'} flex items-center justify-center transition-opacity duration-300`}>
          <motion.div
            animate={{ rotate: isHovered ? 360 : 0 }}
            transition={{ duration: 0.5 }}
          >
            <Icon size={48} className={`text-white ${isHovered || isPlaying ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`} />
          </motion.div>
        </div>
      </div>
      <div className="p-6 flex-grow flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
          <p className="text-gray-400 mb-4">{description}</p>
        </div>
        {isActive && href ? (
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="mt-auto"
          >
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-center transition-colors w-full font-semibold"
              onClick={(e) => {
                e.stopPropagation();
                setLocation(href);
              }}
            >
              Try Now
            </button>
          </motion.div>
        ) : (
          <button
            className="bg-gray-600 text-white px-4 py-2 rounded-full mt-auto cursor-not-allowed w-full"
            disabled
          >
            Coming Soon
          </button>
        )}
      </div>
    </motion.div>
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
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight animate-fade-in">
            <span className="block">Revolutionize your Tattoo</span>
            <span className="block">Designs</span>
          </h1>
          
          {/* Subtitle with delay animation */}
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto animate-fade-in-delay-1">
            Professional AI-powered tools for tattoo artists
          </p>
          
          {/* Hero Video Section */}
          <div className="relative max-w-5xl mx-auto mt-12 animate-fade-in-delay-2">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-black">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto object-cover rounded-2xl"
                poster={stencilExample1}
              >
                <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_9606-7wXjUza5iHfO4woAkktUJemkhAYzvt.MP4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
          
          {/* Transform text with animation */}
          <p className="text-lg text-gray-500 mt-8 animate-fade-in-delay-3">
            Transform your ideas into professional art
          </p>
        </div>
      </section>

      {/* Tools Section */}
      <section className="pt-4 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Title */}
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">TOOLS</h2>
            <p className="text-lg text-gray-400">Advanced tools for tattoo artists</p>
          </div>
          
          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            
            {/* Stencil Generator Card */}
            <div className="animate-card-in animate-card-in-1">
              <ToolCard
                title="Stencil Generator"
                description="Convert designs into hand-drawn style stencils"
                icon={Wand2}
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

            {/* Design Editor 2 - ChatImageEditor Card */}
            <div className="animate-card-in animate-card-in-3">
              <ToolCard
                title="Gemini Chat & Image"
                description="Chat with AI and generate images with Gemini 2.5 Flash"
                icon={MessageSquare}
                imageUrl="https://images.unsplash.com/photo-1683009427513-28e163402d16?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
                href="/design-editor-2"
                isActive={true}
              />
            </div>

            {/* Angle and Rotation Modifier Card */}
            <div className="animate-card-in animate-card-in-4">
              <ToolCard
                title="Angle and Rotation Modifier"
                description="Transform the perspective of your 2D designs into any angle"
                icon={RotateCw}
                imageUrl={stencilExample3}
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