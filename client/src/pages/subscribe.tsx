import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Crown, Sparkles, Zap } from "lucide-react";
import { Link, useLocation } from "wouter";
import Navigation from "@/components/Navigation";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.warn('Missing VITE_STRIPE_PUBLIC_KEY - Stripe subscriptions will not work');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

const SubscribeForm = ({ plan, billingPeriod }: { plan: string; billingPeriod: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/pricing?subscribed=true`,
        },
      });

      if (error) {
        toast({
          title: "Suscripción falló",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "¡Suscripción exitosa!",
          description: `Ahora tienes acceso al plan ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
        });
        setLocation("/pricing?subscribed=true");
      }
    } catch (err) {
      toast({
        title: "Error en la suscripción",
        description: "Hubo un problema procesando tu suscripción",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        size="lg"
        disabled={!stripe || !elements || isProcessing}
        data-testid="button-confirm-subscription"
      >
        {isProcessing ? "Procesando..." : "Confirmar Suscripción"}
      </Button>
    </form>
  );
};

// Plan configuration for display
const planConfig = {
  basic: {
    name: "Basic",
    icon: <Sparkles className="h-6 w-6" />,
    monthlyPrice: 11.99,
    annualPrice: 119,
    originalAnnualPrice: 143.88,
    credits: 200,
    color: "bg-blue-500/10 border-blue-500/20"
  },
  pro: {
    name: "Pro",
    icon: <Zap className="h-6 w-6" />,
    monthlyPrice: 19.99,
    annualPrice: 199,
    originalAnnualPrice: 239.88,
    credits: 500,
    color: "bg-primary/10 border-primary/20",
    popular: true
  },
  premium: {
    name: "Premium",
    icon: <Crown className="h-6 w-6" />,
    monthlyPrice: 39.99,
    annualPrice: 399,
    originalAnnualPrice: 479.88,
    credits: 1000,
    color: "bg-purple-500/10 border-purple-500/20"
  }
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Get plan and billing period from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const plan = urlParams.get('plan') || 'basic';
  const billingPeriod = urlParams.get('billing') || 'monthly';

  const currentPlan = planConfig[plan as keyof typeof planConfig];
  const price = billingPeriod === 'monthly' ? currentPlan?.monthlyPrice : currentPlan?.annualPrice;

  useEffect(() => {
    if (!currentPlan) {
      setError("Plan de suscripción inválido");
      setLoading(false);
      return;
    }

    // Create subscription as soon as the page loads
    apiRequest("POST", "/api/get-or-create-subscription", { 
      plan, 
      billingPeriod 
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error("No client secret received");
        }
      })
      .catch((error) => {
        console.error("Error creating subscription:", error);
        setError("Error al inicializar la suscripción. Por favor intenta de nuevo.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [plan, billingPeriod, currentPlan]);

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-20">
          <div className="h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" aria-label="Loading"/>
              <p className="text-muted-foreground">Preparando tu suscripción...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !clientSecret || !currentPlan) {
    return (
      <>
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-20">
          <div className="max-w-md mx-auto text-center">
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">Error</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  {error || "No se pudo inicializar la suscripción"}
                </p>
                <Link to="/pricing">
                  <Button className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver a Pricing
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  // Make SURE to wrap the form in <Elements> which provides the stripe context.
  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-20">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/pricing">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Pricing
              </Button>
            </Link>
            <h1 className="text-3xl font-bold mb-2">Confirmar Suscripción</h1>
            <p className="text-muted-foreground">
              Completa tu suscripción de manera segura con Stripe
            </p>
          </div>

          {/* Plan Summary */}
          <Card className={`mb-8 ${currentPlan.color} relative`}>
            {'popular' in currentPlan && currentPlan.popular && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                Más Popular
              </Badge>
            )}
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-background rounded-lg">
                    {currentPlan.icon}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{currentPlan.name}</CardTitle>
                    <CardDescription>
                      {currentPlan.credits} créditos mensuales
                    </CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    ${price}
                    {billingPeriod === 'annual' && currentPlan.originalAnnualPrice && (
                      <span className="text-lg text-muted-foreground line-through ml-2">
                        ${currentPlan.originalAnnualPrice}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    /{billingPeriod === 'monthly' ? 'mes' : 'año'}
                  </div>
                  {billingPeriod === 'annual' && (
                    <Badge variant="secondary" className="mt-1">
                      Ahorra 17%
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  <span>{currentPlan.credits} créditos mensuales incluidos</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Acceso completo a herramientas</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Soporte prioritario</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Información de Pago</CardTitle>
              <CardDescription>
                Ingresa los detalles de tu tarjeta para completar la suscripción
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <SubscribeForm plan={plan} billingPeriod={billingPeriod} />
              </Elements>
            </CardContent>
          </Card>
          
          {/* Security Notice */}
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>🔒 Pago seguro procesado por Stripe</p>
            <p>Tu información de pago está protegida con encriptación de nivel bancario</p>
            <p>Cancela tu suscripción en cualquier momento desde tu perfil</p>
          </div>
        </div>
      </div>
    </>
  );
}