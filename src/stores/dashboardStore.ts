/**
 * Dashboard Store - Zustand State Management
 * Manages analytics data, filters, real-time updates
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { dashboardApi } from '../services/dashboardApi';

export interface MetricData {
  timestamp: string;
  value: number;
  label?: string;
}

export interface RevenueData {
  date: string;
  revenue: number;
  subscriptions: number;
  plan: 'FREE' | 'PRO' | 'STUDIO';
}

export interface UsageData {
  featureKey: string;
  totalUsage: number;
  activeUsers?: number;
  uniqueUsers?: number;
  avgPerUser?: number;
  plan: string;
}

export interface InsightData {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  description: string;
  value?: string;
  trend?: 'up' | 'down' | 'neutral';
  timestamp: string;
}

export interface AnalyticsData {
  daily: MetricData[];
  weekly: MetricData[];
  monthly: MetricData[];
}

export interface DashboardFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  plan?: 'ALL' | 'FREE' | 'PRO' | 'STUDIO';
  metric?: string;
}

interface DashboardState {
  // Data
  revenue: RevenueData[];
  usage: UsageData[];
  insights: InsightData[];
  analytics: AnalyticsData;

  // UI State
  filters: DashboardFilters;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Real-time
  isRealTimeEnabled: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';

  // Actions
  setFilters: (filters: Partial<DashboardFilters>) => void;
  setRevenue: (data: RevenueData[]) => void;
  setUsage: (data: UsageData[]) => void;
  setInsights: (data: InsightData[]) => void;
  setAnalytics: (data: AnalyticsData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRealTimeEnabled: (enabled: boolean) => void;
  setConnectionStatus: (status: 'connected' | 'disconnected' | 'connecting' | 'error') => void;
  refreshDashboard: () => Promise<void>;
  reset: () => void;

  // SSE helpers for real-time updates
  addRevenue: (data: RevenueData) => void;
  addUsage: (data: UsageData) => void;
  addInsight: (data: InsightData) => void;
}

const initialFilters: DashboardFilters = {
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date(),
  },
  plan: 'ALL',
};

const initialState = {
  revenue: [],
  usage: [],
  insights: [],
  analytics: {
    daily: [],
    weekly: [],
    monthly: [],
  },
  filters: initialFilters,
  loading: false,
  error: null,
  lastUpdated: null,
  isRealTimeEnabled: false,
  connectionStatus: 'disconnected' as const,
};

export const useDashboardStore = create<DashboardState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),

      setRevenue: (data) =>
        set({
          revenue: data,
          lastUpdated: new Date(),
        }),

      setUsage: (data) =>
        set({
          usage: data,
          lastUpdated: new Date(),
        }),

      setInsights: (data) =>
        set({
          insights: data,
          lastUpdated: new Date(),
        }),

      setAnalytics: (data) =>
        set({
          analytics: data,
          lastUpdated: new Date(),
        }),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      setRealTimeEnabled: (enabled) =>
        set({ isRealTimeEnabled: enabled }),

      setConnectionStatus: (status) =>
        set({ connectionStatus: status }),

      refreshDashboard: async () => {
        const { filters } = get();
        set({ loading: true, error: null });

        try {
          // Fetch all dashboard data from API
          const data = await dashboardApi.refreshAll(filters);

          set({
            revenue: data.revenue,
            usage: data.usage,
            insights: data.insights,
            analytics: data.analytics,
            loading: false,
            lastUpdated: new Date(),
            error: null,
          });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to refresh dashboard',
          });
        }
      },

      // SSE helpers for real-time updates
      addRevenue: (data) =>
        set((state) => ({
          revenue: [...state.revenue, data],
          lastUpdated: new Date(),
        })),

      addUsage: (data) =>
        set((state) => ({
          usage: [...state.usage, data],
          lastUpdated: new Date(),
        })),

      addInsight: (data) =>
        set((state) => ({
          insights: [data, ...state.insights],
          lastUpdated: new Date(),
        })),

      reset: () => set(initialState),
    }),
    { name: 'DashboardStore' }
  )
);

// Selectors
export const useRevenue = () => useDashboardStore((state) => state.revenue);
export const useUsage = () => useDashboardStore((state) => state.usage);
export const useInsights = () => useDashboardStore((state) => state.insights);
export const useAnalytics = () => useDashboardStore((state) => state.analytics);
export const useFilters = () => useDashboardStore((state) => state.filters);
export const useLoading = () => useDashboardStore((state) => state.loading);
export const useError = () => useDashboardStore((state) => state.error);
export const useConnectionStatus = () => useDashboardStore((state) => state.connectionStatus);
