import React from 'react';
import { Plus } from 'lucide-react';
import { TerminalCard } from './TerminalCard';
import { useTerminalStore } from '../stores/terminalStore';

interface TerminalGridProps {
  onAnalyze?: (sessionId: string) => void;
}

export function TerminalGrid({ onAnalyze }: TerminalGridProps) {
  const { sessions, maxSessions, createSession, closeSession } = useTerminalStore();

  const handleCreateSession = () => {
    const id = `terminal-${Date.now()}`;
    createSession(id);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Grid */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
          {sessions.map((session) => (
            <TerminalCard
              key={session.id}
              session={session}
              onClose={() => closeSession(session.id)}
              onAnalyze={() => onAnalyze?.(session.id)}
            />
          ))}

          {/* Add Terminal Button */}
          {sessions.length < maxSessions && (
            <button
              onClick={handleCreateSession}
              className="
                min-h-[200px] flex flex-col items-center justify-center gap-3
                bg-gray-900 border-2 border-dashed border-gray-700
                rounded-lg hover:border-gray-600 hover:bg-gray-800
                transition-all duration-200
              "
            >
              <Plus className="w-8 h-8 text-gray-500" />
              <span className="text-sm text-gray-500">
                Add Terminal ({sessions.length}/{maxSessions})
              </span>
            </button>
          )}
        </div>

        {sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="text-6xl mb-4">💻</div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No terminals</h3>
            <p className="text-gray-500 mb-6">
              Create your first terminal to get started
            </p>
            <button
              onClick={handleCreateSession}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              <Plus className="w-5 h-5 inline mr-2" />
              Create Terminal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
