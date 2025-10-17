/**
 * Header Component
 * Top bar with transport controls, journey button, and auth
 * Extracted from app/page.tsx to reduce component size
 */

'use client';

import { Map } from 'lucide-react';
import { TransportControls } from '@/src/widgets/TransportControls/TransportControls';
import { AuthHeader } from '@/src/widgets/AuthHeader/AuthHeader';

export interface HeaderProps {
  showSidebar: boolean;
  onToggleSidebar: () => void;
  onJourneyClick: () => void;
  onAddTrack: () => void;
  onUpload: () => void;
  audioContext?: AudioContext | null;
  mediaStream?: MediaStream | null;
}

export function Header({
  showSidebar,
  onToggleSidebar,
  onJourneyClick,
  onAddTrack,
  onUpload,
  audioContext,
  mediaStream,
}: HeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        zIndex: 100,
        height: '60px',
        flexShrink: 0,
      }}
    >
      {/* Sidebar Toggle Button */}
      <button
        onClick={onToggleSidebar}
        className="floating-card"
        style={{
          padding: '10px 16px',
          border: 'none',
          cursor: 'pointer',
          background: 'var(--surface-1)',
          color: 'var(--protools-cyan)',
          fontSize: '18px',
        }}
        aria-label={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
      >
        ☰
      </button>

      {/* Journey Button */}
      <button
        onClick={onJourneyClick}
        className="floating-card"
        style={{
          padding: '10px 16px',
          border: 'none',
          cursor: 'pointer',
          background:
            'linear-gradient(135deg, var(--protools-cyan), var(--protools-purple))',
          color: '#000',
          fontWeight: '600',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 229, 255, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 229, 255, 0.3)';
        }}
      >
        <Map size={18} />
        Start Journey
      </button>

      {/* Transport Controls Card */}
      <div
        className="floating-card"
        style={{
          flex: 1,
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <TransportControls
          onAddTrack={onAddTrack}
          onUpload={onUpload}
          audioContext={audioContext}
          mediaStream={mediaStream}
        />
      </div>

      {/* Auth Header Card */}
      <div
        className="floating-card"
        style={{
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <AuthHeader />
      </div>
    </div>
  );
}
