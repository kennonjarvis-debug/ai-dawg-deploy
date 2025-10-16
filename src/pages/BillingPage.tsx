import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { toast } from 'sonner';

export const BillingPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [entitlements, setEntitlements] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const ent = await apiClient.getEntitlements();
        setEntitlements(ent);
      } catch (e: any) {
        toast.error(`Failed to load entitlements: ${e?.message || 'error'}`);
      }
    };
    load();

    // Minimal success refresh handling
    const params = new URLSearchParams(window.location.search);
    if (params.get('billing') === 'success') {
      load();
    }
  }, []);

  const openPortal = async () => {
    try {
      setLoading(true);
      const { url } = await apiClient.createPortal();
      window.location.href = url;
    } catch (e: any) {
      toast.error(`Failed to open billing portal: ${e?.message || 'error'}`);
    } finally {
      setLoading(false);
    }
  };

  const upgrade = async (plan: 'PRO' | 'STUDIO') => {
    try {
      setLoading(true);
      const { url } = await apiClient.createCheckout(plan);
      window.location.href = url;
    } catch (e: any) {
      toast.error(`Failed to start checkout: ${e?.message || 'error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getPlanName = (plan: string) => {
    if (plan === 'FREE' || !plan) return 'Free Plan';
    if (plan === 'PRO') return 'Pro Plan';
    if (plan === 'STUDIO') return 'Studio Plan';
    return `${plan} Plan`;
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Billing</h1>
      <p>{getPlanName(entitlements?.plan)}</p>
      {entitlements?.features && (
        <div>
          <h3>Features</h3>
          <ul>
            {Object.entries(entitlements.features).map(([k, v]) => (
              <li key={k}>{k}: {v ? 'Enabled' : 'Locked'}</li>
            ))}
          </ul>
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button disabled={loading} onClick={openPortal}>Manage Billing</button>
        <button disabled={loading} onClick={() => upgrade('PRO')}>Upgrade to Pro</button>
        <button disabled={loading} onClick={() => upgrade('STUDIO')}>Upgrade to Studio</button>
      </div>
    </div>
  );
};
