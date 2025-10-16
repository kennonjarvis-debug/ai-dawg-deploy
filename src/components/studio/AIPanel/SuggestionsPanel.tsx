import React, { useState } from 'react';
import { useSuggestionsStore, type Suggestion, type SuggestionType } from '../../store/suggestionsStore';
import './SuggestionsPanel.css';

/**
 * SuggestionsPanel Component
 * Right panel displaying AI-generated suggestions from Claude
 *
 * Features:
 * - Categorized suggestions (rhyme, flow, substitution, syllable)
 * - Accept/Reject buttons
 * - Loading indicator
 * - Filter by suggestion type
 */
const SuggestionsPanel: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<SuggestionType | 'all'>('all');

  // Get state and actions from suggestions store
  const {
    suggestions,
    isLoading,
    acceptSuggestion,
    rejectSuggestion,
    clearSuggestions,
  } = useSuggestionsStore();

  // Filter suggestions based on selected type
  const filteredSuggestions = selectedFilter === 'all'
    ? suggestions
    : suggestions.filter(s => s.type === selectedFilter);

  // Get count for each suggestion type
  const getCounts = () => {
    const counts: Record<SuggestionType | 'all', number> = {
      all: suggestions.length,
      rhyme: suggestions.filter(s => s.type === 'rhyme').length,
      flow: suggestions.filter(s => s.type === 'flow').length,
      substitution: suggestions.filter(s => s.type === 'substitution').length,
      syllable: suggestions.filter(s => s.type === 'syllable').length,
      general: suggestions.filter(s => s.type === 'general').length,
    };
    return counts;
  };

  const counts = getCounts();

  // Get icon for suggestion type
  const getTypeIcon = (type: SuggestionType): string => {
    switch (type) {
      case 'rhyme':
        return '🎵';
      case 'flow':
        return '🌊';
      case 'substitution':
        return '🔄';
      case 'syllable':
        return '📊';
      case 'general':
        return '💡';
      default:
        return '✨';
    }
  };

  // Get color for suggestion type
  const getTypeColor = (type: SuggestionType): string => {
    switch (type) {
      case 'rhyme':
        return '#ff4444';
      case 'flow':
        return '#44aaff';
      case 'substitution':
        return '#44ff44';
      case 'syllable':
        return '#ffaa44';
      case 'general':
        return '#aa44ff';
      default:
        return '#888';
    }
  };

  return (
    <div className="suggestions-panel">
      {/* Header */}
      <div className="suggestions-header">
        <h2 className="panel-title">AI Suggestions</h2>
        <button
          className="clear-all-btn"
          onClick={clearSuggestions}
          disabled={suggestions.length === 0}
          title="Clear all suggestions"
        >
          Clear All
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${selectedFilter === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('all')}
        >
          All <span className="filter-count">{counts.all}</span>
        </button>
        <button
          className={`filter-tab ${selectedFilter === 'rhyme' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('rhyme')}
        >
          Rhyme <span className="filter-count">{counts.rhyme}</span>
        </button>
        <button
          className={`filter-tab ${selectedFilter === 'flow' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('flow')}
        >
          Flow <span className="filter-count">{counts.flow}</span>
        </button>
        <button
          className={`filter-tab ${selectedFilter === 'substitution' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('substitution')}
        >
          Word <span className="filter-count">{counts.substitution}</span>
        </button>
        <button
          className={`filter-tab ${selectedFilter === 'syllable' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('syllable')}
        >
          Syllable <span className="filter-count">{counts.syllable}</span>
        </button>
      </div>

      {/* Suggestions List */}
      <div className="suggestions-container">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p className="loading-message">Claude is thinking...</p>
          </div>
        ) : filteredSuggestions.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="empty-message">No suggestions yet</p>
            <p className="empty-hint">
              {selectedFilter === 'all'
                ? 'Start recording to get AI suggestions'
                : `No ${selectedFilter} suggestions available`}
            </p>
          </div>
        ) : (
          <div className="suggestions-list">
            {filteredSuggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onAccept={acceptSuggestion}
                onReject={rejectSuggestion}
                getTypeIcon={getTypeIcon}
                getTypeColor={getTypeColor}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="suggestions-footer">
        <p className="footer-hint">
          Claude AI will analyze your lyrics and provide real-time suggestions
        </p>
      </div>
    </div>
  );
};

/**
 * Individual Suggestion Card Component
 */
interface SuggestionCardProps {
  suggestion: Suggestion;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  getTypeIcon: (type: SuggestionType) => string;
  getTypeColor: (type: SuggestionType) => string;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onAccept,
  onReject,
  getTypeIcon,
  getTypeColor,
}) => {
  return (
    <div className="suggestion-card">
      {/* Type Badge */}
      <div
        className="suggestion-type-badge"
        style={{ backgroundColor: getTypeColor(suggestion.type) }}
      >
        <span className="type-icon">{getTypeIcon(suggestion.type)}</span>
        <span className="type-label">{suggestion.type}</span>
      </div>

      {/* Content */}
      <div className="suggestion-content">
        {suggestion.original && suggestion.alternative && (
          <div className="suggestion-replacement">
            <span className="original-text">{suggestion.original}</span>
            <svg className="arrow-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 11.975-11.975z" />
            </svg>
            <span className="alternative-text">{suggestion.alternative}</span>
          </div>
        )}

        <p className="suggestion-text">{suggestion.content}</p>

        {suggestion.explanation && (
          <p className="suggestion-explanation">{suggestion.explanation}</p>
        )}
      </div>

      {/* Actions */}
      <div className="suggestion-actions">
        <button
          className="action-btn accept-btn"
          onClick={() => onAccept(suggestion.id)}
          title="Accept suggestion"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Accept
        </button>
        <button
          className="action-btn reject-btn"
          onClick={() => onReject(suggestion.id)}
          title="Reject suggestion"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Reject
        </button>
      </div>
    </div>
  );
};

export default SuggestionsPanel;
