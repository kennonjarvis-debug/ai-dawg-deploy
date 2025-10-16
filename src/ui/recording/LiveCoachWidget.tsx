/**
 * LiveCoachWidget Component
 *
 * Displays real-time vocal coaching feedback during recording.
 * Shows pitch accuracy, vibrato detection, and AI suggestions.
 */

import React, { useState, useEffect } from 'react';
import { PitchAnalysisResult } from './AudioCapture';

export interface LiveCoachWidgetProps {
  isVisible: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  analysis?: PitchAnalysisResult;
}

export const LiveCoachWidget: React.FC<LiveCoachWidgetProps> = ({
  isVisible,
  position = 'top-right',
  analysis,
}) => {
  const [pitchHistory, setPitchHistory] = useState<number[]>([]);

  // Update pitch history
  useEffect(() => {
    if (analysis && analysis.detectedPitch > 0) {
      setPitchHistory((prev) => {
        const newHistory = [...prev, analysis.detectedPitch];
        // Keep last 50 pitches
        return newHistory.slice(-50);
      });
    }
  }, [analysis]);

  if (!isVisible) return null;

  const positionStyles = {
    'top-right': { top: '20px', right: '20px' },
    'top-left': { top: '20px', left: '20px' },
    'bottom-right': { bottom: '20px', right: '20px' },
    'bottom-left': { bottom: '20px', left: '20px' },
  };

  const getPitchAccuracyColor = (centsOffset: number): string => {
    if (Math.abs(centsOffset) < 10) return '#10b981'; // Green (in tune)
    if (Math.abs(centsOffset) < 25) return '#f59e0b'; // Orange (slightly off)
    return '#ef4444'; // Red (out of tune)
  };

  const getConfidencePercentage = (confidence: number): number => {
    return Math.round(confidence * 100);
  };

  return (
    <div
      style={{
        position: 'absolute',
        ...positionStyles[position],
        width: '300px',
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        border: '2px solid #374151',
        borderRadius: '12px',
        padding: '16px',
        color: '#f3f4f6',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        zIndex: 1000,
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: analysis ? '#10b981' : '#6b7280',
            animation: analysis ? 'pulse 2s infinite' : 'none',
          }}
        />
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
          Live Vocal Coach
        </h3>
      </div>

      {analysis ? (
        <>
          {/* Pitch Display */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>Pitch</span>
              <span style={{ fontSize: '12px', fontWeight: '500' }}>
                {analysis.noteName}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '24px', fontWeight: '700' }}>
                {analysis.detectedPitch.toFixed(1)} Hz
              </span>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: getPitchAccuracyColor(analysis.centsOffset),
                }}
              >
                {analysis.centsOffset > 0 ? '+' : ''}
                {analysis.centsOffset.toFixed(0)}¢
              </span>
            </div>
          </div>

          {/* Pitch Accuracy Bar */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
              Pitch Accuracy
            </div>
            <div
              style={{
                height: '8px',
                backgroundColor: '#374151',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.max(0, 100 - Math.abs(analysis.centsOffset) * 2)}%`,
                  backgroundColor: getPitchAccuracyColor(analysis.centsOffset),
                  transition: 'width 0.2s ease, background-color 0.2s ease',
                }}
              />
            </div>
          </div>

          {/* Confidence */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>Confidence</span>
              <span style={{ fontSize: '12px', fontWeight: '500' }}>
                {getConfidencePercentage(analysis.pitchConfidence)}%
              </span>
            </div>
            <div
              style={{
                height: '6px',
                backgroundColor: '#374151',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${getConfidencePercentage(analysis.pitchConfidence)}%`,
                  backgroundColor: '#3b82f6',
                  transition: 'width 0.2s ease',
                }}
              />
            </div>
          </div>

          {/* Vibrato Indicator */}
          {analysis.vibratoDetected && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: '#1e293b',
                borderRadius: '6px',
                marginBottom: '12px',
              }}
            >
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>
                Vibrato Detected
              </div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>
                {analysis.vibratoRate?.toFixed(1)} Hz
              </div>
            </div>
          )}

          {/* Correction Suggestion */}
          {analysis.correctionSuggestion && analysis.correctionSuggestion !== 'None' && (
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: '#1e3a8a',
                borderRadius: '6px',
                border: '1px solid #3b82f6',
              }}
            >
              <div style={{ fontSize: '11px', color: '#93c5fd', marginBottom: '4px' }}>
                💡 AI Suggestion
              </div>
              <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
                {analysis.correctionSuggestion}
              </div>
            </div>
          )}

          {/* Mini Pitch Graph */}
          {pitchHistory.length > 10 && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
                Pitch Stability
              </div>
              <div
                style={{
                  height: '40px',
                  backgroundColor: '#1f2937',
                  borderRadius: '4px',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '2px',
                }}
              >
                {pitchHistory.slice(-30).map((pitch, i) => {
                  const minPitch = Math.min(...pitchHistory);
                  const maxPitch = Math.max(...pitchHistory);
                  const range = maxPitch - minPitch || 1;
                  const heightPercent = ((pitch - minPitch) / range) * 100;

                  return (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: `${heightPercent}%`,
                        backgroundColor: '#3b82f6',
                        minHeight: '2px',
                        borderRadius: '2px',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '20px',
            color: '#6b7280',
          }}
        >
          <div style={{ fontSize: '14px' }}>Waiting for audio...</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>
            Start recording to see live feedback
          </div>
        </div>
      )}

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

export default LiveCoachWidget;
