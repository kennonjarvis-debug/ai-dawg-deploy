/**
 * React hook for AI context analysis
 * Provides real-time AI insights and recommendations
 */

import { useEffect, useState, useMemo } from 'react';
import { useTimelineStore } from '@/stores/timelineStore';
import { useTransportStore } from '@/stores/transportStore';
import {
  getAIContextAnalyzer,
  type ProjectContext,
  type AIInsight,
  type AIRecommendation,
} from '@/ai/AIContextAnalyzer';

export const useAIContext = () => {
  const { tracks } = useTimelineStore();
  const { isRecording, isPlaying, currentTime } = useTransportStore();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [contextSummary, setContextSummary] = useState<string>('');

  const analyzer = getAIContextAnalyzer();

  // Memoize project context to avoid unnecessary recalculations
  const projectContext = useMemo<ProjectContext>(() => {
    return analyzer.analyzeProject(tracks, isRecording, isPlaying, currentTime);
  }, [tracks, isRecording, isPlaying, currentTime, analyzer]);

  // Update insights when context changes
  useEffect(() => {
    const newInsights = analyzer.generateInsights(projectContext);
    setInsights(newInsights);

    const summary = analyzer.getContextSummary(projectContext);
    setContextSummary(summary);

    // Generate recommendations (less frequently, only when tracks change significantly)
    const newRecommendations = analyzer.generateRecommendations(projectContext);
    setRecommendations(newRecommendations);
  }, [projectContext, analyzer]);

  // Get track-specific insights
  const getTrackInsights = (trackId: string): AIInsight[] => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return [];
    return analyzer.analyzeTrack(track);
  };

  // Get high-priority insights only
  const criticalInsights = useMemo(() => {
    return insights.filter(i => i.priority === 'high');
  }, [insights]);

  // Get actionable insights only
  const actionableInsights = useMemo(() => {
    return insights.filter(i => i.actionable);
  }, [insights]);

  return {
    projectContext,
    insights,
    recommendations,
    contextSummary,
    criticalInsights,
    actionableInsights,
    getTrackInsights,
  };
};
