/**
 * Stripe Payment Form Component
 * Handles credit card input using Stripe Elements
 */

import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { CreditCard, AlertCircle } from 'lucide-react';

interface StripePaymentFormProps {
  onSuccess: (paymentMethodId: string) => void;
  onCancel?: () => void;
  submitButtonText?: string;
}

export const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  onSuccess,
  onCancel,
  submitButtonText = 'Save Payment Method',
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error: submitError, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: 'if_required',
      });

      if (submitError) {
        setError(submitError.message || 'Payment setup failed');
        setIsProcessing(false);
        return;
      }

      if (setupIntent?.payment_method) {
        onSuccess(setupIntent.payment_method as string);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-gray-400" />
          <h3 className="font-medium text-white">Payment Details</h3>
        </div>
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 rounded-lg transition-all"
        >
          {isProcessing ? 'Processing...' : submitButtonText}
        </button>
      </div>
    </form>
  );
};

export default StripePaymentForm;
