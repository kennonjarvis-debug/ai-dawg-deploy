/**
 * Suggestion Actions Component
 *
 * Provides Accept/Reject buttons for AI suggestions.
 * When accepted, suggestions are applied to the lyrics.
 *
 * Features:
 * - Accept button: Applies suggestion to lyrics
 * - Reject button: Dismisses suggestion
 * - Handles different suggestion types (substitution vs. append)
 * - Visual feedback on actions
 */

import React, { useState } from 'react';
import { useLyricsStore } from '../../store/lyricsStore';
import { useSuggestionsStore } from '../../store/suggestionsStore';
import type { Suggestion } from '../../store/suggestionsStore';
import './SuggestionActions.css';

export interface SuggestionActionsProps {
  suggestion: Suggestion;
  compact?: boolean; // compact mode for smaller displays
}

export function SuggestionActions({ suggestion, compact = false }: SuggestionActionsProps) {
  const lyricsStore = useLyricsStore();
  const suggestionsStore = useSuggestionsStore();
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Handle accepting a suggestion
   */
  const handleAccept = async () => {
    setIsProcessing(true);

    try {
      // Apply the suggestion based on its type
      if (suggestion.type === 'substitution' && suggestion.original && suggestion.alternative) {
        // Substitution: Replace original word/phrase with alternative
        applySubstitution(suggestion.original, suggestion.alternative, suggestion.lineId);
      } else if (suggestion.type === 'rhyme' && suggestion.original) {
        // Rhyme: Append first alternative to a new line
        const rhymes = suggestion.content.split(',').map((r) => r.trim());
        if (rhymes.length > 0) {
          appendNewLine(rhymes[0]);
        }
      } else {
        // General/Flow/Creative: Append as new line
        appendNewLine(suggestion.content);
      }

      // Remove suggestion from store
      suggestionsStore.removeSuggestion(suggestion.id);

      // Log acceptance
      console.log('Accepted suggestion:', suggestion);
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle rejecting a suggestion
   */
  const handleReject = () => {
    suggestionsStore.removeSuggestion(suggestion.id);
    console.log('Rejected suggestion:', suggestion);
  };

  /**
   * Apply a substitution to existing lyrics
   */
  const applySubstitution = (original: string, alternative: string, lineId?: string) => {
    if (lineId) {
      // Replace in specific line
      const line = lyricsStore.lines.find((l) => l.id === lineId);
      if (line) {
        const newText = line.text.replace(new RegExp(escapeRegExp(original), 'gi'), alternative);
        lyricsStore.updateLine(lineId, newText);
      }
    } else {
      // Replace in current/last line
      const currentIndex = lyricsStore.currentLineIndex;
      const targetIndex = currentIndex >= 0 ? currentIndex : lyricsStore.lines.length - 1;

      if (targetIndex >= 0 && targetIndex < lyricsStore.lines.length) {
        const line = lyricsStore.lines[targetIndex];
        const newText = line.text.replace(new RegExp(escapeRegExp(original), 'gi'), alternative);
        lyricsStore.updateLine(line.id, newText);
      }
    }
  };

  /**
   * Append suggestion as a new line
   */
  const appendNewLine = (text: string) => {
    lyricsStore.addLine({
      id: `suggestion-${Date.now()}`,
      text,
      timestamp: Date.now() / 1000,
      confidence: 1.0,
      isEdited: true,
    });
  };

  return (
    <div className={`suggestion-actions ${compact ? 'compact' : ''}`}>
      <button
        className="action-btn accept-btn"
        onClick={handleAccept}
        disabled={isProcessing}
        title="Accept and apply this suggestion"
      >
        {!compact && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {compact ? '✓' : 'Accept'}
      </button>

      <button
        className="action-btn reject-btn"
        onClick={handleReject}
        disabled={isProcessing}
        title="Reject this suggestion"
      >
        {!compact && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        {compact ? '✕' : 'Reject'}
      </button>
    </div>
  );
}

/**
 * Escape special regex characters
 */
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default SuggestionActions;
