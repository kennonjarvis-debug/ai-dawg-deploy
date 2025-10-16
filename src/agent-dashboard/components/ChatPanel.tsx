import React from 'react';
import { Sparkles, Copy } from 'lucide-react';
import { AIAnalysis } from '../types';
import { toast } from 'sonner';

interface ChatPanelProps {
  analysis: AIAnalysis | null;
  sessionId: string;
}

export function ChatPanel({ analysis, sessionId }: ChatPanelProps) {
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <Sparkles className="w-12 h-12 text-gray-600 mb-3" />
        <h3 className="text-lg font-semibold text-gray-400 mb-2">
          No AI Analysis Yet
        </h3>
        <p className="text-sm text-gray-500">
          Click "Analyze" on a terminal to get AI suggestions
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-gray-200">AI Suggestions</h3>
        </div>
        <p className="text-xs text-gray-500">
          Session: {sessionId}
        </p>
      </div>

      {/* Suggestions */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {analysis.suggestions.map((suggestion, index) => (
          <div
            key={index}
            className="bg-gray-800 border border-gray-700 rounded-lg p-3 group hover:border-purple-500 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-gray-300 flex-1">{suggestion}</p>
              <button
                onClick={() => handleCopy(suggestion)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-all"
                aria-label="Copy suggestion"
              >
                <Copy className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Timestamp */}
      <div className="p-3 border-t border-gray-700 text-xs text-gray-500 text-center">
        Updated {new Date(analysis.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}
