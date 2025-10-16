/**
 * Dashboard Layout Component
 * Provides consistent layout with sidebar navigation
 */
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  Activity,
  BarChart3,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useDashboardStore } from '../../stores/dashboardStore';

const navItems = [
  {
    to: '/dashboard',
    icon: LayoutDashboard,
    label: 'Overview',
    end: true,
  },
  {
    to: '/dashboard/insights',
    icon: TrendingUp,
    label: 'Insights',
  },
  {
    to: '/dashboard/revenue',
    icon: DollarSign,
    label: 'Revenue',
  },
  {
    to: '/dashboard/usage',
    icon: Activity,
    label: 'Usage',
  },
  {
    to: '/dashboard/analytics',
    icon: BarChart3,
    label: 'Analytics',
  },
];

export const DashboardLayout: React.FC = () => {
  const { loading, refreshDashboard, connectionStatus, lastUpdated } = useDashboardStore();

  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Never';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-gray-400 mt-1">Business Dashboard</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer with connection status */}
        <div className="p-4 border-t border-gray-700 space-y-3">
          <button
            onClick={refreshDashboard}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh</span>
          </button>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
              {connectionStatus === 'connected' ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-gray-500" />
              )}
              <span>
                {connectionStatus === 'connected' ? 'Live' : 'Offline'}
              </span>
            </div>
            <span>Updated {formatLastUpdated()}</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};
