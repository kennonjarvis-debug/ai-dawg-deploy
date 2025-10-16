/**
 * Billing Dashboard
 * Main billing page with subscription management, payment methods, and invoices
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import {
  CreditCard,
  FileText,
  TrendingUp,
  AlertCircle,
  Check,
  Plus,
  X,
} from 'lucide-react';
import { useSubscription, usePaymentMethods, useInvoices, useCreateSetupIntent } from '../../../hooks/useBilling';
import { PRICING_PLANS } from '../../../config/pricing';
import StripePaymentForm from '../../../components/billing/StripePaymentForm';
import PaymentMethodCard from '../../../components/billing/PaymentMethodCard';
import InvoiceHistory from '../../../components/billing/InvoiceHistory';

// Initialize Stripe
const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export const BillingDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const upgradePlanId = location.state?.upgradeToPlan;

  const {
    subscription,
    isLoading: subscriptionLoading,
    createSubscription,
    cancelSubscription,
    resumeSubscription,
    updateSubscription,
    refetch: refetchSubscription,
  } = useSubscription();

  const {
    paymentMethods,
    isLoading: paymentMethodsLoading,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    refetch: refetchPaymentMethods,
  } = usePaymentMethods();

  const { invoices, upcomingInvoice, isLoading: invoicesLoading } = useInvoices();
  const { createSetupIntent } = useCreateSetupIntent();

  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [setupIntentClientSecret, setSetupIntentClientSecret] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Auto-show upgrade modal if plan was selected
  useEffect(() => {
    if (upgradePlanId) {
      setSelectedPlanId(upgradePlanId);
      setShowUpgradeModal(true);
    }
  }, [upgradePlanId]);

  const handleAddPaymentMethod = async () => {
    try {
      const { clientSecret } = await createSetupIntent();
      setSetupIntentClientSecret(clientSecret);
      setShowAddPayment(true);
    } catch (error: any) {
      setActionError(error.message || 'Failed to initialize payment form');
    }
  };

  const handlePaymentMethodAdded = async (paymentMethodId: string) => {
    try {
      await addPaymentMethod(paymentMethodId);
      setShowAddPayment(false);
      setSetupIntentClientSecret(null);
    } catch (error: any) {
      setActionError(error.message || 'Failed to add payment method');
    }
  };

  const handleRemovePaymentMethod = async (id: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) return;

    try {
      await removePaymentMethod(id);
    } catch (error: any) {
      setActionError(error.message || 'Failed to remove payment method');
    }
  };

  const handleSetDefaultPaymentMethod = async (id: string) => {
    try {
      await setDefaultPaymentMethod(id);
    } catch (error: any) {
      setActionError(error.message || 'Failed to set default payment method');
    }
  };

  const handleUpgrade = async (planId: string) => {
    setIsProcessing(true);
    setActionError(null);

    try {
      const plan = PRICING_PLANS.find((p) => p.id === planId);
      if (!plan?.stripePriceId) {
        throw new Error('Invalid plan selected');
      }

      if (paymentMethods.length === 0) {
        setActionError('Please add a payment method first');
        setShowUpgradeModal(false);
        setShowAddPayment(true);
        return;
      }

      if (subscription) {
        await updateSubscription(plan.stripePriceId);
      } else {
        await createSubscription(plan.stripePriceId);
      }

      setShowUpgradeModal(false);
      setSelectedPlanId(null);
    } catch (error: any) {
      setActionError(error.message || 'Failed to upgrade subscription');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
      return;
    }

    setIsProcessing(true);
    setActionError(null);

    try {
      await cancelSubscription();
    } catch (error: any) {
      setActionError(error.message || 'Failed to cancel subscription');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResumeSubscription = async () => {
    setIsProcessing(true);
    setActionError(null);

    try {
      await resumeSubscription();
    } catch (error: any) {
      setActionError(error.message || 'Failed to resume subscription');
    } finally {
      setIsProcessing(false);
    }
  };

  const currentPlan = PRICING_PLANS.find((p) => p.tier === (subscription?.tier || 'free'));

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
          <p className="text-gray-400">Manage your subscription, payment methods, and invoices</p>
        </div>

        {actionError && (
          <div className="mb-6 bg-red-900/30 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-300">{actionError}</p>
            </div>
            <button
              onClick={() => setActionError(null)}
              className="text-red-400 hover:text-red-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Current Plan */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-semibold">Current Plan</h2>
            </div>
            {subscription && !subscription.cancelAtPeriodEnd && (
              <span className="bg-green-900/30 text-green-400 px-3 py-1 rounded-full text-sm border border-green-500/50">
                Active
              </span>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-400 mb-2">Plan</p>
              <p className="text-2xl font-bold">{currentPlan?.name || 'Free'}</p>
              {subscription && (
                <p className="text-gray-400 mt-2">
                  {subscription.cancelAtPeriodEnd
                    ? `Cancels on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                    : `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
                </p>
              )}
            </div>

            <div className="space-y-2">
              {currentPlan?.features.slice(0, 4).map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-gray-300">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            {(!subscription || subscription.tier === 'free') && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg font-semibold transition-all"
              >
                Upgrade to Pro
              </button>
            )}
            {subscription && subscription.cancelAtPeriodEnd && (
              <button
                onClick={handleResumeSubscription}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Resume Subscription
              </button>
            )}
            {subscription && !subscription.cancelAtPeriodEnd && subscription.tier !== 'free' && (
              <button
                onClick={handleCancelSubscription}
                disabled={isProcessing}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Cancel Subscription
              </button>
            )}
            <button
              onClick={() => navigate('/pricing')}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              View All Plans
            </button>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-semibold">Payment Methods</h2>
            </div>
            <button
              onClick={handleAddPaymentMethod}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Payment Method
            </button>
          </div>

          <div className="space-y-3">
            {paymentMethodsLoading ? (
              <p className="text-gray-400">Loading...</p>
            ) : paymentMethods.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No payment methods added</p>
            ) : (
              paymentMethods.map((pm) => (
                <PaymentMethodCard
                  key={pm.id}
                  paymentMethod={pm}
                  onSetDefault={handleSetDefaultPaymentMethod}
                  onRemove={handleRemovePaymentMethod}
                />
              ))
            )}
          </div>
        </div>

        {/* Billing History */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-semibold">Billing History</h2>
          </div>

          {invoicesLoading ? (
            <p className="text-gray-400">Loading...</p>
          ) : (
            <InvoiceHistory invoices={invoices} />
          )}
        </div>
      </div>

      {/* Add Payment Method Modal */}
      {showAddPayment && setupIntentClientSecret && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Add Payment Method</h3>
              <button
                onClick={() => {
                  setShowAddPayment(false);
                  setSetupIntentClientSecret(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: setupIntentClientSecret,
                appearance: {
                  theme: 'night',
                  variables: {
                    colorPrimary: '#9333ea',
                  },
                },
              }}
            >
              <StripePaymentForm
                onSuccess={handlePaymentMethodAdded}
                onCancel={() => {
                  setShowAddPayment(false);
                  setSetupIntentClientSecret(null);
                }}
              />
            </Elements>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-2xl w-full border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Choose Your Plan</h3>
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  setSelectedPlanId(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {PRICING_PLANS.filter((p) => p.tier === 'pro').map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isProcessing}
                  className={`text-left bg-gray-900 border-2 rounded-lg p-4 transition-all hover:border-purple-500 ${
                    selectedPlanId === plan.id ? 'border-purple-500' : 'border-gray-700'
                  }`}
                >
                  <h4 className="font-semibold mb-2">{plan.name}</h4>
                  <p className="text-2xl font-bold mb-2">
                    ${plan.price}
                    <span className="text-sm text-gray-400">/{plan.interval}</span>
                  </p>
                  <ul className="space-y-1 text-sm text-gray-400">
                    {plan.features.slice(0, 5).map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingDashboard;
