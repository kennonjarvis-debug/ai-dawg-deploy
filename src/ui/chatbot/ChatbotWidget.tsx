/**
 * DAWG AI Chatbot Widget
 * React component for the onboarding assistant chatbot with subscription-based features
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChatAssistant, ChatMessage } from './chat_assistant';
import { SAMPLE_PROMPTS } from './prompt_templates';
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../backend/utils/logger';
import { LyricsWidget, LyricsSegment } from '../recording/LyricsWidget';

// Live coaching types
interface CoachingFeedback {
  id: string;
  type: 'tip' | 'correction' | 'encouragement' | 'metric';
  message: string;
  timestamp: number;
  priority: 'low' | 'medium' | 'high';
}

interface TranscriptLine {
  id: string;
  text: string;
  timestamp: number;
  confidence?: number;
  isFinal: boolean;
}

interface ChatbotWidgetProps {
  onGenerationRequest?: (type: string, params: any) => Promise<any>;
  onAudioPreview?: (audioUrl: string) => void;
  className?: string;
}

// Message limits per subscription tier
const MESSAGE_LIMITS = {
  free: 25,    // 25 messages per day
  pro: 500,    // 500 messages per day
  studio: 2000 // 2000 messages per day
};

// Feature access by tier
const FEATURES_BY_TIER = {
  free: ['Answer questions about features', 'View sample prompts'],
  pro: ['Generate lyrics and melodies', 'Clone your voice', 'Answer questions', 'AI Producer assistant'],
  studio: ['Generate complete songs', 'AI Music Generation', 'Clone your voice', 'Custom AI models', 'Priority assistance']
};

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  onGenerationRequest,
  onAudioPreview,
  className = '',
}) => {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSamples, setShowSamples] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'pro' | 'studio'>('free');

  // Live coaching state
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [coachingFeedback, setCoachingFeedback] = useState<CoachingFeedback[]>([]);
  const [coachingStats, setCoachingStats] = useState({
    wordsSpoken: 0,
    speakingTime: 0,
    averageConfidence: 0
  });

  const assistantRef = useRef<ChatAssistant>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const feedbackIntervalRef = useRef<any>(null);
  const speakingStartTimeRef = useRef<number>(0);

  // Fetch subscription tier
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!isAuthenticated || !user) {
        setSubscriptionTier('free');
        return;
      }

      try {
        // TODO: Replace with actual API call to fetch subscription
        setSubscriptionTier('free');
      } catch (error) {
        logger.error('Failed to fetch subscription:', { error });
        setSubscriptionTier('free');
      }
    };

    fetchSubscription();
  }, [isAuthenticated, user]);

  // Load message count from localStorage
  useEffect(() => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem('chatbot_usage');

    if (stored) {
      const { date, count } = JSON.parse(stored);
      if (date === today) {
        setMessageCount(count);
      } else {
        // Reset count for new day
        localStorage.setItem('chatbot_usage', JSON.stringify({ date: today, count: 0 }));
        setMessageCount(0);
      }
    }
  }, []);

  // Initialize assistant
  useEffect(() => {
    const assistant = new ChatAssistant();

    if (onGenerationRequest) {
      assistant.setGenerationHandler(onGenerationRequest);
    }

    if (onAudioPreview) {
      assistant.setAudioPreviewHandler(onAudioPreview);
    }

    assistantRef.current = assistant;

    // Generate welcome message based on auth and subscription
    const getWelcomeMessage = (): ChatMessage => {
      if (!isAuthenticated) {
        return {
          id: 'welcome',
          role: 'assistant',
          content: `Hey! 👋 I'm your DAWG AI assistant.\n\nPlease log in to access AI features:\n• Generate lyrics, melodies, and songs\n• Clone your voice\n• AI Producer assistance\n\nFor now, I can answer questions about our features!`,
          timestamp: new Date(),
          metadata: {
            suggestions: ['What is AutoTopline?', 'Tell me about pricing', 'How does voice cloning work?'],
          },
        };
      }

      const features = FEATURES_BY_TIER[subscriptionTier];
      const limit = MESSAGE_LIMITS[subscriptionTier];
      const remaining = limit - messageCount;

      return {
        id: 'welcome',
        role: 'assistant',
        content: `Hey! 👋 I'm your DAWG AI assistant.\n\nI can help you:\n${features.map(f => `• ${f}`).join('\n')}\n\n${subscriptionTier === 'free' ? `⚡ ${remaining}/${limit} messages remaining today (Free tier)` : `✨ ${remaining}/${limit} operations remaining today`}`,
        timestamp: new Date(),
        metadata: {
          suggestions: subscriptionTier === 'free'
            ? ['What features are available?', 'How to upgrade?', 'What is AutoTopline?']
            : ['Make a sad pop chorus', 'Generate lofi lyrics', 'Clone my voice'],
        },
      };
    };

    setMessages([getWelcomeMessage()]);
  }, [onGenerationRequest, onAudioPreview, isAuthenticated, subscriptionTier, messageCount]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle send message
  const handleSend = async () => {
    if (!input.trim() || !assistantRef.current) return;

    // Check message limits for paid users
    if (isAuthenticated && subscriptionTier !== 'free') {
      const limit = MESSAGE_LIMITS[subscriptionTier];
      if (messageCount >= limit) {
        const limitMessage: ChatMessage = {
          id: `limit-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ You've reached your daily limit of ${limit} operations. Your limit will reset tomorrow!`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, limitMessage]);
        return;
      }
    }

    // For unauthenticated users, block AI generation requests
    if (!isAuthenticated && (
      input.toLowerCase().includes('generate') ||
      input.toLowerCase().includes('create') ||
      input.toLowerCase().includes('make') ||
      input.toLowerCase().includes('clone')
    )) {
      const loginPrompt: ChatMessage = {
        id: `login-${Date.now()}`,
        role: 'assistant',
        content: `🔒 Please log in to use AI generation features.\n\nFree tier includes:\n• 25 operations per day\n• Auto-Align AI\n• Basic vocal coach\n\nUpgrade to Pro for unlimited access!`,
        timestamp: new Date(),
        metadata: {
          suggestions: ['Tell me about pricing', 'What is AutoTopline?'],
        },
      };
      setMessages(prev => [...prev, { id: `user-${Date.now()}`, role: 'user', content: input, timestamp: new Date() }, loginPrompt]);
      setInput('');
      return;
    }

    setIsLoading(true);

    try {
      const response = await assistantRef.current.processMessage(input);
      setMessages(assistantRef.current.getHistory());
      setInput('');

      // Increment message count for authenticated users
      if (isAuthenticated) {
        const newCount = messageCount + 1;
        setMessageCount(newCount);

        const today = new Date().toDateString();
        localStorage.setItem('chatbot_usage', JSON.stringify({ date: today, count: newCount }));
      }
    } catch (error) {
      logger.error('Chatbot error:', { error });
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `❌ Sorry, something went wrong. Please try again.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    handleSend();
  };

  // Handle sample prompt click
  const handleSampleClick = (sample: { label: string; prompt: string }) => {
    setInput(sample.prompt);
    setShowSamples(false);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Live Coaching Functions
  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        speakingStartTimeRef.current = Date.now();
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;

          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';

            // Add to transcript history
            const newLine: TranscriptLine = {
              id: `${Date.now()}-${Math.random()}`,
              text: transcript,
              timestamp: Date.now(),
              confidence,
              isFinal: true
            };
            setTranscript(prev => [...prev, newLine]);

            // Update stats
            const words = transcript.split(' ').length;
            setCoachingStats(prev => ({
              wordsSpoken: prev.wordsSpoken + words,
              speakingTime: (Date.now() - speakingStartTimeRef.current) / 1000,
              averageConfidence: confidence || prev.averageConfidence
            }));

            // Generate coaching feedback
            generateCoachingFeedback(transcript);
          } else {
            interimTranscript += transcript;
          }
        }

        setCurrentTranscript(interimTranscript || finalTranscript);
      };

      recognition.onerror = (event: any) => {
        logger.error('Speech recognition error:', { error: event.error });
        if (event.error === 'no-speech') {
          // Don't stop on no-speech, just continue
          return;
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        if (isListening && isLiveMode) {
          // Restart if still in live mode
          recognition.start();
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      return true;
    }
    return false;
  };

  const generateCoachingFeedback = (text: string) => {
    const lowerText = text.toLowerCase();
    const feedbackList: CoachingFeedback[] = [];

    // Analyze text and provide coaching
    if (lowerText.includes('um') || lowerText.includes('uh')) {
      feedbackList.push({
        id: `fb-${Date.now()}-1`,
        type: 'tip',
        message: 'Try to minimize filler words like "um" and "uh" for clearer communication',
        timestamp: Date.now(),
        priority: 'low'
      });
    }

    if (lowerText.split(' ').length > 20) {
      feedbackList.push({
        id: `fb-${Date.now()}-2`,
        type: 'encouragement',
        message: 'Great flow! You\'re maintaining good rhythm in your speech.',
        timestamp: Date.now(),
        priority: 'low'
      });
    }

    if (lowerText.includes('lyric') || lowerText.includes('song') || lowerText.includes('melody')) {
      feedbackList.push({
        id: `fb-${Date.now()}-3`,
        type: 'tip',
        message: 'Consider using DAWG AI\'s AutoTopline feature to generate melodies from your lyrics!',
        timestamp: Date.now(),
        priority: 'medium'
      });
    }

    if (feedbackList.length > 0) {
      setCoachingFeedback(prev => [...prev, ...feedbackList].slice(-10));
    }
  };

  const toggleLiveMode = () => {
    const newLiveMode = !isLiveMode;
    setIsLiveMode(newLiveMode);

    if (newLiveMode) {
      // Initialize speech recognition
      const initialized = initializeSpeechRecognition();
      if (!initialized) {
        alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
        setIsLiveMode(false);
        return;
      }

      // Clear previous session data
      setTranscript([]);
      setCurrentTranscript('');
      setCoachingFeedback([]);
      setCoachingStats({ wordsSpoken: 0, speakingTime: 0, averageConfidence: 0 });
    } else {
      // Stop speech recognition
      if (recognitionRef.current) {
        setIsListening(false);
        recognitionRef.current.stop();
      }
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (feedbackIntervalRef.current) {
        clearInterval(feedbackIntervalRef.current);
      }
    };
  }, []);

  // Convert transcript to lyrics segments for LyricsWidget
  const lyricsSegments: LyricsSegment[] = transcript.map(line => ({
    text: line.text,
    timestamp: line.timestamp,
    start: line.timestamp / 1000, // Convert to seconds
    end: (line.timestamp / 1000) + 2, // Estimate 2 second duration per line
    isEditable: true
  }));

  return (
    <>
      {/* Lyrics Widget - Shows alongside chatbot in live mode */}
      {isLiveMode && isExpanded && (
        <LyricsWidget
          isVisible={true}
          position="bottom-right"
          lyrics={lyricsSegments}
          autoScroll={true}
          showTimestamps={false}
          allowEdit={false}
        />
      )}

      <div className={`chatbot-widget ${isExpanded ? 'expanded' : 'collapsed'} ${className}`}>
      {/* Toggle Button */}
      <button
        className="chatbot-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label={isExpanded ? 'Close chatbot' : 'Open chatbot'}
      >
        {isExpanded ? '✕' : '💬'}
      </button>

      {/* Chat Window */}
      {isExpanded && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-content">
              <span className="chatbot-title">DAWG AI Assistant</span>
              <span className="chatbot-status">● Online</span>
            </div>
            <div className="chatbot-header-actions">
              <button
                className={`chatbot-live-coach-btn ${isLiveMode ? 'active' : ''}`}
                onClick={toggleLiveMode}
                title="Toggle Live Coach"
              >
                🎤
              </button>
              <button
                className="chatbot-samples-btn"
                onClick={() => setShowSamples(!showSamples)}
                title="Sample prompts"
              >
                ✨
              </button>
              <button
                className="chatbot-clear-btn"
                onClick={() => {
                  assistantRef.current?.clearHistory();
                  setMessages([]);
                }}
                title="Clear chat"
              >
                🗑️
              </button>
            </div>
          </div>

          {/* Sample Prompts Panel */}
          {showSamples && !isLiveMode && (
            <div className="chatbot-samples">
              <h3>Quick Prompts</h3>
              {Object.entries(SAMPLE_PROMPTS).map(([category, samples]) => (
                <div key={category} className="chatbot-sample-category">
                  <h4>{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                  {samples.map((sample, idx) => (
                    <button
                      key={idx}
                      className="chatbot-sample-item"
                      onClick={() => handleSampleClick(sample)}
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Live Coaching Panel */}
          {isLiveMode && (
            <div className="live-coaching-panel">
              <div className="live-coaching-header">
                <div className="live-coaching-status">
                  <div className={`status-indicator ${isListening ? 'listening' : 'paused'}`} />
                  <span>{isListening ? 'Listening...' : 'Paused'}</span>
                </div>
                <button
                  className="live-coach-control-btn"
                  onClick={toggleListening}
                >
                  {isListening ? '⏸️ Pause' : '▶️ Start'}
                </button>
              </div>

              <div className="live-coaching-content">
                {/* Transcript Section */}
                <div className="live-transcript-section">
                  <div className="section-label">Transcript</div>
                  <div className="transcript-display">
                    {transcript.map((line) => (
                      <div key={line.id} className="transcript-line">
                        <span className="transcript-text">{line.text}</span>
                        {line.confidence !== undefined && (
                          <span className={`confidence-badge ${line.confidence > 0.8 ? 'high' : line.confidence > 0.5 ? 'med' : 'low'}`}>
                            {Math.round(line.confidence * 100)}%
                          </span>
                        )}
                      </div>
                    ))}
                    {currentTranscript && (
                      <div className="transcript-line interim">
                        <span className="transcript-text">{currentTranscript}</span>
                        <span className="interim-badge">...</span>
                      </div>
                    )}
                    {transcript.length === 0 && !currentTranscript && (
                      <div className="empty-state">
                        {isListening ? 'Speak to see your words transcribed...' : 'Press Start to begin'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Coaching Feedback Section */}
                <div className="live-feedback-section">
                  <div className="section-label">AI Coaching</div>
                  <div className="feedback-display">
                    {coachingFeedback.map((feedback) => (
                      <div key={feedback.id} className={`feedback-item ${feedback.type} priority-${feedback.priority}`}>
                        <div className="feedback-icon">
                          {feedback.type === 'tip' ? '💡' : feedback.type === 'correction' ? '⚠️' : feedback.type === 'encouragement' ? '✨' : '📊'}
                        </div>
                        <div className="feedback-message">{feedback.message}</div>
                      </div>
                    ))}
                    {coachingFeedback.length === 0 && (
                      <div className="empty-state">
                        AI will provide real-time coaching as you speak
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats Section */}
                <div className="live-stats-section">
                  <div className="stat-item">
                    <div className="stat-label">Words</div>
                    <div className="stat-value">{coachingStats.wordsSpoken}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Time</div>
                    <div className="stat-value">{Math.round(coachingStats.speakingTime)}s</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Confidence</div>
                    <div className="stat-value">{Math.round(coachingStats.averageConfidence * 100)}%</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Messages and Input (Non-Live Mode) */}
          {!isLiveMode && (
            <div className="chatbot-content">
              <div className="chatbot-messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`chatbot-message ${msg.role}`}>
                  <div className="chatbot-message-content">
                    {msg.content}
                  </div>

                  {/* Suggestions */}
                  {msg.metadata?.suggestions && msg.metadata.suggestions.length > 0 && (
                    <div className="chatbot-suggestions">
                      {msg.metadata.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          className="chatbot-suggestion-chip"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Generated Content Preview */}
                  {msg.metadata?.generatedContent && (
                    <div className="chatbot-generated-preview">
                      <div className="chatbot-preview-label">Generated Content:</div>
                      <pre className="chatbot-preview-content">
                        {JSON.stringify(msg.metadata.generatedContent, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="chatbot-message assistant">
                  <div className="chatbot-typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="chatbot-input-container">
                <input
                  ref={inputRef}
                  type="text"
                  className="chatbot-input"
                  placeholder="Ask me anything or describe what you want to create..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                />
                <button
                  className="chatbot-send-btn"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                >
                  {isLoading ? '⏳' : '➤'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Styles */}
      <style>{`
        .chatbot-widget {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 1000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .chatbot-toggle {
          width: 60px;
          height: 60px;
          border-radius: 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .chatbot-toggle:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }

        .chatbot-window {
          position: absolute;
          bottom: 80px;
          right: 0;
          width: 400px;
          height: 600px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .chatbot-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chatbot-header-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .chatbot-title {
          font-weight: 600;
          font-size: 16px;
        }

        .chatbot-status {
          font-size: 12px;
          opacity: 0.9;
        }

        .chatbot-header-actions {
          display: flex;
          gap: 8px;
        }

        .chatbot-samples-btn,
        .chatbot-clear-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          transition: background 0.2s;
        }

        .chatbot-samples-btn:hover,
        .chatbot-clear-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .chatbot-samples {
          background: #f7f7f7;
          padding: 16px;
          max-height: 250px;
          overflow-y: auto;
          border-bottom: 1px solid #e0e0e0;
        }

        .chatbot-samples h3 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        .chatbot-sample-category {
          margin-bottom: 16px;
        }

        .chatbot-sample-category h4 {
          margin: 0 0 8px 0;
          font-size: 12px;
          font-weight: 500;
          color: #666;
          text-transform: uppercase;
        }

        .chatbot-sample-item {
          display: block;
          width: 100%;
          text-align: left;
          background: white;
          border: 1px solid #e0e0e0;
          padding: 8px 12px;
          margin-bottom: 6px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .chatbot-sample-item:hover {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }

        .chatbot-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .chatbot-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background: #f9f9f9;
        }

        .chatbot-message {
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
        }

        .chatbot-message.user {
          align-items: flex-end;
        }

        .chatbot-message.assistant {
          align-items: flex-start;
        }

        .chatbot-message-content {
          max-width: 80%;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.5;
          white-space: pre-wrap;
        }

        .chatbot-message.user .chatbot-message-content {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .chatbot-message.assistant .chatbot-message-content {
          background: white;
          color: #333;
          border: 1px solid #e0e0e0;
        }

        .chatbot-suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
          max-width: 80%;
        }

        .chatbot-suggestion-chip {
          background: white;
          border: 1px solid #667eea;
          color: #667eea;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .chatbot-suggestion-chip:hover {
          background: #667eea;
          color: white;
        }

        .chatbot-generated-preview {
          margin-top: 8px;
          max-width: 80%;
          background: #f0f0f0;
          border-radius: 8px;
          padding: 12px;
        }

        .chatbot-preview-label {
          font-size: 12px;
          font-weight: 600;
          color: #666;
          margin-bottom: 8px;
        }

        .chatbot-preview-content {
          font-size: 11px;
          color: #333;
          margin: 0;
          max-height: 150px;
          overflow: auto;
          background: white;
          padding: 8px;
          border-radius: 4px;
        }

        .chatbot-typing-indicator {
          display: flex;
          gap: 4px;
          padding: 12px 16px;
          background: white;
          border-radius: 12px;
          border: 1px solid #e0e0e0;
        }

        .chatbot-typing-indicator span {
          width: 8px;
          height: 8px;
          background: #999;
          border-radius: 50%;
          animation: typing 1.4s infinite;
        }

        .chatbot-typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .chatbot-typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: translateY(0);
          }
          30% {
            opacity: 1;
            transform: translateY(-4px);
          }
        }

        .chatbot-input-container {
          display: flex;
          gap: 8px;
          padding: 16px;
          background: white;
          border-top: 1px solid #e0e0e0;
        }

        .chatbot-input {
          flex: 1;
          border: 1px solid #e0e0e0;
          border-radius: 24px;
          padding: 10px 16px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }

        .chatbot-input:focus {
          border-color: #667eea;
        }

        .chatbot-send-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .chatbot-send-btn:hover:not(:disabled) {
          transform: scale(1.05);
        }

        .chatbot-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Live Coaching Styles */
        .chatbot-live-coach-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
        }

        .chatbot-live-coach-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .chatbot-live-coach-btn.active {
          background: #10b981;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .live-coaching-panel {
          background: #f7f7f7;
          padding: 16px;
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .live-coaching-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid #e0e0e0;
        }

        .live-coaching-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        .status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #9ca3af;
        }

        .status-indicator.listening {
          background: #10b981;
          animation: pulse 1.5s infinite;
        }

        .status-indicator.paused {
          background: #f59e0b;
        }

        .live-coach-control-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .live-coach-control-btn:hover {
          transform: scale(1.05);
        }

        .live-coaching-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow: hidden;
        }

        .live-transcript-section,
        .live-feedback-section {
          background: white;
          border-radius: 8px;
          padding: 12px;
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .section-label {
          font-size: 12px;
          font-weight: 600;
          color: #667eea;
          text-transform: uppercase;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }

        .transcript-display,
        .feedback-display {
          flex: 1;
          overflow-y: auto;
          font-size: 14px;
          line-height: 1.6;
        }

        .transcript-line {
          padding: 8px;
          margin-bottom: 6px;
          background: #f9fafb;
          border-radius: 6px;
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 8px;
        }

        .transcript-line.interim {
          background: #fef3c7;
          border-left: 3px solid #f59e0b;
        }

        .transcript-text {
          flex: 1;
          color: #333;
        }

        .confidence-badge {
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
          white-space: nowrap;
        }

        .confidence-badge.high {
          background: #d1fae5;
          color: #065f46;
        }

        .confidence-badge.med {
          background: #fed7aa;
          color: #92400e;
        }

        .confidence-badge.low {
          background: #fecaca;
          color: #991b1b;
        }

        .interim-badge {
          font-size: 11px;
          color: #f59e0b;
          font-weight: 600;
        }

        .feedback-item {
          display: flex;
          gap: 10px;
          padding: 10px;
          margin-bottom: 8px;
          border-radius: 8px;
          background: #f9fafb;
          border-left: 3px solid #e5e7eb;
        }

        .feedback-item.tip {
          border-left-color: #3b82f6;
          background: #eff6ff;
        }

        .feedback-item.correction {
          border-left-color: #f59e0b;
          background: #fffbeb;
        }

        .feedback-item.encouragement {
          border-left-color: #10b981;
          background: #f0fdf4;
        }

        .feedback-item.metric {
          border-left-color: #8b5cf6;
          background: #faf5ff;
        }

        .feedback-icon {
          font-size: 18px;
          flex-shrink: 0;
        }

        .feedback-message {
          flex: 1;
          font-size: 13px;
          color: #374151;
          line-height: 1.5;
        }

        .live-stats-section {
          display: flex;
          gap: 12px;
          background: white;
          border-radius: 8px;
          padding: 12px;
        }

        .stat-item {
          flex: 1;
          text-align: center;
          padding: 8px;
          background: #f9fafb;
          border-radius: 6px;
        }

        .stat-label {
          font-size: 11px;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 4px;
          letter-spacing: 0.5px;
        }

        .stat-value {
          font-size: 18px;
          font-weight: 700;
          color: #667eea;
        }

        .empty-state {
          text-align: center;
          padding: 32px 16px;
          color: #9ca3af;
          font-size: 13px;
          font-style: italic;
        }

        @media (max-width: 480px) {
          .chatbot-window {
            width: calc(100vw - 48px);
            height: calc(100vh - 140px);
          }
        }
      `}</style>
    </div>
    </>
  );
};
