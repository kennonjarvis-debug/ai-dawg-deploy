/**
 * Billing API Hooks
 * Custom hooks for managing billing operations
 */

import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { BillingInfo, Subscription, PaymentMethod, Invoice } from '../types/billing';

export const useBilling = () => {
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBillingInfo = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<BillingInfo>('/billing');
      setBillingInfo(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch billing information');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingInfo();
  }, []);

  return {
    billingInfo,
    isLoading,
    error,
    refetch: fetchBillingInfo,
  };
};

export const useSubscription = () => {
  const { billingInfo, isLoading, error, refetch } = useBilling();

  const createSubscription = async (priceId: string) => {
    const response = await apiClient.post('/billing/subscription', { priceId });
    await refetch();
    return response.data;
  };

  const cancelSubscription = async () => {
    await apiClient.delete('/billing/subscription');
    await refetch();
  };

  const resumeSubscription = async () => {
    await apiClient.post('/billing/subscription/resume');
    await refetch();
  };

  const updateSubscription = async (priceId: string) => {
    await apiClient.patch('/billing/subscription', { priceId });
    await refetch();
  };

  return {
    subscription: billingInfo?.subscription,
    isLoading,
    error,
    createSubscription,
    cancelSubscription,
    resumeSubscription,
    updateSubscription,
    refetch,
  };
};

export const usePaymentMethods = () => {
  const { billingInfo, isLoading, error, refetch } = useBilling();

  const addPaymentMethod = async (paymentMethodId: string) => {
    await apiClient.post('/billing/payment-methods', { paymentMethodId });
    await refetch();
  };

  const removePaymentMethod = async (paymentMethodId: string) => {
    await apiClient.delete(`/billing/payment-methods/${paymentMethodId}`);
    await refetch();
  };

  const setDefaultPaymentMethod = async (paymentMethodId: string) => {
    await apiClient.post('/billing/payment-methods/default', { paymentMethodId });
    await refetch();
  };

  return {
    paymentMethods: billingInfo?.paymentMethods || [],
    isLoading,
    error,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    refetch,
  };
};

export const useInvoices = () => {
  const { billingInfo, isLoading, error } = useBilling();

  return {
    invoices: billingInfo?.invoices || [],
    upcomingInvoice: billingInfo?.upcomingInvoice,
    isLoading,
    error,
  };
};

export const useCreateSetupIntent = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSetupIntent = async (): Promise<{ clientSecret: string }> => {
    setIsCreating(true);
    setError(null);
    try {
      const response = await apiClient.post<{ clientSecret: string }>(
        '/billing/setup-intent'
      );
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to create setup intent');
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createSetupIntent,
    isCreating,
    error,
  };
};
