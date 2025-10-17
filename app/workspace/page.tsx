/**
 * Workspace Page - UI Redesign Phase 1.4
 *
 * Main workspace orchestrator with mode-based layouts.
 * Integrates mode context, grid system, and mode switcher.
 * Supports URL parameter sync (?mode=record).
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useModeContext } from '@/src/contexts/ModeContext';
import { GridContainer, GridArea, GridPanel } from '@/src/layouts/GridSystem';
import { ModeSwitcher } from '@/src/components/ModeSwitcher';
import type { WorkspaceMode } from '@/src/types/workspace';

function WorkspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mode, setMode, modeConfig } = useModeContext();
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Sync URL parameter with mode state
  useEffect(() => {
    const urlMode = searchParams.get('mode') as WorkspaceMode | null;

    if (urlMode && ['record', 'edit', 'mix', 'learn'].includes(urlMode)) {
      if (urlMode !== mode) {
        setMode(urlMode);
      }
    } else if (!urlMode) {
      // Add current mode to URL if not present
      const params = new URLSearchParams(searchParams.toString());
      params.set('mode', mode);
      router.replace(`/workspace?${params.toString()}`);
    }
  }, [searchParams, mode, setMode, router]);

  // Update URL when mode changes
  useEffect(() => {
    const currentUrlMode = searchParams.get('mode');
    if (currentUrlMode !== mode) {
      setIsTransitioning(true);
      const params = new URLSearchParams(searchParams.toString());
      params.set('mode', mode);
      router.replace(`/workspace?${params.toString()}`, { scroll: false });

      // Short transition delay for smoother UX
      const timer = setTimeout(() => setIsTransitioning(false), 150);
      return () => clearTimeout(timer);
    }
  }, [mode, searchParams, router]);

  return (
    <GridContainer className={isTransitioning ? 'transitioning' : ''}>
      {/* Header Area - Mode Switcher */}
      <GridArea area="header">
        <GridPanel variant="glass" padding={false}>
          <div style={{
            padding: '12px',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <ModeSwitcher />
            <div style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.4)',
              fontWeight: '500',
            }}>
              DAWG AI - Workspace
            </div>
          </div>
        </GridPanel>
      </GridArea>

      {/* Wave Area - Main content */}
      <GridArea area="wave">
        <GridPanel variant="glass">
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            marginBottom: '12px',
            background: 'linear-gradient(135deg, #00e5ff, #b066ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {modeConfig.label} Mode
          </h1>
          <p style={{
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.7)',
          }}>
            {modeConfig.description}
          </p>
        </GridPanel>
      </GridArea>

      {/* Controls Area */}
      <GridArea area="controls">
        <GridPanel>
          <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)' }}>
            Controls Area - Keyboard shortcut: <strong>"{modeConfig.keyboardShortcut.toUpperCase()}"</strong>
          </div>
        </GridPanel>
      </GridArea>

      {/* Mode-specific areas with placeholders */}
      {mode === 'record' && (
        <>
          <GridArea area="lyrics">
            <GridPanel variant="glass" scrollable>
              <h3 style={{ marginBottom: '8px', fontSize: '16px' }}>Lyrics</h3>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>Lyrics panel placeholder</p>
            </GridPanel>
          </GridArea>
          <GridArea area="pitch">
            <GridPanel>
              <h3 style={{ marginBottom: '8px', fontSize: '16px' }}>Pitch Monitor</h3>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>Real-time pitch tracking</p>
            </GridPanel>
          </GridArea>
          <GridArea area="coach">
            <GridPanel variant="glass">
              <h3 style={{ marginBottom: '8px', fontSize: '16px' }}>AI Coach</h3>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>Vocal coaching feedback</p>
            </GridPanel>
          </GridArea>
        </>
      )}

      {mode === 'edit' && (
        <>
          <GridArea area="tracks">
            <GridPanel scrollable>
              <h3 style={{ marginBottom: '8px', fontSize: '16px' }}>Tracks</h3>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>Track list panel</p>
            </GridPanel>
          </GridArea>
          <GridArea area="structure">
            <GridPanel variant="glass">
              <h3 style={{ marginBottom: '8px', fontSize: '16px' }}>Song Structure</h3>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>Verse/Chorus arrangement</p>
            </GridPanel>
          </GridArea>
        </>
      )}

      {mode === 'mix' && (
        <>
          <GridArea area="tracks">
            <GridPanel scrollable>
              <h3 style={{ marginBottom: '8px', fontSize: '16px' }}>Mix Tracks</h3>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>Mixer channels</p>
            </GridPanel>
          </GridArea>
          <GridArea area="effects">
            <GridPanel variant="glass" scrollable>
              <h3 style={{ marginBottom: '8px', fontSize: '16px' }}>Effects</h3>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>EQ, Compression, Reverb</p>
            </GridPanel>
          </GridArea>
        </>
      )}

      {mode === 'learn' && (
        <>
          <GridArea area="exercises">
            <GridPanel>
              <h3 style={{ marginBottom: '8px', fontSize: '16px' }}>Exercises</h3>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>Vocal exercises library</p>
            </GridPanel>
          </GridArea>
          <GridArea area="progress">
            <GridPanel variant="glass">
              <h3 style={{ marginBottom: '8px', fontSize: '16px' }}>Progress</h3>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>Skill development tracking</p>
            </GridPanel>
          </GridArea>
          <GridArea area="goals">
            <GridPanel>
              <h3 style={{ marginBottom: '8px', fontSize: '16px' }}>Goals</h3>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>Learning objectives</p>
            </GridPanel>
          </GridArea>
          <GridArea area="assessment">
            <GridPanel variant="glass">
              <h3 style={{ marginBottom: '8px', fontSize: '16px' }}>Vocal Assessment</h3>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>Voice analysis tools</p>
            </GridPanel>
          </GridArea>
          <GridArea area="dashboard">
            <GridPanel>
              <h3 style={{ marginBottom: '8px', fontSize: '16px' }}>Journey Dashboard</h3>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>Overall progress overview</p>
            </GridPanel>
          </GridArea>
        </>
      )}
    </GridContainer>
  );
}

/**
 * WorkspacePage - Main workspace entry point with URL parameter support
 *
 * Wraps content in Suspense for useSearchParams support.
 */
export default function WorkspacePage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-primary, #0a0a0a)',
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '14px',
      }}>
        Loading workspace...
      </div>
    }>
      <WorkspaceContent />
    </Suspense>
  );
}
