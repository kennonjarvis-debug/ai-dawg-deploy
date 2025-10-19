/**
 * Cost Monitoring Dashboard
 * Comprehensive UI for tracking OpenAI API usage and costs
 */

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface BudgetStatus {
  dailyLimit: number | null;
  monthlyLimit: number | null;
  dailySpent: number;
  monthlySpent: number;
  dailyRemaining: number | null;
  monthlyRemaining: number | null;
  dailyPercentage: number | null;
  monthlyPercentage: number | null;
  isOverDailyBudget: boolean;
  isOverMonthlyBudget: boolean;
  alertThreshold: number;
  pauseOnExceed: boolean;
}

interface CostSummary {
  totalCost: number;
  byService: Record<string, number>;
  byOperation: Record<string, number>;
  count: number;
}

interface Alert {
  id: string;
  type: string;
  message: string;
  severity: string;
  currentSpent: number;
  budgetLimit: number | null;
  percentage: number | null;
  isRead: boolean;
  createdAt: string;
}

interface DashboardData {
  budgetStatus: BudgetStatus;
  summary: {
    today: CostSummary;
    week: CostSummary;
    month: CostSummary;
  };
  trends: Array<{ date: string; cost: number }>;
  breakdown: Array<{ service: string; cost: number; count: number; percentage: number }>;
  alerts: Alert[];
}

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3001';

// Color palette for charts
const COLORS = {
  whisper: '#8B5CF6',
  'gpt-4o': '#3B82F6',
  'tts-1-hd': '#10B981',
  'realtime-api': '#F59E0B',
};

