'use client';

import { Mic, Send, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAIChat } from '@/hooks/use-ai-chat';

export function AIChatPanel() {
  const [message, setMessage] = useState('');
  const { messages, isLoading, sendMessage } = useAIChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message;
    setMessage('');
    await sendMessage(userMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-96 border-l border-gray-800 flex flex-col bg-[#0f0f0f]">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-sm font-semibold uppercase text-gray-400">AI Coach</h2>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`rounded-lg p-4 border ${
                msg.role === 'assistant'
                  ? 'bg-[#1a1a1a] border-gray-700'
                  : 'bg-blue-900/20 border-blue-800/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    msg.role === 'assistant'
                      ? 'bg-blue-600'
                      : 'bg-gray-700'
                  }`}
                >
                  {msg.role === 'assistant' ? 'AI' : 'You'}
                </div>
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
                <div className="text-sm text-gray-400">Thinking...</div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-800 space-y-3">
        {/* Voice Input Button */}
        <button className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors">
          <Mic className="w-5 h-5" />
          <span>Hold to Speak</span>
        </button>

        {/* Text Input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:border-blue-600 text-sm disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-[#1a1a1a] border border-gray-700 hover:bg-[#252525] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!message.trim() || isLoading}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
