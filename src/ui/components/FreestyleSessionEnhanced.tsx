/**
 * Enhanced Freestyle Recording Session
 *
 * Professional recording system with:
 * - Real-time waveform visualization
 * - Live lyrics transcription
 * - Voice command control
 * - Beat playback during recording
 * - AI-powered lyrics organization
 * - Take management (playlist system) ⭐ NEW
 * - Punch recording markers ⭐ NEW
 * - AI rhyme suggestions ⭐ NEW
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic, MicOff, Play, Pause, Square, Music, Sparkles, Save, Download,
  MessageSquare, List, Target, Lightbulb, ChevronDown, Plus,
} from 'lucide-react';
import { LiveWaveformRecorder } from './LiveWaveformRecorder';
import { LyricsWidget, LyricsSegment } from '../recording/LyricsWidget';
import { PunchMarkers, PunchMarker } from './PunchMarkers';
import { apiClient } from '../../api/client';
import { toast } from 'sonner';
import {
  getRhymeSuggestions,
  getNextLineSuggestions,
  analyzeRhymeScheme,
} from '../../services/rhymeService';

export interface FreestyleSessionProps {
  projectId: string;
  trackId?: string;
  beatFileId?: string;
  beatUrl?: string;
  trackColor?: string;
  onSessionComplete?: (lyrics: LyricsSegment[], audioBlob: Blob, takeNumber: number) => void;
  onCreatePlaylist?: (trackId: string, name: string) => void;
  onActivatePlaylist?: (trackId: string, playlistId: string) => void;
}

interface Take {
  id: string;
  number: number;
  name: string;
  audioBlob: Blob;
  lyrics: LyricsSegment[];
  duration: number;
  timestamp: number;
  isActive: boolean;
}

interface VoiceCommand {
  command: string;
  action: () => void;
  aliases: string[];
}

export const FreestyleSessionEnhanced: React.FC<FreestyleSessionProps> = ({
  projectId,
  trackId,
  beatFileId,
  beatUrl,
  trackColor = '#3b82f6',
  onSessionComplete,
  onCreatePlaylist,
  onActivatePlaylist,
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

  // Take management ⭐ NEW
  const [takes, setTakes] = useState<Take[]>([]);
  const [currentTake, setCurrentTake] = useState(1);
  const [activeTakeId, setActiveTakeId] = useState<string | null>(null);
  const [showTakesList, setShowTakesList] = useState(false);

  // Punch markers ⭐ NEW
  const [punchMarkers, setPunchMarkers] = useState<PunchMarker[]>([]);
  const [activePunchMarkerId, setActivePunchMarkerId] = useState<string | null>(null);
  const [showPunchMarkers, setShowPunchMarkers] = useState(false);
  const [autoPunch, setAutoPunch] = useState(false);

  // AI Rhyme suggestions ⭐ NEW
  const [rhymeSuggestions, setRhymeSuggestions] = useState<Array<{word: string; type: string; score: number}>>([]);
  const [lineSuggestions, setLineSuggestions] = useState<string[]>([]);
  const [showRhymeSuggestions, setShowRhymeSuggestions] = useState(true);
  const [rhymeScheme, setRhymeScheme] = useState<{scheme: string; quality: number; patterns: string[]}>({
    scheme: '',
    quality: 0,
    patterns: [],
  });

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
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Initialize audio context and beat playback
   */
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

        if (beatUrl) {
          beatAudioRef.current = new Audio(beatUrl);
          beatAudioRef.current.addEventListener('loadedmetadata', () => {
            setBeatDuration(beatAudioRef.current?.duration || 0);
          });

          beatAudioRef.current.addEventListener('timeupdate', () => {
            const currentTime = beatAudioRef.current?.currentTime || 0;
            setBeatCurrentTime(currentTime);

            // Check for auto punch in/out
            if (autoPunch && activePunchMarkerId && isRecording) {
              const activeMarker = punchMarkers.find(m => m.id === activePunchMarkerId);
              if (activeMarker) {
                // Auto punch in
                if (currentTime >= activeMarker.punchIn && isPaused) {
                  togglePause(); // Resume
                  toast.info('Auto punch in!');
                }
                // Auto punch out
                if (currentTime >= activeMarker.punchOut && !isPaused) {
                  togglePause(); // Pause
                  toast.info('Auto punch out!');
                }
              }
            }
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
      if (beatAudioRef.current) {
        beatAudioRef.current.pause();
        beatAudioRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [beatUrl]);

  /**
   * Update rhyme suggestions when lyrics change ⭐ NEW
   */
  useEffect(() => {
    if (lyrics.length === 0) return;

    const lastLine = lyrics[lyrics.length - 1]?.text || '';
    const words = lastLine.trim().split(/\s+/);
    const lastWord = words[words.length - 1];

    if (lastWord && lastWord.length > 2) {
      const suggestions = getRhymeSuggestions(lastWord, {
        lastWords: lyrics.slice(-5).map(l => l.text.split(/\s+/).pop() || ''),
        currentLine: lastLine,
      });
      setRhymeSuggestions(suggestions);

      const nextLines = getNextLineSuggestions({
        lastWords: lyrics.map(l => l.text.split(/\s+/).pop() || ''),
        currentLine: lastLine,
      });
      setLineSuggestions(nextLines);
    }

    // Analyze rhyme scheme
    const allLines = lyrics.map(l => l.text);
    const scheme = analyzeRhymeScheme(allLines);
    setRhymeScheme(scheme);
  }, [lyrics]);

  /**
   * Initialize voice recognition
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

    recognition.onstart = () => setIsListening(true);

    recognition.onend = () => {
      setIsListening(false);
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

        if (event.results[i].isFinal) {
          finalTranscript += transcript;

          if (isRecording && !isPaused) {
            const newSegment: LyricsSegment = {
              text: transcript.trim(),
              timestamp: Date.now(),
              start: recordingDuration,
              end: recordingDuration + 1,
              isEditable: true,
            };
            setLyrics(prev => [...prev, newSegment]);
          }

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
      command: 'new take',
      aliases: ['next take', 'another take', 'retake'],
      action: createNewTake,
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
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      });

      mediaStreamRef.current = stream;
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

        // Save as new take
        const newTake: Take = {
          id: `take-${Date.now()}`,
          number: currentTake,
          name: `Take ${currentTake}`,
          audioBlob,
          lyrics: [...lyrics],
          duration: recordingDuration,
          timestamp: Date.now(),
          isActive: true,
        };

        setTakes(prev => {
          const updated = prev.map(t => ({ ...t, isActive: false }));
          return [...updated, newTake];
        });
        setActiveTakeId(newTake.id);

        if (onSessionComplete) {
          onSessionComplete(lyrics, audioBlob, currentTake);
        }

        await saveRecording(audioBlob, currentTake);
      };

      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;

      setIsRecording(true);
      recordingStartTimeRef.current = Date.now();

      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      if (playBeatToo && beatAudioRef.current) {
        playBeat();
      }

      timerIntervalRef.current = setInterval(() => {
        if (!isPaused) {
          setRecordingDuration(prev => prev + 0.1);
        }
      }, 100);

      toast.success(playBeatToo ? `Recording Take ${currentTake} with beat!` : `Recording Take ${currentTake}!`);
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

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      if (isBeatPlaying) {
        stopBeat();
      }

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      setIsRecording(false);
      setIsPaused(false);

      toast.success(`Take ${currentTake} completed! Processing...`);

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
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (beatAudioRef.current) {
        beatAudioRef.current.pause();
      }
      toast.info('Recording paused');
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      if (beatAudioRef.current && isBeatPlaying) {
        beatAudioRef.current.play();
      }
      toast.info('Recording resumed');
    }
  };

  /**
   * Create new take ⭐ NEW
   */
  const createNewTake = () => {
    if (isRecording) {
      toast.warning('Stop current recording first');
      return;
    }

    setCurrentTake(prev => prev + 1);
    setLyrics([]);
    setRecordingDuration(0);
    toast.success(`Ready for Take ${currentTake + 1}`);
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
  const saveRecording = async (audioBlob: Blob, takeNumber: number) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, `freestyle-take${takeNumber}-${Date.now()}.webm`);
      formData.append('projectId', projectId);
      formData.append('takeNumber', takeNumber.toString());
      formData.append('lyrics', JSON.stringify(lyrics));

      const response = await apiClient.uploadAudio(formData);

      toast.success(`Take ${takeNumber} saved successfully!`);
      return response;
    } catch (error) {
      console.error('Failed to save recording:', error);
      toast.error(`Failed to save Take ${takeNumber}`);
    }
  };

  /**
   * Generate AI-powered lyrics organization
   */
  const generateLyricsOrganization = async () => {
    try {
      const lyricsText = lyrics.map(l => l.text).join('\n');

      const response = await apiClient.post('/api/v1/lyrics/organize', {
        lyrics: lyricsText,
        projectId,
      });

      setAiSuggestion(response.data.data.organized);
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
    a.download = `freestyle-take${currentTake}-${Date.now()}.txt`;
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
            <h2 className="text-xl font-bold text-white">Freestyle Session - Take {currentTake}</h2>
            <p className="text-sm text-gray-400">
              {isRecording ? 'Recording...' : takes.length > 0 ? `${takes.length} takes recorded` : 'Ready to record'}
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

          {/* Takes list button */}
          <button
            onClick={() => setShowTakesList(!showTakesList)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg border border-blue-500/30 transition-colors"
          >
            <List className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-400">{takes.length} Takes</span>
          </button>
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
              trackId={trackId || projectId}
              trackColor={trackColor}
              height={200}
            />
          </div>

          {/* Punch Markers Section ⭐ NEW */}
          {showPunchMarkers && (
            <div className="bg-black/30 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-400" />
                  <span className="text-sm font-medium text-white">Punch Recording</span>
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-400">
                  <input
                    type="checkbox"
                    checked={autoPunch}
                    onChange={(e) => setAutoPunch(e.target.checked)}
                    className="rounded"
                  />
                  Auto Punch
                </label>
              </div>
              <PunchMarkers
                markers={punchMarkers}
                currentTime={beatCurrentTime}
                duration={beatDuration}
                onMarkerAdd={(marker) => {
                  const newMarker: PunchMarker = {
                    ...marker,
                    id: `punch-${Date.now()}`,
                  };
                  setPunchMarkers(prev => [...prev, newMarker]);
                }}
                onMarkerUpdate={(id, updates) => {
                  setPunchMarkers(prev =>
                    prev.map(m => m.id === id ? { ...m, ...updates } : m)
                  );
                }}
                onMarkerDelete={(id) => {
                  setPunchMarkers(prev => prev.filter(m => m.id !== id));
                }}
                onMarkerActivate={(id) => {
                  setPunchMarkers(prev =>
                    prev.map(m => ({ ...m, isActive: m.id === id }))
                  );
                  setActivePunchMarkerId(id);
                }}
              />
            </div>
          )}

          {/* Beat Player */}
          {beatUrl && (
            <div className="bg-black/30 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-medium text-white">Beat Track</span>
                </div>
                <button
                  onClick={() => setShowPunchMarkers(!showPunchMarkers)}
                  className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
                >
                  <Target className="w-3 h-3" />
                  {showPunchMarkers ? 'Hide' : 'Show'} Punch Markers
                </button>
              </div>

              <div className="flex items-center gap-2 mb-2">
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

                  {takes.length > 0 && (
                    <button
                      onClick={createNewTake}
                      className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      New Take
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
                💡 Say: "start recording and play beat" | "stop recording" | "new take"
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Lyrics Widget & Rhyme Suggestions */}
        {showLyricsWidget && (
          <div className="w-96 flex flex-col gap-4">
            {/* Lyrics Widget */}
            <div className="flex-1">
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

            {/* AI Rhyme Suggestions ⭐ NEW */}
            {showRhymeSuggestions && lyrics.length > 0 && (
              <div className="bg-black/30 rounded-lg p-4 border border-white/10 max-h-64 overflow-y-auto">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                  <h3 className="text-sm font-semibold text-white">AI Rhyme Suggestions</h3>
                </div>

                {/* Rhyme Scheme Analysis */}
                {rhymeScheme.scheme && (
                  <div className="mb-3 p-2 bg-purple-500/10 rounded border border-purple-500/20">
                    <div className="text-xs text-purple-300 mb-1">
                      Rhyme Scheme: <span className="font-mono font-bold">{rhymeScheme.scheme}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {rhymeScheme.patterns.join(', ')} • Quality: {(rhymeScheme.quality * 100).toFixed(0)}%
                    </div>
                  </div>
                )}

                {/* Rhyme Suggestions */}
                {rhymeSuggestions.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-gray-400 mb-2">Rhymes with last word:</div>
                    <div className="flex flex-wrap gap-2">
                      {rhymeSuggestions.slice(0, 8).map((sugg, i) => (
                        <button
                          key={i}
                          className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded text-xs text-blue-300 transition-colors"
                          onClick={() => {
                            navigator.clipboard.writeText(sugg.word);
                            toast.success(`Copied: ${sugg.word}`);
                          }}
                        >
                          {sugg.word}
                          <span className="ml-1 text-[10px] text-blue-400/70">
                            {sugg.type === 'perfect' ? '✓' : sugg.type === 'near' ? '≈' : '~'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Line Suggestions */}
                {lineSuggestions.length > 0 && (
                  <div>
                    <div className="text-xs text-gray-400 mb-2">Next line ideas:</div>
                    <div className="space-y-1">
                      {lineSuggestions.map((line, i) => (
                        <div
                          key={i}
                          className="text-xs text-green-300 bg-green-500/10 px-2 py-1 rounded cursor-pointer hover:bg-green-500/20 transition-colors"
                          onClick={() => {
                            navigator.clipboard.writeText(line);
                            toast.success('Line suggestion copied!');
                          }}
                        >
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Takes List Panel ⭐ NEW */}
      {showTakesList && (
        <div className="fixed top-20 right-4 w-80 bg-black/90 backdrop-blur-lg rounded-lg border border-white/20 shadow-2xl z-50 max-h-[60vh] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <List className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-white">Takes</h3>
            </div>
            <button
              onClick={() => setShowTakesList(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {takes.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No takes recorded yet
              </p>
            ) : (
              takes.map((take) => (
                <div
                  key={take.id}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    take.isActive
                      ? 'bg-blue-500/20 border-blue-500'
                      : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
                  }`}
                  onClick={() => setActiveTakeId(take.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white">{take.name}</span>
                    <span className="text-xs text-gray-400">{formatTime(take.duration)}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {take.lyrics.length} lines • {new Date(take.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* AI Assistant Modal */}
      {showAIAssistant && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-xl font-bold text-white">AI Lyrics Assistant - Take {currentTake}</h3>
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

      {/* Current transcript overlay */}
      {isRecording && currentTranscript && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-purple-500/90 backdrop-blur-sm rounded-lg shadow-xl border border-purple-400/50 z-40">
          <p className="text-white font-medium">{currentTranscript}</p>
        </div>
      )}
    </div>
  );
};

export default FreestyleSessionEnhanced;
