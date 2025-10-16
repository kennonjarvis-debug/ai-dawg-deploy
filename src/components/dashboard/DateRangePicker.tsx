/**
 * Date Range Picker Component
 * Allows users to select date ranges for filtering
 */
import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  presets?: Array<{
    label: string;
    getValue: () => DateRange;
  }>;
}

const defaultPresets = [
  {
    label: 'Last 7 days',
    getValue: () => ({
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date(),
    }),
  },
  {
    label: 'Last 30 days',
    getValue: () => ({
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
    }),
  },
  {
    label: 'Last 90 days',
    getValue: () => ({
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      end: new Date(),
    }),
  },
  {
    label: 'This year',
    getValue: () => ({
      start: new Date(new Date().getFullYear(), 0, 1),
      end: new Date(),
    }),
  },
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  presets = defaultPresets,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handlePresetClick = (preset: typeof presets[0]) => {
    onChange(preset.getValue());
    setIsOpen(false);
  };

  const formatDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors"
      >
        <Calendar className="w-4 h-4 text-gray-400" />
        <span className="text-sm">
          {formatDate(value.start)} - {formatDate(value.end)}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-300 mb-3">
                Select Date Range
              </div>

              {/* Presets */}
              <div className="space-y-1">
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetClick(preset)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom range inputs */}
              <div className="pt-3 border-t border-gray-700 space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={format(value.start, 'yyyy-MM-dd')}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      onChange({ ...value, start: newDate });
                    }}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={format(value.end, 'yyyy-MM-dd')}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      onChange({ ...value, end: newDate });
                    }}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-full mt-3 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                Apply
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
