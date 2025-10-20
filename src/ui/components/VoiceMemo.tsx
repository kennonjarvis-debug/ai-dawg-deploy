/**
 * Voice Memo Component
 *
 * AI-powered voice memo system for DAWG AI:
 * - Quick voice recordings for musical ideas
 * - Automatic transcription with Whisper
 * - AI analysis (melody, rhythm, lyrics detection)
 * - Convert to MIDI, lyrics, or audio clips
 * - Organize with tags and search
 *
 * @module VoiceMemo
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Download,
  Music,
  FileText,
  Sparkles,
  Tag,
  Search,
  Clock,
  MoreVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import { whisperGPTService } from '../../services/WhisperGPTService';
import { logger } from '../../backend/utils/logger';
import { formatDuration } from '../../utils/formatters';

// ============================================================================
// Types
// ============================================================================

export interface VoiceMemoData {
  id: string;
  audioBlob: Blob;
  audioUrl: string;
  duration: number;
  transcription?: string;
  analysis?: {
    containsMusic: boolean;
    containsLyrics: boolean;
    containsRhythm: boolean;
    mood?: string;
    bpm?: number;
    key?: string;
  };
  tags: string[];
  createdAt: Date;
  name: string;
}

export interface VoiceMemoProps {
  onMemoCreated?: (memo: VoiceMemoData) => void;
  onConvertToClip?: (memo: VoiceMemoData) => void;
  onConvertToLyrics?: (memo: VoiceMemoData) => void;
  onConvertToMIDI?: (memo: VoiceMemoData) => void;
}

// ============================================================================
// Voice Memo Component
// ============================================================================

export const VoiceMemo: React.FC<VoiceMemoProps> = ({
  onMemoCreated,
  onConvertToClip,
  onConvertToLyrics,
  onConvertToMIDI,
}) => {
  // State
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [memos, setMemos] = useState<VoiceMemoData[]>([]);
  const [selectedMemo, setSelectedMemo] = useState<VoiceMemoData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<number | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ==========================================================================
  // Recording
  // ==========================================================================

  const startRecording = useCallback(async () => {
    try {
      logger.info('[VoiceMemo] Starting recording');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1, // Mono for voice
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        await handleRecordingComplete();
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      // Start duration timer
      recordingStartTimeRef.current = Date.now();
      recordingIntervalRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - recordingStartTimeRef.current) / 1000;
        setRecordingDuration(elapsed);
      }, 100);

      toast.success('Recording voice memo...');
    } catch (error) {
      logger.error('[VoiceMemo] Failed to start recording', { error });
      toast.error('Failed to access microphone');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      logger.info('[VoiceMemo] Stopped recording', { duration: recordingDuration });
    }
  }, [isRecording, recordingDuration]);

  const handleRecordingComplete = useCallback(async () => {
    setIsProcessing(true);

    try {
      // Create audio blob
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const audioUrl = URL.createObjectURL(audioBlob);

      logger.info('[VoiceMemo] Recording complete', { size: audioBlob.size });

      // Create memo object
      const memo: VoiceMemoData = {
        id: crypto.randomUUID(),
        audioBlob,
        audioUrl,
        duration: recordingDuration,
        tags: [],
        createdAt: new Date(),
        name: `Voice Memo ${new Date().toLocaleString()}`,
      };

      // Transcribe and analyze in background
      transcribeAndAnalyzeMemo(memo);

      // Add to list
      setMemos(prev => [memo, ...prev]);
      setSelectedMemo(memo);

      onMemoCreated?.(memo);

      toast.success('Voice memo saved!');
    } catch (error) {
      logger.error('[VoiceMemo] Failed to process recording', { error });
      toast.error('Failed to save voice memo');
    } finally {
      setIsProcessing(false);
      setRecordingDuration(0);
    }
  }, [recordingDuration, onMemoCreated]);

  // ==========================================================================
  // AI Analysis
  // ==========================================================================

  const transcribeAndAnalyzeMemo = async (memo: VoiceMemoData) => {
    try {
      logger.info('[VoiceMemo] Transcribing memo', { id: memo.id });

      // Transcribe with Whisper
      const transcription = await whisperGPTService.transcribe(memo.audioBlob);

      // Simple analysis (in production, use more sophisticated ML)
      const analysis = {
        containsMusic: /\b(melody|tune|hum|sing|note|chord)\b/i.test(transcription.text),
        containsLyrics: /\b(verse|chorus|bridge|lyric|line)\b/i.test(transcription.text),
        containsRhythm: /\b(beat|rhythm|drum|tempo|bpm)\b/i.test(transcription.text),
        mood: detectMood(transcription.text),
      };

      // Update memo
      setMemos(prev =>
        prev.map(m =>
          m.id === memo.id
            ? { ...m, transcription: transcription.text, analysis }
            : m
        )
      );

      logger.info('[VoiceMemo] Transcription complete', { id: memo.id, analysis });
      toast.success('Memo transcribed!');
    } catch (error) {
      logger.error('[VoiceMemo] Transcription failed', { error });
      // Don't show error to user - transcription is optional
    }
  };

  const detectMood = (text: string): string => {
    const moodKeywords = {
      happy: /\b(happy|joy|upbeat|cheerful|bright|fun)\b/i,
      sad: /\b(sad|melancholy|down|blue|somber)\b/i,
      energetic: /\b(energy|fast|intense|powerful|driving)\b/i,
      calm: /\b(calm|peaceful|quiet|gentle|soft)\b/i,
      dark: /\b(dark|heavy|moody|dramatic)\b/i,
    };

    for (const [mood, pattern] of Object.entries(moodKeywords)) {
      if (pattern.test(text)) {
        return mood;
      }
    }

    return 'neutral';
  };

  // ==========================================================================
  // Playback
  // ==========================================================================

  const playMemo = useCallback((memo: VoiceMemoData) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying && selectedMemo?.id === memo.id) {
      // Pause
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Play
      audioRef.current.src = memo.audioUrl;
      audioRef.current.play();
      setIsPlaying(true);
      setSelectedMemo(memo);
    }
  }, [isPlaying, selectedMemo]);

  // ==========================================================================
  // Memo Management
  // ==========================================================================

  const deleteMemo = useCallback((memoId: string) => {
    setMemos(prev => {
      const memo = prev.find(m => m.id === memoId);
      if (memo) {
        URL.revokeObjectURL(memo.audioUrl);
      }
      return prev.filter(m => m.id !== memoId);
    });

    if (selectedMemo?.id === memoId) {
      setSelectedMemo(null);
    }

    toast.success('Memo deleted');
  }, [selectedMemo]);

  const downloadMemo = useCallback((memo: VoiceMemoData) => {
    const a = document.createElement('a');
    a.href = memo.audioUrl;
    a.download = `${memo.name}.webm`;
    a.click();
    toast.success('Downloading memo...');
  }, []);

  const addTag = useCallback((memoId: string, tag: string) => {
    setMemos(prev =>
      prev.map(m =>
        m.id === memoId && !m.tags.includes(tag)
          ? { ...m, tags: [...m.tags, tag] }
          : m
      )
    );
  }, []);

  const removeTag = useCallback((memoId: string, tag: string) => {
    setMemos(prev =>
      prev.map(m =>
        m.id === memoId
          ? { ...m, tags: m.tags.filter(t => t !== tag) }
          : m
      )
    );
  }, []);

  // ==========================================================================
  // Conversion Actions
  // ==========================================================================

  const convertToClip = useCallback((memo: VoiceMemoData) => {
    onConvertToClip?.(memo);
    toast.success('Converting to audio clip...');
  }, [onConvertToClip]);

  const convertToLyrics = useCallback((memo: VoiceMemoData) => {
    if (!memo.transcription) {
      toast.error('Memo must be transcribed first');
      return;
    }
    onConvertToLyrics?.(memo);
    toast.success('Extracting lyrics...');
  }, [onConvertToLyrics]);

  const convertToMIDI = useCallback((memo: VoiceMemoData) => {
    onConvertToMIDI?.(memo);
    toast.success('Converting to MIDI...');
  }, [onConvertToMIDI]);

  // ==========================================================================
  // Filtering
  // ==========================================================================

  const filteredMemos = memos.filter(memo => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      memo.name.toLowerCase().includes(query) ||
      memo.transcription?.toLowerCase().includes(query) ||
      memo.tags.some(tag => tag.toLowerCase().includes(query))
    );
  });

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Music className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Voice Memos</h2>
            <p className="text-sm text-gray-400">Capture musical ideas instantly</p>
          </div>
        </div>

        {/* Recording Controls */}
        <div className="flex items-center gap-2">
          {isRecording ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-400 text-sm font-medium">
                  {formatDuration(recordingDuration)}
                </span>
              </div>
              <button
                onClick={stopRecording}
                className="p-3 bg-red-600 hover:bg-red-700 rounded-full transition"
              >
                <Square className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              onClick={startRecording}
              disabled={isProcessing}
              className="p-3 bg-purple-600 hover:bg-purple-700 rounded-full transition disabled:opacity-50"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search memos, transcriptions, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Memos List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredMemos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Mic className="w-16 h-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No voice memos yet</h3>
            <p className="text-gray-400 max-w-md">
              Click the microphone button to record musical ideas, lyrics, or production notes.
              They'll be automatically transcribed and organized.
            </p>
          </div>
        ) : (
          filteredMemos.map((memo) => (
            <MemoCard
              key={memo.id}
              memo={memo}
              isSelected={selectedMemo?.id === memo.id}
              isPlaying={isPlaying && selectedMemo?.id === memo.id}
              onPlay={playMemo}
              onDelete={deleteMemo}
              onDownload={downloadMemo}
              onAddTag={addTag}
              onRemoveTag={removeTag}
              onConvertToClip={convertToClip}
              onConvertToLyrics={convertToLyrics}
              onConvertToMIDI={convertToMIDI}
            />
          ))
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Memo Card Component
// ============================================================================

interface MemoCardProps {
  memo: VoiceMemoData;
  isSelected: boolean;
  isPlaying: boolean;
  onPlay: (memo: VoiceMemoData) => void;
  onDelete: (id: string) => void;
  onDownload: (memo: VoiceMemoData) => void;
  onAddTag: (id: string, tag: string) => void;
  onRemoveTag: (id: string, tag: string) => void;
  onConvertToClip: (memo: VoiceMemoData) => void;
  onConvertToLyrics: (memo: VoiceMemoData) => void;
  onConvertToMIDI: (memo: VoiceMemoData) => void;
}

const MemoCard: React.FC<MemoCardProps> = ({
  memo,
  isSelected,
  isPlaying,
  onPlay,
  onDelete,
  onDownload,
  onAddTag,
  onRemoveTag,
  onConvertToClip,
  onConvertToLyrics,
  onConvertToMIDI,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className={`
        p-4 rounded-lg border transition cursor-pointer
        ${isSelected
          ? 'bg-purple-500/10 border-purple-500/50'
          : 'bg-gray-800 border-gray-700 hover:border-gray-600'
        }
      `}
      onClick={() => onPlay(memo)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            className={`
              p-2 rounded-full transition
              ${isPlaying ? 'bg-purple-600' : 'bg-purple-600/20'}
            `}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <div>
            <h3 className="text-sm font-medium">{memo.name}</h3>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{formatDuration(memo.duration)}</span>
              <span>•</span>
              <span>{memo.createdAt.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 hover:bg-gray-700 rounded transition"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onConvertToClip(memo);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-700 transition flex items-center gap-2"
              >
                <Music className="w-4 h-4" />
                Convert to Clip
              </button>
              {memo.transcription && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onConvertToLyrics(memo);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-700 transition flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Extract Lyrics
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onConvertToMIDI(memo);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-700 transition flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Convert to MIDI
              </button>
              <div className="border-t border-gray-700" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(memo);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-700 transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(memo.id);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-red-600 transition flex items-center gap-2 text-red-400"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Transcription */}
      {memo.transcription && (
        <p className="text-sm text-gray-300 mb-2 line-clamp-2">{memo.transcription}</p>
      )}

      {/* Analysis Tags */}
      {memo.analysis && (
        <div className="flex flex-wrap gap-1 mb-2">
          {memo.analysis.containsMusic && (
            <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">Music</span>
          )}
          {memo.analysis.containsLyrics && (
            <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded">Lyrics</span>
          )}
          {memo.analysis.containsRhythm && (
            <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded">Rhythm</span>
          )}
          {memo.analysis.mood && (
            <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded capitalize">
              {memo.analysis.mood}
            </span>
          )}
        </div>
      )}

      {/* Tags */}
      {memo.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {memo.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 rounded flex items-center gap-1"
            >
              <Tag className="w-3 h-3" />
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
