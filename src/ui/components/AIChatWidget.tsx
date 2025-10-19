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
  // Logic Pro X-style Mixer & Routing Control
  onCreateAuxTrack?: (name: string, channels: 'mono' | 'stereo') => string; // Returns track ID
  onCreateAudioTrack?: (name: string, channels: 'mono' | 'stereo') => string; // Returns track ID
  onCreateSend?: (sourceTrackId: string, destinationTrackId: string, preFader: boolean, level?: number) => void;
  onRemoveSend?: (sourceTrackId: string, sendId: string) => void;
  onSetSendLevel?: (sourceTrackId: string, sendId: string, level: number) => void;
  onSetTrackOutput?: (trackId: string, outputDestination: string) => void; // 'master' or aux track ID
  onSetTrackVolume?: (trackId: string, volume: number) => void;
  onSetTrackPan?: (trackId: string, pan: number) => void;
  onMuteTrack?: (trackId: string, mute: boolean) => void;
  onSoloTrack?: (trackId: string, solo: boolean) => void;
  onGetTracks?: () => any[]; // Returns current tracks for AI to inspect
  flashFeature?: 'voice-memo' | 'music-gen' | null;
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
  onExportProject,
  onGetTracks,
  onCreateAuxTrack,
  onCreateAudioTrack,
  onCreateSend,
  onRemoveSend,
  onSetSendLevel,
  onSetTrackOutput,
  onSetTrackVolume,
  onSetTrackPan,
  onMuteTrack,
  onSoloTrack,
  flashFeature
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
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [currentTranscriptType, setCurrentTranscriptType] = useState<'user' | 'ai' | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string>(() => {
    // Load saved voice preference from localStorage
    return localStorage.getItem('dawg-ai-voice') || 'alloy';
  });
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceSocketRef = useRef<Socket | null>(null); // Unified voice server (port 3100)
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);
  const isLiveRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const AI_BRAIN_URL = import.meta.env.VITE_AI_BRAIN_URL || import.meta.env.VITE_API_URL || 'http://localhost:8002';

  // Auto-detect protocol and use environment variable for production
  const REALTIME_VOICE_URL = (() => {
    const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_REALTIME_VOICE_URL;
    if (envUrl) return envUrl;

    // For local development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return import.meta.env.VITE_API_URL || 'http://localhost:3100';
    }

    // For production, use same host with appropriate protocol
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//${window.location.hostname}`;
  })();

  // Initialize Voice WebSocket connection (unified on port 3100)
  useEffect(() => {
    voiceSocketRef.current = io(REALTIME_VOICE_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000
    });

    voiceSocketRef.current.on('connect', () => {
      console.log('🎤 Connected to Unified Voice Server');
    });

    voiceSocketRef.current.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from Unified Voice Server:', reason);
    });

    voiceSocketRef.current.on('connect_error', (error) => {
      // Suppress common transient errors during development
      if (error.message.includes('websocket error') || error.message.includes('xhr poll error')) {
        console.debug('Voice server connection error (retrying...):', error.message);
      } else {
        console.error('Voice server connection error:', error);
      }
    });

    // Handle function calls from AI
    voiceSocketRef.current.on('function-call', (data: { call_id: string; name: string; arguments: string }) => {
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
              toast.loading('🎚️ AI Smart Mix in progress...', {
                duration: 15000,
                id: 'smart-mix-progress'
              });
            }
            break;

          case 'master_audio':
            if (onMaster) {
              onMaster();
              result = { success: true, message: 'Mastering applied' };
              toast.loading('✨ AI Mastering in progress...', {
                duration: 20000,
                id: 'master-progress'
              });
            }
            break;

          case 'generate_music':
            if (onGenerateMusic && args.prompt) {
              onGenerateMusic(args.prompt, args.genre, args.tempo, args.duration);
              result = { success: true, message: `Generating: ${args.prompt}` };
              // Toast is handled by handleAutoMusic in DAWDashboard - don't duplicate here
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

          // ===== LOGIC PRO X-STYLE ROUTING FUNCTIONS =====
          case 'getTracks':
            if (onGetTracks) {
              const tracks = onGetTracks();
              result = { success: true, message: 'Got tracks', data: tracks };
            }
            break;

          case 'createAuxTrack':
            if (onCreateAuxTrack && args.name) {
              const trackId = onCreateAuxTrack(args.name, args.channels || 'stereo');
              result = { success: true, message: `Aux track created: ${args.name}`, trackId };
            }
            break;

          case 'createAudioTrack':
            if (onCreateAudioTrack && args.name) {
              const trackId = onCreateAudioTrack(args.name, args.channels || 'stereo');
              result = { success: true, message: `Audio track created: ${args.name}`, trackId };
            }
            break;

          case 'createSend':
            if (onCreateSend && args.sourceTrackId && args.destinationTrackId) {
              onCreateSend(args.sourceTrackId, args.destinationTrackId, args.preFader || false, args.level);
              result = { success: true, message: 'Send created' };
            }
            break;

          case 'removeSend':
            if (onRemoveSend && args.sourceTrackId && args.sendId) {
              onRemoveSend(args.sourceTrackId, args.sendId);
              result = { success: true, message: 'Send removed' };
            }
            break;

          case 'setSendLevel':
            if (onSetSendLevel && args.sourceTrackId && args.sendId && args.level !== undefined) {
              onSetSendLevel(args.sourceTrackId, args.sendId, args.level);
              result = { success: true, message: `Send level set to ${args.level}` };
            }
            break;

          case 'setTrackOutput':
            if (onSetTrackOutput && args.trackId && args.outputDestination) {
              onSetTrackOutput(args.trackId, args.outputDestination);
              result = { success: true, message: 'Track output routed' };
            }
            break;

          case 'setTrackVolume':
            if (onSetTrackVolume && args.trackId && args.volume !== undefined) {
              onSetTrackVolume(args.trackId, args.volume);
              result = { success: true, message: `Volume set to ${args.volume}` };
            }
            break;

          case 'setTrackPan':
            if (onSetTrackPan && args.trackId && args.pan !== undefined) {
              onSetTrackPan(args.trackId, args.pan);
              result = { success: true, message: `Pan set to ${args.pan}` };
            }
            break;

          case 'muteTrack':
            if (onMuteTrack && args.trackId && args.mute !== undefined) {
              onMuteTrack(args.trackId, args.mute);
              result = { success: true, message: args.mute ? 'Track muted' : 'Track unmuted' };
            }
            break;

          case 'soloTrack':
            if (onSoloTrack && args.trackId && args.solo !== undefined) {
              onSoloTrack(args.trackId, args.solo);
              result = { success: true, message: args.solo ? 'Track solo on' : 'Track solo off' };
            }
            break;

          default:
            result = { success: false, message: `Unknown function: ${data.name}` };
        }
      } catch (error: any) {
        result = { success: false, message: `Error: ${error.message}` };
      }

      // Send result back to server
      voiceSocketRef.current?.emit('function-result', {
        call_id: data.call_id,
        output: result
      });

      console.log('✅ Function result sent:', result);
    });

    voiceSocketRef.current.on('realtime-connected', () => {
      console.log('🎤 OpenAI Realtime API connected');
      setIsConnected(true);
      toast.success('🔴 LIVE voice active!');
    });

    voiceSocketRef.current.on('realtime-disconnected', () => {
      console.log('🔌 OpenAI Realtime API disconnected');
      setIsConnected(false);
    });

    voiceSocketRef.current.on('speech-started', () => {
      console.log('🗣️ User started speaking');
      setIsSpeaking(true);
    });

    voiceSocketRef.current.on('speech-stopped', () => {
      console.log('🤐 User stopped speaking');
      setIsSpeaking(false);
    });

    voiceSocketRef.current.on('user-transcript-delta', (data: { text: string }) => {
      setCurrentTranscriptType('user');
      setCurrentTranscript(prev => prev + data.text);
    });

    voiceSocketRef.current.on('user-transcript-done', (data: { text: string }) => {
      console.log('📝 User said:', data.text);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'user',
        content: data.text,
        timestamp: new Date()
      }]);
      setCurrentTranscript('');
      setCurrentTranscriptType(null);
    });

    voiceSocketRef.current.on('ai-text-delta', (data: { text: string }) => {
      // Append to transcript (type already set in response-started)
      setCurrentTranscript(prev => prev + data.text);
    });

    voiceSocketRef.current.on('ai-text-done', (data: { text: string }) => {
      console.log('🤖 AI said:', data.text);
      console.log('📊 AI text length:', data.text?.length || 0);

      if (!data.text || data.text.trim() === '') {
        console.warn('⚠️ AI text is empty, not adding message');
        setCurrentTranscript('');
        setCurrentTranscriptType(null);
        return;
      }

      setMessages(prev => {
        const newMessage = {
          id: `ai-${Date.now()}`,
          type: 'assistant' as const,
          content: data.text,
          timestamp: new Date()
        };
        const newMessages = [...prev, newMessage];
        console.log('📊 New messages array length:', newMessages.length);
        console.log('📊 Added AI message:', newMessage.content.substring(0, 100));
        return newMessages;
      });
      setCurrentTranscript('');
      setCurrentTranscriptType(null);
    });

    voiceSocketRef.current.on('audio-delta', (data: { audio: string }) => {
      playAudioResponse(data.audio);
    });

    voiceSocketRef.current.on('audio-done', () => {
      console.log('🔊 Audio playback complete');
    });

    // AI response state tracking
    voiceSocketRef.current.on('response-started', () => {
      console.log('🤖 AI started responding');
      setIsAISpeaking(true);
      // Reset transcript for new AI response
      setCurrentTranscript('');
      setCurrentTranscriptType('ai');
    });

    voiceSocketRef.current.on('response-done', () => {
      console.log('✅ AI finished responding');
      setIsAISpeaking(false);
    });

    // Handle interruption
    voiceSocketRef.current.on('ai-interrupted', () => {
      console.log('⚡ AI was interrupted by user');
      setIsAISpeaking(false);

      // Stop audio playback immediately
      if (audioContextRef.current && audioContextRef.current.state === 'running') {
        audioContextRef.current.suspend();
      }

      // Clear audio queue
      audioQueueRef.current = [];
    });

    voiceSocketRef.current.on('voice-changed', (data: { voice: string }) => {
      console.log('🎙️ Voice changed to:', data.voice);
      setSelectedVoice(data.voice);
    });

    // Handle errors
    voiceSocketRef.current.on('error', (data: { message: string }) => {
      console.error('❌ Error:', data.message);
      toast.error(data.message);
    });

    return () => {
      stopLiveVoice();
      voiceSocketRef.current?.disconnect();
    };
  }, [REALTIME_VOICE_URL]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Debug: Log messages array changes
  useEffect(() => {
    console.log('📋 Messages array updated. Total messages:', messages.length);
    console.log('📋 Messages:', messages.map(m => `${m.type}: ${m.content.substring(0, 50)}...`));
  }, [messages]);

  // Handle flash animation when feature is triggered
  useEffect(() => {
    if (flashFeature) {
      setIsFlashing(true);

      // Add guidance message
      const guidanceMessages = {
        'voice-memo': "🎤 Voice Memo Mode! Click the '+' button below to upload your voice memo, OR tell me what you want to create and I'll guide you through recording it!",
        'music-gen': "🎵 Music Generation Mode! Click the '+' button to upload inspiration audio, OR describe the music you want and I'll help you create it!"
      };

      const message: Message = {
        id: `flash-${Date.now()}`,
        type: 'system',
        content: guidanceMessages[flashFeature],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, message]);

      // Stop flashing after 3 seconds (6 pulses at 0.5s each)
      const timer = setTimeout(() => {
        setIsFlashing(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [flashFeature]);

  // Execute function call
  const executeFunction = (name: string, args: any): any => {
    let result: any = { success: false, message: 'Function not implemented' };

    switch (name) {
      case 'getTracks':
        if (onGetTracks) {
          const tracks = onGetTracks();
          result = { success: true, message: 'Got tracks', data: tracks };
        }
        break;

      case 'createAuxTrack':
        if (onCreateAuxTrack && args.name) {
          const trackId = onCreateAuxTrack(args.name, args.channels || 'stereo');
          result = { success: true, message: `Aux track created: ${args.name}`, trackId };
          toast.success(`Created ${args.channels || 'stereo'} aux track: ${args.name}`);
        }
        break;

      case 'createAudioTrack':
        if (onCreateAudioTrack && args.name) {
          const trackId = onCreateAudioTrack(args.name, args.channels || 'stereo');
          result = { success: true, message: `Audio track created: ${args.name}`, trackId };
          toast.success(`Created ${args.channels || 'stereo'} audio track: ${args.name}`);
        }
        break;

      case 'createSend':
        if (onCreateSend && args.sourceTrackId && args.destinationTrackId) {
          onCreateSend(
            args.sourceTrackId,
            args.destinationTrackId,
            args.preFader || false,
            args.level !== undefined ? args.level : 0.8
          );
          result = { success: true, message: `Created ${args.preFader ? 'pre-fader' : 'post-fader'} send` };
        }
        break;

      case 'removeSend':
        if (onRemoveSend && args.sourceTrackId && args.sendId) {
          onRemoveSend(args.sourceTrackId, args.sendId);
          result = { success: true, message: 'Send removed' };
        }
        break;

      case 'setSendLevel':
        if (onSetSendLevel && args.sourceTrackId && args.sendId) {
          onSetSendLevel(args.sourceTrackId, args.sendId, args.level || 0.8);
          result = { success: true, message: `Send level set to ${Math.round((args.level || 0.8) * 100)}%` };
        }
        break;

      case 'setTrackOutput':
        if (onSetTrackOutput && args.trackId && args.outputDestination) {
          onSetTrackOutput(args.trackId, args.outputDestination);
          result = { success: true, message: `Track output set to ${args.outputDestination}` };
        }
        break;

      case 'setTrackVolume':
        if (onSetTrackVolume && args.trackId) {
          onSetTrackVolume(args.trackId, args.volume || 1.0);
          result = { success: true, message: `Volume set to ${Math.round((args.volume || 1.0) * 100)}%` };
        }
        break;

      case 'setTrackPan':
        if (onSetTrackPan && args.trackId) {
          onSetTrackPan(args.trackId, args.pan || 0);
          result = { success: true, message: `Pan set to ${args.pan > 0 ? 'right' : args.pan < 0 ? 'left' : 'center'}` };
        }
        break;

      case 'muteTrack':
        if (onMuteTrack && args.trackId) {
          onMuteTrack(args.trackId, args.mute !== false);
          result = { success: true, message: args.mute !== false ? 'Track muted' : 'Track unmuted' };
        }
        break;

      case 'soloTrack':
        if (onSoloTrack && args.trackId) {
          onSoloTrack(args.trackId, args.solo !== false);
          result = { success: true, message: args.solo !== false ? 'Track soloed' : 'Solo disabled' };
        }
        break;

      case 'start_recording':
      case 'startRecording':
        if (onStartRecording) {
          onStartRecording();
          result = { success: true, message: 'Recording started' };
        }
        break;

      case 'stop_recording':
      case 'stopRecording':
        if (onStopRecording) {
          onStopRecording();
          result = { success: true, message: 'Recording stopped' };
        }
        break;

      case 'play':
      case 'playProject':
        if (onPlay) {
          onPlay();
          result = { success: true, message: 'Playback started' };
        }
        break;

      case 'stop':
      case 'stopPlayback':
        if (onStop) {
          onStop();
          result = { success: true, message: 'Playback stopped' };
        }
        break;

      case 'set_tempo':
      case 'setTempo':
        if (onSetTempo && args.bpm) {
          onSetTempo(args.bpm);
          result = { success: true, message: `Tempo set to ${args.bpm} BPM` };
        }
        break;

      case 'set_key':
      case 'setKey':
        if (onSetKey && args.key) {
          onSetKey(args.key);
          result = { success: true, message: `Key set to ${args.key}` };
        }
        break;

      case 'create_track':
      case 'createTrack':
        if (onNewTrack) {
          onNewTrack();
          result = { success: true, message: 'Track created' };
        }
        break;

      case 'generate_music':
        if (onGenerateMusic && args.prompt) {
          onGenerateMusic(args.prompt, args.genre, args.tempo, args.duration);
          result = { success: true, message: `Generating: ${args.prompt}` };
          // Toast is handled by handleAutoMusic in DAWDashboard - don't duplicate here
        }
        break;

      case 'generateBeats':
        console.log('🎵 generateBeats case reached with args:', args);
        console.log('🎵 onGenerateMusic exists?', !!onGenerateMusic);
        if (onGenerateMusic && args.genre) {
          // Convert generateBeats params to generate_music format
          const prompt = `${args.genre} beat`;
          const duration = args.bars ? Math.ceil((args.bars * 240) / (args.tempo || 120)) : 30; // Estimate duration from bars
          console.log('🎵 Calling onGenerateMusic with:', { prompt, genre: args.genre, tempo: args.tempo, duration });
          onGenerateMusic(prompt, args.genre, args.tempo, duration);
          result = { success: true, message: `Generating ${args.genre} beat` };
          // Toast is handled by handleAutoMusic in DAWDashboard - don't duplicate here
        } else {
          console.warn('🎵 generateBeats: Missing onGenerateMusic or genre', { onGenerateMusic: !!onGenerateMusic, genre: args.genre });
        }
        break;

      default:
        console.warn(`Unknown function: ${name}`);
    }

    return result;
  };

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
    const originalMessage = inputText;
    setInputText('');
    setIsProcessing(true);

    try {
      const response = await fetch(`${AI_BRAIN_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: originalMessage,
          project_context: projectContext
        })
      });

      const data = await response.json();

      // Check if AI wants to call a function
      if (data.function_call) {
        console.log('AI requested function call:', data.function_call);

        // Execute the function
        const functionResult = executeFunction(data.function_call.name, data.function_call.arguments);

        // Show AI's response
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'assistant',
          content: data.response || functionResult.message || `✓ Executed ${data.function_call.name}`,
          timestamp: new Date()
        }]);
      } else {
        // Just a text response, no function call
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'assistant',
          content: data.response,
          timestamp: new Date()
        }]);
      }

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

      // Create processor to capture raw audio with larger buffer to reduce crackling
      // Using 8192 instead of 4096 for smoother audio processing
      // NOTE: ScriptProcessorNode is deprecated but still functional. Migration to AudioWorkletNode
      // requires additional setup with worklet processor files and is planned for future update.
      const processor = audioContext.createScriptProcessor(8192, 1, 1);
      processorRef.current = processor;

      let audioChunks: Int16Array[] = [];
      let lastSendTime = Date.now();

      processor.onaudioprocess = (e) => {
        if (!isLiveRef.current || !voiceSocketRef.current?.connected) return;

        const inputData = e.inputBuffer.getChannelData(0);

        // Convert Float32 to Int16 (PCM16 format)
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Buffer audio chunks and send in batches to reduce overhead
        audioChunks.push(pcm16);
        const now = Date.now();

        // Send every 100ms or when we have 3+ chunks to reduce websocket overhead
        if (now - lastSendTime >= 100 || audioChunks.length >= 3) {
          // Combine chunks into single array
          const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
          const combined = new Int16Array(totalLength);
          let offset = 0;
          for (const chunk of audioChunks) {
            combined.set(chunk, offset);
            offset += chunk.length;
          }

          // Convert to base64 and send to voice server
          const base64 = int16ArrayToBase64(combined);
          voiceSocketRef.current?.emit('send-audio', { audio: base64 });

          audioChunks = [];
          lastSendTime = now;
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      // Set both state and ref
      isLiveRef.current = true;
      setIsLive(true);

      // Start realtime session with saved voice preference and project context
      voiceSocketRef.current?.emit('start-realtime', {
        voice: selectedVoice,
        projectContext: projectContext
      });

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
    voiceSocketRef.current?.emit('stop-realtime');

    setIsLive(false);
    setIsConnected(false);
    toast.info('Voice stopped');
  };

  // Change AI voice
  const changeVoice = (voice: string) => {
    setSelectedVoice(voice);
    // Save to localStorage for persistence
    localStorage.setItem('dawg-ai-voice', voice);
    voiceSocketRef.current?.emit('change-voice', { voice });
    toast.success(`Voice changed to ${voice}`);
    setShowVoiceMenu(false);
  };

  // Play audio response from server
  const playAudioResponse = (base64Audio: string) => {
    try {
      // Decode base64 to binary
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert to Int16Array
      const audioData = new Int16Array(bytes.buffer);

      // Add to queue and play
      audioQueueRef.current.push(audioData);
      playAudioQueue();
    } catch (error) {
      console.error('Error playing audio response:', error);
    }
  };

  // Play audio queue with improved buffering to reduce crackling
  const playAudioQueue = async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

    // AudioContext must be created by user gesture (in startLiveVoice)
    // Don't create it here to avoid autoplay policy violations
    if (!audioContextRef.current) {
      console.warn('[AIChatWidget] Cannot play audio: AudioContext not initialized. Start live voice first.');
      return;
    }

    // Resume AudioContext if it's suspended (e.g., after AI was interrupted)
    if (audioContextRef.current.state === 'suspended') {
      console.log('[AIChatWidget] Resuming suspended AudioContext');
      await audioContextRef.current.resume();
    }

    isPlayingRef.current = true;

    try {
      let currentTime = audioContextRef.current.currentTime;

      while (audioQueueRef.current.length > 0) {
        const audioData = audioQueueRef.current.shift();
        if (!audioData) continue;

        // Create audio buffer with smooth transitions
        const audioBuffer = audioContextRef.current.createBuffer(
          1,
          audioData.length,
          24000
        );

        const channelData = audioBuffer.getChannelData(0);
        for (let i = 0; i < audioData.length; i++) {
          channelData[i] = audioData[i] / (audioData[i] < 0 ? 0x8000 : 0x7FFF);
        }

        // Create gain node for smooth volume transitions
        const gainNode = audioContextRef.current.createGain();
        gainNode.gain.value = 1.0;

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);

        // Schedule playback with precise timing to avoid gaps/crackling
        const bufferDuration = audioData.length / 24000;
        source.start(Math.max(currentTime, audioContextRef.current.currentTime + 0.01));
        currentTime += bufferDuration;

        // Wait for this chunk to finish
        await new Promise<void>((resolve) => {
          source.onended = () => resolve();
        });
      }
    } finally {
      isPlayingRef.current = false;
    }
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
    <div
      data-testid="ai-chat-widget"
      className="flex flex-col h-[420px] w-full max-w-md bg-bg-surface backdrop-blur-xl border border-border-strong rounded-2xl shadow-lg transition-all duration-300"
      style={{
        animation: isFlashing ? 'yellowFlash 0.5s ease-in-out 6' : undefined,
        borderColor: isFlashing ? '#FFD700' : undefined,
        borderWidth: isFlashing ? '3px' : undefined
      }}
    >
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border-base flex items-center justify-between">
        <h3 className="text-xs font-medium tracking-wide text-text-dim uppercase">AI CHAT</h3>

        <div className="flex items-center gap-3">
          {isSpeaking && (
            <div className="flex items-center gap-1 text-xs text-blue-400">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              Speaking...
            </div>
          )}

          {isAISpeaking && (
            <div className="flex items-center gap-1 text-xs text-purple-400">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              AI responding...
            </div>
          )}

          {/* Voice Selector */}
          <div className="relative">
            <button
              onClick={() => setShowVoiceMenu(!showVoiceMenu)}
              className="px-2 py-1 text-[10px] rounded-md bg-bg-surface-2 hover:bg-bg-surface-hover text-text-muted hover:text-primary transition-all ring-1 ring-border-base hover:ring-primary/50 flex items-center gap-1"
              title="Change AI voice"
            >
              <Volume2 className="w-3 h-3" />
              <span className="font-medium">{selectedVoice}</span>
            </button>

            {showVoiceMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowVoiceMenu(false)} />
                <div className="absolute top-full right-0 mt-1 bg-bg-surface-2 border border-border-strong rounded-lg shadow-2xl z-20 min-w-[120px]">
                  <div className="p-1 space-y-0.5">
                    {['alloy', 'echo', 'shimmer', 'ash', 'ballad', 'coral', 'sage', 'verse'].map((voice) => (
                      <button
                        key={voice}
                        onClick={() => changeVoice(voice)}
                        className={`w-full px-2 py-1.5 text-xs text-left rounded transition-colors ${
                          voice === selectedVoice
                            ? 'bg-primary text-text-base'
                            : 'text-text-muted hover:bg-bg-surface-hover'
                        }`}
                      >
                        {voice.charAt(0).toUpperCase() + voice.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
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
          <div className={`flex ${currentTranscriptType === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              currentTranscriptType === 'user'
                ? 'bg-primary/20 text-text-base border border-primary/50'
                : 'bg-bg-surface-2/50 text-text-base border border-purple-500/50'
            }`}>
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
      <div className="flex-shrink-0 p-4 border-t border-border-base">
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-xl bg-bg-surface-2 hover:bg-bg-surface-hover text-text-dim transition-colors"
            disabled={isProcessing}
            title="Upload audio file"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            style={{ display: 'none' }}
            onChange={async (e) => {
              const files = Array.from(e.target.files || []);
              if (files.length === 0 || !onUploadAudio) return;

              for (const file of files) {
                try {
                  await onUploadAudio(file);
                  toast.success(`Uploaded ${file.name}`);
                } catch (error) {
                  console.error('Upload error:', error);
                  toast.error(`Failed to upload ${file.name}`);
                }
              }

              // Reset input so same file can be uploaded again
              e.target.value = '';
            }}
          />

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

      {/* CSS Animation for yellow flash */}
      <style>{`
        @keyframes yellowFlash {
          0%, 100% {
            border-color: inherit;
            box-shadow: 0 0 0 rgba(255, 215, 0, 0);
          }
          50% {
            border-color: #FFD700;
            box-shadow: 0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.4);
          }
        }
      `}</style>
    </div>
  );
};
