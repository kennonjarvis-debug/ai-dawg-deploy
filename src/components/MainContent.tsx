/**
 * MainContent Component
 * Main workspace with tracks list and waveform display
 * Extracted from app/page.tsx to reduce component size
 */

'use client';

import { TrackList } from '@/src/widgets/TrackList/TrackList';
import { WaveformDisplay } from '@/src/widgets/WaveformDisplay/WaveformDisplay';

export function MainContent() {
  return (
    <div
      className="floating-card"
      style={{
        flex: 1,
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        gap: '12px',
        minHeight: 0,
      }}
    >
      {/* Tracks Section */}
      <div
        style={{
          height: '35%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        <h2
          style={{
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '10px',
            color: 'var(--protools-cyan)',
            textShadow: '0 0 10px rgba(0, 229, 255, 0.5)',
            flexShrink: 0,
          }}
        >
          Tracks
        </h2>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <TrackList />
        </div>
      </div>

      {/* Waveform Section */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        <h2
          style={{
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '10px',
            color: 'var(--protools-blue)',
            textShadow: '0 0 10px rgba(0, 212, 255, 0.5)',
            flexShrink: 0,
          }}
        >
          Waveform
        </h2>
        <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <WaveformDisplay />
        </div>
      </div>
    </div>
  );
}
