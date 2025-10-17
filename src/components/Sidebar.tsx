/**
 * Sidebar Component
 * Left sidebar with project selector and AI chat
 * Extracted from app/page.tsx to reduce component size
 */

'use client';

import { ProjectSelector } from '@/src/widgets/ProjectSelector/ProjectSelector';
import { ChatPanel } from '@/src/widgets/ChatPanel/ChatPanel';

export interface SidebarProps {
  currentProjectId: string;
  currentProjectName: string;
  onProjectChange: (projectId: string) => void;
  onNewProject: () => void;
}

export function Sidebar({
  currentProjectId,
  currentProjectName,
  onProjectChange,
  onNewProject,
}: SidebarProps) {
  return (
    <div
      style={{
        width: '300px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        flexShrink: 0,
        minHeight: 0,
      }}
    >
      {/* Project Selector */}
      <div className="floating-card" style={{ padding: '12px' }}>
        <ProjectSelector
          currentProjectId={currentProjectId}
          currentProjectName={currentProjectName}
          onProjectChange={onProjectChange}
          onNewProject={onNewProject}
        />
      </div>

      {/* AI Coach */}
      <div
        className="floating-card"
        style={{
          flex: 1,
          padding: '12px',
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
            color: 'var(--protools-purple)',
            textShadow: '0 0 10px rgba(176, 102, 255, 0.5)',
            flexShrink: 0,
          }}
        >
          AI Coach
        </h2>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <ChatPanel />
        </div>
      </div>
    </div>
  );
}
