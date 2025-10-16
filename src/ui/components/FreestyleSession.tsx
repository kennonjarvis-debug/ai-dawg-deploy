/**
 * Freestyle Recording Session
 *
 * Unified component for freestyle recording with:
 * - Real-time waveform visualization
 * - Live lyrics transcription
 * - Voice command control
 * - Beat playback during recording
 * - AI-powered lyrics organization
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Play, Pause, Square, Music, Sparkles, Save, Download, MessageSquare } from 'lucide-react';
import { LiveWaveformRecorder } from './LiveWaveformRecorder';
import { LyricsWidget, LyricsSegment } from '../recording/LyricsWidget';
import { apiClient } from '../../api/client';
import { toast } from 'sonner';

export interface FreestyleSessionProps {
  projectId: string;
  beatFileId?: string;
  beatUrl?: string;
  trackColor?: string;
  onSessionComplete?: (lyrics: LyricsSegment[], audioBlob: Blob) => void;
}

interface VoiceCommand {
  command: string;
  action: () => void;
  aliases: string[];
}

export const FreestyleSession: React.FC<FreestyleSessionProps> = ({
  projectId,
  beatFileId,
  beatUrl,
  trackColor = '#3b82f6',
  onSessionComplete,
}) => {
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Beat playback state
  const [isBeatPlaying, setIsBeatPlaying] = useState(false);
  const [beatDuration, setBeatDuration] = useState(0);
  const [beatCurrentTime, setBeatCurrentTime] = useState(0);

  // Lyrics state
  const [lyrics, setLyrics] = useState<LyricsSegment[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');

  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const [voiceCommandsEnabled, setVoiceCommandsEnabled] = useState(true);

  // UI state
  const [showLyricsWidget, setShowLyricsWidget] = useState(true);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string>('');

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const beatAudioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const beatStartTimeRef = useRef<number>(0);

  /**
   * Initialize audio context and beat playback
   */
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        // Create audio context
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Load beat if URL provided
        if (beatUrl) {
          beatAudioRef.current = new Audio(beatUrl);
          beatAudioRef.current.addEventListener('loadedmetadata', () => {
            setBeatDuration(beatAudioRef.current?.duration || 0);
          });

          beatAudioRef.current.addEventListener('timeupdate', () => {
            setBeatCurrentTime(beatAudioRef.current?.currentTime || 0);
          });

          beatAudioRef.current.addEventListener('ended', () => {
            setIsBeatPlaying(false);
            if (isRecording) {
              stopRecording();
            }
          });
        }
      } catch (error) {
        console.error('Failed to initialize audio:', error);
        toast.error('Failed to initialize audio system');
      }
    };

    initializeAudio();

    return () => {
      // Cleanup
      if (beatAudioRef.current) {
        beatAudioRef.current.pause();
        beatAudioRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [beatUrl]);

  /**
   * Initialize voice recognition for commands and transcription
   */
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart if still recording
      if (isRecording && !isPaused) {
        try {
          recognition.start();
        } catch (e) {
          console.error('Failed to restart recognition:', e);
        }
      }
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;

        if (event.results[i].isFinal) {
          finalTranscript += transcript;

          // Add to lyrics
          if (isRecording) {
            const newSegment: LyricsSegment = {
              text: transcript.trim(),
              timestamp: Date.now(),
              start: recordingDuration,
              end: recordingDuration + 1,
              isEditable: true,
            };
            setLyrics(prev => [...prev, newSegment]);
          }

          // Check for voice commands (only when not actively recording lyrics)
          if (voiceCommandsEnabled && !isRecording) {
            handleVoiceCommand(transcript.toLowerCase().trim());
          }
        } else {
          interimTranscript += transcript;
        }
      }

      setCurrentTranscript(interimTranscript || finalTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please enable microphone permissions.');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isRecording, isPaused, voiceCommandsEnabled, recordingDuration]);

  /**
   * Voice commands definitions
   */
  const voiceCommands: VoiceCommand[] = [
    {
      command: 'start recording',
      aliases: ['begin recording', 'record', 'start', 'lets record'],
      action: () => startRecording(false),
    },
    {
      command: 'start recording and play beat',
      aliases: ['record with beat', 'freestyle time', 'lets go', 'play beat and record'],
      action: () => startRecording(true),
    },
    {
      command: 'stop recording',
      aliases: ['stop', 'end recording', 'finish', 'done'],
      action: stopRecording,
    },
    {
      command: 'pause',
      aliases: ['pause recording', 'hold on'],
      action: togglePause,
    },
    {
      command: 'play beat',
      aliases: ['start beat', 'play instrumental'],
      action: playBeat,
    },
    {
      command: 'stop beat',
      aliases: ['pause beat', 'stop instrumental'],
      action: stopBeat,
    },
  ];

  /**
   * Handle voice commands
   */
  const handleVoiceCommand = (transcript: string) => {
    for (const cmd of voiceCommands) {
      const matches = [cmd.command, ...cmd.aliases].some(phrase =>
        transcript.includes(phrase)
      );

      if (matches) {
        console.log('Voice command detected:', cmd.command);
        toast.success(`Command: ${cmd.command}`);
        cmd.action();
        break;
      }
    }
  };

  /**
   * Start recording
   */
  const startRecording = async (playBeatToo: boolean = false) => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      });

      mediaStreamRef.current = stream;

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        // Callback with complete session data
        if (onSessionComplete) {
          onSessionComplete(lyrics, audioBlob);
        }

        // Save to backend
        await saveRecording(audioBlob);
      };

      mediaRecorder.start(1000); // Capture in 1-second chunks
      mediaRecorderRef.current = mediaRecorder;

      setIsRecording(true);
      recordingStartTimeRef.current = Date.now();

      // Start speech recognition for lyrics
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      // Play beat if requested
      if (playBeatToo && beatAudioRef.current) {
        playBeat();
      }

      // Start recording timer
      const timerInterval = setInterval(() => {
        if (!isPaused) {
          setRecordingDuration(prev => prev + 0.1);
        }
      }, 100);

      toast.success(playBeatToo ? 'Recording started with beat!' : 'Recording started!');

      return () => clearInterval(timerInterval);
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to start recording. Please check microphone permissions.');
    }
  };

  /**
   * Stop recording
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();

      // Stop media stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }

      // Stop speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      // Stop beat
      if (isBeatPlaying) {
        stopBeat();
      }

      setIsRecording(false);
      setIsPaused(false);

      toast.success('Recording stopped! Processing...');

      // Show AI assistant for lyrics organization
      setShowAIAssistant(true);
      generateLyricsOrganization();
    }
  };

  /**
   * Toggle pause
   */
  const togglePause = () => {
    if (!isRecording) return;

    const newPausedState = !isPaused;
    setIsPaused(newPausedState);

    if (newPausedState) {
      // Pause recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      // Pause beat
      if (beatAudioRef.current) {
        beatAudioRef.current.pause();
      }
      toast.info('Recording paused');
    } else {
      // Resume recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      // Resume beat
      if (beatAudioRef.current && isBeatPlaying) {
        beatAudioRef.current.play();
      }
      toast.info('Recording resumed');
    }
  };

  /**
   * Play beat
   */
  const playBeat = () => {
    if (beatAudioRef.current) {
      beatAudioRef.current.currentTime = 0;
      beatAudioRef.current.play();
      setIsBeatPlaying(true);
      beatStartTimeRef.current = Date.now();
      toast.success('Beat playing');
    } else {
      toast.error('No beat loaded. Upload a beat first.');
    }
  };

  /**
   * Stop beat
   */
  const stopBeat = () => {
    if (beatAudioRef.current) {
      beatAudioRef.current.pause();
      beatAudioRef.current.currentTime = 0;
      setIsBeatPlaying(false);
      toast.info('Beat stopped');
    }
  };

  /**
   * Save recording to backend
   */
  const saveRecording = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, `freestyle-${Date.now()}.webm`);
      formData.append('projectId', projectId);
      formData.append('lyrics', JSON.stringify(lyrics));

      const response = await apiClient.uploadAudio(formData);

      toast.success('Recording saved successfully!');
      return response;
    } catch (error) {
      console.error('Failed to save recording:', error);
      toast.error('Failed to save recording');
    }
  };

  /**
   * Generate AI-powered lyrics organization
   */
  const generateLyricsOrganization = async () => {
    try {
      const lyricsText = lyrics.map(l => l.text).join('\n');

      const response = await apiClient.post('/api/v1/ai/organize-lyrics', {
        lyrics: lyricsText,
        projectId,
      });

      setAiSuggestion(response.data.organized);
      toast.success('AI organized your lyrics!');
    } catch (error) {
      console.error('Failed to organize lyrics:', error);
      toast.error('AI organization failed');
    }
  };

  /**
   * Export lyrics
   */
  const exportLyrics = () => {
    const text = lyrics.map(l => l.text).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `freestyle-lyrics-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Lyrics exported!');
  };

  /**
   * Format time display
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="freestyle-session h-full flex flex-col bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/30 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Mic className="w-6 h-6 text-purple-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Freestyle Session</h2>
            <p className="text-sm text-gray-400">
              {isRecording ? 'Recording...' : 'Ready to record'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Voice commands indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-lg border border-green-500/30">
            {isListening && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
            <span className="text-xs text-green-400 font-medium">
              Voice Commands {voiceCommandsEnabled ? 'ON' : 'OFF'}
            </span>
          </div>

          {/* Recording timer */}
          <div className="px-4 py-2 bg-black/50 rounded-lg border border-white/20">
            <span className="text-lg font-mono text-white">
              {formatTime(recordingDuration)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Left Side - Waveform & Controls */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Live Waveform */}
          <div className="flex-1">
            <LiveWaveformRecorder
              isRecording={isRecording}
              trackId={projectId}
              trackColor={trackColor}
              height={200}
            />
          </div>

          {/* Beat Player */}
          {beatUrl && (
            <div className="bg-black/30 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-medium text-white">Beat Track</span>
                </div>
                <span className="text-xs text-gray-400">
                  {formatTime(beatCurrentTime)} / {formatTime(beatDuration)}
                </span>
              </div>

              <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-100"
                  style={{ width: `${(beatCurrentTime / beatDuration) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Control Panel */}
          <div className="bg-black/30 rounded-lg p-6 border border-white/10">
            <div className="flex items-center justify-center gap-4">
              {!isRecording ? (
                <>
                  <button
                    onClick={() => startRecording(false)}
                    className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors shadow-lg shadow-red-500/50"
                  >
                    <Mic className="w-5 h-5" />
                    Start Recording
                  </button>

                  {beatUrl && (
                    <button
                      onClick={() => startRecording(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors shadow-lg shadow-purple-500/50"
                    >
                      <Music className="w-5 h-5" />
                      Record + Play Beat
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={togglePause}
                    className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-colors"
                  >
                    {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>

                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors animate-pulse"
                  >
                    <Square className="w-5 h-5" />
                    Stop Recording
                  </button>
                </>
              )}

              {beatUrl && !isRecording && (
                <button
                  onClick={isBeatPlaying ? stopBeat : playBeat}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
                >
                  {isBeatPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  {isBeatPlaying ? 'Stop Beat' : 'Play Beat'}
                </button>
              )}
            </div>

            {/* Voice command hint */}
            <div className="mt-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <p className="text-xs text-purple-300 text-center">
                💡 Try saying: "start recording and play beat" or "stop recording"
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Lyrics Widget */}
        {showLyricsWidget && (
          <div className="w-96">
            <LyricsWidget
              isVisible={true}
              position="top-left"
              lyrics={lyrics}
              currentTime={recordingDuration}
              showTimestamps={true}
              allowEdit={!isRecording}
              onLyricsEdit={(edited) => {
                const newLyrics = edited.split('\n').map((text, i) => ({
                  text,
                  timestamp: Date.now() + i,
                  isEditable: true,
                }));
                setLyrics(newLyrics);
              }}
            />
          </div>
        )}
      </div>

      {/* AI Assistant Modal */}
      {showAIAssistant && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-xl font-bold text-white">AI Lyrics Assistant</h3>
                </div>
                <button
                  onClick={() => setShowAIAssistant(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {aiSuggestion ? (
                <div className="space-y-4">
                  <div className="bg-black/30 rounded-lg p-4 border border-white/10">
                    <h4 className="text-sm font-semibold text-purple-300 mb-2">
                      AI Organized Version:
                    </h4>
                    <pre className="text-sm text-white whitespace-pre-wrap font-mono">
                      {aiSuggestion}
                    </pre>
                  </div>

                  <div className="bg-black/30 rounded-lg p-4 border border-white/10">
                    <h4 className="text-sm font-semibold text-blue-300 mb-2">
                      Original Raw Lyrics:
                    </h4>
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                      {lyrics.map(l => l.text).join('\n')}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-gray-400">Organizing your lyrics...</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/10 flex gap-3">
              <button
                onClick={exportLyrics}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Lyrics
              </button>
              <button
                onClick={() => {
                  if (aiSuggestion) {
                    navigator.clipboard.writeText(aiSuggestion);
                    toast.success('AI organized lyrics copied!');
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
              >
                <Save className="w-4 h-4" />
                Copy AI Version
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Current transcript overlay (shown during recording) */}
      {isRecording && currentTranscript && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-purple-500/90 backdrop-blur-sm rounded-lg shadow-xl border border-purple-400/50 z-40">
          <p className="text-white font-medium">{currentTranscript}</p>
        </div>
      )}
    </div>
  );
};

export default FreestyleSession;
