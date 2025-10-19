/**
 * AI Context Analyzer - Makes AI more context-aware of the project state
 * Provides intelligent analysis and suggestions based on current project context
 */

import type { Track, Clip } from '@/stores/timelineStore';
import type { TrackChannelStrip } from '@/audio/routing/types';

export interface ProjectContext {
  tracks: {
    total: number;
    armed: number;
    withClips: number;
    empty: number;
    withPlugins: number;
  };
  clips: {
    total: number;
    totalDuration: number;
    averageDuration: number;
  };
  routing: {
    totalSends: number;
    totalInserts: number;
    busesUsed: number;
  };
  recording: {
    isRecording: boolean;
    recordingTracks: string[];
  };
  playback: {
    isPlaying: boolean;
    currentTime: number;
  };
  genre?: string;
  projectDuration: number;
}

export interface AIInsight {
  type: 'suggestion' | 'warning' | 'optimization' | 'info';
  category: 'mixing' | 'routing' | 'performance' | 'workflow' | 'creative';
  title: string;
  description: string;
  actionable: boolean;
  action?: {
    label: string;
    callback: () => void;
  };
  priority: 'low' | 'medium' | 'high';
}

export interface AIRecommendation {
  id: string;
  type: 'plugin' | 'routing' | 'mix' | 'workflow';
  title: string;
  description: string;
  confidence: number;
  reasoning: string;
  implementation?: {
    steps: string[];
    automated: boolean;
  };
}

export class AIContextAnalyzer {
  private static instance: AIContextAnalyzer;

  private constructor() {}

  static getInstance(): AIContextAnalyzer {
    if (!AIContextAnalyzer.instance) {
      AIContextAnalyzer.instance = new AIContextAnalyzer();
    }
    return AIContextAnalyzer.instance;
  }

  /**
   * Analyze project context and generate comprehensive overview
   */
  analyzeProject(
    tracks: Track[],
    isRecording: boolean,
    isPlaying: boolean,
    currentTime: number
  ): ProjectContext {
    const clips = tracks.flatMap(t => t.clips || []);
    const armedTracks = tracks.filter(t => t.isArmed);
    const tracksWithClips = tracks.filter(t => t.clips && t.clips.length > 0);
    const emptyTracks = tracks.filter(t => !t.clips || t.clips.length === 0);

    const totalInserts = tracks.reduce((sum, track) => {
      return sum + (track.channelStrip?.inserts?.filter(i => i.pluginInstanceId).length || 0);
    }, 0);

    const totalSends = tracks.reduce((sum, track) => {
      return sum + (track.channelStrip?.sends?.length || 0);
    }, 0);

    const projectDuration = Math.max(
      ...clips.map(c => (c.startTime || 0) + (c.duration || 0)),
      0
    );

    const totalClipDuration = clips.reduce((sum, clip) => sum + (clip.duration || 0), 0);

    return {
      tracks: {
        total: tracks.length,
        armed: armedTracks.length,
        withClips: tracksWithClips.length,
        empty: emptyTracks.length,
        withPlugins: tracks.filter(t =>
          t.channelStrip?.inserts?.some(i => i.pluginInstanceId)
        ).length,
      },
      clips: {
        total: clips.length,
        totalDuration: totalClipDuration,
        averageDuration: clips.length > 0 ? totalClipDuration / clips.length : 0,
      },
      routing: {
        totalSends: totalSends,
        totalInserts: totalInserts,
        busesUsed: 0, // Could be calculated from routing engine
      },
      recording: {
        isRecording,
        recordingTracks: armedTracks.map(t => t.id),
      },
      playback: {
        isPlaying,
        currentTime,
      },
      projectDuration,
    };
  }