export default function CostMonitoringDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBudgetSettings, setShowBudgetSettings] = useState(false);
  const [budgetForm, setBudgetForm] = useState({
    dailyLimit: '',
    monthlyLimit: '',
    alertThreshold: '0.8',
    alertsEnabled: true,
    pauseOnExceed: false,
  });

  // Fetch dashboard data
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual user ID from auth context
      const userId = 'demo-user';

      const response = await fetch(`${API_BASE_URL}/api/cost-monitoring/dashboard`, {
        headers: {
          'X-User-Id': userId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const result = await response.json();
      setData(result);

      // Update budget form with current values
      if (result.budgetStatus) {
        setBudgetForm({
          dailyLimit: result.budgetStatus.dailyLimit?.toString() || '',
          monthlyLimit: result.budgetStatus.monthlyLimit?.toString() || '',
          alertThreshold: result.budgetStatus.alertThreshold.toString(),
          alertsEnabled: true,
          pauseOnExceed: result.budgetStatus.pauseOnExceed,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Update budget settings
  const updateBudget = async () => {
    try {
      const userId = 'demo-user';

      const response = await fetch(`${API_BASE_URL}/api/cost-monitoring/budget`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({
          dailyLimit: budgetForm.dailyLimit ? parseFloat(budgetForm.dailyLimit) : null,
          monthlyLimit: budgetForm.monthlyLimit ? parseFloat(budgetForm.monthlyLimit) : null,
          alertThreshold: parseFloat(budgetForm.alertThreshold),
          alertsEnabled: budgetForm.alertsEnabled,
          pauseOnExceed: budgetForm.pauseOnExceed,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update budget');
      }

      // Refresh dashboard
      await fetchDashboard();
      setShowBudgetSettings(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update budget');
    }
  };

  // Mark alert as read
  const markAlertRead = async (alertId: string) => {
    try {
      const userId = 'demo-user';

      await fetch(`${API_BASE_URL}/api/cost-monitoring/alerts/${alertId}/read`, {
        method: 'PUT',
        headers: {
          'X-User-Id': userId,
        },
      });

      // Refresh dashboard
      await fetchDashboard();
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  useEffect(() => {
    fetchDashboard();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cost monitoring dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">Error Loading Dashboard</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchDashboard}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cost Monitoring Dashboard</h1>
          <p className="text-gray-600">Track your OpenAI API usage and costs in real-time</p>
        </div>

        {/* Alerts */}
        {data.alerts.length > 0 && (
          <div className="mb-6">
            {data.alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg mb-3 ${
                  alert.severity === 'critical'
                    ? 'bg-red-50 border border-red-200'
                    : alert.severity === 'warning'
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-blue-50 border border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4
                      className={`font-semibold mb-1 ${
                        alert.severity === 'critical'
                          ? 'text-red-800'
                          : alert.severity === 'warning'
                          ? 'text-yellow-800'
                          : 'text-blue-800'
                      }`}
                    >
                      {alert.type === 'budget_exceeded' ? 'Budget Exceeded!' : 'Budget Alert'}
                    </h4>
                    <p
                      className={`text-sm ${
                        alert.severity === 'critical'
                          ? 'text-red-600'
                          : alert.severity === 'warning'
                          ? 'text-yellow-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {alert.message}
                    </p>
                  </div>
                  <button
                    onClick={() => markAlertRead(alert.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Budget Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Today */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Today</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              ${data.summary.today.totalCost.toFixed(4)}
            </p>
            <p className="text-sm text-gray-600">{data.summary.today.count} API calls</p>
            {data.budgetStatus.dailyLimit && (
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">Daily Budget</span>
                  <span className="font-medium">
                    ${data.budgetStatus.dailySpent.toFixed(2)} / ${data.budgetStatus.dailyLimit.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      data.budgetStatus.isOverDailyBudget
                        ? 'bg-red-600'
                        : (data.budgetStatus.dailyPercentage || 0) >= 80
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(data.budgetStatus.dailyPercentage || 0, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* This Week */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">This Week</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              ${data.summary.week.totalCost.toFixed(4)}
            </p>
            <p className="text-sm text-gray-600">{data.summary.week.count} API calls</p>
          </div>

          {/* This Month */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">This Month</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              ${data.summary.month.totalCost.toFixed(4)}
            </p>
            <p className="text-sm text-gray-600">{data.summary.month.count} API calls</p>
            {data.budgetStatus.monthlyLimit && (
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">Monthly Budget</span>
                  <span className="font-medium">
                    ${data.budgetStatus.monthlySpent.toFixed(2)} / $
                    {data.budgetStatus.monthlyLimit.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      data.budgetStatus.isOverMonthlyBudget
                        ? 'bg-red-600'
                        : (data.budgetStatus.monthlyPercentage || 0) >= 80
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(data.budgetStatus.monthlyPercentage || 0, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Spending Trends */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending Trends (30 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: any) => `$${value.toFixed(4)}`} />
                <Legend />
                <Line type="monotone" dataKey="cost" stroke="#3B82F6" strokeWidth={2} name="Daily Cost" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Service Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost by Service (This Month)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.breakdown}
                  dataKey="cost"
                  nameKey="service"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.service}: $${entry.cost.toFixed(4)}`}
                >
                  {data.breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.service as keyof typeof COLORS] || '#94A3B8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `$${value.toFixed(4)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Details Table */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Service Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    API Calls
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.breakdown.map((item) => (
                  <tr key={item.service}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-3"
                          style={{ backgroundColor: COLORS[item.service as keyof typeof COLORS] || '#94A3B8' }}
                        />
                        <span className="text-sm font-medium text-gray-900">{item.service}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${item.cost.toFixed(6)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.percentage.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Budget Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Budget Settings</h3>
            <button
              onClick={() => setShowBudgetSettings(!showBudgetSettings)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              {showBudgetSettings ? 'Cancel' : 'Edit Settings'}
            </button>
          </div>

          {showBudgetSettings ? (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Daily Budget Limit ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={budgetForm.dailyLimit}
                    onChange={(e) => setBudgetForm({ ...budgetForm, dailyLimit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="No limit"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Budget Limit ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={budgetForm.monthlyLimit}
                    onChange={(e) => setBudgetForm({ ...budgetForm, monthlyLimit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="No limit"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alert Threshold (0-1)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={budgetForm.alertThreshold}
                    onChange={(e) => setBudgetForm({ ...budgetForm, alertThreshold: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Alert when {(parseFloat(budgetForm.alertThreshold) * 100).toFixed(0)}% of budget is reached</p>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={budgetForm.pauseOnExceed}
                      onChange={(e) => setBudgetForm({ ...budgetForm, pauseOnExceed: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Pause services when budget exceeded</span>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowBudgetSettings(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={updateBudget}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Settings
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Daily Limit</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {data.budgetStatus.dailyLimit ? `$${data.budgetStatus.dailyLimit.toFixed(2)}` : 'No limit'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Monthly Limit</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {data.budgetStatus.monthlyLimit ? `$${data.budgetStatus.monthlyLimit.toFixed(2)}` : 'No limit'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Alert Threshold</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {(data.budgetStatus.alertThreshold * 100).toFixed(0)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pause on Exceed</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {data.budgetStatus.pauseOnExceed ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Last updated: {new Date().toLocaleString()}</p>
          <p className="mt-2">
            Pricing: Whisper $0.006/min | GPT-4o $2.50/$10 per 1M tokens | TTS-1-HD $0.030/1K chars | Realtime API
            $5/$20 per 1M tokens + $0.06/$0.24 per min audio
          </p>
        </div>
      </div>
    </div>
  );
}
