/**
 * Client-Side Audio Uploader with Auto BPM/Key Detection
 * Processes audio without backend, using Web Audio API
 */

import React, { useCallback, useState } from 'react';
import { Upload, Music, AlertCircle, Zap, Hash, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useTimelineStore } from '@/stores/timelineStore';
import { getAudioEngine } from '@/audio/AudioEngine';

interface AudioUploaderClientSideProps {
  trackId?: string;
  onUploadComplete?: (data: {
    buffer: AudioBuffer;
    bpm?: number;
    key?: string;
    fileName: string;
  }) => void;
  accept?: string;
  maxSizeMB?: number;
}

interface AnalysisResult {
  bpm: number;
  key: string;
  confidence: number;
  duration: number;
}

export const AudioUploaderClientSide: React.FC<AudioUploaderClientSideProps> = ({
  trackId,
  onUploadComplete,
  accept = 'audio/*,.wav,.mp3,.aiff,.flac,.ogg',
  maxSizeMB = 100,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const { addClip, addTrack, tracks } = useTimelineStore();

  const analyzeAudio = async (audioBuffer: AudioBuffer): Promise<AnalysisResult | null> => {
    try {
      const engine = getAudioEngine();

      // Detect BPM
      setProgress(30);
      const bpmResult = await engine.detectBPM(audioBuffer);

      // Detect Key
      setProgress(60);
      const keyResult = await engine.detectKey(audioBuffer);

      setProgress(90);

      return {
        bpm: bpmResult?.bpm || 120,
        key: keyResult?.key || 'C',
        confidence: bpmResult?.confidence || 0.5,
        duration: audioBuffer.duration,
      };
    } catch (error) {
      console.error('Audio analysis error:', error);
      return {
        bpm: 120,
        key: 'C',
        confidence: 0,
        duration: audioBuffer.duration,
      };
    }
  };

  const processAudioFile = async (file: File) => {
    const UPLOAD_TIMEOUT_MS = 120000; // 2 minutes timeout

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('File upload timed out. Please try a smaller file or check your connection.')), UPLOAD_TIMEOUT_MS);
    });

    try {
      setIsProcessing(true);
      setProgress(0);

      // Wrap entire processing in timeout
      await Promise.race([
        (async () => {
          // Read file as ArrayBuffer
          setProgress(10);
          const arrayBuffer = await file.arrayBuffer();

          // Decode audio
          setProgress(20);
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          // Analyze audio (BPM & Key)
          const analysisResult = await analyzeAudio(audioBuffer);
          setAnalysis(analysisResult);

          setProgress(100);

          // Auto-create track if needed, then add clip
          let targetTrackId = trackId;

          if (!targetTrackId) {
            // Create a new track for this audio file
            const newTrack = addTrack({
              name: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
              color: '#3b82f6',
            });
            targetTrackId = newTrack.id;
            console.log(`[AudioUploader] Created new track "${newTrack.name}" (${targetTrackId})`);
          }

          // Generate waveform
          const engine = getAudioEngine();
          const waveformData = engine.getWaveformData(audioBuffer, 1000);

          // Export as blob for URL
          const blob = engine.exportAsWAV(audioBuffer);
          const audioUrl = URL.createObjectURL(blob);

          // Add clip to timeline
          addClip(targetTrackId, {
            name: file.name,
            startTime: 0,
            duration: audioBuffer.duration,
            color: '#3b82f6',
            audioBuffer,
            waveformData,
            audioUrl,
            bpm: analysisResult?.bpm,
            key: analysisResult?.key,
          });

          console.log(`[AudioUploader] Added clip "${file.name}" to track ${targetTrackId}`);

          // Show BPM/Key info
          if (analysisResult && (analysisResult.bpm || analysisResult.key)) {
            toast.success(
              `Added to timeline! 🎵 ${analysisResult.bpm.toFixed(0)} BPM, Key: ${analysisResult.key}`,
              { duration: 4000 }
            );
          }

          // Callback
          if (onUploadComplete) {
            onUploadComplete({
              buffer: audioBuffer,
              bpm: analysisResult?.bpm,
              key: analysisResult?.key,
              fileName: file.name,
            });
          }
        })(),
        timeoutPromise
      ]);

    } catch (error) {
      console.error('Audio processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process audio file';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setAnalysis(null);
    }
  };

  const uploadFile = async (file: File) => {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error(`File size exceeds ${maxSizeMB}MB limit`);
      return;
    }

    // Check file type
    const isAudio = file.type.startsWith('audio/') ||
      /\.(wav|mp3|aiff|flac|ogg|m4a)$/i.test(file.name);

    if (!isAudio) {
      toast.error('Please upload a valid audio file');
      return;
    }

    await processAudioFile(file);
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      await uploadFile(file);
    }
  }, [trackId]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      await uploadFile(file);
    }
    // Reset input
    e.target.value = '';
  }, [trackId]);

  return (
    <div className="w-full">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8
          transition-all duration-200 cursor-pointer
          ${isDragging
            ? 'border-primary bg-primary/10'
            : 'border-border-base hover:border-primary/50'
          }
          ${isProcessing ? 'pointer-events-none opacity-50' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('audio-file-input-client')?.click()}
      >
        <input
          id="audio-file-input-client"
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          multiple
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center justify-center gap-3">
          {isProcessing ? (
            <>
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />

              {/* Progress Bar */}
              <div className="w-full max-w-xs bg-bg-surface rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Progress Text */}
              <p className="text-sm text-text-muted">
                {progress < 20 && 'Loading audio...'}
                {progress >= 20 && progress < 30 && 'Decoding...'}
                {progress >= 30 && progress < 60 && '🎵 Detecting BPM...'}
                {progress >= 60 && progress < 90 && '🎹 Detecting Key...'}
                {progress >= 90 && 'Finalizing...'}
              </p>

              {/* Analysis Preview */}
              {analysis && (
                <div className="flex gap-4 mt-2 text-xs text-text-muted">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{analysis.bpm.toFixed(0)} BPM</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    <span>Key: {analysis.key}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <Music className="w-6 h-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-base font-medium text-text-base">
                  Drop audio files here or click to browse
                </p>
                <p className="text-sm text-text-muted mt-1">
                  Supports WAV, MP3, AIFF, FLAC, OGG (max {maxSizeMB}MB)
                </p>
                <div className="flex items-center justify-center gap-2 mt-2 text-xs text-primary">
                  <Zap className="w-3 h-3" />
                  <span>Auto-detects BPM & Key</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioUploaderClientSide;
