/**
 * Billing and Subscription Types
 */

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface PricingPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  price: number;
  interval: 'month' | 'year';
  stripePriceId?: string;
  features: string[];
  limits: {
    projects: number;
    tracks: number;
    storage: string;
    exportMinutes: number;
    aiCredits: number;
  };
  popular?: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card';
  card: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  invoiceUrl?: string;
  paidAt?: Date;
  createdAt: Date;
}

export interface BillingInfo {
  subscription: Subscription | null;
  paymentMethods: PaymentMethod[];
  invoices: Invoice[];
  upcomingInvoice?: {
    amount: number;
    date: Date;
  };
}
