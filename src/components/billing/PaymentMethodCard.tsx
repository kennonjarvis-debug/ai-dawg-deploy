/**
 * Payment Method Card Component
 * Displays a single payment method with actions
 */

import React from 'react';
import { CreditCard, Trash2, Check } from 'lucide-react';
import { PaymentMethod } from '../../types/billing';

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod;
  onSetDefault?: (id: string) => void;
  onRemove?: (id: string) => void;
}

export const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  paymentMethod,
  onSetDefault,
  onRemove,
}) => {
  const getCardBrandIcon = (brand: string) => {
    // You can add actual card brand logos here
    return <CreditCard className="w-6 h-6" />;
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="text-gray-400">
          {getCardBrandIcon(paymentMethod.card.brand)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-white">
              {paymentMethod.card.brand.toUpperCase()} •••• {paymentMethod.card.last4}
            </p>
            {paymentMethod.isDefault && (
              <span className="bg-green-900/30 text-green-400 text-xs px-2 py-1 rounded border border-green-500/50">
                Default
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">
            Expires {paymentMethod.card.expMonth}/{paymentMethod.card.expYear}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!paymentMethod.isDefault && onSetDefault && (
          <button
            onClick={() => onSetDefault(paymentMethod.id)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
            title="Set as default"
          >
            <Check className="w-5 h-5" />
          </button>
        )}
        {onRemove && (
          <button
            onClick={() => onRemove(paymentMethod.id)}
            className="p-2 hover:bg-red-900/30 rounded-lg transition-colors text-gray-400 hover:text-red-400"
            title="Remove payment method"
            disabled={paymentMethod.isDefault}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default PaymentMethodCard;
