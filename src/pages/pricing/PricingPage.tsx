/**
 * Pricing Page
 * Displays subscription tiers and pricing information
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap } from 'lucide-react';
import { PRICING_PLANS } from '../../config/pricing';
import { PricingPlan } from '../../types/billing';
import { useAuth } from '../../contexts/AuthContext';

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  const filteredPlans = PRICING_PLANS.filter((plan) => {
    if (plan.tier === 'free') return true;
    if (plan.tier === 'enterprise') return true;
    return plan.interval === billingInterval;
  });

  const handleSelectPlan = (plan: PricingPlan) => {
    if (plan.tier === 'enterprise') {
      window.location.href = 'mailto:sales@aidaw.com?subject=Enterprise Plan Inquiry';
      return;
    }

    if (plan.tier === 'free') {
      navigate('/register');
      return;
    }

    if (!user) {
      navigate('/register', { state: { selectedPlan: plan.id } });
      return;
    }

    navigate('/dashboard/billing', { state: { upgradeToPlan: plan.id } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Header */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-300 mb-8">
            Start creating music with AI-powered tools
          </p>

          {/* Billing Interval Toggle */}
          <div className="inline-flex items-center bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setBillingInterval('month')}
              className={`px-6 py-2 rounded-md transition-colors ${
                billingInterval === 'month'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('year')}
              className={`px-6 py-2 rounded-md transition-colors ${
                billingInterval === 'year'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Annual
              <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {filteredPlans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              onSelect={() => handleSelectPlan(plan)}
              isPopular={plan.popular}
            />
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <FAQItem
              question="Can I change plans at any time?"
              answer="Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately for upgrades, or at the end of your billing cycle for downgrades."
            />
            <FAQItem
              question="What payment methods do you accept?"
              answer="We accept all major credit cards (Visa, Mastercard, American Express) through Stripe. Enterprise customers can arrange invoicing."
            />
            <FAQItem
              question="Is there a free trial?"
              answer="The Free tier is available indefinitely. You can upgrade to Pro at any time to unlock advanced features."
            />
            <FAQItem
              question="What happens if I cancel?"
              answer="You'll have access to your Pro features until the end of your current billing period. Your projects and data are preserved."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface PricingCardProps {
  plan: PricingPlan;
  onSelect: () => void;
  isPopular?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({ plan, onSelect, isPopular }) => {
  const isEnterprise = plan.tier === 'enterprise';
  const isFree = plan.tier === 'free';

  return (
    <div
      className={`relative bg-gray-800 rounded-2xl p-8 border-2 transition-all hover:scale-105 ${
        isPopular
          ? 'border-purple-500 shadow-2xl shadow-purple-500/20'
          : 'border-gray-700'
      }`}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
            <Zap className="w-4 h-4" />
            Most Popular
          </div>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
        <div className="text-4xl font-bold mb-2">
          {isEnterprise ? (
            <span className="text-3xl">Contact Us</span>
          ) : (
            <>
              ${plan.price}
              {!isFree && (
                <span className="text-lg text-gray-400">
                  /{plan.interval === 'year' ? 'year' : 'mo'}
                </span>
              )}
            </>
          )}
        </div>
        {plan.interval === 'year' && !isEnterprise && (
          <p className="text-sm text-gray-400">
            ${(plan.price / 12).toFixed(2)}/month when billed annually
          </p>
        )}
      </div>

      <ul className="space-y-3 mb-8">
        {plan.features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        className={`w-full py-3 rounded-lg font-semibold transition-colors ${
          isPopular
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
            : 'bg-gray-700 hover:bg-gray-600 text-white'
        }`}
      >
        {isEnterprise ? 'Contact Sales' : isFree ? 'Get Started' : 'Upgrade Now'}
      </button>
    </div>
  );
};

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left flex justify-between items-center"
      >
        <h3 className="text-lg font-semibold">{question}</h3>
        <span className="text-2xl">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && <p className="mt-4 text-gray-300">{answer}</p>}
    </div>
  );
};

export default PricingPage;
