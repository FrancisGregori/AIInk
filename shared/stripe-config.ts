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
    monthlyCredits: 200,
    features: [
      "200 créditos mensuales",
      "40 stencils profesionales",
      "66 diseños editados",
      "Asistente AI (100 mensajes/mes)",
      "Soporte estándar (48h)",
      "Historial 30 días",
      "Rollover 50% créditos"
    ]
  },
  pro: {
    name: "Pro",
    tier: "pro",
    monthlyPrice: 19.99,
    annualPrice: 199,
    monthlyCredits: 500,
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
    popular: true
  },
  premium: {
    name: "Premium",
    tier: "premium",
    monthlyPrice: 39.99,
    annualPrice: 399,
    monthlyCredits: 1000,
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

// Reverse mapping: Price ID to Tier (for webhook processing)
export const PRICE_ID_TO_TIER: Record<string, string> = {
  // Basic tier
  "price_1RzfEMIDfLh5OgxChHN9KcSH": "basic", // Basic $11.99/month
  "price_1RzfEuIDfLh5OgxC0RFsNlvX": "basic", // Basic $119/year
  // Pro tier  
  "price_1Rzk7TIDfLh5OgxCABCUNxQ9": "pro",   // Pro $24.99/month
  "price_1Rzk7zIDfLh5OgxCn6vhQcpw": "pro",   // Pro $249/year
  // Premium tier
  "price_1Rzk8PIDfLh5OgxCTSs1FJvt": "premium", // Premium $39.99/month
  "price_1Rzk8nIDfLh5OgxCZ6YzOkA1": "premium"  // Premium $399/year
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