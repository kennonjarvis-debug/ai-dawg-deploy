/**
 * Header Component Tests
 * Tests for extracted header component from app/page.tsx
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Header } from './Header';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock widgets
vi.mock('@/src/widgets/TransportControls/TransportControls', () => ({
  TransportControls: ({ onAddTrack, onUpload }: any) => (
    <div data-testid="transport-controls">
      <button onClick={onAddTrack}>Add Track</button>
      <button onClick={onUpload}>Upload</button>
    </div>
  ),
}));

vi.mock('@/src/widgets/AuthHeader/AuthHeader', () => ({
  AuthHeader: () => <div data-testid="auth-header">Auth</div>,
}));

describe('Header Component', () => {
  const defaultProps = {
    showSidebar: true,
    onToggleSidebar: vi.fn(),
    onJourneyClick: vi.fn(),
    onAddTrack: vi.fn(),
    onUpload: vi.fn(),
  };

  it('renders all header elements', () => {
    render(<Header {...defaultProps} />);

    expect(screen.getByText('☰')).toBeInTheDocument();
    expect(screen.getByText('Start Journey')).toBeInTheDocument();
    expect(screen.getByTestId('transport-controls')).toBeInTheDocument();
    expect(screen.getByTestId('auth-header')).toBeInTheDocument();
  });

  it('calls onToggleSidebar when sidebar toggle button clicked', () => {
    render(<Header {...defaultProps} />);

    const toggleButton = screen.getByText('☰');
    fireEvent.click(toggleButton);

    expect(defaultProps.onToggleSidebar).toHaveBeenCalledTimes(1);
  });

  it('calls onJourneyClick when journey button clicked', () => {
    render(<Header {...defaultProps} />);

    const journeyButton = screen.getByText('Start Journey');
    fireEvent.click(journeyButton);

    expect(defaultProps.onJourneyClick).toHaveBeenCalledTimes(1);
  });

  it('passes callbacks to TransportControls', () => {
    render(<Header {...defaultProps} />);

    const addTrackButton = screen.getByText('Add Track');
    const uploadButton = screen.getByText('Upload');

    fireEvent.click(addTrackButton);
    fireEvent.click(uploadButton);

    expect(defaultProps.onAddTrack).toHaveBeenCalledTimes(1);
    expect(defaultProps.onUpload).toHaveBeenCalledTimes(1);
  });

  it('has correct layout structure with flex', () => {
    const { container } = render(<Header {...defaultProps} />);

    const headerElement = container.firstChild as HTMLElement;
    expect(headerElement).toHaveStyle({
      display: 'flex',
      gap: '12px',
    });
  });

  it('renders within height constraint (60px)', () => {
    const { container } = render(<Header {...defaultProps} />);

    const headerElement = container.firstChild as HTMLElement;
    expect(headerElement).toHaveStyle({
      height: '60px',
      flexShrink: '0',
    });
  });

  it('journey button has gradient background', () => {
    render(<Header {...defaultProps} />);

    const journeyButton = screen.getByText('Start Journey').closest('button');
    expect(journeyButton).toHaveStyle({
      background: 'linear-gradient(135deg, var(--protools-cyan), var(--protools-purple))',
    });
  });

  it('sidebar toggle button shows menu icon', () => {
    render(<Header {...defaultProps} />);

    const toggleButton = screen.getByText('☰');
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton.tagName).toBe('BUTTON');
  });

  it('journey button hover effects work', () => {
    render(<Header {...defaultProps} />);

    const journeyButton = screen.getByText('Start Journey').closest('button') as HTMLButtonElement;

    // Mouse enter
    fireEvent.mouseEnter(journeyButton);
    expect(journeyButton.style.transform).toBe('translateY(-2px)');

    // Mouse leave
    fireEvent.mouseLeave(journeyButton);
    expect(journeyButton.style.transform).toBe('translateY(0)');
  });

  it('renders with proper z-index for layering', () => {
    const { container } = render(<Header {...defaultProps} />);

    const headerElement = container.firstChild as HTMLElement;
    expect(headerElement).toHaveStyle({
      zIndex: '100',
    });
  });
});
