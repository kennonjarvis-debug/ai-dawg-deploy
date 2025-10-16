import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX, X, Minimize2, Maximize2, Sparkles, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  functionCall?: {
    name: string;
    arguments: any;
    result?: any;
  };
}

interface AIChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  projectContext?: any;
}

export const AIChatWidget: React.FC<AIChatWidgetProps> = ({
  isOpen,
  onClose,
  projectContext
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hey! I'm AI DAWG, your AI music production assistant. I can help you with:\n\n• Auto-comp vocal takes\n• Time align to grid\n• Pitch correction (Auto-Tune)\n• Smart mixing\n• Professional mastering\n• Generate chords, melodies, drums\n• Full auto production (AI DAWG)\n\nWhat would you like to do?",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send text message
  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    try {
      // Call AI Brain API
      const response = await fetch('http://localhost:8002/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputText,
          project_context: projectContext
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI Brain');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: data.response,
        timestamp: new Date(data.timestamp),
        functionCall: data.function_call
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Show toast if function was executed
      if (data.function_call) {
        toast.success(`Executed: ${data.function_call.name}`);
      }

    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');

      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'system',
        content: `Error: ${error.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await sendVoiceMessage(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      toast.info('Recording... Click to stop');
    } catch (error: any) {
      toast.error('Microphone access denied');
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Send voice message
  const sendVoiceMessage = async (audioBlob: Blob) => {
    setIsProcessing(true);

    try {
      // Convert audio blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);

      await new Promise((resolve) => {
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];

          // Add user message with audio indicator
          const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: '🎤 Voice message',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, userMessage]);

          // Call AI Brain voice API
          const response = await fetch('http://localhost:8002/api/voice-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audio_base64: base64Audio,
              project_context: projectContext
            })
          });

          if (!response.ok) {
            throw new Error('Voice chat failed');
          }

          const data = await response.json();

          // Update user message with transcription
          setMessages(prev => prev.map(msg =>
            msg.id === userMessage.id
              ? { ...msg, content: `🎤 "${data.transcript}"` }
              : msg
          ));

          // Add assistant message
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: data.response_text,
            timestamp: new Date(),
            functionCall: data.function_call
          };
          setMessages(prev => [...prev, assistantMessage]);

          // Play audio response if enabled
          if (audioEnabled && data.response_audio_base64 && audioRef.current) {
            const audioBlob = base64ToBlob(data.response_audio_base64, 'audio/mp3');
            const audioUrl = URL.createObjectURL(audioBlob);
            audioRef.current.src = audioUrl;
            audioRef.current.play();
          }

          if (data.function_call) {
            toast.success(`Executed: ${data.function_call.name}`);
          }

          resolve(true);
        };
      });

    } catch (error: any) {
      toast.error(error.message || 'Voice message failed');

      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'system',
        content: `Error: ${error.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to convert base64 to blob
  const base64ToBlob = (base64: string, type: string): Blob => {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let i = 0; i < byteCharacters.length; i++) {
      byteArrays.push(byteCharacters.charCodeAt(i));
    }

    return new Blob([new Uint8Array(byteArrays)], { type });
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed ${isMinimized ? 'bottom-4 right-4 w-80' : 'bottom-0 right-0 w-full sm:w-96 h-[600px]'} bg-bg-surface backdrop-blur-xl border border-border-strong rounded-tl-2xl shadow-2xl flex flex-col z-50 transition-all duration-300`}>
      {/* Header */}
      <div className="h-14 bg-gradient-to-r from-primary/20 to-primary/10 border-b border-border-base flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Sparkles className="w-6 h-6 text-primary" />
            <Zap className="w-3 h-3 text-blue-400 absolute -bottom-1 -right-1" />
          </div>
          <div>
            <h3 className="font-semibold text-text-base">AI DAWG</h3>
            <p className="text-xs text-text-dim">Your AI Music Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio toggle */}
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="p-2 hover:bg-bg-surface-hover rounded-lg transition-colors"
            title={audioEnabled ? 'Mute audio responses' : 'Enable audio responses'}
          >
            {audioEnabled ? (
              <Volume2 className="w-4 h-4 text-blue-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-text-dim" />
            )}
          </button>

          {/* Minimize/Maximize */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-bg-surface-hover rounded-lg transition-colors"
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4 text-text-dim" />
            ) : (
              <Minimize2 className="w-4 h-4 text-text-dim" />
            )}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-surface-hover rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-text-dim" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-primary/30 text-text-base'
                      : message.type === 'system'
                      ? 'bg-red-600/20 text-red-300 text-sm'
                      : 'bg-bg-surface-2 text-text-base'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>

                  {message.functionCall && (
                    <div className="mt-2 pt-2 border-t border-border-base">
                      <p className="text-xs text-blue-300">
                        ⚡ Executed: <span className="font-mono">{message.functionCall.name}</span>
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-text-dim mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-bg-surface-2 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-text-dim">AI DAWG is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border-base">
            <div className="flex items-center gap-2">
              {/* Voice button */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-3 rounded-xl transition-all ${
                  isRecording
                    ? 'bg-red-500/20 text-red-400 animate-pulse'
                    : 'bg-bg-surface-2 hover:bg-bg-surface-hover text-text-dim'
                }`}
                disabled={isProcessing}
              >
                {isRecording ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>

              {/* Text input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask AI DAWG anything..."
                className="flex-1 bg-bg-surface-2 border border-border-base rounded-xl px-4 py-3 text-sm text-text-base placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={isProcessing || isRecording}
              />

              {/* Send button */}
              <button
                onClick={sendMessage}
                className="p-3 bg-primary hover:bg-primary-hover rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isProcessing || isRecording || !inputText.trim()}
              >
                <Send className="w-5 h-5 text-text-base" />
              </button>
            </div>

            <p className="text-xs text-text-dim mt-2 text-center">
              Try: "Auto-comp these takes" • "Quantize to 16ths" • "Mix this in Drake style"
            </p>
          </div>
        </>
      )}

      {/* Hidden audio element for playback */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
};
