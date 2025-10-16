/**
 * AI Settings Component
 *
 * Configuration panel for AI suggestion behavior:
 * - Enable/disable auto-suggestions
 * - Adjust suggestion frequency
 * - Filter suggestion types
 * - Configure coaching style
 * - View API usage statistics
 */

import React, { useState, useEffect } from 'react';
import { autoSuggestSystem } from '../../services/autoSuggest';
import { suggestionManager } from '../../services/suggestionManager';
import type { SuggestionType } from '../../store/suggestionsStore';
import './AISettings.css';

interface AISettingsState {
  autoSuggestEnabled: boolean;
  suggestionFrequency: number; // seconds
  debounceDelay: number; // seconds
  enabledTypes: Record<SuggestionType, boolean>;
  minLyricLength: number;
  streamingMode: boolean;
}

export function AISettings() {
  const [settings, setSettings] = useState<AISettingsState>({
    autoSuggestEnabled: false,
    suggestionFrequency: 5,
    debounceDelay: 2,
    enabledTypes: {
      rhyme: true,
      flow: true,
      substitution: true,
      syllable: true,
      general: true,
    },
    minLyricLength: 10,
    streamingMode: false,
  });

  const [cacheStats, setCacheStats] = useState({ size: 0, keys: [] as string[] });
  const [apiAvailable, setApiAvailable] = useState(true);
  const [timeUntilNextRequest, setTimeUntilNextRequest] = useState(0);

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('aiSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings((prev) => ({ ...prev, ...parsed }));

        // Apply auto-suggest settings
        if (parsed.autoSuggestEnabled) {
          autoSuggestSystem.updateConfig({
            enabled: true,
            minInterval: parsed.suggestionFrequency * 1000,
            debounceDelay: parsed.debounceDelay * 1000,
            minLyricLength: parsed.minLyricLength,
          });
          autoSuggestSystem.enable();
        }
      } catch (e) {
        console.error('Failed to load AI settings:', e);
      }
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('aiSettings', JSON.stringify(settings));
  }, [settings]);

  // Update cache stats and API availability
  useEffect(() => {
    const interval = setInterval(() => {
      const stats = suggestionManager.getCacheStats();
      setCacheStats(stats);

      const time = suggestionManager.getTimeUntilNextRequest();
      setTimeUntilNextRequest(time);
    }, 500);

    // Check API availability
    suggestionManager.checkAPIHealth().then(setApiAvailable);

    return () => clearInterval(interval);
  }, []);

  /**
   * Toggle auto-suggestions
   */
  const handleToggleAutoSuggest = (enabled: boolean) => {
    setSettings((prev) => ({ ...prev, autoSuggestEnabled: enabled }));

    if (enabled) {
      autoSuggestSystem.updateConfig({
        enabled: true,
        minInterval: settings.suggestionFrequency * 1000,
        debounceDelay: settings.debounceDelay * 1000,
        minLyricLength: settings.minLyricLength,
      });
      autoSuggestSystem.enable();
    } else {
      autoSuggestSystem.disable();
    }
  };

  /**
   * Update suggestion frequency
   */
  const handleFrequencyChange = (frequency: number) => {
    setSettings((prev) => ({ ...prev, suggestionFrequency: frequency }));
    autoSuggestSystem.updateConfig({
      minInterval: frequency * 1000,
    });
  };

  /**
   * Update debounce delay
   */
  const handleDebounceChange = (delay: number) => {
    setSettings((prev) => ({ ...prev, debounceDelay: delay }));
    autoSuggestSystem.updateConfig({
      debounceDelay: delay * 1000,
    });
  };

  /**
   * Toggle suggestion type filter
   */
  const handleToggleType = (type: SuggestionType, enabled: boolean) => {
    setSettings((prev) => ({
      ...prev,
      enabledTypes: {
        ...prev.enabledTypes,
        [type]: enabled,
      },
    }));
  };

  /**
   * Clear suggestion cache
   */
  const handleClearCache = () => {
    suggestionManager.clearCache();
    setCacheStats({ size: 0, keys: [] });
  };

  /**
   * Reset throttle
   */
  const handleResetThrottle = () => {
    autoSuggestSystem.resetThrottle();
    setTimeUntilNextRequest(0);
  };

  return (
    <div className="ai-settings">
      <div className="settings-header">
        <h3>AI Settings</h3>
        <div className={`api-status ${apiAvailable ? 'available' : 'unavailable'}`}>
          <span className="status-dot"></span>
          {apiAvailable ? 'API Connected' : 'API Unavailable'}
        </div>
      </div>

      {/* Auto-Suggest Section */}
      <div className="settings-section">
        <div className="section-header">
          <h4>Auto-Suggestions</h4>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.autoSuggestEnabled}
              onChange={(e) => handleToggleAutoSuggest(e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {settings.autoSuggestEnabled && (
          <div className="section-content">
            <div className="setting-item">
              <label>
                Suggestion Frequency: {settings.suggestionFrequency}s
                <input
                  type="range"
                  min="3"
                  max="15"
                  value={settings.suggestionFrequency}
                  onChange={(e) => handleFrequencyChange(Number(e.target.value))}
                />
              </label>
              <span className="setting-hint">Time between automatic suggestions</span>
            </div>

            <div className="setting-item">
              <label>
                Debounce Delay: {settings.debounceDelay}s
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={settings.debounceDelay}
                  onChange={(e) => handleDebounceChange(Number(e.target.value))}
                />
              </label>
              <span className="setting-hint">Wait time after lyric input</span>
            </div>

            <div className="setting-item">
              <label>
                Minimum Lyric Length: {settings.minLyricLength} characters
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={settings.minLyricLength}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      minLyricLength: Number(e.target.value),
                    }))
                  }
                />
              </label>
              <span className="setting-hint">Minimum text to trigger suggestions</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggestion Types Section */}
      <div className="settings-section">
        <h4>Suggestion Types</h4>
        <div className="section-content">
          {Object.entries(settings.enabledTypes).map(([type, enabled]) => (
            <label key={type} className="checkbox-item">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => handleToggleType(type as SuggestionType, e.target.checked)}
              />
              <span className="checkbox-label">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="settings-section">
        <h4>Advanced</h4>
        <div className="section-content">
          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.streamingMode}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, streamingMode: e.target.checked }))
              }
            />
            <span className="checkbox-label">Use streaming mode (real-time)</span>
          </label>
          <span className="setting-hint">
            Streaming provides faster initial response but may use more API tokens
          </span>
        </div>
      </div>

      {/* Cache & Performance */}
      <div className="settings-section">
        <h4>Cache & Performance</h4>
        <div className="section-content">
          <div className="stat-row">
            <span className="stat-label">Cached Suggestions:</span>
            <span className="stat-value">{cacheStats.size}</span>
          </div>

          <div className="stat-row">
            <span className="stat-label">Next Request Available:</span>
            <span className="stat-value">
              {timeUntilNextRequest > 0
                ? `${(timeUntilNextRequest / 1000).toFixed(1)}s`
                : 'Now'}
            </span>
          </div>

          <div className="action-buttons">
            <button className="secondary-btn" onClick={handleClearCache}>
              Clear Cache
            </button>
            <button
              className="secondary-btn"
              onClick={handleResetThrottle}
              disabled={timeUntilNextRequest === 0}
            >
              Reset Throttle
            </button>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="settings-info">
        <p className="info-text">
          Claude AI analyzes your lyrics in real-time to provide suggestions for rhymes, flow,
          word choice, and creative directions. All requests go through the backend proxy to
          protect your API keys.
        </p>
        <p className="info-text">
          <strong>Rate Limit:</strong> Max 10 requests per minute
        </p>
      </div>
    </div>
  );
}

export default AISettings;
