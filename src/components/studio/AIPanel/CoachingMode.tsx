/**
 * Coaching Mode Component
 *
 * Chat interface for freestyle coaching with Claude AI.
 * Users can ask questions, get tips, and receive personalized feedback.
 *
 * Features:
 * - Real-time chat with Claude
 * - Conversation history
 * - Quick tip buttons
 * - Typing indicators
 * - Message persistence
 */

import React, { useState, useRef, useEffect } from 'react';
import { claudeClient } from '../../services/claudeClient';
import './CoachingMode.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface CoachingModeProps {
  initialMessage?: string;
}

export function CoachingMode({ initialMessage }: CoachingModeProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send initial message if provided
  useEffect(() => {
    if (initialMessage && messages.length === 0) {
      sendMessage(initialMessage);
    }
  }, [initialMessage]);

  /**
   * Send a message to Claude
   */
  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();

    if (!textToSend) {
      return;
    }

    // Add user message to chat
    const userMessage: Message = {
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      // Prepare conversation history
      const history = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call Claude API
      const response = await claudeClient.chat({
        message: textToSend,
        history,
      });

      // Add assistant response to chat
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get response';
      setError(errorMessage);
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  /**
   * Handle quick tip button clicks
   */
  const handleQuickTip = (tip: string) => {
    sendMessage(tip);
  };

  /**
   * Clear conversation history
   */
  const handleClearChat = () => {
    if (window.confirm('Clear conversation history?')) {
      setMessages([]);
      setError(null);
    }
  };

  return (
    <div className="coaching-mode">
      {/* Header */}
      <div className="coaching-header">
        <div className="header-title">
          <h3>Freestyle Coach</h3>
          <span className="subtitle">Ask Claude for tips and feedback</span>
        </div>
        {messages.length > 0 && (
          <button className="clear-chat-btn" onClick={handleClearChat} title="Clear chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Quick Tips */}
      {messages.length === 0 && (
        <div className="quick-tips">
          <p className="quick-tips-label">Quick questions:</p>
          <div className="quick-tip-buttons">
            <button
              className="quick-tip-btn"
              onClick={() => handleQuickTip('How can I improve my flow?')}
            >
              Improve flow
            </button>
            <button
              className="quick-tip-btn"
              onClick={() => handleQuickTip('Give me rhyme scheme ideas')}
            >
              Rhyme schemes
            </button>
            <button
              className="quick-tip-btn"
              onClick={() => handleQuickTip('Tips for better breath control?')}
            >
              Breath control
            </button>
            <button
              className="quick-tip-btn"
              onClick={() => handleQuickTip('How to create better punchlines?')}
            >
              Punchlines
            </button>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>Start a conversation with your AI coach</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <div className="message-avatar">
              {message.role === 'user' ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
              )}
            </div>
            <div className="message-content">
              <div className="message-text">{message.content}</div>
              <div className="message-time">
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message assistant">
            <div className="message-avatar">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
              </svg>
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="chat-error">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for tips, feedback, or advice..."
          disabled={isLoading}
        />
        <button type="submit" className="send-btn" disabled={!input.trim() || isLoading}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>
    </div>
  );
}

export default CoachingMode;
