/**
 * Live Lyrics Widget with AI Analysis
 * Displays real-time transcribed lyrics during recording with AI-powered structure analysis
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface LyricsSegment {
  text: string;
  timestamp: number;
  start?: number;
  end?: number;
  isEditable?: boolean;
}

export interface SectionLabel {
  lineStart: number;
  lineEnd: number;
  sectionType: 'intro' | 'verse' | 'pre-chorus' | 'chorus' | 'bridge' | 'outro' | 'hook' | 'unknown';
  sectionNumber?: number;
  confidence: number;
  reasoning?: string;
}

export interface Recommendation {
  type: 'suggestion' | 'warning' | 'info';
  message: string;
  section?: string;
  reasoning: string;
  confidence?: number;
  accepted?: boolean;
}

export interface LyricsWidgetProps {
  isVisible: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  lyrics: LyricsSegment[];
  onLyricsEdit?: (editedLyrics: string) => void;
  autoScroll?: boolean;
  showTimestamps?: boolean;
  allowEdit?: boolean;
  currentTime?: number;
  trackId?: string;
  projectId?: string;
  userId?: string;
  websocketUrl?: string;
}

const GENRE_OPTIONS = [
  { value: 'pop', label: 'Pop' },
  { value: 'country', label: 'Country' },
  { value: 'hip-hop', label: 'Hip-Hop' },
  { value: 'rock', label: 'Rock' },
  { value: 'rnb', label: 'R&B' },
  { value: 'indie', label: 'Indie' },
  { value: 'folk', label: 'Folk' },
  { value: 'other', label: 'Other' },
];

const SECTION_COLORS: Record<string, string> = {
  intro: '#8b5cf6',
  verse: '#3b82f6',
  'pre-chorus': '#f59e0b',
  chorus: '#10b981',
  bridge: '#ec4899',
  outro: '#6366f1',
  hook: '#14b8a6',
  unknown: '#6b7280',
};

export const LyricsWidget: React.FC<LyricsWidgetProps> = ({
  isVisible,
  position = 'bottom-left',
  lyrics,
  onLyricsEdit,
  autoScroll = true,
  showTimestamps = false,
  allowEdit = true,
  currentTime = 0,
  trackId = 'track-1',
  projectId = 'project-1',
  userId = 'user-123',
  websocketUrl = 'http://localhost:3000',
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>(() => {
    return localStorage.getItem('lyrics-widget-genre') || 'pop';
  });
  const [sectionLabels, setSectionLabels] = useState<SectionLabel[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>('');
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [totalSessionCost, setTotalSessionCost] = useState(0);
  const [lastAnalysisCost, setLastAnalysisCost] = useState<number | null>(null);
  const [iterationCount, setIterationCount] = useState(0);
  const [maxIterations] = useState(3);
  const [showCostEstimate, setShowCostEstimate] = useState(false);

  const lyricsEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const socket = io(websocketUrl, {
      auth: { userId },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[LyricsWidget] WebSocket connected');
      if (projectId) {
        socket.emit('join:project', { projectId });
      }
    });

    socket.on('lyrics:analyzed', (data: any) => {
      console.log('[LyricsWidget] Received lyrics:analyzed event', data);
      if (data.trackId === trackId) {
        setIsAnalyzing(false);
        setAnalysisStatus('Analysis complete!');

        if (data.analysis?.cost) {
          setLastAnalysisCost(data.analysis.cost.totalCost);
          setTotalSessionCost(prev => prev + data.analysis.cost.totalCost);
        }

        setTimeout(() => setAnalysisStatus(''), 3000);
      }
    });

    socket.on('lyrics:section-labels-updated', (data: any) => {
      console.log('[LyricsWidget] Received section labels', data);
      if (data.trackId === trackId && data.sectionLabels) {
        setSectionLabels(data.sectionLabels);
      }
    });

    socket.on('lyrics:recommendations', (data: any) => {
      console.log('[LyricsWidget] Received recommendations', data);
      if (data.trackId === trackId && data.recommendations) {
        setRecommendations(data.recommendations.map((r: Recommendation) => ({
          ...r,
          accepted: false,
        })));
        setShowRecommendations(true);
      }
    });

    socket.on('disconnect', () => {
      console.log('[LyricsWidget] WebSocket disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [websocketUrl, userId, projectId, trackId]);

  // Auto-scroll to latest lyric
  useEffect(() => {
    if (autoScroll && lyricsEndRef.current && !showRecommendations) {
      lyricsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lyrics, autoScroll, showRecommendations]);

  // Update edited text when lyrics change
  useEffect(() => {
    if (!editMode) {
      setEditedText(lyrics.map(l => l.text).join('\n'));
    }
  }, [lyrics, editMode]);

  // Debounced lyrics update via WebSocket
  const sendLyricsUpdate = useCallback((lyricsText: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit('lyrics:update', {
          projectId,
          trackId,
          lyrics: lyricsText,
        });
      }
    }, 1000);
  }, [projectId, trackId]);

  // Update cost estimate when lyrics change
  useEffect(() => {
    const lyricsText = lyrics.map(l => l.text).join('\n');
    if (lyricsText.length > 0) {
      fetchCostEstimate(lyricsText);
    }
  }, [lyrics]);

  const fetchCostEstimate = async (lyricsText: string) => {
    try {
      const response = await fetch(
        `${websocketUrl.replace(/:\d+$/, ':3000')}/api/lyrics/cost-estimate?lyricsLength=${lyricsText.length}&includeGenreAdvice=true`
      );
      if (response.ok) {
        const data = await response.json();
        setEstimatedCost(data.estimate.estimatedCost);
      }
    } catch (error) {
      console.error('[LyricsWidget] Failed to fetch cost estimate:', error);
    }
  };

  const handleEditClick = () => {
    setEditedText(lyrics.map(l => l.text).join('\n'));
    setEditMode(true);
  };

  const handleSaveClick = () => {
    if (onLyricsEdit) {
      onLyricsEdit(editedText);
    }
    sendLyricsUpdate(editedText);
    setEditMode(false);
  };

  const handleCancelClick = () => {
    setEditMode(false);
  };

  const handleExport = () => {
    const text = lyrics.map(l => l.text).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lyrics-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    const text = lyrics.map(l => l.text).join('\n');
    navigator.clipboard.writeText(text);
  };

  const handleGenreChange = (genre: string) => {
    setSelectedGenre(genre);
    localStorage.setItem('lyrics-widget-genre', genre);
  };

  const handleAIAnalyze = async () => {
    const lyricsText = lyrics.map(l => l.text).join('\n');
    if (!lyricsText.trim()) {
      alert('No lyrics to analyze');
      return;
    }

    setIsAnalyzing(true);
    setIterationCount(0);
    setShowCostEstimate(false);

    try {
      // Simulate AI iteration process
      for (let i = 1; i <= maxIterations; i++) {
        setIterationCount(i);
        setAnalysisStatus(`AI is thinking... (Iteration ${i}/${maxIterations})`);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      setAnalysisStatus('Comparing results and picking best suggestions...');
      await new Promise(resolve => setTimeout(resolve, 600));

      // Make actual API call
      const response = await fetch(`${websocketUrl.replace(/:\d+$/, ':3000')}/api/lyrics/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lyrics: lyricsText,
          genre: selectedGenre,
          trackId,
          projectId,
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      console.log('[LyricsWidget] Analysis result:', result);

      // Events will be received via WebSocket
      setAnalysisStatus('Finalizing analysis...');
    } catch (error) {
      console.error('[LyricsWidget] AI analysis failed:', error);
      setIsAnalyzing(false);
      setAnalysisStatus('Analysis failed');
      setTimeout(() => setAnalysisStatus(''), 3000);
    }
  };

  const handleRecommendationAccept = (index: number) => {
    setRecommendations(prev =>
      prev.map((r, i) => i === index ? { ...r, accepted: !r.accepted } : r)
    );
  };

  const handleRecommendationDismiss = (index: number) => {
    setRecommendations(prev => prev.filter((_, i) => i !== index));
  };

  const scrollToSection = (lineStart: number) => {
    // Scroll to the section in the lyrics
    const lyricsContainer = containerRef.current?.querySelector('[data-lyrics-container]');
    if (lyricsContainer) {
      const lineElements = lyricsContainer.querySelectorAll('[data-line-index]');
      const targetLine = lineElements[lineStart];
      if (targetLine) {
        targetLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const getSectionLabel = (lineIndex: number): SectionLabel | null => {
    return sectionLabels.find(
      label => lineIndex >= label.lineStart && lineIndex <= label.lineEnd
    ) || null;
  };

  const isCurrentSegment = (segment: LyricsSegment): boolean => {
    if (!segment.start || !segment.end) return false;
    return currentTime >= segment.start && currentTime <= segment.end;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSectionName = (label: SectionLabel): string => {
    const type = label.sectionType.toUpperCase().replace('-', ' ');
    return label.sectionNumber ? `${type} ${label.sectionNumber}` : type;
  };

  const positionStyles = {
    'top-left': { top: '20px', left: '20px' },
    'top-right': { top: '20px', right: '20px' },
    'bottom-left': { bottom: '20px', left: '20px' },
    'bottom-right': { bottom: '20px', right: '20px' },
    'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
  };

  if (!isVisible) return null;

  const linesArray = lyrics.map(l => l.text);

  return (
    <div
      style={{
        position: 'absolute',
        ...positionStyles[position],
        width: showRecommendations ? '700px' : '400px',
        maxHeight: '600px',
        backgroundColor: 'rgba(20, 20, 30, 0.95)',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        zIndex: 1000,
        transition: 'width 0.3s ease',
      }}
      ref={containerRef}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          paddingBottom: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isAnalyzing ? '#f59e0b' : '#3b82f6',
              animation: isAnalyzing ? 'pulse-fast 1s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
          <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: '600' }}>
            Live Lyrics {isAnalyzing && '(AI Analyzing...)'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {!editMode && (
            <>
              <button
                onClick={handleCopy}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
                title="Copy to clipboard"
              >
                Copy
              </button>
              <button
                onClick={handleExport}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
                title="Export lyrics"
              >
                Export
              </button>
              {allowEdit && (
                <button
                  onClick={handleEditClick}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                  title="Edit lyrics"
                >
                  Edit
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* AI Controls */}
      {!editMode && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <select
              value={selectedGenre}
              onChange={(e) => handleGenreChange(e.target.value)}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
              disabled={isAnalyzing}
            >
              {GENRE_OPTIONS.map(option => (
                <option key={option.value} value={option.value} style={{ backgroundColor: '#1a1a2e' }}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleAIAnalyze}
              disabled={isAnalyzing || lyrics.length === 0}
              style={{
                padding: '8px 16px',
                backgroundColor: isAnalyzing ? 'rgba(59, 130, 246, 0.5)' : '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {isAnalyzing ? 'Analyzing...' : 'Ask AI for Help'}
            </button>
            {recommendations.length > 0 && (
              <button
                onClick={() => setShowRecommendations(!showRecommendations)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: showRecommendations ? '#10b981' : 'rgba(16, 185, 129, 0.2)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                {recommendations.length}
                {recommendations.length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#ef4444',
                    borderRadius: '50%',
                  }} />
                )}
              </button>
            )}
          </div>

          {/* Analysis Status */}
          {(isAnalyzing || analysisStatus) && (
            <div style={{
              padding: '8px 12px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#93c5fd',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              {isAnalyzing && (
                <div style={{
                  width: '12px',
                  height: '12px',
                  border: '2px solid #93c5fd',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
              )}
              <span>{analysisStatus}</span>
              {isAnalyzing && (
                <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.7 }}>
                  Step {iterationCount}/{maxIterations}
                </span>
              )}
            </div>
          )}

          {/* Cost Display */}
          {(estimatedCost !== null || lastAnalysisCost !== null) && (
            <div style={{
              marginTop: '8px',
              padding: '6px 10px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '6px',
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.7)',
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              <span>
                Est. cost: ${(estimatedCost || 0).toFixed(4)}
                {lastAnalysisCost !== null && ` | Last: $${lastAnalysisCost.toFixed(4)}`}
              </span>
              {totalSessionCost > 0 && (
                <span>Session: ${totalSessionCost.toFixed(4)}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {/* Lyrics Content */}
        <div
          style={{
            flex: showRecommendations ? '1' : '1',
            maxHeight: '400px',
            overflowY: 'auto',
            paddingRight: '8px',
          }}
          data-lyrics-container
        >
          {editMode ? (
            /* Edit Mode */
            <div>
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '300px',
                  padding: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  onClick={handleSaveClick}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  Save
                </button>
                <button
                  onClick={handleCancelClick}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Display Mode */
            <div>
              {lyrics.length === 0 ? (
                <div
                  style={{
                    padding: '32px',
                    textAlign: 'center',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '14px',
                  }}
                >
                  Waiting for lyrics...
                </div>
              ) : (
                lyrics.map((segment, index) => {
                  const sectionLabel = getSectionLabel(index);
                  const isNewSection = sectionLabel && (index === 0 || getSectionLabel(index - 1)?.sectionType !== sectionLabel.sectionType);

                  return (
                    <div key={index} data-line-index={index}>
                      {isNewSection && sectionLabel && (
                        <div
                          onClick={() => scrollToSection(sectionLabel.lineStart)}
                          style={{
                            marginTop: index > 0 ? '16px' : '0',
                            marginBottom: '8px',
                            padding: '4px 10px',
                            backgroundColor: `${SECTION_COLORS[sectionLabel.sectionType]}22`,
                            border: `1px solid ${SECTION_COLORS[sectionLabel.sectionType]}`,
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            color: SECTION_COLORS[sectionLabel.sectionType],
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            display: 'inline-block',
                            cursor: 'pointer',
                            animation: 'slideIn 0.3s ease-out',
                          }}
                          title={`Confidence: ${(sectionLabel.confidence * 100).toFixed(0)}%${sectionLabel.reasoning ? '\n' + sectionLabel.reasoning : ''}`}
                        >
                          {formatSectionName(sectionLabel)}
                          {sectionLabel.confidence < 0.7 && (
                            <span style={{ marginLeft: '6px', opacity: 0.6 }}>?</span>
                          )}
                          {sectionLabel.confidence >= 0.9 && (
                            <span style={{ marginLeft: '6px' }}>✓</span>
                          )}
                        </div>
                      )}
                      <div
                        style={{
                          padding: '8px 12px',
                          marginBottom: '4px',
                          backgroundColor: isCurrentSegment(segment)
                            ? 'rgba(59, 130, 246, 0.2)'
                            : sectionLabel
                            ? `${SECTION_COLORS[sectionLabel.sectionType]}11`
                            : 'transparent',
                          borderRadius: '6px',
                          borderLeft: isCurrentSegment(segment)
                            ? '3px solid #3b82f6'
                            : sectionLabel
                            ? `3px solid ${SECTION_COLORS[sectionLabel.sectionType]}66`
                            : '3px solid transparent',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {showTimestamps && segment.start !== undefined && (
                          <div
                            style={{
                              fontSize: '10px',
                              color: 'rgba(255, 255, 255, 0.5)',
                              marginBottom: '4px',
                            }}
                          >
                            {formatTime(segment.start)}
                          </div>
                        )}
                        <div
                          style={{
                            color: isCurrentSegment(segment)
                              ? '#ffffff'
                              : 'rgba(255, 255, 255, 0.9)',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            fontWeight: isCurrentSegment(segment) ? '500' : '400',
                          }}
                        >
                          {segment.text}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={lyricsEndRef} />
            </div>
          )}
        </div>

        {/* AI Recommendations Panel */}
        {showRecommendations && recommendations.length > 0 && (
          <div
            style={{
              width: '280px',
              maxHeight: '400px',
              overflowY: 'auto',
              paddingLeft: '12px',
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
              animation: 'slideInRight 0.3s ease-out',
            }}
          >
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span>AI Recommendations</span>
              <button
                onClick={() => setShowRecommendations(false)}
                style={{
                  padding: '2px 6px',
                  fontSize: '11px',
                  backgroundColor: 'transparent',
                  color: 'rgba(255, 255, 255, 0.5)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
            {recommendations.map((rec, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '12px',
                  padding: '10px',
                  backgroundColor: rec.accepted
                    ? 'rgba(16, 185, 129, 0.15)'
                    : rec.type === 'warning'
                    ? 'rgba(239, 68, 68, 0.1)'
                    : rec.type === 'suggestion'
                    ? 'rgba(59, 130, 246, 0.1)'
                    : 'rgba(156, 163, 175, 0.1)',
                  borderRadius: '8px',
                  border: `1px solid ${
                    rec.accepted
                      ? '#10b981'
                      : rec.type === 'warning'
                      ? '#ef4444'
                      : rec.type === 'suggestion'
                      ? '#3b82f6'
                      : '#6b7280'
                  }`,
                  animation: `fadeIn 0.3s ease-out ${index * 0.1}s both`,
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  marginBottom: '6px',
                }}>
                  <span style={{
                    fontSize: '16px',
                    lineHeight: 1,
                  }}>
                    {rec.type === 'warning' ? '⚠️' : rec.type === 'suggestion' ? '💡' : 'ℹ️'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#ffffff',
                      marginBottom: '4px',
                    }}>
                      {rec.message}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'rgba(255, 255, 255, 0.6)',
                      lineHeight: '1.4',
                    }}>
                      {rec.reasoning}
                    </div>
                    {rec.confidence !== undefined && (
                      <div style={{
                        marginTop: '6px',
                        fontSize: '10px',
                        color: 'rgba(255, 255, 255, 0.5)',
                      }}>
                        Confidence: {(rec.confidence * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '6px',
                  marginTop: '8px',
                }}>
                  <button
                    onClick={() => handleRecommendationAccept(index)}
                    style={{
                      flex: 1,
                      padding: '4px 8px',
                      fontSize: '11px',
                      backgroundColor: rec.accepted ? '#10b981' : 'rgba(16, 185, 129, 0.2)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '500',
                    }}
                  >
                    {rec.accepted ? 'Accepted ✓' : 'Accept'}
                  </button>
                  <button
                    onClick={() => handleRecommendationDismiss(index)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.7)',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {!editMode && lyrics.length > 0 && (
        <div
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.6)',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>{lyrics.length} segments</span>
          <span>{lyrics.reduce((acc, l) => acc + l.text.split(' ').length, 0)} words</span>
          {sectionLabels.length > 0 && (
            <span>{sectionLabels.length} sections</span>
          )}
        </div>
      )}

      {/* Animations */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }

          @keyframes pulse-fast {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.3;
              transform: scale(1.2);
            }
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};

export default LyricsWidget;
