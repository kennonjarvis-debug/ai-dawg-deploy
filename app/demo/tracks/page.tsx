'use client';

import { useEffect } from 'react';
import { TransportControls } from '@/src/widgets/TransportControls/TransportControls';
import { TrackList } from '@/src/widgets/TrackList/TrackList';
import { initializeTransport } from '@/src/core/transport';
import { useTrackStore } from '@/src/core/store';

export default function TracksDemo() {
  const { addTrack } = useTrackStore();

  useEffect(() => {
    initializeTransport(120);
  }, []);

  const handleAddTrack = () => {
    addTrack('audio');
  };

  const handleUpload = () => {
    console.log('Upload clicked');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Transport Bar at top */}
      <TransportControls
        onAddTrack={handleAddTrack}
        onUpload={handleUpload}
      />

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Left Sidebar: Track List */}
        <div style={{
          width: '300px',
          borderRight: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <TrackList />
        </div>

        {/* Center: Waveform Area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-6)'
        }}>
          {/* Timeline Ruler */}
          <div style={{
            width: '100%',
            paddingBottom: '24px',
            color: 'var(--text-tertiary)',
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-mono)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              {['00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '02:52'].map((time, i) => (
                <div key={i}>{time}</div>
              ))}
            </div>
          </div>

          {/* Waveform placeholder */}
          <div style={{
            textAlign: 'center',
            color: 'var(--text-tertiary)',
            fontSize: 'var(--text-sm)'
          }}>
            <div style={{ marginBottom: '16px', fontSize: '64px', opacity: 0.2 }}>🎧</div>
            <div style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>
              Waveform Display Area
            </div>
            <div style={{ fontSize: 'var(--text-xs)' }}>
              Add tracks using the sidebar or the "+ Add Track" button
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-secondary)',
        maxWidth: '250px'
      }}>
        <div style={{ marginBottom: '12px', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
          Track Demo
        </div>
        <div style={{ marginBottom: '12px', fontSize: '11px', lineHeight: '1.6' }}>
          <strong>Features:</strong>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Add/remove tracks</li>
            <li>Solo/Mute/Record arm</li>
            <li>Volume control</li>
            <li>Duplicate tracks</li>
            <li>Double-click to rename</li>
          </ul>
        </div>
        <div style={{
          paddingTop: '12px',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '11px'
        }}>
          Click "+ Add Track" to get started
        </div>
      </div>
    </div>
  );
}
