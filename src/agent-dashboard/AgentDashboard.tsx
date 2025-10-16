import React, { useState } from 'react';
import { Terminal as TerminalIcon, Layout, StickyNote } from 'lucide-react';
import { TerminalGrid } from './components/TerminalGrid';
import { CommandBar } from './components/CommandBar';
import { ChatPanel } from './components/ChatPanel';
import { Notepad } from './components/Notepad';
import { MobileHotkeys } from './components/MobileHotkeys';
import { LatencyBadge } from './components/LatencyBadge';
import { OfflineBanner } from './components/OfflineBanner';
import { useTerminalStore } from './stores/terminalStore';
import { useTerminalWebSocket } from './hooks/useTerminalWebSocket';
import { toast } from 'sonner';
import './styles/mobile.css';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000';

export function AgentDashboard() {
  const [activePanel, setActivePanel] = useState<'chat' | 'notes'>('chat');
  const [showSidebar, setShowSidebar] = useState(true);

  const {
    sessions,
    analyses,
    isConnected,
    latency,
    activeSessionId,
  } = useTerminalStore();

  const { connect, sendData } = useTerminalWebSocket({
    url: WS_URL,
    autoConnect: true,
  });

  const handleCommand = (command: string) => {
    if (!activeSessionId) {
      toast.error('No active terminal session');
      return;
    }
    sendData(activeSessionId, command + '\n');
  };

  const handleAnalyze = async (sessionId: string) => {
    try {
      toast.loading('Analyzing terminal session...');
      const response = await fetch(`/api/ai/analyze?sessionId=${sessionId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      useTerminalStore.getState().setAnalysis(sessionId, {
        sessionId,
        suggestions: data.suggestions || [],
        timestamp: Date.now(),
      });

      toast.success('Analysis complete');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze terminal');
    }
  };

  const handleMobileKey = (key: string) => {
    if (!activeSessionId) return;

    const keyMap: Record<string, string> = {
      'Ctrl': '\x03',
      'Escape': '\x1b',
      'Tab': '\t',
      'ArrowLeft': '\x1b[D',
      'ArrowUp': '\x1b[A',
      'ArrowRight': '\x1b[C',
      'ArrowDown': '\x1b[B',
    };

    const mappedKey = keyMap[key];
    if (mappedKey) {
      sendData(activeSessionId, mappedKey);
    }
  };

  const activeAnalysis = activeSessionId ? analyses[activeSessionId] : null;

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100">
      {/* Offline Banner */}
      {!isConnected && <OfflineBanner onReconnect={connect} />}

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <TerminalIcon className="w-6 h-6 text-blue-500" />
          <h1 className="text-xl font-bold">AI Agent Terminal</h1>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
        </div>

        <div className="flex items-center gap-3">
          <LatencyBadge latency={latency} />

          {/* Sidebar Toggle (Desktop) */}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded transition-colors text-sm"
          >
            <Layout className="w-4 h-4" />
            {showSidebar ? 'Hide' : 'Show'} Panel
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Terminal Grid */}
        <div className="flex-1 flex flex-col">
          <TerminalGrid onAnalyze={handleAnalyze} />
          <CommandBar onCommand={handleCommand} />
        </div>

        {/* Sidebar (Chat/Notes) */}
        {showSidebar && (
          <div className="w-full lg:w-96 border-l border-gray-800 flex flex-col bg-gray-900">
            {/* Tabs */}
            <div className="flex border-b border-gray-800">
              <button
                onClick={() => setActivePanel('chat')}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors
                  ${activePanel === 'chat'
                    ? 'bg-gray-800 text-purple-400 border-b-2 border-purple-500'
                    : 'text-gray-500 hover:text-gray-300'
                  }
                `}
              >
                <TerminalIcon className="w-4 h-4" />
                AI Chat
              </button>
              <button
                onClick={() => setActivePanel('notes')}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors
                  ${activePanel === 'notes'
                    ? 'bg-gray-800 text-yellow-400 border-b-2 border-yellow-500'
                    : 'text-gray-500 hover:text-gray-300'
                  }
                `}
              >
                <StickyNote className="w-4 h-4" />
                Notes
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              {activePanel === 'chat' ? (
                <ChatPanel
                  analysis={activeAnalysis || null}
                  sessionId={activeSessionId || 'none'}
                />
              ) : (
                <Notepad />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Hotkeys */}
      <MobileHotkeys onKey={handleMobileKey} />

      {/* Session Count */}
      {sessions.length > 0 && (
        <div className="fixed bottom-4 left-4 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-full text-xs text-gray-400">
          {sessions.length} / 6 sessions
        </div>
      )}
    </div>
  );
}
