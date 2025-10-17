'use client';

import { TrackSidebar } from '@/components/layout/track-sidebar';
import { MainWorkspace } from '@/components/layout/main-workspace';
import { AIChatPanel } from '@/components/chat/ai-chat-panel';
import { TransportBar } from '@/components/layout/transport-bar';

export default function Dashboard() {
  return (
    <div className="flex flex-col h-screen text-white">
      {/* Top: Premium Transport Bar */}
      <TransportBar />

      {/* Main Content - 3 Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Tracks */}
        <TrackSidebar />

        {/* Center - Main Workspace */}
        <MainWorkspace />

        {/* Right Panel - AI Chat */}
        <AIChatPanel />
      </div>
    </div>
  );
}
