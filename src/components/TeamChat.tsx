'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ChatMessage {
  id: string;
  timestamp: string;
  from: string;
  to?: string;
  message: string;
  type: 'user' | 'agent' | 'system';
  read: boolean;
}

const AGENTS = ['alexis', 'tom', 'jerry', 'karen', 'max', 'alex'];

export function TeamChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const lastMessage = messages[messages.length - 1];
      const lastMessageTime = lastMessage ? lastMessage.timestamp : undefined;

      const params = new URLSearchParams();
      if (lastMessageTime) params.set('since', lastMessageTime);

      const response = await fetch(`/api/team-chat?${params}`);
      const data = await response.json();

      if (data.messages && data.messages.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newMessages = data.messages.filter((m: ChatMessage) => !existingIds.has(m.id));
          return [...prev, ...newMessages];
        });
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  // Auto-refresh messages every 2 seconds
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, []);

  // Send message
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/team-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'user',
          to: selectedAgent,
          message: inputMessage.trim(),
          type: 'user',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
        setInputMessage('');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
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

  const getMessageColor = (msg: ChatMessage) => {
    if (msg.type === 'system') return 'bg-gray-100 border-gray-300';
    if (msg.from === 'user') return 'bg-blue-100 border-blue-300';
    return 'bg-green-100 border-green-300';
  };

  const getAgentBadgeColor = (agent: string) => {
    const colors: Record<string, string> = {
      alexis: 'bg-purple-500',
      tom: 'bg-blue-500',
      jerry: 'bg-green-500',
      karen: 'bg-pink-500',
      max: 'bg-orange-500',
      alex: 'bg-red-500',
    };
    return colors[agent] || 'bg-gray-500';
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Team Chat</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Send to:</span>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="px-3 py-1 text-sm border rounded bg-white"
            >
              <option value="all">All Agents</option>
              {AGENTS.map((agent) => (
                <option key={agent} value={agent}>
                  {agent.charAt(0).toUpperCase() + agent.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 min-h-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Start a conversation with your team!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`p-3 rounded-lg border ${getMessageColor(msg)}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    className={`${msg.from === 'user' ? 'bg-blue-600' : getAgentBadgeColor(msg.from)} text-white text-xs`}
                  >
                    {msg.from === 'user' ? 'You' : msg.from}
                  </Badge>
                  {msg.to && msg.to !== 'all' && (
                    <>
                      <span className="text-xs text-gray-500">→</span>
                      <Badge
                        variant="outline"
                        className={`${getAgentBadgeColor(msg.to)} text-white text-xs`}
                      >
                        {msg.to}
                      </Badge>
                    </>
                  )}
                  <span className="text-xs text-gray-500 ml-auto">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="flex-1 px-3 py-2 text-sm border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>

        <div className="text-xs text-gray-500">
          💡 Tip: Agents monitor this chat. They'll see messages sent to "All Agents" or
          specifically to them.
        </div>
      </CardContent>
    </Card>
  );
}
