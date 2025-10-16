/**
 * Dashboard Overview Page
 * Main landing page showing key business metrics and trends
 */
import React, { useEffect } from 'react';
import {
  DollarSign,
  Users,
  TrendingUp,
  Activity,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { LineChart, BarChart } from '../../components/dashboard/charts';
import { DataTable } from '../../components/dashboard/DataTable';
import { FilterPanel } from '../../components/dashboard/FilterPanel';
import { useDashboardStore } from '../../stores/dashboardStore';

export const DashboardOverview: React.FC = () => {
  const {
    revenue,
    usage,
    insights,
    loading,
    error,
    refreshDashboard,
  } = useDashboardStore();

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  // Calculate summary metrics from data
  const totalRevenue = revenue.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const totalUsers = usage.reduce((sum, item) => sum + (item.activeUsers || 0), 0);
  const avgRevenue = revenue.length > 0 ? totalRevenue / revenue.length : 0;

  // Mock trend calculations (in production, these would come from backend)
  const revenueTrend = revenue.length > 1
    ? ((revenue[revenue.length - 1]?.revenue || 0) - (revenue[0]?.revenue || 0)) / (revenue[0]?.revenue || 1) * 100
    : 0;

  // Top features by usage
  const topFeatures = usage
    .sort((a, b) => (b.totalUsage || 0) - (a.totalUsage || 0))
    .slice(0, 5);

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <div>
            <h3 className="text-lg font-semibold text-red-500">Error Loading Dashboard</h3>
            <p className="text-gray-400 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-gray-400 mt-1">
            Real-time business analytics and insights
          </p>
        </div>
        <FilterPanel />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          subtitle="All time"
          trend={{
            direction: revenueTrend > 0 ? 'up' : revenueTrend < 0 ? 'down' : 'neutral',
            value: `${Math.abs(revenueTrend).toFixed(1)}%`,
          }}
          icon={DollarSign}
          iconColor="text-green-500"
          loading={loading}
        />
        <MetricCard
          title="Active Users"
          value={totalUsers.toLocaleString()}
          subtitle="This period"
          icon={Users}
          iconColor="text-blue-500"
          loading={loading}
        />
        <MetricCard
          title="Avg Revenue"
          value={`$${avgRevenue.toFixed(2)}`}
          subtitle="Per day"
          icon={TrendingUp}
          iconColor="text-purple-500"
          loading={loading}
        />
        <MetricCard
          title="Total Usage"
          value={usage.reduce((sum, item) => sum + (item.totalUsage || 0), 0).toLocaleString()}
          subtitle="Feature interactions"
          icon={Activity}
          iconColor="text-orange-500"
          loading={loading}
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Revenue Trend</h2>
        {loading ? (
          <div className="h-[300px] bg-gray-700 animate-pulse rounded"></div>
        ) : revenue.length > 0 ? (
          <LineChart
            data={revenue}
            xKey="date"
            yKeys={['revenue']}
            colors={['#10b981']}
            height={300}
            formatYAxis={(value) => `$${value.toLocaleString()}`}
            formatTooltip={(value) => `$${value.toLocaleString()}`}
          />
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No revenue data available
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Distribution */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Subscription Plans</h2>
          {loading ? (
            <div className="h-[250px] bg-gray-700 animate-pulse rounded"></div>
          ) : revenue.length > 0 ? (
            <BarChart
              data={revenue.slice(-7)}
              xKey="date"
              yKeys={['subscriptions']}
              colors={['#8b5cf6']}
              height={250}
            />
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500">
              No subscription data available
            </div>
          )}
        </div>

        {/* Recent Insights */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Insights</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-700 animate-pulse rounded"></div>
              ))}
            </div>
          ) : insights.length > 0 ? (
            <div className="space-y-3 max-h-[250px] overflow-y-auto">
              {insights.slice(0, 3).map((insight) => (
                <div
                  key={insight.id}
                  className="bg-gray-900 border border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-purple-500 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-white">
                        {insight.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        {insight.description}
                      </p>
                      {insight.value && (
                        <span className="text-sm text-green-500 font-medium mt-2 inline-block">
                          {insight.value}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500">
              No insights available
            </div>
          )}
        </div>
      </div>

      {/* Top Features Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Top Features by Usage</h2>
        {loading ? (
          <div className="h-[200px] bg-gray-700 animate-pulse rounded"></div>
        ) : topFeatures.length > 0 ? (
          <DataTable
            data={topFeatures}
            columns={[
              {
                key: 'featureKey',
                header: 'Feature',
                sortable: true,
              },
              {
                key: 'totalUsage',
                header: 'Total Usage',
                sortable: true,
                render: (val: number) => val.toLocaleString(),
              },
              {
                key: 'activeUsers',
                header: 'Active Users',
                sortable: true,
                render: (val: number) => val.toLocaleString(),
              },
              {
                key: 'plan',
                header: 'Plan',
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
            ]}
            searchable={false}
            pageSize={5}
          />
        ) : (
          <div className="h-[200px] flex items-center justify-center text-gray-500">
            No usage data available
          </div>
        )}
      </div>
    </div>
  );
};
