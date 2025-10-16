/**
 * Pie Chart Component
 * Wrapper around Recharts PieChart with custom styling
 */
import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';

interface PieChartProps {
  data: any[];
  dataKey: string;
  nameKey: string;
  colors?: string[];
  height?: number;
  showLegend?: boolean;
  innerRadius?: number; // For donut chart
  formatTooltip?: (value: number) => string;
}

const defaultColors = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

const CustomTooltip = ({ active, payload, formatTooltip }: TooltipProps<any, any> & { formatTooltip?: (value: number) => string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: payload[0].payload.fill }}
          />
          <span className="text-gray-400 text-sm">{payload[0].name}:</span>
          <span className="text-white font-medium">
            {formatTooltip ? formatTooltip(payload[0].value) : payload[0].value}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

const renderLabel = (entry: any) => {
  const percent = ((entry.value / entry.payload.totalValue) * 100).toFixed(0);
  return `${entry.name} (${percent}%)`;
};

export const PieChart: React.FC<PieChartProps> = ({
  data,
  dataKey,
  nameKey,
  colors = defaultColors,
  height = 300,
  showLegend = true,
  innerRadius = 0,
  formatTooltip,
}) => {
  // Calculate total for percentage display
  const totalValue = data.reduce((sum, entry) => sum + entry[dataKey], 0);
  const dataWithTotal = data.map(entry => ({ ...entry, totalValue }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={dataWithTotal}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderLabel}
          outerRadius={80}
          innerRadius={innerRadius}
          dataKey={dataKey}
          nameKey={nameKey}
        >
          {dataWithTotal.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip formatTooltip={formatTooltip} />} />
        {showLegend && (
          <Legend
            wrapperStyle={{ color: '#9ca3af', fontSize: 12 }}
            iconType="circle"
          />
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};
