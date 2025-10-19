/**
 * DAW Command Chat Widget
 *
 * Natural language interface for controlling the DAW
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, Trash2, Zap, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../../api/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  result?: any;
}

interface DAWCommandChatWidgetProps {
  projectId: string;
  userId: string;
  currentState?: {
    tracks: any[];
    bpm: number;
    isPlaying: boolean;
    isRecording: boolean;
    currentTime: number;
  };
  onCommandExecuted?: (result: any) => void;
}

export const DAWCommandChatWidget: React.FC<DAWCommandChatWidgetProps> = ({
  projectId,
  userId,
  currentState,
  onCommandExecuted,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hey! I can help you control the DAW with natural language. Try commands like:\n\n- "Create a new track called Vocals"\n- "Set BPM to 120"\n- "Add reverb to track 2"\n- "Generate a hip-hop beat in C minor"\n- "Mix the vocals louder"',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendCommand = async (command: string) => {
    if (!command.trim() || isProcessing) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: command,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      // Send command to backend
      const response = await apiClient.request('POST', '/ai/daw-command', {
        command,
        userId,
        projectId,
        currentState: currentState || {
          tracks: [],
          bpm: 120,
          isPlaying: false,
          isRecording: false,
          currentTime: 0,
        },
      });

      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message || 'Command executed',
        timestamp: new Date(),
        result: response.result,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Show toast
      if (response.success) {
        toast.success(response.message);

        // Callback for parent component to handle result
        if (onCommandExecuted && response.result) {
          onCommandExecuted(response);
        }
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast.error(`Command failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendCommand(inputValue);
  };

  const handleVoiceInput = () => {
    // In production, this would use Web Speech API
    setIsListening(true);
    toast.info('Voice input not yet implemented');

    setTimeout(() => {
      setIsListening(false);
    }, 2000);
  };

  const clearHistory = async () => {
    try {
      await apiClient.request('DELETE', `/ai/daw-command/${userId}/history`);
      setMessages([
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Conversation history cleared. How can I help you?',
          timestamp: new Date(),
        },
      ]);
      toast.success('History cleared');
    } catch (error: any) {
      toast.error(`Failed to clear history: ${error.message}`);
    }
  };

  // Quick command suggestions
  const quickCommands = [
    'Create a new track',
    'Set BPM to 120',
    'Generate a trap beat',
    'Add reverb to track 1',
    'Start recording',
  ];

  const handleQuickCommand = (command: string) => {
    setInputValue(command);
    inputRef.current?.focus();
  };

  return (
    <div className="bg-gray-800 rounded-lg flex flex-col h-full max-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">DAW Command Chat</h3>
        </div>
        <button
          onClick={clearHistory}
          className="text-gray-400 hover:text-white transition-colors"
          title="Clear history"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-100'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">{message.content}</div>

              {/* Result Display */}
              {message.result && (
                <div className="mt-2 pt-2 border-t border-gray-600 text-xs space-y-1">
                  {Object.entries(message.result).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-2">
                      <span className="text-gray-400">{key}:</span>
                      <span className="font-semibold">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-1 text-xs opacity-60">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-gray-100 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 animate-pulse text-purple-400" />
                <span className="text-sm">Processing command...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Commands */}
      {messages.length === 1 && (
        <div className="px-4 py-2 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-2">Quick commands:</div>
          <div className="flex flex-wrap gap-2">
            {quickCommands.map((cmd, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickCommand(cmd)}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded-full transition-colors"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a command... e.g., 'Create a new track called Vocals'"
            disabled={isProcessing}
            className="flex-1 bg-gray-700 text-white placeholder-gray-400 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleVoiceInput}
            disabled={isProcessing || isListening}
            className={`p-2 rounded-lg transition-colors ${
              isListening
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Voice input"
          >
            <Mic className="w-5 h-5" />
          </button>
          <button
            type="submit"
            disabled={!inputValue.trim() || isProcessing}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          Powered by GPT-4 - Understands natural language commands
        </div>
      </form>
    </div>
  );
};
