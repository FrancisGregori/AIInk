// Centralized Stripe pricing configuration
// This file contains all pricing information to avoid duplication

export interface CreditPack {
  credits: number;
  price: number;
  perCredit: number;
  popular?: boolean;
}

export interface SubscriptionPlan {
  name: string;
  tier: 'basic' | 'pro' | 'premium';
  monthlyPrice: number;
  annualPrice: number;
  monthlyCredits: number;
  features: string[];
  popular?: boolean;
  disabled?: boolean;
}

// Credit packs configuration - used by both frontend and backend
export const CREDIT_PACKS: Record<number, CreditPack> = {
  100: { 
    credits: 100, 
    price: 4.99, 
    perCredit: 0.0499 
  },
  250: { 
    credits: 250, 
    price: 9.99, 
    perCredit: 0.0400, 
    popular: true 
  },
  500: { 
    credits: 500, 
    price: 18.99, 
    perCredit: 0.0380 
  },
  1000: { 
    credits: 1000, 
    price: 36.99, 
    perCredit: 0.0370 
  }
};

// Subscription plans configuration
export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  basic: {
    name: "Basic",
    tier: "basic",
    monthlyPrice: 11.99,
    annualPrice: 119,
    monthlyCredits: 275,
    features: [
      "275 créditos mensuales",
      "Generación básica de stencils",
      "Editor de diseños AI",
      "Galería personal limitada",
      "Soporte por email"
    ]
  },
  pro: {
    name: "Pro",
    tier: "pro",
    monthlyPrice: 24.99,
    annualPrice: 249,
    monthlyCredits: 750,
    features: [
      "750 créditos mensuales",
      "Acceso a todos los estilos AI",
      "Editor avanzado con FLUX Kontext",
      "Galería ilimitada",
      "Exportación en alta resolución",
      "InkVision AI Assistant",
      "Soporte prioritario"
    ],
    popular: true
  },
  premium: {
    name: "Premium",
    tier: "premium",
    monthlyPrice: 39.99,
    annualPrice: 399,
    monthlyCredits: 1500,
    features: [
      "1,500 créditos mensuales",
      "Todo lo de Pro",
      "Modelos AI personalizados",
      "API access",
      "Colaboración en equipo",
      "Training de modelos custom",
      "Soporte dedicado 24/7"
    ]
  }
};

// Stripe Price IDs mapping (from your live Stripe account)
export const STRIPE_PRICE_IDS = {
  creditPacks: {
    // These would be created in Stripe for one-time payments
    // Currently handled dynamically by payment amount
  },
  subscriptions: {
    basic: {
      monthly: "price_1RzfEMIDfLh5OgxChHN9KcSH", // Basic $11.99/month
      annual: "price_1RzfEuIDfLh5OgxC0RFsNlvX"   // Basic $119/year
    },
    pro: {
      monthly: "price_1Rzk7TIDfLh5OgxCABCUNxQ9", // Pro $24.99/month
      annual: "price_1Rzk7zIDfLh5OgxCn6vhQcpw"   // Pro $249/year
    },
    premium: {
      monthly: "price_1Rzk8PIDfLh5OgxCTSs1FJvt", // Premium $39.99/month
      annual: "price_1Rzk8nIDfLh5OgxCZ6YzOkA1"   // Premium $399/year
    }
  }
};

// Helper functions
export function getCreditPackByCredits(credits: number): CreditPack | undefined {
  return CREDIT_PACKS[credits];
}

export function getSubscriptionPlan(tier: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS[tier];
}

export function getPriceId(plan: string, billingPeriod: 'monthly' | 'annual'): string | undefined {
  return STRIPE_PRICE_IDS.subscriptions[plan as keyof typeof STRIPE_PRICE_IDS.subscriptions]?.[billingPeriod];
}