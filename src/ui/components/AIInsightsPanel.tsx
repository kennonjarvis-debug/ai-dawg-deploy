/**
 * AI Insights Panel - Display context-aware AI suggestions and insights
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Lightbulb,
  AlertTriangle,
  Info,
  Zap,
  ChevronDown,
  ChevronUp,
  X,
  TrendingUp,
} from 'lucide-react';
import { useAIContext } from '@/hooks/useAIContext';
import type { AIInsight, AIRecommendation } from '@/ai/AIContextAnalyzer';

export const AIInsightsPanel: React.FC = () => {
  const {
    insights,
    recommendations,
    contextSummary,
    criticalInsights,
  } = useAIContext();

  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'insights' | 'recommendations'>('insights');
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set());

  const visibleInsights = insights.filter((_, index) =>
    !dismissedInsights.has(`insight-${index}`)
  );

  const handleDismissInsight = (index: number) => {
    setDismissedInsights(prev => new Set(prev).add(`insight-${index}`));
  };

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'suggestion':
        return <Lightbulb className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'optimization':
        return <Zap className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
    }
  };

  const getInsightColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'suggestion':
        return 'from-blue-500/20 to-blue-600/10 border-blue-500/40 text-blue-400';
      case 'warning':
        return 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/40 text-yellow-400';
      case 'optimization':
        return 'from-green-500/20 to-green-600/10 border-green-500/40 text-green-400';
      case 'info':
        return 'from-purple-500/20 to-purple-600/10 border-purple-500/40 text-purple-400';
    }
  };

  const getPriorityBadge = (priority: AIInsight['priority']) => {
    const colors = {
      high: 'bg-red-500/20 text-red-400 border-red-500/40',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
      low: 'bg-gray-500/20 text-gray-400 border-gray-500/40',
    };

    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${colors[priority]}`}>
        {priority}
      </span>
    );
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-gradient-to-r from-primary to-primary-hover text-white px-4 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold">AI Insights</span>
          {criticalInsights.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {criticalInsights.length}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-[400px] max-h-[600px] bg-bg-surface/95 backdrop-blur-xl rounded-xl shadow-2xl border border-border-strong z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-base">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-base">AI Assistant</h3>
            <p className="text-[10px] text-text-muted">Context-aware insights</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="p-1.5 rounded-lg hover:bg-bg-surface-hover transition-colors text-text-muted hover:text-text-base"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Context Summary */}
      <div className="p-3 bg-bg-base/30 border-b border-border-base">
        <p className="text-xs text-text-muted leading-relaxed">{contextSummary}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-base">
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex-1 px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === 'insights'
              ? 'bg-primary/10 text-primary border-b-2 border-primary'
              : 'text-text-muted hover:text-text-base hover:bg-bg-surface/50'
          }`}
        >
          Insights ({visibleInsights.length})
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`flex-1 px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === 'recommendations'
              ? 'bg-primary/10 text-primary border-b-2 border-primary'
              : 'text-text-muted hover:text-text-base hover:bg-bg-surface/50'
          }`}
        >
          Suggestions ({recommendations.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {activeTab === 'insights' && (
          <>
            {visibleInsights.length === 0 ? (
              <div className="text-center py-12 text-text-muted">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm">All good!</p>
                <p className="text-xs mt-2">No insights at the moment</p>
              </div>
            ) : (
              visibleInsights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border bg-gradient-to-r ${getInsightColor(insight.type)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getInsightIcon(insight.type)}
                      <span className="text-xs font-semibold text-text-base">
                        {insight.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getPriorityBadge(insight.priority)}
                      <button
                        onClick={() => handleDismissInsight(index)}
                        className="p-1 rounded hover:bg-bg-surface/50 transition-colors"
                      >
                        <X className="w-3 h-3 text-text-muted" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-text-base/80 leading-relaxed">
                    {insight.description}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] text-text-muted px-2 py-0.5 bg-bg-base/50 rounded">
                      {insight.category}
                    </span>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'recommendations' && (
          <>
            {recommendations.length === 0 ? (
              <div className="text-center py-12 text-text-muted">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm">No recommendations</p>
                <p className="text-xs mt-2">Start creating to get AI suggestions</p>
              </div>
            ) : (
              recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 rounded-lg border border-border-base bg-bg-surface/50 hover:bg-bg-surface transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-xs font-semibold text-text-base">
                        {rec.title}
                      </h4>
                      <p className="text-[10px] text-text-muted mt-1">
                        Confidence: {(rec.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-primary/20 text-primary rounded font-semibold">
                      {rec.type}
                    </span>
                  </div>
                  <p className="text-xs text-text-base/80 leading-relaxed mb-2">
                    {rec.description}
                  </p>
                  <details className="text-xs text-text-muted">
                    <summary className="cursor-pointer hover:text-text-base transition-colors">
                      Why this suggestion?
                    </summary>
                    <p className="mt-2 pl-4 border-l-2 border-primary/30">
                      {rec.reasoning}
                    </p>
                  </details>
                  {rec.implementation && rec.implementation.steps.length > 0 && (
                    <div className="mt-2 p-2 bg-bg-base/30 rounded text-[10px]">
                      <div className="font-semibold text-text-base mb-1">Steps:</div>
                      <ol className="list-decimal list-inside space-y-0.5 text-text-muted">
                        {rec.implementation.steps.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AIInsightsPanel;
