/**
 * Jarvis AI Chat Component
 * Real-time chat interface with Gemini/Claude AI
 * Uses streaming for better UX
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Brain, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  provider?: 'gemini' | 'claude';
  cost?: number;
}

export function JarvisAIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/jarvis/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          complexity: 'medium',
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        provider: data.provider,
        cost: data.cost,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.cost) {
        setTotalCost((prev) => prev + data.cost);
      }
    } catch (error) {
      console.error('Chat error:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600 rounded-lg">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Jarvis AI Assistant</h2>
            <p className="text-sm text-gray-400">Powered by Gemini & Claude</p>
          </div>
        </div>

        {/* Cost Display */}
        <div className="text-right">
          <p className="text-xs text-gray-500">Session Cost</p>
          <p className="text-sm font-mono text-green-400">
            ${totalCost.toFixed(4)}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Ask me anything! I can:</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Research music trends (FREE web search)</li>
              <li>• Analyze your data</li>
              <li>• Generate code</li>
              <li>• Create content</li>
              <li>• Search your documents</li>
            </ul>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-purple-600'
                  : 'bg-gray-800 border border-gray-700'
              }`}
            >
              <div className="prose prose-invert prose-sm">
                <p className="whitespace-pre-wrap m-0">{message.content}</p>
              </div>

              <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                <span>{message.timestamp.toLocaleTimeString()}</span>

                {message.provider && (
                  <>
                    <span>•</span>
                    <span
                      className={
                        message.provider === 'gemini'
                          ? 'text-blue-400'
                          : 'text-orange-400'
                      }
                    >
                      {message.provider}
                    </span>
                  </>
                )}

                {message.cost !== undefined && (
                  <>
                    <span>•</span>
                    <span className="text-green-400">
                      ${message.cost.toFixed(4)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
              <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Jarvis anything..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3
                     text-white placeholder-gray-500 resize-none focus:outline-none
                     focus:ring-2 focus:ring-purple-600"
            rows={2}
            disabled={isLoading}
          />

          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-6 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700
                     disabled:cursor-not-allowed rounded-lg transition-colors
                     flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        <p className="mt-2 text-xs text-gray-500 text-center">
          💡 Tip: Most requests use Gemini (FREE tier). Complex reasoning uses
          Claude.
        </p>
      </div>
    </div>
  );
}
