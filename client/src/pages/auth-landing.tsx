import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Sparkles, Palette, Users, Zap, Star, Shield, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function AuthLanding() {
  const features = [
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "AI-Powered Stencils",
      description: "Generate professional tattoo stencils with our advanced AI models",
    },
    {
      icon: <Palette className="w-5 h-5" />,
      title: "Design Editor",
      description: "Transform and enhance your designs with intelligent editing tools",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Secure & Private",
      description: "Your designs and projects are securely stored and private to you",
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Fast Processing",
      description: "Get high-quality results in seconds, not hours",
    },
  ];

  const testimonials = [
    {
      name: "Steven Martinez",
      role: "Professional Tattoo Artist",
      content: "This tool has revolutionized my workflow. The AI-generated stencils are incredibly accurate.",
      rating: 5,
    },
    {
      name: "Darwin Thompson",
      role: "Studio Owner",
      content: "The quality of the stencils is unmatched. My clients love the precision.",
      rating: 5,
    },
    {
      name: "Adrian Lee",
      role: "Independent Artist",
      content: "Finally, a tool that understands what tattoo artists really need.",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img 
                src="https://tattoostencilpro.com/wp-content/uploads/2024/05/logo_1_Mesa-de-trabajo-1-copia-14-300x106.png" 
                alt="TattooStencilPro" 
                className="h-8 object-contain"
              />
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/pricing">
                <Button variant="ghost" className="text-muted-foreground hover:text-white">
                  Pricing
                </Button>
              </Link>
              <Button 
                onClick={() => window.location.href = '/api/login'}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Sign In with Replit
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                Professional AI Tools for
                <span className="bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent"> Tattoo Artists</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Transform your creative process with AI-powered stencil generation and intelligent design editing. 
                Built specifically for individual tattoo artists who demand precision and quality.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  onClick={() => window.location.href = '/api/login'}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  Get Started Free <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Link href="/pricing">
                  <Button size="lg" variant="outline">
                    View Pricing
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-6 mt-8">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-muted border-2 border-background" />
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold">500+ Artists</p>
                  <p className="text-xs text-muted-foreground">Already using TattooStencilPro</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-lg overflow-hidden shadow-2xl">
                <img 
                  src="https://via.placeholder.com/600x400/1a1a1a/ffffff?text=AI+Stencil+Demo" 
                  alt="Demo" 
                  className="w-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full blur-3xl" />
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full blur-3xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Professional tools designed specifically for tattoo artists
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 border-t">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Trusted by Artists</h2>
            <p className="text-muted-foreground">
              See what professional tattoo artists are saying
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <CardDescription className="text-white">
                      "{testimonial.content}"
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-800/50">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Art?</h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join hundreds of professional tattoo artists who are already using our AI-powered tools to enhance their creative process.
              </p>
              <Button 
                size="lg"
                onClick={() => window.location.href = '/api/login'}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                Start Free Trial <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                No credit card required • 10 free stencils included
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}