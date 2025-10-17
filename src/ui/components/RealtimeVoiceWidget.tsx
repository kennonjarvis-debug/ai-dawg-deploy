import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface RealtimeVoiceWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RealtimeVoiceWidget: React.FC<RealtimeVoiceWidgetProps> = ({
  isOpen,
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hey! I'm DAWG AI with LIVE voice. Click the mic and start talking - I'll respond in real-time!",
      timestamp: new Date()
    }
  ]);
  const [isLive, setIsLive] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);

  const AI_BRAIN_URL = import.meta.env.VITE_AI_BRAIN_URL || 'http://localhost:3100';

  // Initialize WebSocket
  useEffect(() => {
    socketRef.current = io(AI_BRAIN_URL, {
      transports: ['websocket'],
      reconnection: true
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Connected to Realtime Voice Server');
    });

    socketRef.current.on('realtime-connected', () => {
      console.log('🎤 OpenAI Realtime API connected');
      setIsConnected(true);
      toast.success('Live voice active!');
    });

    socketRef.current.on('realtime-disconnected', () => {
      console.log('🔌 OpenAI Realtime API disconnected');
      setIsConnected(false);
    });

    socketRef.current.on('speech-started', () => {
      console.log('🗣️  User started speaking');
      setIsSpeaking(true);
    });

    socketRef.current.on('speech-stopped', () => {
      console.log('🤐 User stopped speaking');
      setIsSpeaking(false);
    });

    socketRef.current.on('transcript-delta', (data: { text: string }) => {
      setCurrentTranscript(prev => prev + data.text);
    });

    socketRef.current.on('transcript-done', (data: { text: string }) => {
      console.log('📝 Complete transcript:', data.text);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'user',
        content: data.text,
        timestamp: new Date()
      }]);
      setCurrentTranscript('');
    });

    socketRef.current.on('audio-delta', (data: { audio: string }) => {
      // Queue audio for playback
      const audioData = base64ToInt16Array(data.audio);
      audioQueueRef.current.push(audioData);
      if (!isPlayingRef.current) {
        playAudioQueue();
      }
    });

    socketRef.current.on('audio-done', () => {
      console.log('🔊 Audio response complete');
    });

    socketRef.current.on('error', (data: { message: string }) => {
      console.error('❌ Error:', data.message);
      toast.error(data.message);
    });

    return () => {
      stopLiveVoice();
      socketRef.current?.disconnect();
    };
  }, [AI_BRAIN_URL]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Start live voice
  const startLiveVoice = async () => {
    if (isLive) return;

    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      mediaStreamRef.current = stream;

      // Create audio context
      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);

      // Create processor to capture raw audio
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!isLive || !socketRef.current?.connected) return;

        const inputData = e.inputBuffer.getChannelData(0);

        // Convert Float32 to Int16 (PCM16 format)
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Convert to base64 and send to backend
        const base64 = int16ArrayToBase64(pcm16);
        socketRef.current?.emit('audio-data', { audio: base64 });
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsLive(true);

      // Start realtime session
      socketRef.current?.emit('start-realtime');

      toast.success('🎤 LIVE! Start talking...');

    } catch (error) {
      console.error('Microphone error:', error);
      toast.error('Microphone access denied');
    }
  };

  // Stop live voice
  const stopLiveVoice = () => {
    if (!isLive) return;

    // CRITICAL: If recording is active, stop it to save the clip
    const { isRecording } = require('../stores/transportStore').useTransportStore.getState();
    if (isRecording) {
      require('../stores/transportStore').useTransportStore.setState({ isRecording: false, isPlaying: false });
      console.log('🔴 Auto-stopped recording on voice disconnect to save clip');
      toast.info('Recording saved');
    }

    // Stop audio processing
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Stop realtime session
    socketRef.current?.emit('stop-realtime');

    setIsLive(false);
    setIsConnected(false);
    toast.info('Voice stopped');
  };

  // Play audio queue
  const playAudioQueue = async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    }

    isPlayingRef.current = true;

    while (audioQueueRef.current.length > 0) {
      const audioData = audioQueueRef.current.shift();
      if (!audioData) continue;

      const audioBuffer = audioContextRef.current.createBuffer(
        1,
        audioData.length,
        24000
      );

      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < audioData.length; i++) {
        channelData[i] = audioData[i] / (audioData[i] < 0 ? 0x8000 : 0x7FFF);
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);

      await new Promise<void>((resolve) => {
        source.onended = () => resolve();
        source.start();
      });
    }

    isPlayingRef.current = false;
  };

  // Helper: Convert Int16Array to base64
  const int16ArrayToBase64 = (array: Int16Array): string => {
    const bytes = new Uint8Array(array.buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Helper: Convert base64 to Int16Array
  const base64ToInt16Array = (base64: string): Int16Array => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Int16Array(bytes.buffer);
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-bg-surface backdrop-blur-xl border border-border-strong rounded-2xl shadow-lg">
      {/* Header */}
      <div className="h-14 bg-gradient-to-r from-purple-500/20 to-pink-500/10 border-b border-border-base flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            <Zap className="w-3 h-3 text-blue-400 absolute -bottom-1 -right-1" />
          </div>
          <div>
            <h3 className="font-semibold text-text-base">DAWG AI LIVE</h3>
            <p className="text-xs text-text-dim">
              {isLive ? (isConnected ? '🔴 LIVE' : 'Connecting...') : 'Click mic to go live'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSpeaking && (
            <div className="flex items-center gap-1 text-xs text-blue-400">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              Speaking...
            </div>
          )}
        </div>
      </div>

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
                  : 'bg-bg-surface-2 text-text-base'
              }`}
            >
              <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              <p className="text-xs text-text-dim mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {currentTranscript && (
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-primary/20 text-text-base border border-primary/50">
              <p className="whitespace-pre-wrap text-sm">{currentTranscript}...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Live Voice Control */}
      <div className="p-4 border-t border-border-base">
        <div className="flex items-center justify-center">
          <button
            onClick={isLive ? stopLiveVoice : startLiveVoice}
            className={`p-6 rounded-full transition-all shadow-lg ${
              isLive
                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
            }`}
          >
            {isLive ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </button>
        </div>

        <p className="text-xs text-text-dim mt-3 text-center">
          {isLive ? '🔴 LIVE - Talk naturally, I can hear you!' : '🎤 Click to start live voice chat'}
        </p>
        <p className="text-xs text-text-dim text-center">
          OpenAI Realtime API • Interruptions supported • Real-time responses
        </p>
      </div>
    </div>
  );
};
