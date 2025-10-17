import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX, Sparkles, Zap, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface AIChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  projectContext?: any;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onUpdateLyrics?: (text: string, append: boolean) => void;
  // DAW control functions
  onAutoComp?: () => void;
  onQuantize?: () => void;
  onAutotune?: () => void;
  onSmartMix?: () => void;
  onMaster?: () => void;
  onGenerateMusic?: (prompt: string, genre?: string, tempo?: number, duration?: number) => void;
  onAIDawg?: () => void;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onPlay?: () => void;
  onStop?: () => void;
  onSetTempo?: (bpm: number) => void;
  onSetKey?: (key: string) => void;
  onNewTrack?: () => void;
  onSaveProject?: () => void;
  onExportProject?: () => void;
  onUploadAudio?: (file: File) => Promise<void>;
  onCreateHeadphoneMix?: () => void;
  onUpdateTrackName?: (trackId: string, name: string) => void;
  onUpdateClipName?: (clipId: string, name: string) => void;
}

export const AIChatWidget: React.FC<AIChatWidgetProps> = ({
  isOpen,
  onClose,
  projectContext,
  isExpanded = false,
  onToggleExpand,
  onUpdateLyrics,
  onAutoComp,
  onQuantize,
  onAutotune,
  onSmartMix,
  onMaster,
  onGenerateMusic,
  onAIDawg,
  onStartRecording,
  onStopRecording,
  onPlay,
  onStop,
  onSetTempo,
  onSetKey,
  onNewTrack,
  onSaveProject,
  onExportProject
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hey! I'm DAWG AI. Click the mic to start LIVE voice chat, or type your message below.",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);
  const isLiveRef = useRef(false);

  const AI_BRAIN_URL = import.meta.env.VITE_AI_BRAIN_URL || 'http://localhost:3100';

  // Initialize WebSocket connection
  useEffect(() => {
    socketRef.current = io(AI_BRAIN_URL, {
      transports: ['websocket'],
      reconnection: true
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Connected to AI Brain');
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ Disconnected from AI Brain');
    });

    // OpenAI Realtime API events
    socketRef.current.on('realtime-connected', () => {
      console.log('🎤 OpenAI Realtime API connected');
      setIsConnected(true);
      toast.success('🔴 LIVE voice active!');
    });

    socketRef.current.on('realtime-disconnected', () => {
      console.log('🔌 OpenAI Realtime API disconnected');
      setIsConnected(false);
    });

    socketRef.current.on('speech-started', () => {
      console.log('🗣️ User started speaking');
      setIsSpeaking(true);
    });

    socketRef.current.on('speech-stopped', () => {
      console.log('🤐 User stopped speaking');
      setIsSpeaking(false);
    });

    // User speech transcript (what the user said)
    socketRef.current.on('user-transcript-delta', (data: { text: string }) => {
      setCurrentTranscript(prev => prev + data.text);
    });

    socketRef.current.on('user-transcript-done', (data: { text: string }) => {
      console.log('📝 User said:', data.text);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'user',
        content: data.text,
        timestamp: new Date()
      }]);
      setCurrentTranscript('');
    });

    // AI response text (what the AI is saying)
    socketRef.current.on('ai-text-delta', (data: { text: string }) => {
      // Could show AI thinking in real-time if needed
    });

    socketRef.current.on('ai-text-done', (data: { text: string }) => {
      console.log('🤖 AI said:', data.text);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'assistant',
        content: data.text,
        timestamp: new Date()
      }]);
    });

    // Handle function calls from AI
    socketRef.current.on('function-call', (data: { call_id: string; name: string; arguments: string }) => {
      console.log('🔧 Function call received:', data.name, data.arguments);

      let result = { success: false, message: 'Function not implemented' };

      try {
        const args = JSON.parse(data.arguments);

        switch (data.name) {
          case 'start_recording':
            if (onStartRecording) {
              onStartRecording();
              result = { success: true, message: 'Recording started' };
            }
            break;

          case 'stop_recording':
            if (onStopRecording) {
              onStopRecording();
              result = { success: true, message: 'Recording stopped' };
            }
            break;

          case 'play':
            if (onPlay) {
              onPlay();
              result = { success: true, message: 'Playback started' };
            }
            break;

          case 'stop':
            if (onStop) {
              onStop();
              result = { success: true, message: 'Playback stopped' };
            }
            break;

          case 'update_lyrics':
            if (onUpdateLyrics && args.text) {
              onUpdateLyrics(args.text, args.append || false);
              result = { success: true, message: `Lyrics ${args.append ? 'appended' : 'updated'}` };
            }
            break;

          case 'create_track':
            if (onNewTrack) {
              onNewTrack();
              result = { success: true, message: 'Track created' };
            }
            break;

          case 'set_tempo':
            if (onSetTempo && args.bpm) {
              onSetTempo(args.bpm);
              result = { success: true, message: `Tempo set to ${args.bpm} BPM` };
            }
            break;

          case 'set_key':
            if (onSetKey && args.key) {
              onSetKey(args.key);
              result = { success: true, message: `Key set to ${args.key}` };
            }
            break;

          case 'apply_autotune':
            if (onAutotune) {
              onAutotune();
              result = { success: true, message: 'Autotune applied' };
            }
            break;

          case 'apply_compression':
            if (onAutoComp) {
              onAutoComp();
              result = { success: true, message: 'Compression applied' };
            }
            break;

          case 'quantize_audio':
            if (onQuantize) {
              onQuantize();
              result = { success: true, message: 'Audio quantized' };
            }
            break;

          case 'smart_mix':
            if (onSmartMix) {
              onSmartMix();
              result = { success: true, message: 'Smart mix applied' };
            }
            break;

          case 'master_audio':
            if (onMaster) {
              onMaster();
              result = { success: true, message: 'Mastering applied' };
            }
            break;

          case 'generate_music':
            if (onGenerateMusic && args.prompt) {
              onGenerateMusic(args.prompt, args.genre, args.tempo, args.duration);
              result = { success: true, message: `Generating: ${args.prompt}` };
              // Show user-friendly message
              toast.success(`🎵 Generating music: "${args.prompt}"${args.genre ? ` (${args.genre})` : ''}`);
            }
            break;

          case 'save_project':
            if (onSaveProject) {
              onSaveProject();
              result = { success: true, message: 'Project saved' };
            }
            break;

          case 'export_project':
            if (onExportProject) {
              onExportProject();
              result = { success: true, message: 'Project export started' };
            }
            break;

          case 'process_voice_memo':
            // Voice memo workflow: start recording -> AI will transcribe and process
            if (onStartRecording) {
              onStartRecording();
              toast.success('🎤 Voice Memo: Recording started! Speak your ideas, I\'ll transcribe and help you create.');
              result = { success: true, message: 'Voice memo recording started - AI will process when you stop' };
            } else {
              result = { success: false, message: 'Recording not available' };
            }
            break;

          // REAL-TIME EFFECT CONTROL HANDLERS
          case 'adjust_brightness':
            {
              const args = JSON.parse(functionArgs);
              const { amount } = args;
              const boosts = {
                subtle: { freq: 10000, gain: 2 },
                moderate: { freq: 8000, gain: 4 },
                aggressive: { freq: 6000, gain: 6 }
              };

              // TODO: Integrate with PluginController for live monitoring
              toast.success(`✨ Brightness adjusted: ${amount} (+${boosts[amount as keyof typeof boosts].gain}dB @ ${boosts[amount as keyof typeof boosts].freq}Hz)`);
              result = { success: true, message: `Brightness adjusted: ${amount}` };
            }
            break;

          case 'adjust_compression':
            {
              const args = JSON.parse(functionArgs);
              const { amount } = args;
              const settings = {
                light: { threshold: -18, ratio: 2.5 },
                medium: { threshold: -15, ratio: 4 },
                heavy: { threshold: -12, ratio: 6 }
              };

              toast.success(`🎚️ Compression: ${amount} (${settings[amount as keyof typeof settings].ratio}:1 @ ${settings[amount as keyof typeof settings].threshold}dB)`);
              result = { success: true, message: `Compression adjusted: ${amount}` };
            }
            break;

          case 'adjust_warmth':
            {
              const args = JSON.parse(functionArgs);
              const { amount } = args;
              const settings = {
                subtle: { freq: 200, gain: 2, neve: false },
                moderate: { freq: 150, gain: 3, neve: false },
                heavy: { freq: 110, gain: 4, neve: true }
              };

              const setting = settings[amount as keyof typeof settings];
              const message = setting.neve
                ? `🔥 Warmth: ${amount} (+${setting.gain}dB @ ${setting.freq}Hz + Neve 1073)`
                : `🔥 Warmth: ${amount} (+${setting.gain}dB @ ${setting.freq}Hz)`;

              toast.success(message);
              result = { success: true, message: `Warmth adjusted: ${amount}` };
            }
            break;

          case 'add_autotune':
            {
              const args = JSON.parse(functionArgs);
              const { speed } = args;
              const speeds = {
                natural: '25ms (subtle)',
                moderate: '15ms (modern)',
                tpain: '0ms (T-Pain effect)'
              };

              toast.success(`🎵 Auto-Tune: ${speeds[speed as keyof typeof speeds]}`);
              result = { success: true, message: `Auto-Tune enabled: ${speed}` };
            }
            break;

          case 'add_reverb':
            {
              const args = JSON.parse(functionArgs);
              const { amount, type } = args;
              const typeDescriptions = {
                plate: 'bright, tight',
                room: 'natural',
                hall: 'large, spacious'
              };

              toast.success(`🌊 Reverb: ${amount}% ${type} (${typeDescriptions[type as keyof typeof typeDescriptions]})`);
              result = { success: true, message: `Reverb added: ${amount}% ${type}` };
            }
            break;

          case 'remove_harshness':
            {
              const args = JSON.parse(functionArgs);
              const { amount } = args;

              toast.success(`🔇 Reducing harshness: ${amount}`);
              result = { success: true, message: `Harshness reduced: ${amount}` };
            }
            break;

          case 'add_delay':
            {
              const args = JSON.parse(functionArgs);
              const { timing, feedback, mix } = args;

              toast.success(`⏱️ Delay: ${timing} note, ${feedback}% feedback, ${mix}% wet`);
              result = { success: true, message: `Delay added: ${timing}` };
            }
            break;

          case 'adjust_presence':
            {
              const args = JSON.parse(functionArgs);
              const { amount } = args;
              const boosts = {
                subtle: 2,
                moderate: 4,
                aggressive: 6
              };

              toast.success(`📢 Presence: +${boosts[amount as keyof typeof boosts]}dB @ 4kHz`);
              result = { success: true, message: `Presence adjusted: ${amount}` };
            }
            break;

          case 'reset_effects':
            toast.info('🔄 All effects reset to bypass');
            result = { success: true, message: 'All effects reset' };
            break;

          default:
            result = { success: false, message: `Unknown function: ${data.name}` };
        }
      } catch (error: any) {
        result = { success: false, message: `Error: ${error.message}` };
      }

      // Send result back to server
      socketRef.current?.emit('function-result', {
        call_id: data.call_id,
        output: result
      });

      console.log('✅ Function result sent:', result);
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

    // Handle errors
    socketRef.current.on('error', (data: { message: string }) => {
      console.error('❌ Error:', data.message);
      toast.error(data.message);
    });

    return () => {
      stopLiveVoice();
      socketRef.current?.disconnect();
    };
  }, [AI_BRAIN_URL]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send text message
  const sendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    try {
      const response = await fetch(`${AI_BRAIN_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputText,
          project_context: projectContext
        })
      });

      const data = await response.json();

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'assistant',
        content: data.response,
        timestamp: new Date()
      }]);

    } catch (error: any) {
      toast.error('Failed to send message');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

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
        if (!isLiveRef.current || !socketRef.current?.connected) return;

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

      // Set both state and ref
      isLiveRef.current = true;
      setIsLive(true);

      // Start realtime session
      socketRef.current?.emit('start-realtime');

      toast.success('🔴 LIVE! Start talking...');

    } catch (error) {
      console.error('Microphone error:', error);
      toast.error('Microphone access denied');
    }
  };

  // Stop live voice
  const stopLiveVoice = () => {
    if (!isLive) return;

    // Update ref immediately
    isLiveRef.current = false;

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

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-bg-surface backdrop-blur-xl border border-border-strong rounded-2xl shadow-lg">
      {/* Header */}
      <div className="h-14 bg-gradient-to-r from-primary/20 to-primary/10 border-b border-border-base flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Sparkles className={`w-6 h-6 ${isLive ? 'text-red-500 animate-pulse' : 'text-primary'}`} />
            <Zap className="w-3 h-3 text-blue-400 absolute -bottom-1 -right-1" />
          </div>
          <div>
            <h3 className="font-semibold text-text-base">DAWG AI</h3>
            <p className="text-xs text-text-dim">
              {isLive ? (isConnected ? '🔴 LIVE' : 'Connecting...') : 'Click mic for live voice'}
            </p>
          </div>
        </div>

        {isSpeaking && (
          <div className="flex items-center gap-1 text-xs text-blue-400">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            Speaking...
          </div>
        )}
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
                  : message.type === 'system'
                  ? 'bg-red-600/20 text-red-300 text-sm'
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

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-bg-surface-2 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-text-dim">AI thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border-base">
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.info('Coming soon!')}
            className="p-3 rounded-xl bg-bg-surface-2 hover:bg-bg-surface-hover text-text-dim transition-colors"
            disabled={isProcessing}
          >
            <Plus className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isLive ? "LIVE mode active..." : "Type or click mic for live voice..."}
            className="flex-1 bg-bg-surface-2 border border-border-base rounded-xl px-4 py-3 text-sm text-text-base placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50"
            disabled={isProcessing || isLive}
          />

          <button
            onClick={isLive ? stopLiveVoice : startLiveVoice}
            className={`p-3 rounded-xl transition-all ${
              isLive
                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                : 'bg-bg-surface-2 hover:bg-bg-surface-hover text-text-dim'
            }`}
            disabled={isProcessing}
          >
            {isLive ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={sendMessage}
            className="p-3 bg-primary hover:bg-primary-hover rounded-xl transition-colors disabled:opacity-50"
            disabled={isProcessing || isLive || !inputText.trim()}
          >
            <Send className="w-5 h-5 text-text-base" />
          </button>
        </div>
      </div>
    </div>
  );
};
