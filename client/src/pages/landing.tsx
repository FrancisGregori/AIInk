import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import logoPath from "@assets/1Asset 3zzz_1755637024508.png";
import { ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="flex justify-between items-center p-6">
        <img src={logoPath} alt="TattooStencilPro" className="h-10" />
        <div className="flex gap-4">
          <Link href="/pricing">
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              Pricing
            </Button>
          </Link>
          <Link href="/login">
            <Button className="bg-white text-black hover:bg-gray-200">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Professional AI Tools for Tattoo Artists
        </h1>
        <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto">
          Transform your tattoo designs with AI-powered stencil generation and intelligent design editing
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button className="bg-white text-black hover:bg-gray-200 px-8 py-6 text-lg">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/pricing">
            <Button variant="outline" className="border-gray-700 hover:bg-gray-900 px-8 py-6 text-lg">
              View Pricing
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="text-center">
            <div className="bg-zinc-900 rounded-lg p-8 mb-4">
              <h3 className="text-2xl font-semibold mb-4">Stencil Tool</h3>
              <p className="text-gray-400">
                Convert any image into professional tattoo stencils with 5K-6K resolution
              </p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-zinc-900 rounded-lg p-8 mb-4">
              <h3 className="text-2xl font-semibold mb-4">Design Editor</h3>
              <p className="text-gray-400">
                AI-powered editing to transform backgrounds while preserving subjects
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-20">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center text-gray-500">
          <p>&copy; 2025 TattooStencilPro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}