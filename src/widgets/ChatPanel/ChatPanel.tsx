'use client';

import { FC, useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, X, Loader2, Zap, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useTrackStore } from '$lib/../core/store';
import { useTransport } from '$lib/../core/transport';
import { executeAction } from '$lib/ai/actions';
import styles from './ChatPanel.module.css';

import { logger } from '$lib/utils/logger';
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isAction?: boolean; // Mark action execution messages
}

interface ChatPanelProps {
  className?: string;
}

/**
 * ChatPanel Widget
 * AI vocal coach chat interface with streaming support
 */
export const ChatPanel: FC<ChatPanelProps> = ({ className }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<any>(null);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);

  const { tracks, activeTrackId } = useTrackStore();
  const { bpm } = useTransport();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (!isCollapsed && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCollapsed]);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Speech Recognition (STT)
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        logger.info('[ChatPanel] 🎤 Speech recognition supported');
        setIsSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          logger.info('[ChatPanel] 🎤 Speech recognized:', transcript);
          setInput((prev) => prev + ' ' + transcript);
          setIsRecording(false);
        };

        recognition.onerror = (event: any) => {
          logger.error('[ChatPanel] ❌ Speech recognition error:', event.error);
          setIsRecording(false);
        };

        recognition.onend = () => {
          logger.info('[ChatPanel] 🎤 Speech recognition ended');
          setIsRecording(false);
        };

        setSpeechRecognition(recognition);
      } else {
        logger.info('[ChatPanel] ⚠️ Speech recognition not supported');
      }

      // Speech Synthesis (TTS)
      if (window.speechSynthesis) {
        logger.info('[ChatPanel] 🔊 Speech synthesis supported');
        speechSynthesisRef.current = window.speechSynthesis;
      } else {
        logger.info('[ChatPanel] ⚠️ Speech synthesis not supported');
      }
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!speechRecognition) return;

    if (isRecording) {
      logger.info('[ChatPanel] 🛑 Stopping voice input');
      speechRecognition.stop();
      setIsRecording(false);
    } else {
      logger.info('[ChatPanel] 🎤 Starting voice input');
      try {
        speechRecognition.start();
        setIsRecording(true);
      } catch (error) {
        logger.error('[ChatPanel] ❌ Failed to start voice input:', error);
      }
    }
  };

  const speakText = (text: string) => {
    if (!speechSynthesisRef.current || !ttsEnabled) return;

    logger.info('[ChatPanel] 🔊 Speaking text:', text.substring(0, 50) + '...');

    // Cancel any ongoing speech
    speechSynthesisRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      logger.info('[ChatPanel] 🔊 Speech started');
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      logger.info('[ChatPanel] 🔊 Speech ended');
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      logger.error('[ChatPanel] ❌ Speech synthesis error:', event);
      setIsSpeaking(false);
    };

    speechSynthesisRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (speechSynthesisRef.current) {
      logger.info('[ChatPanel] 🛑 Stopping speech');
      speechSynthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    logger.info('[ChatPanel] 🚀 Sending message:', input.trim());

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare enhanced project context with full track details
      const activeTrack = tracks.find((t) => t.id === activeTrackId);
      const projectContext = {
        trackCount: tracks.length,
        currentTrack: activeTrack?.name || null,
        bpm,
        recordingDuration: activeTrack?.recordings[0]?.duration || null,
        tracks: tracks.map((t) => ({
          id: t.id,
          name: t.name,
          type: t.type,
          recordArm: t.recordArm,
          solo: t.solo,
          mute: t.mute,
          volume: t.volume,
          pan: t.pan,
        })),
      };

      logger.info('[ChatPanel] 📊 Project context:', projectContext);
      logger.info('[ChatPanel] 🔧 Tools enabled: true');

      // Determine which API to use
      const useMockAPI = process.env.NEXT_PUBLIC_USE_MOCK_AI === 'true';
      const aiProvider = process.env.NEXT_PUBLIC_AI_PROVIDER || 'anthropic';

      let apiEndpoint = '/api/chat'; // Default to Anthropic
      if (useMockAPI) {
        apiEndpoint = '/api/chat-mock';
      } else if (aiProvider === 'openai') {
        apiEndpoint = '/api/chat-openai';
      }

      logger.info('[ChatPanel] 🎯 Using API:', apiEndpoint, '(provider:', aiProvider, ', mock:', useMockAPI, ')');

      // Call chat API with streaming and tools enabled
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages
            .concat(userMessage)
            .filter((m) => m.role !== 'system') // Don't send system messages
            .map((m) => ({ role: m.role, content: m.content })),
          stream: true,
          enableTools: true, // Enable AI function calling
          projectContext,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('[ChatPanel] ❌ API error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      logger.info('[ChatPanel] ✅ API response received, starting stream...');

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let currentToolUse: { name: string; id: string; inputJson: string } | null = null;

      // Add empty assistant message that we'll update
      const assistantMessageIndex = messages.length + 1;
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        },
      ]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                logger.info('[ChatPanel] 🏁 Stream complete');

                // Speak the assistant's response if TTS is enabled
                if (assistantMessage.trim() && ttsEnabled) {
                  speakText(assistantMessage);
                }

                // If we have a pending tool use, execute it now
                if (currentToolUse) {
                  logger.info('[ChatPanel] 🔧 Executing pending tool:', currentToolUse.name);
                  logger.info('[ChatPanel] 📝 Tool input JSON:', currentToolUse.inputJson);
                  try {
                    const input = JSON.parse(currentToolUse.inputJson);
                    logger.info('[ChatPanel] 📋 Parsed tool input:', input);

                    const result = await executeAction(currentToolUse.name, input);
                    logger.info('[ChatPanel] ✅ Tool execution result:', result);

                    // Update the executing message with the result
                    setMessages((prev) => {
                      const updated = [...prev];
                      updated[updated.length - 1] = {
                        role: 'system',
                        content: result.success
                          ? `✅ ${result.message}`
                          : `❌ ${result.message}`,
                        timestamp: new Date(),
                        isAction: true,
                      };
                      return updated;
                    });

                    currentToolUse = null;
                  } catch (e) {
                    logger.error('[ChatPanel] ❌ Failed to execute tool:', e);
                  }
                }
                break;
              }

              try {
                const parsed = JSON.parse(data);
                logger.info('[ChatPanel] 📦 Parsed event:', parsed);

                // Handle text content
                if (parsed.text) {
                  assistantMessage += parsed.text;
                  logger.info('[ChatPanel] 💬 Text chunk received:', parsed.text);

                  // Update the assistant message in state
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[assistantMessageIndex] = {
                      role: 'assistant',
                      content: assistantMessage,
                      timestamp: new Date(),
                    };
                    return updated;
                  });
                }

                // Handle tool use start
                if (parsed.type === 'tool_use') {
                  const { name, id } = parsed;
                  logger.info('[ChatPanel] 🔧 Tool use started:', name, 'ID:', id);

                  // Start tracking this tool use
                  currentToolUse = {
                    name,
                    id,
                    inputJson: '',
                  };

                  // Show that AI is performing an action
                  setMessages((prev) => [
                    ...prev,
                    {
                      role: 'system',
                      content: `🤖 Executing: ${name}...`,
                      timestamp: new Date(),
                      isAction: true,
                    },
                  ]);
                }

                // Handle tool input chunks
                if (parsed.type === 'tool_input' && currentToolUse) {
                  logger.info('[ChatPanel] 📝 Tool input chunk:', parsed.partial_json);
                  // Accumulate the partial JSON
                  currentToolUse.inputJson += parsed.partial_json;
                }
              } catch (e) {
                logger.warn('[ChatPanel] ⚠️ Failed to parse JSON:', data, e);
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (error) {
      logger.error('[ChatPanel] ❌ Chat error:', error);

      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      logger.info('[ChatPanel] 🔄 Request complete, loading set to false');
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isCollapsed) {
    return (
      <div className={`${styles.chatPanelCollapsed} ${className || ''}`}>
        <button
          className={styles.expandButton}
          onClick={() => setIsCollapsed(false)}
          title="Open AI Coach"
        >
          <MessageSquare className={styles.icon} />
          <span className={styles.expandText}>AI Coach</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`${styles.chatPanel} ${className || ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <MessageSquare className={styles.headerIcon} />
          <div className={styles.headerText}>
            <h3 className={styles.title}>AI Vocal Coach</h3>
            <p className={styles.subtitle}>
              {isSpeaking ? '🔊 Speaking...' : 'Country music specialist'}
            </p>
          </div>
        </div>
        <div className={styles.headerActions}>
          {speechSynthesisRef.current && (
            <button
              className={styles.ttsButton}
              onClick={() => {
                if (isSpeaking) {
                  stopSpeaking();
                } else {
                  setTtsEnabled(!ttsEnabled);
                }
              }}
              title={isSpeaking ? 'Stop speaking' : (ttsEnabled ? 'Disable voice output' : 'Enable voice output')}
            >
              {isSpeaking ? (
                <VolumeX className={styles.icon} style={{ color: '#ef4444' }} />
              ) : ttsEnabled ? (
                <Volume2 className={styles.icon} />
              ) : (
                <VolumeX className={styles.icon} style={{ opacity: 0.5 }} />
              )}
            </button>
          )}
          <button
            className={styles.collapseButton}
            onClick={() => setIsCollapsed(true)}
            title="Close"
          >
            <X className={styles.icon} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {messages.length === 0 && (
          <div className={styles.emptyState}>
            <MessageSquare className={styles.emptyIcon} />
            <p className={styles.emptyText}>
              Ask me anything about singing, recording, or producing country music!
            </p>
            <div className={styles.suggestions}>
              <button
                className={styles.suggestion}
                onClick={() => setInput('How do I improve my vocal tone?')}
              >
                How do I improve my vocal tone?
              </button>
              <button
                className={styles.suggestion}
                onClick={() => setInput('What BPM is best for country ballads?')}
              >
                What BPM is best for country ballads?
              </button>
              <button
                className={styles.suggestion}
                onClick={() => setInput('How can I add emotion to my singing?')}
              >
                How can I add emotion to my singing?
              </button>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`${styles.message} ${
              message.role === 'user'
                ? styles.userMessage
                : message.role === 'system'
                ? styles.systemMessage
                : styles.assistantMessage
            }`}
          >
            <div className={styles.messageContent}>
              {message.isAction && (
                <div className={styles.actionBadge}>
                  <Zap style={{ width: '12px', height: '12px' }} />
                  <span>Action</span>
                </div>
              )}
              <div className={styles.messageText}>{message.content}</div>
              <div className={styles.messageTime}>{formatTime(message.timestamp)}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className={`${styles.message} ${styles.assistantMessage}`}>
            <div className={styles.messageContent}>
              <div className={styles.messageText}>
                <Loader2 className={styles.spinner} />
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={styles.inputContainer}>
        {isSpeechSupported && (
          <button
            className={`${styles.voiceButton} ${isRecording ? styles.voiceButtonActive : ''}`}
            onClick={toggleVoiceInput}
            disabled={isLoading}
            title={isRecording ? 'Stop recording' : 'Voice input'}
          >
            {isRecording ? (
              <MicOff className={styles.icon} style={{ color: '#ef4444' }} />
            ) : (
              <Mic className={styles.icon} />
            )}
          </button>
        )}
        <textarea
          ref={inputRef}
          className={styles.input}
          placeholder="Ask about singing, recording, production..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          disabled={isLoading || isRecording}
        />
        <button
          className={styles.sendButton}
          onClick={sendMessage}
          disabled={!input.trim() || isLoading || isRecording}
          title="Send message (Enter)"
        >
          <Send className={styles.icon} />
        </button>
      </div>
    </div>
  );
};
