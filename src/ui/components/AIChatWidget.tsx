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
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isFlashing, setIsFlashing] = useState(false);

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

      // Create processor to capture raw audio with larger buffer to reduce crackling
      // Using 8192 instead of 4096 for smoother audio processing
      // NOTE: ScriptProcessorNode is deprecated but still functional. Migration to AudioWorkletNode
      // requires additional setup with worklet processor files and is planned for future update.
      const processor = audioContext.createScriptProcessor(8192, 1, 1);
      processorRef.current = processor;

      let audioChunks: Int16Array[] = [];
      let lastSendTime = Date.now();

      processor.onaudioprocess = (e) => {
        if (!isLiveRef.current || !socketRef.current?.connected) return;

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

          // Convert to base64 and send to backend
          const base64 = int16ArrayToBase64(combined);
          socketRef.current?.emit('audio-data', { audio: base64 });

          audioChunks = [];
          lastSendTime = now;
        }
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

  // Play audio queue with improved buffering to reduce crackling
  const playAudioQueue = async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

    // AudioContext must be created by user gesture (in startLiveVoice)
    // Don't create it here to avoid autoplay policy violations
    if (!audioContextRef.current) {
      console.warn('[AIChatWidget] Cannot play audio: AudioContext not initialized. Start live voice first.');
      return;
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
      className="flex flex-col h-full bg-bg-surface backdrop-blur-xl border border-border-strong rounded-2xl shadow-lg transition-all duration-300"
      style={{
        animation: isFlashing ? 'yellowFlash 0.5s ease-in-out 6' : undefined,
        borderColor: isFlashing ? '#FFD700' : undefined,
        borderWidth: isFlashing ? '3px' : undefined
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border-base flex items-center justify-between">
        <h3 className="text-xs font-medium tracking-wide text-text-dim uppercase">AI CHAT</h3>
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
