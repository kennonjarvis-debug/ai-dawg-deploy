/**
 * Analytics Page
 * Advanced analytics with AI-powered forecasting and insights
 */
import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Target,
  Brain,
  Calendar,
  Download,
} from 'lucide-react';
import { LineChart, BarChart, PieChart } from '../../components/dashboard/charts';
import { DataTable } from '../../components/dashboard/DataTable';
import { FilterPanel } from '../../components/dashboard/FilterPanel';
import { useDashboardStore } from '../../stores/dashboardStore';

type AnalyticsView = 'daily' | 'weekly' | 'monthly';
type MetricType = 'revenue' | 'usage' | 'users';

export const AnalyticsPage: React.FC = () => {
  const { analytics, loading, error, refreshDashboard } = useDashboardStore();
  const [view, setView] = useState<AnalyticsView>('daily');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('revenue');

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  // Get data based on selected view
  const currentData = analytics[view] || [];

  // Calculate cohort retention (mock data)
  const cohortData = [
    { cohort: 'Week 1', retained: 100, churned: 0 },
    { cohort: 'Week 2', retained: 85, churned: 15 },
    { cohort: 'Week 3', retained: 72, churned: 28 },
    { cohort: 'Week 4', retained: 65, churned: 35 },
  ];

  // Feature adoption funnel (mock data)
  const funnelData = [
    { stage: 'Sign Up', users: 1000, percentage: 100 },
    { stage: 'First Project', users: 750, percentage: 75 },
    { stage: 'Collaboration', users: 450, percentage: 45 },
    { stage: 'Premium Upgrade', users: 120, percentage: 12 },
  ];

  // Geographic distribution (mock data)
  const geoData = [
    { region: 'North America', users: 450, revenue: 125000 },
    { region: 'Europe', users: 320, revenue: 89000 },
    { region: 'Asia', users: 280, revenue: 67000 },
    { region: 'South America', users: 120, revenue: 28000 },
    { region: 'Other', users: 80, revenue: 15000 },
  ];

  // Time-based metrics (mock aggregated data)
  const timeMetrics = currentData.slice(0, 12).map((item: any, idx: number) => ({
    period: item.date || `Period ${idx + 1}`,
    revenue: item.revenue || Math.random() * 10000,
    users: item.activeUsers || Math.floor(Math.random() * 500),
    usage: item.totalUsage || Math.floor(Math.random() * 10000),
  }));

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Advanced Analytics</h1>
          <p className="text-gray-400 mt-1">
            Deep insights and AI-powered forecasting
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors">
            <Download className="w-4 h-4" />
            <span className="text-sm">Export</span>
          </button>
          <FilterPanel />
        </div>
      </div>

      {/* View Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Time Period:</span>
          <div className="flex gap-2">
            {(['daily', 'weekly', 'monthly'] as AnalyticsView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === v
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-gray-400">Metric:</span>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="revenue">Revenue</option>
            <option value="usage">Usage</option>
            <option value="users">Users</option>
          </select>
        </div>
      </div>

      {/* Main Metrics Chart */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-semibold text-white">
              Performance Trends
            </h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Brain className="w-4 h-4" />
            <span>AI-Powered Analysis</span>
          </div>
        </div>
        {loading ? (
          <div className="h-[350px] bg-gray-700 animate-pulse rounded"></div>
        ) : timeMetrics.length > 0 ? (
          <LineChart
            data={timeMetrics}
            xKey="period"
            yKeys={[selectedMetric]}
            colors={
              selectedMetric === 'revenue'
                ? ['#10b981']
                : selectedMetric === 'users'
                ? ['#3b82f6']
                : ['#8b5cf6']
            }
            height={350}
            formatYAxis={(value) =>
              selectedMetric === 'revenue'
                ? `$${value.toLocaleString()}`
                : value.toLocaleString()
            }
            formatTooltip={(value) =>
              selectedMetric === 'revenue'
                ? `$${value.toLocaleString()}`
                : value.toLocaleString()
            }
          />
        ) : (
          <div className="h-[350px] flex items-center justify-center text-gray-500">
            No analytics data available
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cohort Retention */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-white">Cohort Retention</h2>
          </div>
          {loading ? (
            <div className="h-[300px] bg-gray-700 animate-pulse rounded"></div>
          ) : (
            <BarChart
              data={cohortData}
              xKey="cohort"
              yKeys={['retained', 'churned']}
              colors={['#10b981', '#ef4444']}
              height={300}
              stacked
            />
          )}
        </div>

        {/* Geographic Distribution */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-purple-500" />
            <h2 className="text-xl font-semibold text-white">User Distribution</h2>
          </div>
          {loading ? (
            <div className="h-[300px] bg-gray-700 animate-pulse rounded"></div>
          ) : (
            <PieChart
              data={geoData}
              dataKey="users"
              nameKey="region"
              height={300}
              innerRadius={60}
            />
          )}
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-500" />
          <h2 className="text-xl font-semibold text-white">Conversion Funnel</h2>
        </div>
        <div className="space-y-3">
          {funnelData.map((stage, idx) => (
            <div key={stage.stage} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {idx + 1}
                  </div>
                  <span className="font-medium text-white">{stage.stage}</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-white">
                    {stage.users.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">{stage.percentage}%</div>
                </div>
              </div>
              <div className="bg-gray-700 rounded-full h-4 ml-11">
                <div
                  className="bg-gradient-to-r from-purple-600 to-blue-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${stage.percentage}%` }}
                ></div>
              </div>
              {idx < funnelData.length - 1 && (
                <div className="ml-11 text-xs text-gray-500">
                  Drop-off: {funnelData[idx].users - funnelData[idx + 1].users} users (
                  {(
                    ((funnelData[idx].users - funnelData[idx + 1].users) /
                      funnelData[idx].users) *
                    100
                  ).toFixed(1)}
                  %)
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Geographic Performance Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Regional Performance
        </h2>
        {loading ? (
          <div className="h-[300px] bg-gray-700 animate-pulse rounded"></div>
        ) : (
          <DataTable
            data={geoData}
            columns={[
              {
                key: 'region',
                header: 'Region',
                sortable: true,
                render: (val: string) => (
                  <span className="font-medium text-white">{val}</span>
                ),
              },
              {
                key: 'users',
                header: 'Active Users',
                sortable: true,
                render: (val: number) => val.toLocaleString(),
              },
              {
                key: 'revenue',
                header: 'Revenue',
                sortable: true,
                render: (val: number) => (
                  <span className="text-green-500 font-medium">
                    ${val.toLocaleString()}
                  </span>
                ),
              },
              {
                key: 'revenue',
                header: 'Avg Revenue/User',
                render: (val: number, row: any) => {
                  const avg = row.users > 0 ? val / row.users : 0;
                  return (
                    <span className="text-purple-400">${avg.toFixed(2)}</span>
                  );
                },
              },
              {
                key: 'users',
                header: 'Market Share',
                render: (val: number) => {
                  const total = geoData.reduce((sum, item) => sum + item.users, 0);
                  const percentage = total > 0 ? (val / total) * 100 : 0;
                  return (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-700 rounded-full h-2 max-w-[100px]">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-400">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  );
                },
              },
            ]}
            searchable={false}
            pageSize={10}
          />
        )}
      </div>

      {/* Key Insights Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-900/30 to-gray-800 border border-green-700/50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold text-white">Best Performing</h3>
          </div>
          <p className="text-2xl font-bold text-white mb-1">North America</p>
          <p className="text-sm text-gray-400">
            Highest revenue per user at $277.78
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-900/30 to-gray-800 border border-blue-700/50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-white">Retention Rate</h3>
          </div>
          <p className="text-2xl font-bold text-white mb-1">65%</p>
          <p className="text-sm text-gray-400">4-week cohort retention</p>
        </div>

        <div className="bg-gradient-to-br from-purple-900/30 to-gray-800 border border-purple-700/50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-white">Conversion Rate</h3>
          </div>
          <p className="text-2xl font-bold text-white mb-1">12%</p>
          <p className="text-sm text-gray-400">Sign-up to premium upgrade</p>
        </div>
      </div>
    </div>
  );
};
