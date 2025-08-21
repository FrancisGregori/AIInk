import { useState } from "react";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");

  const plans = [
    {
      name: "Basic",
      icon: <Sparkles className="h-6 w-6" />,
      price: billingPeriod === "monthly" ? 11.99 : 119,
      originalPrice: billingPeriod === "annual" ? 143.88 : null,
      credits: 200,
      period: billingPeriod === "monthly" ? "mes" : "año",
      popular: false,
      features: [
        "200 créditos mensuales",
        "40 stencils profesionales",
        "66 diseños editados",
        "Asistente AI (100 mensajes/mes)",
        "Soporte estándar (48h)",
        "Historial 30 días",
        "Rollover 50% créditos"
      ],
      breakdown: {
        stencils: "25 stencils (125 cr)",
        editor: "20 ediciones (60 cr)",
        free: "15 créditos libres"
      },
      cta: "Empezar con Basic",
      disabled: false
    },
    {
      name: "Pro",
      icon: <Zap className="h-6 w-6" />,
      price: billingPeriod === "monthly" ? 19.99 : 199,
      originalPrice: billingPeriod === "annual" ? 239.88 : null,
      credits: 500,
      period: billingPeriod === "monthly" ? "mes" : "año",
      popular: true,
      features: [
        "500 créditos mensuales",
        "100 stencils profesionales",
        "166 diseños editados",
        "Asistente AI (500 mensajes/mes)",
        "Soporte rápido (12h)",
        "Modelo personalizado disponible",
        "Exportación en lote",
        "Rollover 50% créditos"
      ],
      breakdown: {
        stencils: "60 stencils (300 cr)",
        editor: "50 ediciones (150 cr)",
        free: "50 créditos libres"
      },
      cta: "Upgrade a Pro",
      disabled: false
    },
    {
      name: "Premium",
      icon: <Crown className="h-6 w-6" />,
      price: billingPeriod === "monthly" ? 39.99 : 399,
      originalPrice: billingPeriod === "annual" ? 479.88 : null,
      credits: 1000,
      period: billingPeriod === "monthly" ? "mes" : "año",
      popular: false,
      features: [
        "1,000 créditos mensuales",
        "200 stencils profesionales",
        "333 diseños editados",
        "Asistente AI ilimitado",
        "Soporte prioritario (4h)",
        "Modelo personalizado disponible",
        "API access",
        "Auto Top-Up disponible",
        "Rollover 50% créditos"
      ],
      breakdown: {
        stencils: "120 stencils (600 cr)",
        editor: "100 ediciones (300 cr)",
        free: "100 créditos libres"
      },
      cta: "Ir Premium",
      disabled: false
    }
  ];

  const creditPacks = [
    { credits: 100, price: 4.99, perCredit: 0.0499 },
    { credits: 250, price: 9.99, perCredit: 0.0400, popular: true },
    { credits: 500, price: 18.99, perCredit: 0.0380 },
    { credits: 1000, price: 36.99, perCredit: 0.0370 }
  ];

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-20 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Planes diseñados para artistas del tatuaje
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Elige el plan perfecto para tu estudio. Sin compromisos, cancela cuando quieras.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-12">
        <Tabs value={billingPeriod} onValueChange={(v) => setBillingPeriod(v as "monthly" | "annual")} className="w-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">Mensual</TabsTrigger>
            <TabsTrigger value="annual" className="relative">
              Anual
              <Badge className="absolute -top-3 -right-3 bg-green-500">Ahorra 17%</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-20">
        {plans.map((plan) => (
          <Card 
            key={plan.name} 
            className={`relative ${plan.popular ? 'border-primary shadow-xl scale-105' : ''}`}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                Más Popular
              </Badge>
            )}
            
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  {plan.icon}
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
              </div>
              
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  {plan.originalPrice && (
                    <span className="text-lg text-muted-foreground line-through">
                      ${plan.originalPrice}
                    </span>
                  )}
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {plan.credits} créditos incluidos
                </div>
              </div>

              <CardDescription className="text-sm space-y-1">
                <div>• {plan.breakdown.stencils}</div>
                <div>• {plan.breakdown.editor}</div>
                <div>• {plan.breakdown.free}</div>
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            
            <CardFooter>
              <Button 
                className="w-full" 
                variant={plan.popular ? "default" : "outline"}
                size="lg"
                disabled={plan.disabled}
              >
                {plan.cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Credit Packs Section */}
      <div className="mb-20">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Paquetes de Créditos Adicionales</h2>
          <p className="text-muted-foreground">
            ¿Necesitas más créditos? Compra paquetes sin cambiar tu plan
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {creditPacks.map((pack) => (
            <Card key={pack.credits} className={pack.popular ? 'border-primary' : ''}>
              <CardHeader className="pb-4">
                {pack.popular && (
                  <Badge className="w-fit mb-2" variant="secondary">Mejor valor</Badge>
                )}
                <CardTitle className="text-xl">{pack.credits} créditos</CardTitle>
                <div className="text-2xl font-bold">${pack.price}</div>
                <CardDescription className="text-xs">
                  ${pack.perCredit.toFixed(4)} por crédito
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-0">
                <Button variant="outline" className="w-full" size="sm">
                  Comprar
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Model Add-on */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">
                ✨ Custom AI Model Training - Exclusive Service
              </CardTitle>
              <CardDescription className="text-base max-w-2xl">
                Transform your unique tattoo artistry into a personalized AI model. TattooStencilPro 
                can train a private model exclusively with your tattoo style, allowing you to 
                generate stencils that perfectly match your artistic signature.
              </CardDescription>
            </div>
            <div className="text-right">
              <Badge className="mb-2 bg-purple-600">By Invitation</Badge>
              <div className="text-3xl font-bold">$299</div>
              <div className="text-sm text-muted-foreground">One-time investment</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              This exclusive service is available only to artists who qualify. Contact us to learn if you meet our requirements.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Premium Benefits
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5" />
                  <span>Complete consistency across all generated stencils</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5" />
                  <span>Your custom model can be shared with your team or kept private</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5" />
                  <span>Faster workflow with your signature style</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5" />
                  <span>Professional branding with your name featured</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5" />
                  <span>Priority processing for all generations</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Qualification Requirements</h4>
              <div className="space-y-3 mb-4">
                <Badge variant="outline" className="mr-2">Pro Plan Required</Badge>
                <Badge variant="outline">Premium Plan Required</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Limited to 5 artists per month. Application review takes 24-48 hours.
              </p>
              <Button className="w-full" variant="default" size="lg">
                Apply for Custom Model
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                You'll receive a response within 48 hours
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Comparison */}
      <div className="mt-20">
        <h2 className="text-3xl font-bold text-center mb-8">
          Todas las funciones incluidas
        </h2>
        
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Sistema de Créditos</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Stencil Tool: 5 créditos por diseño</li>
                    <li>• Design Editor: 3 créditos por edición</li>
                    <li>• AI Assistant: 0 créditos (límites por plan)</li>
                    <li>• Rollover: hasta 50% al siguiente mes</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Políticas y Soporte</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Auto Top-Up opcional con 3% descuento</li>
                    <li>• Dashboard con tracking detallado</li>
                    <li>• Alertas al 80% de uso</li>
                    <li>• Sin contratos, cancela cuando quieras</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA Section */}
      <div className="text-center mt-20 py-12 rounded-2xl bg-primary/5">
        <h2 className="text-3xl font-bold mb-4">
          ¿Listo para transformar tu arte?
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Únete a miles de tatuadores que ya están ahorrando horas con TattooStencilPro
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" variant="default">
            Empezar prueba gratuita
          </Button>
          <Button size="lg" variant="outline">
            Hablar con ventas
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          7 días gratis • Sin tarjeta requerida • 50 créditos incluidos
        </p>
      </div>
    </div>
    </>
  );
}