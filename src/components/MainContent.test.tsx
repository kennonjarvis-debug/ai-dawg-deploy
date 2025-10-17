/**
 * MainContent Component Tests
 * Tests for extracted main content component from app/page.tsx
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MainContent } from './MainContent';

// Mock widgets
vi.mock('@/src/widgets/TrackList/TrackList', () => ({
  TrackList: () => <div data-testid="track-list">Tracks</div>,
}));

vi.mock('@/src/widgets/WaveformDisplay/WaveformDisplay', () => ({
  WaveformDisplay: () => <div data-testid="waveform-display">Waveform</div>,
}));

describe('MainContent Component', () => {
  it('renders tracks and waveform sections', () => {
    render(<MainContent />);

    expect(screen.getByTestId('track-list')).toBeInTheDocument();
    expect(screen.getByTestId('waveform-display')).toBeInTheDocument();
  });

  it('displays section headings', () => {
    render(<MainContent />);

    expect(screen.getByText('Tracks')).toBeInTheDocument();
    expect(screen.getByText('Waveform')).toBeInTheDocument();
  });

  it('tracks heading has cyan color', () => {
    render(<MainContent />);

    const tracksHeading = screen.getByText('Tracks');
    expect(tracksHeading).toHaveStyle({
      color: 'var(--protools-cyan)',
      fontSize: '14px',
      fontWeight: '600',
    });
  });

  it('waveform heading has blue color', () => {
    render(<MainContent />);

    const waveformHeading = screen.getByText('Waveform');
    expect(waveformHeading).toHaveStyle({
      color: 'var(--protools-blue)',
      fontSize: '14px',
      fontWeight: '600',
    });
  });

  it('has correct flex layout structure', () => {
    const { container } = render(<MainContent />);

    const mainElement = container.firstChild as HTMLElement;
    expect(mainElement).toHaveStyle({
      flex: '1',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      minHeight: '0',
    });
  });

  it('has floating-card class for styling', () => {
    const { container } = render(<MainContent />);

    const mainElement = container.firstChild as HTMLElement;
    expect(mainElement).toHaveClass('floating-card');
  });

  it('tracks section has 35% height constraint', () => {
    const { container } = render(<MainContent />);

    // First section after main card
    const tracksSection = container.querySelector(
      'div.floating-card > div:first-child'
    ) as HTMLElement;

    expect(tracksSection).toHaveStyle({
      height: '35%',
      overflow: 'hidden',
      minHeight: '0',
    });
  });

  it('waveform section has flex: 1 to fill remaining space', () => {
    const { container } = render(<MainContent />);

    // Second section after main card
    const sections = container.querySelectorAll('div.floating-card > div');
    const waveformSection = sections[1] as HTMLElement;

    expect(waveformSection).toHaveStyle({
      flex: '1',
      overflow: 'hidden',
      minHeight: '0',
    });
  });

  it('both sections have scroll containers with overflowY: auto', () => {
    const { container } = render(<MainContent />);

    const scrollContainers = container.querySelectorAll(
      'div[style*="overflowY"]'
    );

    expect(scrollContainers.length).toBeGreaterThan(0);
  });

  it('headings have text shadow for glow effect', () => {
    render(<MainContent />);

    const tracksHeading = screen.getByText('Tracks');
    const waveformHeading = screen.getByText('Waveform');

    expect(tracksHeading).toHaveStyle({
      textShadow: '0 0 10px rgba(0, 229, 255, 0.5)',
    });

    expect(waveformHeading).toHaveStyle({
      textShadow: '0 0 10px rgba(0, 212, 255, 0.5)',
    });
  });
});
