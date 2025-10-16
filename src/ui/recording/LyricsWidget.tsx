/**
 * Live Lyrics Widget
 * Displays real-time transcribed lyrics during recording
 */

import React, { useState, useEffect, useRef } from 'react';

export interface LyricsSegment {
  text: string;
  timestamp: number;
  start?: number;
  end?: number;
  isEditable?: boolean;
}

export interface LyricsWidgetProps {
  isVisible: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  lyrics: LyricsSegment[];
  onLyricsEdit?: (editedLyrics: string) => void;
  autoScroll?: boolean;
  showTimestamps?: boolean;
  allowEdit?: boolean;
  currentTime?: number; // For highlighting current lyric
}

export const LyricsWidget: React.FC<LyricsWidgetProps> = ({
  isVisible,
  position = 'bottom-left',
  lyrics,
  onLyricsEdit,
  autoScroll = true,
  showTimestamps = false,
  allowEdit = true,
  currentTime = 0,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editedText, setEditedText] = useState('');
  const lyricsEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest lyric
  useEffect(() => {
    if (autoScroll && lyricsEndRef.current) {
      lyricsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lyrics, autoScroll]);

  // Update edited text when lyrics change
  useEffect(() => {
    if (!editMode) {
      setEditedText(lyrics.map(l => l.text).join('\n'));
    }
  }, [lyrics, editMode]);

  const handleEditClick = () => {
    setEditedText(lyrics.map(l => l.text).join('\n'));
    setEditMode(true);
  };

  const handleSaveClick = () => {
    if (onLyricsEdit) {
      onLyricsEdit(editedText);
    }
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

  const isCurrentSegment = (segment: LyricsSegment): boolean => {
    if (!segment.start || !segment.end) return false;
    return currentTime >= segment.start && currentTime <= segment.end;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const positionStyles = {
    'top-left': { top: '20px', left: '20px' },
    'top-right': { top: '20px', right: '20px' },
    'bottom-left': { bottom: '20px', left: '20px' },
    'bottom-right': { bottom: '20px', right: '20px' },
    'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
  };

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        ...positionStyles[position],
        width: '400px',
        maxHeight: '500px',
        backgroundColor: 'rgba(20, 20, 30, 0.95)',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        zIndex: 1000,
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
              backgroundColor: '#3b82f6',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
          <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: '600' }}>
            Live Lyrics
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
                📋
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
                💾
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
                  ✏️
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Lyrics Content */}
      <div
        style={{
          maxHeight: '400px',
          overflowY: 'auto',
          paddingRight: '8px',
        }}
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
              lyrics.map((segment, index) => (
                <div
                  key={index}
                  style={{
                    padding: '8px 12px',
                    marginBottom: '4px',
                    backgroundColor: isCurrentSegment(segment)
                      ? 'rgba(59, 130, 246, 0.2)'
                      : 'transparent',
                    borderRadius: '6px',
                    borderLeft: isCurrentSegment(segment)
                      ? '3px solid #3b82f6'
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
              ))
            )}
            <div ref={lyricsEndRef} />
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
        </div>
      )}

      {/* Pulse Animation */}
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
        `}
      </style>
    </div>
  );
};

export default LyricsWidget;
