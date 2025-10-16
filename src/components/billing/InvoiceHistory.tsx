/**
 * Invoice History Component
 * Displays billing history and downloadable invoices
 */

import React from 'react';
import { FileText, Download, Calendar, DollarSign } from 'lucide-react';
import { Invoice } from '../../types/billing';

interface InvoiceHistoryProps {
  invoices: Invoice[];
}

export const InvoiceHistory: React.FC<InvoiceHistoryProps> = ({ invoices }) => {
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100); // Stripe amounts are in cents
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const styles = {
      paid: 'bg-green-900/30 text-green-400 border-green-500/50',
      open: 'bg-yellow-900/30 text-yellow-400 border-yellow-500/50',
      void: 'bg-gray-700 text-gray-400 border-gray-600',
      uncollectible: 'bg-red-900/30 text-red-400 border-red-500/50',
    };

    return (
      <span
        className={`px-2 py-1 text-xs rounded border ${styles[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">No invoices yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {invoices.map((invoice) => (
        <div
          key={invoice.id}
          className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between hover:bg-gray-750 transition-colors"
        >
          <div className="flex items-center gap-4 flex-1">
            <FileText className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-white">
                  {formatAmount(invoice.amount, invoice.currency)}
                </p>
                {getStatusBadge(invoice.status)}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(invoice.createdAt)}
                </span>
                {invoice.paidAt && (
                  <span className="text-green-400">
                    Paid on {formatDate(invoice.paidAt)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {invoice.invoiceUrl && invoice.status === 'paid' && (
            <a
              href={invoice.invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
              title="Download invoice"
            >
              <Download className="w-5 h-5" />
            </a>
          )}
        </div>
      ))}
    </div>
  );
};

export default InvoiceHistory;
