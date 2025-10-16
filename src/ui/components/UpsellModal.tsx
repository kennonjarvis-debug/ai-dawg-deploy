import React from 'react';
import { apiClient } from '../../api/client';

interface Props {
  open: boolean;
  onClose: () => void;
  feature?: string;
  plan?: string;
  upgradeUrl?: string | null;
}

export const UpsellModal: React.FC<Props> = ({ open, onClose, feature, plan, upgradeUrl }) => {
  if (!open) return null;
  const onUpgrade = async () => {
    if (upgradeUrl) {
      window.location.href = upgradeUrl;
      return;
    }
    try {
      const { url } = await apiClient.createCheckout();
      window.location.href = url;
    } catch {
      window.location.href = '/settings/billing';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000]">
      <div className="bg-[#0b0b0f] border border-white/10 rounded-xl w-[520px] max-w-[92vw] p-6 text-white">
        <h2 className="text-xl font-semibold mb-2">Upgrade to unlock {feature || 'this feature'}</h2>
        <p className="text-sm text-gray-300 mb-4">
          Your current plan ({plan || 'FREE'}) doesn’t include this feature. Upgrade to Pro or Studio to continue.
        </p>
        <div className="flex gap-2 justify-end">
          <button className="px-3 py-2 bg-white/10 rounded" onClick={onClose}>Not now</button>
          <button className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded" onClick={onUpgrade}>Upgrade</button>
        </div>
      </div>
    </div>
  );
};

