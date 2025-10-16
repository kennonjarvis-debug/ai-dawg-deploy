/**
 * Pricing Plans Configuration
 */

import { PricingPlan } from '../types/billing';

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    tier: 'free',
    price: 0,
    interval: 'month',
    features: [
      'Up to 3 projects',
      '8 tracks per project',
      '1GB storage',
      '10 minutes export/month',
      'Basic AI assistance',
      'Community support',
    ],
    limits: {
      projects: 3,
      tracks: 8,
      storage: '1GB',
      exportMinutes: 10,
      aiCredits: 100,
    },
  },
  {
    id: 'pro-monthly',
    name: 'Pro',
    tier: 'pro',
    price: 19.99,
    interval: 'month',
    stripePriceId: process.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID,
    features: [
      'Unlimited projects',
      'Unlimited tracks',
      '50GB storage',
      'Unlimited exports',
      'Advanced AI features',
      'Vocal coach',
      'Melody to lyrics',
      'Priority support',
      'Offline mode',
    ],
    limits: {
      projects: -1, // unlimited
      tracks: -1,
      storage: '50GB',
      exportMinutes: -1,
      aiCredits: 10000,
    },
    popular: true,
  },
  {
    id: 'pro-yearly',
    name: 'Pro (Annual)',
    tier: 'pro',
    price: 199.99,
    interval: 'year',
    stripePriceId: process.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID,
    features: [
      'Everything in Pro Monthly',
      '2 months free',
      'Annual billing',
    ],
    limits: {
      projects: -1,
      tracks: -1,
      storage: '50GB',
      exportMinutes: -1,
      aiCredits: 120000,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tier: 'enterprise',
    price: 0, // Contact for pricing
    interval: 'month',
    features: [
      'Everything in Pro',
      'Unlimited storage',
      'Custom AI models',
      'White-label option',
      'Dedicated support',
      'SLA guarantee',
      'Custom integrations',
      'Team collaboration',
    ],
    limits: {
      projects: -1,
      tracks: -1,
      storage: 'Unlimited',
      exportMinutes: -1,
      aiCredits: -1,
    },
  },
];

export const DEFAULT_PLAN = PRICING_PLANS[0]; // Free tier
export const POPULAR_PLAN = PRICING_PLANS.find((p) => p.popular) || PRICING_PLANS[1];
