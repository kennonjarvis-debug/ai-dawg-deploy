/**
 * Dashboard API Service
 * Handles all API requests for dashboard analytics
 */

// Use relative path to avoid CORS and work with ngrok
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export interface DateRangeFilter {
  start: Date;
  end: Date;
}

export interface DashboardFilters {
  dateRange: DateRangeFilter;
  plan?: 'ALL' | 'FREE' | 'PRO' | 'ENTERPRISE';
}

export interface RevenueData {
  date: string;
  revenue: number;
  subscriptions: number;
  plan?: string;
}

export interface UsageData {
  featureKey: string;
  totalUsage: number;
  activeUsers: number;
  plan: string;
}

export interface InsightData {
  id: string;
  type: 'success' | 'warning' | 'info' | 'suggestion';
  title: string;
  description: string;
  value?: string;
  trend?: 'up' | 'down' | 'neutral';
  timestamp: string;
}

export interface AnalyticsData {
  daily: Array<{
    date: string;
    revenue?: number;
    activeUsers?: number;
    totalUsage?: number;
  }>;
  weekly: Array<{
    date: string;
    revenue?: number;
    activeUsers?: number;
    totalUsage?: number;
  }>;
  monthly: Array<{
    date: string;
    revenue?: number;
    activeUsers?: number;
    totalUsage?: number;
  }>;
}

export interface ForecastData {
  metric: string;
  predictions: Array<{
    date: string;
    predicted: number;
    confidence: number;
  }>;
}

/**
 * Helper function to format date for API requests
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Helper function to build query parameters
 */
function buildQueryParams(filters: DashboardFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.dateRange) {
    params.append('startDate', formatDate(filters.dateRange.start));
    params.append('endDate', formatDate(filters.dateRange.end));
  }

  if (filters.plan && filters.plan !== 'ALL') {
    params.append('plan', filters.plan);
  }

  return params;
}

/**
 * Cached CSRF token
 */
let cachedCSRFToken: string | null = null;

/**
 * Get CSRF token from backend
 */
async function getCSRFToken(): Promise<string | null> {
  // Return cached token if available
  if (cachedCSRFToken) {
    return cachedCSRFToken;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/csrf-token`, {
      credentials: 'include',
    });
    const data = await response.json();
    cachedCSRFToken = data.csrfToken || null;
    return cachedCSRFToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    return null;
  }
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchWithErrorHandling<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const csrfToken = await getCSRFToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    // Add CSRF token for POST requests
    if (options?.method === 'POST' && csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Include cookies for authentication
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(
        errorData.message || `API request failed with status ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
}

export const dashboardApi = {
  /**
   * Get comprehensive analytics data
   */
  async getAnalytics(filters: DashboardFilters): Promise<AnalyticsData> {
    const params = buildQueryParams(filters);
    const url = `${API_BASE_URL}/gpt/analyze?${params}`;

    return fetchWithErrorHandling<AnalyticsData>(url, {
      method: 'POST',
      body: JSON.stringify(filters),
    });
  },

  /**
   * Get revenue data
   */
  async getRevenue(filters: DashboardFilters): Promise<RevenueData[]> {
    const params = buildQueryParams(filters);
    const url = `${API_BASE_URL}/gpt/revenue?${params}`;

    const response = await fetchWithErrorHandling<{ data: RevenueData[] }>(url);
    return response.data || [];
  },

  /**
   * Get usage metrics
   */
  async getUsage(filters: DashboardFilters): Promise<UsageData[]> {
    const params = buildQueryParams(filters);
    const url = `${API_BASE_URL}/gpt/usage?${params}`;

    const response = await fetchWithErrorHandling<{ data: UsageData[] }>(url);
    return response.data || [];
  },

  /**
   * Get AI-generated insights
   */
  async getInsights(filters: DashboardFilters): Promise<InsightData[]> {
    const url = `${API_BASE_URL}/gpt/insights`;

    const response = await fetchWithErrorHandling<{ insights: InsightData[] }>(url, {
      method: 'POST',
      body: JSON.stringify(filters),
    });

    return response.insights || [];
  },

  /**
   * Get AI forecast for a specific metric
   */
  async getForecast(
    metric: 'revenue' | 'usage' | 'users',
    horizon: number = 30
  ): Promise<ForecastData> {
    const url = `${API_BASE_URL}/gpt/forecast`;

    return fetchWithErrorHandling<ForecastData>(url, {
      method: 'POST',
      body: JSON.stringify({ metric, horizon }),
    });
  },

  /**
   * Refresh all dashboard data
   */
  async refreshAll(filters: DashboardFilters): Promise<{
    revenue: RevenueData[];
    usage: UsageData[];
    insights: InsightData[];
    analytics: AnalyticsData;
  }> {
    // Run all requests in parallel for better performance
    const [revenue, usage, insights, analytics] = await Promise.all([
      this.getRevenue(filters),
      this.getUsage(filters),
      this.getInsights(filters),
      this.getAnalytics(filters),
    ]);

    return {
      revenue,
      usage,
      insights,
      analytics,
    };
  },

  /**
   * Export dashboard data as CSV/JSON
   */
  async exportData(
    dataType: 'revenue' | 'usage' | 'insights' | 'analytics',
    format: 'csv' | 'json',
    filters: DashboardFilters
  ): Promise<Blob> {
    const params = buildQueryParams(filters);
    params.append('format', format);
    const url = `${API_BASE_URL}/gpt/export/${dataType}?${params}`;

    const response = await fetch(url, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Export failed with status ${response.status}`);
    }

    return await response.blob();
  },

  /**
   * Get real-time updates via Server-Sent Events
   * Returns an EventSource for streaming updates
   */
  createSSEConnection(filters: DashboardFilters): EventSource {
    const params = buildQueryParams(filters);
    const url = `${API_BASE_URL}/gpt/stream?${params}`;

    return new EventSource(url, {
      withCredentials: true,
    });
  },
};

// Export types for use in components
export type { DashboardFilters, RevenueData, UsageData, InsightData, AnalyticsData };
