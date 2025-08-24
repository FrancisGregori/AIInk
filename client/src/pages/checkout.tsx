import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CreditCard } from "lucide-react";
import { Link, useLocation } from "wouter";
import Navigation from "@/components/Navigation";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.warn('Missing VITE_STRIPE_PUBLIC_KEY - Stripe checkout will not work');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

const CheckoutForm = ({ amount, credits }: { amount: number; credits: number }) => {
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
          return_url: `${window.location.origin}/pricing?success=true`,
        },
      });

      if (error) {
        toast({
          title: "Pago falló",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "¡Pago exitoso!",
          description: `Se agregaron ${credits} créditos a tu cuenta`,
        });
        setLocation("/pricing?success=true");
      }
    } catch (err) {
      toast({
        title: "Error en el pago",
        description: "Hubo un problema procesando tu pago",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Finalizar Compra
        </CardTitle>
        <CardDescription>
          {credits} créditos por ${amount}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentElement />
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!stripe || !elements || isProcessing}
            data-testid="button-confirm-payment"
          >
            {isProcessing ? "Procesando..." : `Pagar $${amount}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Get amount and credits from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const amount = parseFloat(urlParams.get('amount') || '0');
  const credits = parseInt(urlParams.get('credits') || '0');

  useEffect(() => {
    if (!amount || !credits) {
      setError("Parámetros de pago inválidos");
      setLoading(false);
      return;
    }

    // Create PaymentIntent as soon as the page loads
    apiRequest("POST", "/api/create-payment-intent", { 
      amount, 
      credits,
      type: "credit_pack" 
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
        console.error("Error creating payment intent:", error);
        setError("Error al inicializar el pago. Por favor intenta de nuevo.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [amount, credits]);

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-20">
          <div className="h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" aria-label="Loading"/>
              <p className="text-muted-foreground">Preparando tu pago...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !clientSecret) {
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
                  {error || "No se pudo inicializar el pago"}
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
            <h1 className="text-3xl font-bold mb-2">Comprar Créditos</h1>
            <p className="text-muted-foreground">
              Completa tu compra de manera segura con Stripe
            </p>
          </div>

          {/* Checkout Form */}
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm amount={amount} credits={credits} />
          </Elements>
          
          {/* Security Notice */}
          <div className="text-center mt-8 text-sm text-muted-foreground">
            <p>🔒 Pago seguro procesado por Stripe</p>
            <p>Tu información de pago está protegida con encriptación de nivel bancario</p>
          </div>
        </div>
      </div>
    </>
  );
}