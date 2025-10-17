'use client';

import { useEffect } from 'react';
import { TransportControls } from '@/src/widgets/TransportControls/TransportControls';
import { useTransport, initializeTransport } from '@/src/core/transport';

export default function TransportDemo() {
  const { state, position, bpm } = useTransport();

  useEffect(() => {
    initializeTransport(120);
  }, []);

  const handleAddTrack = () => {
    console.log('Add Track clicked');
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
      {/* Transport Bar - Fixed at top */}
      <TransportControls
        onAddTrack={handleAddTrack}
        onUpload={handleUpload}
      />

      {/* Main Content Area - Waveform would go here */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Timeline Ruler */}
        <div style={{
          width: '100%',
          padding: '0 24px',
          color: 'var(--text-tertiary)',
          fontSize: 'var(--text-xs)',
          fontFamily: 'var(--font-mono)'
        }}>
          {/* Timeline markers */}
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

          {/* Waveform placeholder */}
          <div style={{
            marginTop: '40px',
            textAlign: 'center',
            color: 'var(--text-tertiary)',
            fontSize: 'var(--text-sm)'
          }}>
            <div style={{ marginBottom: '16px', fontSize: '48px', opacity: 0.3 }}>🎵</div>
            <div>Waveform Display Area</div>
            <div style={{ fontSize: 'var(--text-xs)', marginTop: '8px' }}>
              Transport State: <strong style={{ color: 'var(--text-primary)' }}>{state}</strong>
            </div>
            <div style={{ fontSize: 'var(--text-xs)', marginTop: '4px' }}>
              Position: <strong style={{ color: 'var(--text-primary)' }}>{position}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div style={{
        position: 'fixed',
        top: '20px',
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
          Transport Demo
        </div>
        <div style={{ marginBottom: '8px' }}>
          <strong>State:</strong> {state}
        </div>
        <div style={{ marginBottom: '8px' }}>
          <strong>BPM:</strong> {bpm}
        </div>
        <div style={{ marginBottom: '12px' }}>
          <strong>Position:</strong> {position}
        </div>
        <div style={{
          paddingTop: '12px',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '11px',
          lineHeight: '1.5'
        }}>
          <div style={{ marginBottom: '4px' }}>
            <kbd style={{
              background: 'var(--bg-tertiary)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px'
            }}>Space</kbd> Play/Pause
          </div>
          <div>
            Click buttons to interact
          </div>
        </div>
      </div>
    </div>
  );
}
