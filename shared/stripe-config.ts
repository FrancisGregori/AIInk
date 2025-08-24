// Centralized Stripe pricing configuration
// This file contains all pricing information to avoid duplication

export interface CreditPack {
  credits: number;
  price: number; // Price in cents (e.g., 499 = $4.99)
  perCredit: number; // Price per credit in cents
  popular?: boolean;
}

export interface SubscriptionPlan {
  name: string;
  tier: 'basic' | 'pro' | 'premium';
  monthlyPrice: number; // Price in cents (e.g., 1199 = $11.99)
  annualPrice: number; // Price in cents (e.g., 11900 = $119.00)
  monthlyCredits: number;
  features: string[];
  popular?: boolean;
  disabled?: boolean;
}

// Credit packs configuration - used by both frontend and backend
// All prices are stored in cents to avoid floating point precision issues
export const CREDIT_PACKS: Record<number, CreditPack> = {
  100: { 
    credits: 100, 
    price: 499, // $4.99 in cents
    perCredit: 5 // ~$0.05 per credit in cents
  },
  250: { 
    credits: 250, 
    price: 999, // $9.99 in cents
    perCredit: 4, // ~$0.04 per credit in cents
    popular: true 
  },
  500: { 
    credits: 500, 
    price: 1899, // $18.99 in cents
    perCredit: 4 // ~$0.04 per credit in cents
  },
  1000: { 
    credits: 1000, 
    price: 3699, // $36.99 in cents
    perCredit: 4 // ~$0.04 per credit in cents
  }
};

// Subscription plans configuration
// All prices are stored in cents to avoid floating point precision issues
export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  basic: {
    name: "Basic",
    tier: "basic",
    monthlyPrice: 1199, // $11.99 in cents
    annualPrice: 11900, // $119.00 in cents
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
    monthlyPrice: 1999, // $19.99 in cents
    annualPrice: 19900, // $199.00 in cents
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
    monthlyPrice: 3999, // $39.99 in cents
    annualPrice: 39900, // $399.00 in cents
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
      monthly: "price_1RzfEMIDfLh5OgxC5n6nNv7J", // Basic $11.99/month
      annual: "price_1RzfH1IDfLh5OgxCya1cNQCF"   // Basic $119/year
    },
    pro: {
      monthly: "price_1Rzk6zIDfLh5OgxCUA69kNnZ", // Pro $19.99/month
      annual: "price_1Rzk7eIDfLh5OgxCYoI0R3ku"   // Pro $199/year
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
  "price_1RzfEMIDfLh5OgxC5n6nNv7J": "basic", // Basic $11.99/month
  "price_1RzfH1IDfLh5OgxCya1cNQCF": "basic", // Basic $119/year
  // Pro tier  
  "price_1Rzk6zIDfLh5OgxCUA69kNnZ": "pro",   // Pro $19.99/month
  "price_1Rzk7eIDfLh5OgxCYoI0R3ku": "pro",   // Pro $199/year
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