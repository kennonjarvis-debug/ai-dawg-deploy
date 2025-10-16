/**
 * Filter Panel Component
 * Provides filtering controls for dashboard data
 */
import React from 'react';
import { Filter, X } from 'lucide-react';
import { DateRangePicker } from './DateRangePicker';
import { useDashboardStore } from '../../stores/dashboardStore';

interface FilterOption {
  value: string;
  label: string;
}

const planOptions: FilterOption[] = [
  { value: 'ALL', label: 'All Plans' },
  { value: 'FREE', label: 'Free' },
  { value: 'PRO', label: 'Pro' },
  { value: 'STUDIO', label: 'Studio' },
];

export const FilterPanel: React.FC = () => {
  const { filters, setFilters } = useDashboardStore();
  const [isOpen, setIsOpen] = React.useState(false);

  const hasActiveFilters = filters.plan !== 'ALL';

  const clearFilters = () => {
    setFilters({
      plan: 'ALL',
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      },
    });
  };

  return (
    <div className="flex items-center gap-3">
      <DateRangePicker
        value={filters.dateRange}
        onChange={(dateRange) => setFilters({ dateRange })}
      />

      {/* Plan Filter */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors"
        >
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm">
            {planOptions.find((opt) => opt.value === filters.plan)?.label || 'All Plans'}
          </span>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 z-20 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-2">
              {planOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setFilters({ plan: option.value as any });
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors ${
                    filters.plan === option.value
                      ? 'text-purple-400 bg-gray-700/50'
                      : 'text-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
          <span>Clear</span>
        </button>
      )}
    </div>
  );
};
