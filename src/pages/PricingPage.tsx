import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowLeft, Zap } from 'lucide-react';
import Logo from '@/components/Logo';

type BillingCycle = 'monthly' | 'yearly';

interface PricingTier {
  name: string;
  displayName: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  features: string[];
  highlighted?: boolean;
  stripePriceId?: string;
}

const PRICING_TIERS: PricingTier[] = [
  {
    name: 'FREE',
    displayName: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'Perfect for getting started',
    features: [
      'Auto-Align AI feature',
      '25 operations per day',
      '3 projects max',
      '5 tracks per project',
      'Basic vocal coach',
      'Community support'
    ],
  },
  {
    name: 'PRO',
    displayName: 'Pro',
    monthlyPrice: 19.99,
    yearlyPrice: 199.90,
    description: 'For serious music producers',
    features: [
      'All AI features (Comp, Pitch, Align, Mix)',
      '500 operations per day',
      'Unlimited projects',
      'Unlimited tracks',
      '50 GB storage',
      'Advanced vocal coach',
      'AI Producer assistant',
      'Priority support'
    ],
    highlighted: true,
    stripePriceId: 'price_1SFHdcQckzKJ9tzeiq1pI0ue'
  },
  {
    name: 'STUDIO',
    displayName: 'Studio',
    monthlyPrice: 49.99,
    yearlyPrice: 499.90,
    description: 'Professional studios & teams',
    features: [
      'Everything in Pro',
      'Auto-Master feature',
      'AI Music Generation',
      '2000 operations per day',
      'Unlimited storage',
      'Team collaboration',
      'Custom AI models',
      'Dedicated support',
      'Early access to features'
    ],
    stripePriceId: 'price_1SFHdeQckzKJ9tzePfVFGEJ4'
  },
];

export const PricingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const navigate = useNavigate();

  const getPrice = (tier: PricingTier) => {
    if (tier.monthlyPrice === 0) return 'Free';
    const price = billingCycle === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice;
    const suffix = billingCycle === 'monthly' ? '/mo' : '/yr';
    return `$${price.toFixed(2)}${suffix}`;
  };

  const getPeriod = () => {
    return billingCycle === 'monthly' ? 'per month' : 'per year';
  };

  const getSavings = (tier: PricingTier) => {
    if (tier.monthlyPrice === 0) return null;
    const yearlyEquivalent = tier.monthlyPrice * 12;
    const savings = yearlyEquivalent - tier.yearlyPrice;
    return savings > 0 ? Math.round(savings) : null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo size="md" />
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6">
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">Simple Pricing</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Start free, upgrade when you need more power
          </p>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex gap-1 p-1 bg-gray-800/50 backdrop-blur border border-white/10 rounded-lg">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs text-green-400">Save 15%</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PRICING_TIERS.map((tier) => {
            const savings = billingCycle === 'yearly' ? getSavings(tier) : null;

            return (
              <div
                key={tier.name}
                className={`relative bg-gray-800/50 backdrop-blur border rounded-2xl p-8 transition-all duration-300 hover:transform hover:scale-105 ${
                  tier.highlighted
                    ? 'border-purple-500 shadow-2xl shadow-purple-500/20 md:scale-105'
                    : 'border-white/10'
                }`}
              >
                {/* Popular Badge */}
                {tier.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-full shadow-lg">
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Tier Header */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{tier.displayName}</h3>
                  <p className="text-gray-400 text-sm">{tier.description}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-bold text-white">{getPrice(tier)}</span>
                    {tier.monthlyPrice > 0 && (
                      <span className="text-gray-400">{getPeriod()}</span>
                    )}
                  </div>
                  {savings && (
                    <div className="text-sm text-green-400">
                      Save ${savings}/year with yearly billing
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 min-h-[300px]">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => {
                    if (tier.name === 'FREE') {
                      navigate('/register');
                    } else {
                      navigate('/settings/billing');
                    }
                  }}
                  className={`w-full py-4 rounded-lg font-bold transition-all duration-200 ${
                    tier.highlighted
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-purple-500/50'
                      : tier.name === 'FREE'
                      ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  }`}
                >
                  {tier.name === 'FREE' ? 'Get Started Free' : 'Upgrade Now'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Compare Features
          </h2>

          <div className="bg-gray-800/50 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-white font-semibold">Feature</th>
                    <th className="px-6 py-4 text-center text-white font-semibold">Free</th>
                    <th className="px-6 py-4 text-center text-white font-semibold">Pro</th>
                    <th className="px-6 py-4 text-center text-white font-semibold">Studio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  <tr className="hover:bg-white/5">
                    <td className="px-6 py-4 text-gray-300">AI Auto-Align</td>
                    <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="px-6 py-4 text-gray-300">AI Auto-Comp</td>
                    <td className="px-6 py-4 text-center"><span className="text-gray-600">–</span></td>
                    <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="px-6 py-4 text-gray-300">AI Auto-Pitch</td>
                    <td className="px-6 py-4 text-center"><span className="text-gray-600">–</span></td>
                    <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="px-6 py-4 text-gray-300">AI Auto-Mix</td>
                    <td className="px-6 py-4 text-center"><span className="text-gray-600">–</span></td>
                    <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="px-6 py-4 text-gray-300">AI Auto-Master</td>
                    <td className="px-6 py-4 text-center"><span className="text-gray-600">–</span></td>
                    <td className="px-6 py-4 text-center"><span className="text-gray-600">–</span></td>
                    <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="px-6 py-4 text-gray-300">AI Music Generation</td>
                    <td className="px-6 py-4 text-center"><span className="text-gray-600">–</span></td>
                    <td className="px-6 py-4 text-center"><span className="text-gray-600">–</span></td>
                    <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="px-6 py-4 text-gray-300">Projects</td>
                    <td className="px-6 py-4 text-center text-gray-400">3</td>
                    <td className="px-6 py-4 text-center text-gray-400">Unlimited</td>
                    <td className="px-6 py-4 text-center text-gray-400">Unlimited</td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="px-6 py-4 text-gray-300">Daily Operations</td>
                    <td className="px-6 py-4 text-center text-gray-400">25</td>
                    <td className="px-6 py-4 text-center text-gray-400">500</td>
                    <td className="px-6 py-4 text-center text-gray-400">2000</td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="px-6 py-4 text-gray-300">Storage</td>
                    <td className="px-6 py-4 text-center text-gray-400">1 GB</td>
                    <td className="px-6 py-4 text-center text-gray-400">50 GB</td>
                    <td className="px-6 py-4 text-center text-gray-400">Unlimited</td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="px-6 py-4 text-gray-300">Support</td>
                    <td className="px-6 py-4 text-center text-gray-400">Community</td>
                    <td className="px-6 py-4 text-center text-gray-400">Priority</td>
                    <td className="px-6 py-4 text-center text-gray-400">Dedicated</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-300">Yes! You can cancel your subscription at any time. No questions asked.</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-2">Is there a free trial?</h3>
              <p className="text-gray-300">The Free plan is available forever with no credit card required. Upgrade anytime to unlock more features.</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-300">We accept all major credit cards through our secure payment processor, Stripe.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
