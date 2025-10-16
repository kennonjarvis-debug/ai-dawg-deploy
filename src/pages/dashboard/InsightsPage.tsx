/**
 * Insights Page
 * Displays AI-generated business insights with filtering and categorization
 */
import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
  Lightbulb,
  Filter,
} from 'lucide-react';
import { FilterPanel } from '../../components/dashboard/FilterPanel';
import { useDashboardStore } from '../../stores/dashboardStore';

type InsightType = 'success' | 'warning' | 'info' | 'suggestion';

const insightConfig: Record<InsightType, { icon: any; color: string; bgColor: string }> = {
  success: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-900/20 border-green-700',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-900/20 border-yellow-700',
  },
  info: {
    icon: Info,
    color: 'text-blue-500',
    bgColor: 'bg-blue-900/20 border-blue-700',
  },
  suggestion: {
    icon: Lightbulb,
    color: 'text-purple-500',
    bgColor: 'bg-purple-900/20 border-purple-700',
  },
};

export const InsightsPage: React.FC = () => {
  const { insights, loading, error, refreshDashboard } = useDashboardStore();
  const [selectedType, setSelectedType] = useState<InsightType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'priority'>('recent');

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  // Filter and sort insights
  const filteredInsights = insights
    .filter((insight) => selectedType === 'all' || insight.type === selectedType)
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      // Priority sort (warning > suggestion > info > success)
      const priority: Record<InsightType, number> = {
        warning: 4,
        suggestion: 3,
        info: 2,
        success: 1,
      };
      return priority[b.type as InsightType] - priority[a.type as InsightType];
    });

  const insightCounts = insights.reduce(
    (acc, insight) => {
      acc[insight.type as InsightType] = (acc[insight.type as InsightType] || 0) + 1;
      return acc;
    },
    {} as Record<InsightType, number>
  );

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">AI Insights</h1>
          <p className="text-gray-400 mt-1">
            Automated analysis and recommendations for your business
          </p>
        </div>
        <FilterPanel />
      </div>

      {/* Insight Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(insightConfig).map(([type, config]) => {
          const Icon = config.icon;
          const count = insightCounts[type as InsightType] || 0;
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type as InsightType)}
              className={`bg-gray-800 border rounded-lg p-4 text-left transition-colors ${
                selectedType === type
                  ? 'border-purple-500'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-5 h-5 ${config.color}`} />
                <span className="text-2xl font-bold text-white">{count}</span>
              </div>
              <div className="text-sm text-gray-400 mt-2 capitalize">{type}</div>
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedType === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            All Insights ({insights.length})
          </button>
          <Filter className="w-4 h-4 text-gray-500" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'priority')}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="recent">Most Recent</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>

      {/* Insights List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-gray-800 border border-gray-700 rounded-lg p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-700 rounded w-1/4 mb-3"></div>
              <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
          <p className="text-red-500">{error}</p>
        </div>
      ) : filteredInsights.length > 0 ? (
        <div className="space-y-4">
          {filteredInsights.map((insight) => {
            const config = insightConfig[insight.type as InsightType];
            const Icon = config.icon;
            const trendDirection = insight.trend === 'up' ? 'up' : insight.trend === 'down' ? 'down' : null;

            return (
              <div
                key={insight.id}
                className={`border rounded-lg p-6 ${config.bgColor} hover:shadow-lg transition-shadow`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`p-3 bg-gray-900 rounded-lg ${config.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium uppercase ${config.color} bg-gray-900`}
                          >
                            {insight.type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(insight.timestamp).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold text-white mt-2">
                          {insight.title}
                        </h3>
                      </div>

                      {/* Value/Trend */}
                      {(insight.value || trendDirection) && (
                        <div className="flex items-center gap-2">
                          {insight.value && (
                            <span className="text-2xl font-bold text-white">
                              {insight.value}
                            </span>
                          )}
                          {trendDirection && (
                            trendDirection === 'up' ? (
                              <TrendingUp className="w-5 h-5 text-green-500" />
                            ) : (
                              <TrendingDown className="w-5 h-5 text-red-500" />
                            )
                          )}
                        </div>
                      )}
                    </div>

                    <p className="text-gray-300 mt-3 leading-relaxed">
                      {insight.description}
                    </p>

                    {/* Action Button (if insight has actionable items) */}
                    {insight.type === 'suggestion' && (
                      <button className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors">
                        Take Action
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
          <Lightbulb className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400">No Insights Available</h3>
          <p className="text-gray-500 mt-2">
            {selectedType === 'all'
              ? 'Insights will appear here as we analyze your data.'
              : `No ${selectedType} insights found for the selected period.`}
          </p>
        </div>
      )}
    </div>
  );
};
