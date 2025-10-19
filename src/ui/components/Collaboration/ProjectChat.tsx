/**
 * ProjectChat Component
 * Real-time chat interface for project collaboration
 */

import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../../../types/collaboration';

interface ProjectChatProps {
  messages: ChatMessage[];
  currentUserId: string | null;
  onSendMessage: (text: string, mentions?: string[]) => void;
  className?: string;
}

export const ProjectChat: React.FC<ProjectChatProps> = ({
  messages,
  currentUserId,
  onSendMessage,
  className = '',
}) => {
  const [messageText, setMessageText] = useState('');
  const [mentionSuggestions, setMentionSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!messageText.trim()) return;

    // Extract @mentions
    const mentions = messageText
      .match(/@\w+/g)
      ?.map((m) => m.substring(1)) || [];

    onSendMessage(messageText, mentions);
    setMessageText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className={`flex flex-col h-full bg-gray-800 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">Project Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => {
          const isOwnMessage = message.userId === currentUserId;

          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] ${
                  isOwnMessage ? 'items-end' : 'items-start'
                } flex flex-col`}
              >
                {/* Avatar and username */}
                {!isOwnMessage && (
                  <div className="flex items-center space-x-2 mb-1">
                    {message.avatar ? (
                      <img
                        src={message.avatar}
                        alt={message.username}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                        {message.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-medium text-gray-300">
                      {message.username}
                    </span>
                  </div>
                )}

                {/* Message bubble */}
                <div
                  className={`rounded-lg px-4 py-2 ${
                    isOwnMessage
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-100'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.text}
                  </p>

                  {/* Timestamp */}
                  <p
                    className={`text-xs mt-1 ${
                      isOwnMessage ? 'text-blue-200' : 'text-gray-400'
                    }`}
                  >
                    {formatTime(message.createdAt)}
                    {message.isEdited && ' (edited)'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">
              No messages yet. Start the conversation!
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex space-x-2">
          <textarea
            ref={inputRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message... (use @ to mention)"
            className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={1}
            style={{ maxHeight: '100px' }}
          />

          <button
            onClick={handleSend}
            disabled={!messageText.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Send
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};
