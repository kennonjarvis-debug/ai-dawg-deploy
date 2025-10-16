/**
 * Revenue Page
 * Detailed revenue analytics and subscription metrics
 */
import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { LineChart, BarChart, PieChart } from '../../components/dashboard/charts';
import { DataTable } from '../../components/dashboard/DataTable';
import { FilterPanel } from '../../components/dashboard/FilterPanel';
import { useDashboardStore } from '../../stores/dashboardStore';

type TimeGroup = 'daily' | 'weekly' | 'monthly';

export const RevenuePage: React.FC = () => {
  const { revenue, loading, error, refreshDashboard } = useDashboardStore();
  const [timeGroup, setTimeGroup] = useState<TimeGroup>('daily');

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  // Calculate metrics
  const totalRevenue = revenue.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const totalSubscriptions = revenue.reduce(
    (sum, item) => sum + (item.subscriptions || 0),
    0
  );
  const avgRevenuePerDay = revenue.length > 0 ? totalRevenue / revenue.length : 0;

  // Calculate growth
  const lastPeriodRevenue = revenue.slice(-7).reduce((sum, item) => sum + (item.revenue || 0), 0);
  const prevPeriodRevenue = revenue.slice(-14, -7).reduce((sum, item) => sum + (item.revenue || 0), 0);
  const growthRate = prevPeriodRevenue > 0
    ? ((lastPeriodRevenue - prevPeriodRevenue) / prevPeriodRevenue) * 100
    : 0;

  // Group revenue by plan (mock data - in production this would come from backend)
  const planDistribution = [
    { plan: 'FREE', revenue: totalRevenue * 0.05, users: Math.floor(totalSubscriptions * 0.6) },
    { plan: 'PRO', revenue: totalRevenue * 0.35, users: Math.floor(totalSubscriptions * 0.3) },
    { plan: 'ENTERPRISE', revenue: totalRevenue * 0.6, users: Math.floor(totalSubscriptions * 0.1) },
  ];

  // Recent transactions (mock - would come from API)
  const recentTransactions = revenue.slice(-10).map((item, idx) => ({
    id: `txn-${idx}`,
    date: item.date,
    amount: item.revenue,
    plan: ['PRO', 'ENTERPRISE', 'FREE'][idx % 3],
    status: 'completed' as const,
  }));

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Revenue Analytics</h1>
          <p className="text-gray-400 mt-1">
            Track revenue, subscriptions, and growth metrics
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
            direction: growthRate > 0 ? 'up' : growthRate < 0 ? 'down' : 'neutral',
            value: `${Math.abs(growthRate).toFixed(1)}%`,
          }}
          icon={DollarSign}
          iconColor="text-green-500"
          loading={loading}
        />
        <MetricCard
          title="Subscriptions"
          value={totalSubscriptions.toLocaleString()}
          subtitle="Active subscriptions"
          icon={CreditCard}
          iconColor="text-blue-500"
          loading={loading}
        />
        <MetricCard
          title="Avg Revenue/Day"
          value={`$${avgRevenuePerDay.toFixed(2)}`}
          subtitle="Daily average"
          icon={Calendar}
          iconColor="text-purple-500"
          loading={loading}
        />
        <MetricCard
          title="Growth Rate"
          value={`${Math.abs(growthRate).toFixed(1)}%`}
          subtitle="Last 7 days vs previous"
          trend={{
            direction: growthRate > 0 ? 'up' : growthRate < 0 ? 'down' : 'neutral',
            value: growthRate > 0 ? 'Growing' : 'Declining',
          }}
          icon={TrendingUp}
          iconColor="text-orange-500"
          loading={loading}
        />
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Revenue Trend</h2>
          <div className="flex gap-2">
            {(['daily', 'weekly', 'monthly'] as TimeGroup[]).map((group) => (
              <button
                key={group}
                onClick={() => setTimeGroup(group)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  timeGroup === group
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                {group.charAt(0).toUpperCase() + group.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="h-[350px] bg-gray-700 animate-pulse rounded"></div>
        ) : revenue.length > 0 ? (
          <LineChart
            data={revenue}
            xKey="date"
            yKeys={['revenue']}
            colors={['#10b981']}
            height={350}
            formatYAxis={(value) => `$${value.toLocaleString()}`}
            formatTooltip={(value) => `$${value.toLocaleString()}`}
          />
        ) : (
          <div className="h-[350px] flex items-center justify-center text-gray-500">
            No revenue data available
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Plan */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Revenue by Plan</h2>
          {loading ? (
            <div className="h-[300px] bg-gray-700 animate-pulse rounded"></div>
          ) : planDistribution.length > 0 ? (
            <PieChart
              data={planDistribution}
              dataKey="revenue"
              nameKey="plan"
              height={300}
              innerRadius={60}
              colors={['#6b7280', '#8b5cf6', '#3b82f6']}
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No plan data available
            </div>
          )}
        </div>

        {/* Subscriptions Growth */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Subscription Growth</h2>
          {loading ? (
            <div className="h-[300px] bg-gray-700 animate-pulse rounded"></div>
          ) : revenue.length > 0 ? (
            <BarChart
              data={revenue.slice(-12)}
              xKey="date"
              yKeys={['subscriptions']}
              colors={['#8b5cf6']}
              height={300}
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No subscription data available
            </div>
          )}
        </div>
      </div>

      {/* Plan Breakdown Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Plan Breakdown</h2>
        {loading ? (
          <div className="h-[200px] bg-gray-700 animate-pulse rounded"></div>
        ) : planDistribution.length > 0 ? (
          <DataTable
            data={planDistribution}
            columns={[
              {
                key: 'plan',
                header: 'Plan',
                sortable: true,
                render: (val: string) => (
                  <span className="font-semibold text-white">{val}</span>
                ),
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
                key: 'users',
                header: 'Active Users',
                sortable: true,
                render: (val: number) => val.toLocaleString(),
              },
              {
                key: 'revenue',
                header: 'Avg Revenue/User',
                render: (val: number, row: any) => {
                  const avg = row.users > 0 ? val / row.users : 0;
                  return (
                    <span className="text-purple-400">
                      ${avg.toFixed(2)}
                    </span>
                  );
                },
              },
              {
                key: 'revenue',
                header: 'Contribution',
                render: (val: number) => {
                  const percentage = totalRevenue > 0 ? (val / totalRevenue) * 100 : 0;
                  return (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
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
        ) : (
          <div className="h-[200px] flex items-center justify-center text-gray-500">
            No plan data available
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Recent Transactions</h2>
        {loading ? (
          <div className="h-[300px] bg-gray-700 animate-pulse rounded"></div>
        ) : recentTransactions.length > 0 ? (
          <DataTable
            data={recentTransactions}
            columns={[
              {
                key: 'id',
                header: 'Transaction ID',
                render: (val: string) => (
                  <span className="font-mono text-sm text-gray-400">{val}</span>
                ),
              },
              {
                key: 'date',
                header: 'Date',
                sortable: true,
                render: (val: string) => new Date(val).toLocaleDateString(),
              },
              {
                key: 'amount',
                header: 'Amount',
                sortable: true,
                render: (val: number) => (
                  <span className="font-semibold text-green-500">
                    ${val.toLocaleString()}
                  </span>
                ),
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
              {
                key: 'status',
                header: 'Status',
                render: (val: string) => (
                  <span className="flex items-center gap-1 text-green-500 text-sm">
                    <ArrowUpRight className="w-4 h-4" />
                    {val}
                  </span>
                ),
              },
            ]}
            searchable={false}
            pageSize={10}
          />
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No transactions available
          </div>
        )}
      </div>
    </div>
  );
};
