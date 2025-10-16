/**
 * Bar Chart Component
 * Wrapper around Recharts BarChart with custom styling
 */
import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';

interface BarChartProps {
  data: any[];
  xKey: string;
  yKeys: string[];
  colors?: string[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  stacked?: boolean;
  formatYAxis?: (value: number) => string;
  formatTooltip?: (value: number) => string;
}

const defaultColors = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

const CustomTooltip = ({ active, payload, label, formatTooltip }: TooltipProps<any, any> & { formatTooltip?: (value: number) => string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
        <p className="text-gray-300 text-sm mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-400 text-sm">{entry.name}:</span>
            <span className="text-white font-medium">
              {formatTooltip ? formatTooltip(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const BarChart: React.FC<BarChartProps> = ({
  data,
  xKey,
  yKeys,
  colors = defaultColors,
  height = 300,
  showGrid = true,
  showLegend = true,
  stacked = false,
  formatYAxis,
  formatTooltip,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data}>
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        )}
        <XAxis
          dataKey={xKey}
          stroke="#9ca3af"
          tick={{ fill: '#9ca3af', fontSize: 12 }}
        />
        <YAxis
          stroke="#9ca3af"
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          tickFormatter={formatYAxis}
        />
        <Tooltip content={<CustomTooltip formatTooltip={formatTooltip} />} />
        {showLegend && (
          <Legend
            wrapperStyle={{ color: '#9ca3af', fontSize: 12 }}
            iconType="square"
          />
        )}
        {yKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            fill={colors[index % colors.length]}
            stackId={stacked ? 'stack' : undefined}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};
