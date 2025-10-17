/**
 * Sidebar Component Tests
 * Tests for extracted sidebar component from app/page.tsx
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Sidebar } from './Sidebar';

// Mock widgets
vi.mock('@/src/widgets/ProjectSelector/ProjectSelector', () => ({
  ProjectSelector: ({
    currentProjectId,
    currentProjectName,
    onProjectChange,
    onNewProject,
  }: any) => (
    <div data-testid="project-selector">
      <span>{currentProjectName}</span>
      <button onClick={() => onProjectChange('project-1')}>Change Project</button>
      <button onClick={onNewProject}>New Project</button>
    </div>
  ),
}));

vi.mock('@/src/widgets/ChatPanel/ChatPanel', () => ({
  ChatPanel: () => <div data-testid="chat-panel">Chat</div>,
}));

describe('Sidebar Component', () => {
  const defaultProps = {
    currentProjectId: 'project-123',
    currentProjectName: 'My Project',
    onProjectChange: vi.fn(),
    onNewProject: vi.fn(),
  };

  it('renders project selector and chat panel', () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByTestId('project-selector')).toBeInTheDocument();
    expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
    expect(screen.getByText('My Project')).toBeInTheDocument();
  });

  it('displays AI Coach heading', () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByText('AI Coach')).toBeInTheDocument();
  });

  it('calls onProjectChange when project changed', () => {
    render(<Sidebar {...defaultProps} />);

    const changeButton = screen.getByText('Change Project');
    fireEvent.click(changeButton);

    expect(defaultProps.onProjectChange).toHaveBeenCalledWith('project-1');
  });

  it('calls onNewProject when new project clicked', () => {
    render(<Sidebar {...defaultProps} />);

    const newButton = screen.getByText('New Project');
    fireEvent.click(newButton);

    expect(defaultProps.onNewProject).toHaveBeenCalledTimes(1);
  });

  it('has correct width constraint (300px)', () => {
    const { container } = render(<Sidebar {...defaultProps} />);

    const sidebarElement = container.firstChild as HTMLElement;
    expect(sidebarElement).toHaveStyle({
      width: '300px',
      flexShrink: '0',
    });
  });

  it('uses flex column layout with gap', () => {
    const { container } = render(<Sidebar {...defaultProps} />);

    const sidebarElement = container.firstChild as HTMLElement;
    expect(sidebarElement).toHaveStyle({
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    });
  });

  it('has minHeight: 0 for flex overflow handling', () => {
    const { container } = render(<Sidebar {...defaultProps} />);

    const sidebarElement = container.firstChild as HTMLElement;
    expect(sidebarElement).toHaveStyle({
      minHeight: '0',
    });
  });

  it('chat panel container has flex: 1 and overflow', () => {
    const { container } = render(<Sidebar {...defaultProps} />);

    // Find the chat panel container (second floating-card div)
    const cards = container.querySelectorAll('.floating-card');
    const chatCard = cards[1] as HTMLElement;

    expect(chatCard).toHaveStyle({
      flex: '1',
      overflow: 'hidden',
      minHeight: '0',
    });
  });

  it('AI Coach heading has correct styling', () => {
    render(<Sidebar {...defaultProps} />);

    const heading = screen.getByText('AI Coach');
    expect(heading).toHaveStyle({
      fontSize: '14px',
      fontWeight: '600',
      color: 'var(--protools-purple)',
    });
  });

  it('project selector is in floating card', () => {
    const { container } = render(<Sidebar {...defaultProps} />);

    const projectCard = container.querySelector('.floating-card');
    expect(projectCard).toBeInTheDocument();
    expect(projectCard).toHaveStyle({
      padding: '12px',
    });
  });
});
