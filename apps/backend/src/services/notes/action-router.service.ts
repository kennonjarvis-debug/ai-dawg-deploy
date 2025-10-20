/**
 * Action Router Service
 * Routes analyzed actions to appropriate handlers based on app context
 */

import type { Action, AIAnalysis, Note } from '../../types/notes.js';
import { logger } from '../../../../src/lib/utils/logger.js';

export interface ActionResult {
  action: Action;
  executed: boolean;
  result?: any;
  error?: string;
}

export class ActionRouterService {
  /**
   * Execute actions based on analysis
   */
  async executeActions(analysis: AIAnalysis, note: Note): Promise<ActionResult[]> {
    const results: ActionResult[] = [];

    for (const action of analysis.suggestedActions) {
      try {
        const result = await this.executeAction(action, note, analysis);
        results.push(result);
      } catch (error) {
        results.push({
          action,
          executed: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Execute a single action
   */
  private async executeAction(action: Action, note: Note, analysis: AIAnalysis): Promise<ActionResult> {
    logger.info('Executing action: ${action.type} for ${action.appContext}');

    switch (action.type) {
      case 'finalize_song':
        return this.handleFinalizeSong(action, note, analysis);

      case 'create_track':
        return this.handleCreateTrack(action, note, analysis);

      case 'suggest_improvements':
        return this.handleSuggestImprovements(action, note, analysis);

      case 'schedule_event':
        return this.handleScheduleEvent(action, note, analysis);

      case 'create_reminder':
        return this.handleCreateReminder(action, note, analysis);

      case 'archive':
        return this.handleArchive(action, note);

      default:
        return {
          action,
          executed: false,
          error: `Unknown action type: ${action.type}`,
        };
    }
  }

  /**
   * DAWG AI: Finalize a song
   */
  private async handleFinalizeSong(action: Action, note: Note, analysis: AIAnalysis): Promise<ActionResult> {
    const songStructure = analysis.extractedData.songStructure;

    if (!songStructure) {
      return {
        action,
        executed: false,
        error: 'No song structure detected',
      };
    }

    // Extract song components
    const songData = {
      title: note.title.replace(/^(Voice Memo:|Song:)\s*/i, '').trim(),
      verses: songStructure.verses || [],
      chorus: songStructure.chorus || [],
      bridge: songStructure.bridge || '',
      rawLyrics: note.content,
      keywords: analysis.extractedData.keywords || [],
      createdAt: note.createdAt,
      suggestions: action.metadata?.suggestions || [],
    };

    return {
      action,
      executed: true,
      result: {
        type: 'song_finalized',
        data: songData,
        message: `Song "${songData.title}" is ready for production`,
      },
    };
  }

  /**
   * DAWG AI: Create a new track
   */
  private async handleCreateTrack(action: Action, note: Note, analysis: AIAnalysis): Promise<ActionResult> {
    const trackName = note.title.replace(/^Voice Memo:\s*/i, '').trim();

    const trackData = {
      name: trackName,
      type: 'audio',
      color: this.generateTrackColor(analysis.contentType),
      sourceNote: note.id,
      lyrics: note.content,
      suggestedBPM: action.metadata?.bpm || 120,
      suggestedKey: action.metadata?.key || 'C',
    };

    return {
      action,
      executed: true,
      result: {
        type: 'track_created',
        data: trackData,
        message: `Track "${trackName}" created and ready for recording`,
      },
    };
  }

  /**
   * DAWG AI: Suggest song improvements
   */
  private async handleSuggestImprovements(
    action: Action,
    note: Note,
    analysis: AIAnalysis
  ): Promise<ActionResult> {
    const suggestions = {
      lyricalImprovements: action.metadata?.lyrical || [],
      structuralChanges: action.metadata?.structural || [],
      productionIdeas: action.metadata?.production || [],
      overallAssessment: analysis.summary,
    };

    return {
      action,
      executed: true,
      result: {
        type: 'improvements_suggested',
        data: suggestions,
        message: 'Generated song improvement suggestions',
      },
    };
  }

  /**
   * JARVIS: Schedule a calendar event
   */
  private async handleScheduleEvent(action: Action, note: Note, analysis: AIAnalysis): Promise<ActionResult> {
    const dates = analysis.extractedData.dates || [];

    if (dates.length === 0) {
      return {
        action,
        executed: false,
        error: 'No dates found to schedule event',
      };
    }

    const eventData = {
      title: note.title,
      description: note.content,
      dates: dates,
      location: action.metadata?.location,
      attendees: analysis.extractedData.entities || [],
    };

    return {
      action,
      executed: true,
      result: {
        type: 'event_scheduled',
        data: eventData,
        message: `Event "${eventData.title}" scheduled`,
      },
    };
  }

  /**
   * JARVIS: Create a reminder
   */
  private async handleCreateReminder(action: Action, note: Note, analysis: AIAnalysis): Promise<ActionResult> {
    const actionItems = analysis.extractedData.actionItems || [];

    const reminderData = {
      title: note.title,
      items: actionItems,
      priority: action.priority,
      dueDate: analysis.extractedData.dates?.[0],
      notes: note.content,
    };

    return {
      action,
      executed: true,
      result: {
        type: 'reminder_created',
        data: reminderData,
        message: `Reminder created with ${actionItems.length} action items`,
      },
    };
  }

  /**
   * Archive a note
   */
  private async handleArchive(action: Action, note: Note): Promise<ActionResult> {
    return {
      action,
      executed: true,
      result: {
        type: 'note_archived',
        noteId: note.id,
        message: `Note "${note.title}" archived`,
      },
    };
  }

  /**
   * Generate a color for a track based on content type
   */
  private generateTrackColor(contentType: string): string {
    const colorMap: Record<string, string> = {
      song_lyrics: '#ff6b6b',
      song_idea: '#4ecdc4',
      reminder: '#95e1d3',
      meeting_note: '#f9ca24',
      todo: '#6c5ce7',
      general_note: '#a29bfe',
      other: '#74b9ff',
    };

    return colorMap[contentType] || colorMap.other;
  }

  /**
   * Get recommended actions for a content type
   */
  getRecommendedActions(contentType: string, appContext: 'jarvis' | 'dawg_ai'): string[] {
    if (appContext === 'dawg_ai') {
      switch (contentType) {
        case 'song_lyrics':
          return ['finalize_song', 'create_track', 'suggest_improvements'];
        case 'song_idea':
          return ['create_track', 'suggest_improvements'];
        default:
          return ['archive'];
      }
    } else {
      switch (contentType) {
        case 'reminder':
          return ['create_reminder'];
        case 'meeting_note':
          return ['schedule_event', 'create_reminder'];
        case 'todo':
          return ['create_reminder'];
        default:
          return ['archive'];
      }
    }
  }
}

export const actionRouterService = new ActionRouterService();
