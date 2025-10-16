/**
 * Usage Page
 * Feature usage metrics and user activity analytics
 */
import React, { useEffect, useState } from 'react';
import {
  Activity,
  Users,
  Zap,
  TrendingUp,
  BarChart3,
  Calendar,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { BarChart, LineChart } from '../../components/dashboard/charts';
import { DataTable } from '../../components/dashboard/DataTable';
import { FilterPanel } from '../../components/dashboard/FilterPanel';
import { useDashboardStore } from '../../stores/dashboardStore';

export const UsagePage: React.FC = () => {
  const { usage, loading, error, refreshDashboard, filters } = useDashboardStore();
  const [sortBy, setSortBy] = useState<'usage' | 'users' | 'growth'>('usage');

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  // Calculate metrics
  const totalUsage = usage.reduce((sum, item) => sum + (item.totalUsage || 0), 0);
  const totalActiveUsers = usage.reduce((sum, item) => sum + (item.activeUsers || 0), 0);
  const uniqueFeatures = new Set(usage.map((item) => item.featureKey)).size;

  // Average usage per user
  const avgUsagePerUser = totalActiveUsers > 0 ? totalUsage / totalActiveUsers : 0;

  // Calculate growth (mock - would use historical data in production)
  const growthRate = 12.5; // Mock growth rate

  // Top features
  const topFeatures = [...usage]
    .sort((a, b) => {
      if (sortBy === 'usage') {
        return (b.totalUsage || 0) - (a.totalUsage || 0);
      } else if (sortBy === 'users') {
        return (b.activeUsers || 0) - (a.activeUsers || 0);
      }
      // growth sort - mock calculation
      return 0;
    })
    .slice(0, 10);

  // Usage by plan
  const usageByPlan = usage.reduce(
    (acc, item) => {
      const plan = item.plan || 'FREE';
      acc[plan] = (acc[plan] || 0) + (item.totalUsage || 0);
      return acc;
    },
    {} as Record<string, number>
  );

  const planData = Object.entries(usageByPlan).map(([plan, usage]) => ({
    plan,
    usage,
  }));

  // Time series data (mock - would aggregate usage data by date)
  const timeSeriesData = usage.slice(0, 30).map((item, idx) => ({
    date: new Date(Date.now() - (29 - idx) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    usage: item.totalUsage || 0,
    users: item.activeUsers || 0,
  }));

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Feature Usage</h1>
          <p className="text-gray-400 mt-1">
            Track how users interact with your platform features
          </p>
        </div>
        <FilterPanel />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Usage"
          value={totalUsage.toLocaleString()}
          subtitle="All features"
          trend={{
            direction: 'up',
            value: `+${growthRate}%`,
          }}
          icon={Activity}
          iconColor="text-blue-500"
          loading={loading}
        />
        <MetricCard
          title="Active Users"
          value={totalActiveUsers.toLocaleString()}
          subtitle="This period"
          icon={Users}
          iconColor="text-green-500"
          loading={loading}
        />
        <MetricCard
          title="Avg Usage/User"
          value={avgUsagePerUser.toFixed(1)}
          subtitle="Per active user"
          icon={Zap}
          iconColor="text-yellow-500"
          loading={loading}
        />
        <MetricCard
          title="Active Features"
          value={uniqueFeatures.toString()}
          subtitle="Features in use"
          icon={BarChart3}
          iconColor="text-purple-500"
          loading={loading}
        />
      </div>

      {/* Usage Trend */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Usage Trend</h2>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400">Last 30 days</span>
          </div>
        </div>
        {loading ? (
          <div className="h-[300px] bg-gray-700 animate-pulse rounded"></div>
        ) : timeSeriesData.length > 0 ? (
          <LineChart
            data={timeSeriesData}
            xKey="date"
            yKeys={['usage', 'users']}
            colors={['#3b82f6', '#10b981']}
            height={300}
            formatYAxis={(value) => value.toLocaleString()}
          />
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No usage trend data available
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage by Plan */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Usage by Plan</h2>
          {loading ? (
            <div className="h-[300px] bg-gray-700 animate-pulse rounded"></div>
          ) : planData.length > 0 ? (
            <BarChart
              data={planData}
              xKey="plan"
              yKeys={['usage']}
              colors={['#8b5cf6']}
              height={300}
              formatYAxis={(value) => value.toLocaleString()}
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No plan data available
            </div>
          )}
        </div>

        {/* Plan Distribution */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Plan Usage Distribution</h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-700 animate-pulse rounded"></div>
              ))}
            </div>
          ) : planData.length > 0 ? (
            <div className="space-y-4">
              {planData.map((item) => {
                const percentage = totalUsage > 0 ? (item.usage / totalUsage) * 100 : 0;
                return (
                  <div key={item.plan} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-white">{item.plan}</span>
                      <span className="text-gray-400">
                        {item.usage.toLocaleString()} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="bg-gray-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          item.plan === 'FREE'
                            ? 'bg-gray-500'
                            : item.plan === 'PRO'
                            ? 'bg-purple-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No distribution data available
            </div>
          )}
        </div>
      </div>

      {/* Top Features Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Feature Usage Details</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="usage">Total Usage</option>
              <option value="users">Active Users</option>
              <option value="growth">Growth</option>
            </select>
          </div>
        </div>
        {loading ? (
          <div className="h-[400px] bg-gray-700 animate-pulse rounded"></div>
        ) : topFeatures.length > 0 ? (
          <DataTable
            data={topFeatures}
            columns={[
              {
                key: 'featureKey',
                header: 'Feature',
                sortable: true,
                render: (val: string) => (
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-500" />
                    <span className="font-medium text-white">{val}</span>
                  </div>
                ),
              },
              {
                key: 'totalUsage',
                header: 'Total Usage',
                sortable: true,
                render: (val: number) => (
                  <span className="font-semibold text-blue-500">
                    {val.toLocaleString()}
                  </span>
                ),
              },
              {
                key: 'activeUsers',
                header: 'Active Users',
                sortable: true,
                render: (val: number) => val.toLocaleString(),
              },
              {
                key: 'totalUsage',
                header: 'Avg Usage/User',
                render: (val: number, row: any) => {
                  const avg = row.activeUsers > 0 ? val / row.activeUsers : 0;
                  return (
                    <span className="text-gray-300">
                      {avg.toFixed(1)}
                    </span>
                  );
                },
              },
              {
                key: 'plan',
                header: 'Primary Plan',
                render: (val: string) => (
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      val === 'FREE'
                        ? 'bg-gray-700 text-gray-300'
                        : val === 'PRO'
                        ? 'bg-purple-900/30 text-purple-400'
                        : 'bg-blue-900/30 text-blue-400'
                    }`}
                  >
                    {val}
                  </span>
                ),
              },
              {
                key: 'totalUsage',
                header: 'Trend',
                render: () => {
                  // Mock trend - in production would calculate from historical data
                  const trend = Math.random() > 0.5 ? 'up' : 'down';
                  const value = (Math.random() * 20).toFixed(1);
                  return (
                    <div
                      className={`flex items-center gap-1 ${
                        trend === 'up' ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {trend === 'up' ? (
                        <ArrowUp className="w-4 h-4" />
                      ) : (
                        <ArrowDown className="w-4 h-4" />
                      )}
                      <span className="text-sm">{value}%</span>
                    </div>
                  );
                },
              },
            ]}
            searchable
            searchKeys={['featureKey']}
            pageSize={10}
          />
        ) : (
          <div className="h-[400px] flex items-center justify-center text-gray-500">
            No feature usage data available
          </div>
        )}
      </div>
    </div>
  );
};