  /**
   * Generate intelligent insights based on project context
   */
  generateInsights(context: ProjectContext): AIInsight[] {
    const insights: AIInsight[] = [];

    // Empty tracks insight
    if (context.tracks.empty > 3) {
      insights.push({
        type: 'optimization',
        category: 'workflow',
        title: 'Multiple Empty Tracks',
        description: `You have ${context.tracks.empty} empty tracks. Consider removing unused tracks to keep your project organized.`,
        actionable: true,
        priority: 'low',
      });
    }

    // No plugins insight
    if (context.tracks.withClips > 0 && context.routing.totalInserts === 0) {
      insights.push({
        type: 'suggestion',
        category: 'mixing',
        title: 'No Plugins Applied',
        description: 'Your tracks don\'t have any plugins yet. Consider adding EQ, compression, or effects to enhance your mix.',
        actionable: true,
        priority: 'medium',
      });
    }

    // Recording setup
    if (context.tracks.armed > 0 && !context.recording.isRecording) {
      insights.push({
        type: 'info',
        category: 'workflow',
        title: 'Track Armed for Recording',
        description: `${context.tracks.armed} track${context.tracks.armed > 1 ? 's are' : ' is'} armed and ready to record.`,
        actionable: false,
        priority: 'low',
      });
    }

    // Mix balance
    if (context.tracks.withClips > 0 && context.routing.totalSends === 0) {
      insights.push({
        type: 'suggestion',
        category: 'mixing',
        title: 'Consider Adding Send Effects',
        description: 'Send effects like reverb and delay can add depth and space to your mix. Try routing tracks to aux buses.',
        actionable: true,
        priority: 'medium',
      });
    }

    // Performance optimization
    if (context.routing.totalInserts > 50) {
      insights.push({
        type: 'warning',
        category: 'performance',
        title: 'High Plugin Count',
        description: `You have ${context.routing.totalInserts} plugin instances. This may impact performance. Consider freezing tracks or bouncing to audio.`,
        actionable: true,
        priority: 'high',
      });
    }

    // Project length
    if (context.projectDuration > 0 && context.clips.total > 0) {
      const avgClipLength = context.clips.totalDuration / context.clips.total;
      if (avgClipLength < 5) {
        insights.push({
          type: 'info',
          category: 'creative',
          title: 'Short Clips Detected',
          description: 'You have many short clips. This might be a loop-based project or arrangement in progress.',
          actionable: false,
          priority: 'low',
        });
      }
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Generate AI recommendations based on context
   */
  generateRecommendations(context: ProjectContext, genre?: string): AIRecommendation[] {
    const recommendations: AIRecommendation[] = [];

    // Vocal processing recommendation
    if (genre && ['pop', 'rnb', 'country'].includes(genre.toLowerCase())) {
      recommendations.push({
        id: 'vocal-chain',
        type: 'plugin',
        title: 'Recommended Vocal Chain',
        description: `For ${genre} vocals, try this classic chain: EQ → De-Esser → Compressor → Reverb Send`,
        confidence: 0.85,
        reasoning: `${genre} productions typically benefit from clear, polished vocals with controlled sibilance and natural compression.`,
        implementation: {
          steps: [
            'Add Vintage EQ to pre-EQ slot',
            'Add De-Esser to slot 5',
            'Add 1176 Compressor to post-EQ slot',
            'Create send to Reverb bus',
          ],
          automated: false,
        },
      });
    }

    // Mix bus processing
    if (context.tracks.withClips >= 4 && context.routing.busesUsed === 0) {
      recommendations.push({
        id: 'mix-bus',
        type: 'routing',
        title: 'Use Mix Bus for Cohesion',
        description: 'Route your tracks through a mix bus for glue compression and master processing',
        confidence: 0.90,
        reasoning: 'Mix bus processing helps create cohesion and "glue" in multi-track mixes.',
        implementation: {
          steps: [
            'Create Mix Bus',
            'Route all tracks to Mix Bus',
            'Add compressor to Mix Bus',
            'Route Mix Bus to Master',
          ],
          automated: false,
        },
      });
    }

    // Organization recommendation
    if (context.tracks.total > 8 && context.tracks.empty > 2) {
      recommendations.push({
        id: 'track-organization',
        type: 'workflow',
        title: 'Organize Your Tracks',
        description: 'Group similar tracks and remove unused ones for better workflow',
        confidence: 0.75,
        reasoning: 'Clean project organization improves focus and speeds up mixing workflow.',
        implementation: {
          steps: [
            'Delete empty tracks',
            'Color-code tracks by type (drums, vocals, etc.)',
            'Use track folders for grouping',
          ],
          automated: false,
        },
      });
    }

    // Reference track suggestion
    if (context.clips.total > 0 && genre) {
      recommendations.push({
        id: 'reference-track',
        type: 'mix',
        title: 'Use a Reference Track',
        description: `Import a professional ${genre} reference track to guide your mix decisions`,
        confidence: 0.80,
        reasoning: 'A/B comparing with professional references helps achieve competitive sound quality.',
        implementation: {
          steps: [
            'Import reference track',
            'Create reference track in project',
            'Match levels and frequency balance',
            'Use AI EQ matching feature',
          ],
          automated: false,
        },
      });
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Analyze track and suggest improvements
   */
  analyzeTrack(track: Track): AIInsight[] {
    const insights: AIInsight[] = [];

    // No clips
    if (!track.clips || track.clips.length === 0) {
      insights.push({
        type: 'info',
        category: 'workflow',
        title: 'Empty Track',
        description: 'This track is empty. Arm it to record or delete if not needed.',
        actionable: true,
        priority: 'low',
      });
    }

    // No plugins
    if (track.clips && track.clips.length > 0 &&
        (!track.channelStrip?.inserts ||
         !track.channelStrip.inserts.some(i => i.pluginInstanceId))) {
      insights.push({
        type: 'suggestion',
        category: 'mixing',
        title: 'No Processing Applied',
        description: 'This track has no plugins. Consider adding EQ or compression to shape the sound.',
        actionable: true,
        priority: 'medium',
      });
    }

    // Too many plugins
    const pluginCount = track.channelStrip?.inserts?.filter(i => i.pluginInstanceId).length || 0;
    if (pluginCount > 8) {
      insights.push({
        type: 'warning',
        category: 'performance',
        title: 'Many Plugins on Track',
        description: `${pluginCount} plugins may cause CPU issues. Consider bouncing or freezing this track.`,
        actionable: true,
        priority: 'high',
      });
    }

    // Armed but not recording
    if (track.isArmed) {
      insights.push({
        type: 'info',
        category: 'workflow',
        title: 'Track Armed',
        description: 'This track is ready to record. Press the record button to start.',
        actionable: false,
        priority: 'low',
      });
    }

    return insights;
  }

  /**
   * Get context summary for AI assistant
   */
  getContextSummary(context: ProjectContext): string {
    const parts: string[] = [];

    parts.push(`Project has ${context.tracks.total} tracks (${context.tracks.withClips} with audio, ${context.tracks.empty} empty).`);

    if (context.clips.total > 0) {
      parts.push(`Total of ${context.clips.total} clips with ${context.projectDuration.toFixed(1)}s duration.`);
    }

    if (context.routing.totalInserts > 0) {
      parts.push(`${context.routing.totalInserts} plugins loaded across tracks.`);
    }

    if (context.routing.totalSends > 0) {
      parts.push(`${context.routing.totalSends} send effects configured.`);
    }

    if (context.recording.isRecording) {
      parts.push(`Currently recording on ${context.recording.recordingTracks.length} track(s).`);
    } else if (context.tracks.armed > 0) {
      parts.push(`${context.tracks.armed} track(s) armed for recording.`);
    }

    if (context.playback.isPlaying) {
      parts.push(`Playback active at ${context.playback.currentTime.toFixed(2)}s.`);
    }

    return parts.join(' ');
  }
}

// Singleton export
export const getAIContextAnalyzer = () => AIContextAnalyzer.getInstance();
