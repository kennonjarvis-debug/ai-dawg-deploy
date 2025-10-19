/**
 * Complete Usage Example: Real-Time Vocal Analysis System
 *
 * This example demonstrates how to use all components together
 * for a complete recording session with:
 * - Draggable/resizable widgets
 * - Real-time pitch display
 * - Dual audio streaming (vocals + backing)
 * - AI-powered recommendations
 * - Cost monitoring
 */

import React, { useState, useEffect } from 'react';
import { DraggableResizableWrapper } from '../src/ui/components/DraggableResizableWrapper';
import { LivePitchDisplay } from '../src/ui/components/LivePitchDisplay';
import { LyricsWidget, LyricsSegment } from '../src/ui/recording/LyricsWidget';
import { AIChatWidget } from '../src/ui/components/AIChatWidget';
import { useMultiTrackRecordingEnhanced } from '../src/hooks/useMultiTrackRecordingEnhanced';
import { useTransportStore } from '../src/stores/transportStore';
import { io } from 'socket.io-client';
import { toast } from 'sonner';

export function VocalAnalysisExample() {
  // State
  const [showPitchDisplay, setShowPitchDisplay] = useState(false);
  const [showLyrics, setShowLyrics] = useState(true);
  const [showAIChat, setShowAIChat] = useState(true);
  const [lyrics, setLyrics] = useState<LyricsSegment[]>([]);
  const [sessionCost, setSessionCost] = useState<number>(0);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);

  // Transport controls
  const { isRecording, setIsRecording, isPlaying, setIsPlaying, currentTime } = useTransportStore();

  // Enhanced recording with dual audio streaming
  const { isRecordingActive, recordingTrackCount, isDualStreamActive } =
    useMultiTrackRecordingEnhanced({
      enableVocalAnalysis: true,
      enableAudioSeparation: true,
      enableAIRecommendations: true,
      streamToAI: true,
      expectedKey: 'C',
      expectedBPM: 120,
      separationMethod: 'hybrid',
    });

  // WebSocket for cost monitoring
  useEffect(() => {
    const socket = io('http://localhost:3000');

    socket.on('connect', () => {
      console.log('Connected to cost monitoring');
    });

    socket.on('session-cost-update', (data: { cost: number; duration: number }) => {
      setSessionCost(data.cost);
      setRecordingDuration(data.duration);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Start recording
  const handleStartRecording = () => {
    setIsRecording(true);
    setShowPitchDisplay(true);
    toast.success('Recording started with real-time vocal analysis!');
  };

  // Stop recording
  const handleStopRecording = () => {
    setIsRecording(false);
    setShowPitchDisplay(false);
    toast.success(`Recording stopped. Session cost: $${sessionCost.toFixed(4)}`);
  };

  // Update lyrics from transcription
  const handleLyricsUpdate = (text: string) => {
    const newSegment: LyricsSegment = {
      text,
      timestamp: Date.now(),
      start: currentTime,
      end: currentTime + 5,
      isEditable: true,
    };
    setLyrics((prev) => [...prev, newSegment]);
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden">
      {/* Header with Controls */}
      <div className="fixed top-0 left-0 right-0 bg-black/50 backdrop-blur-md z-50 px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">Vocal Analysis Studio</h1>
            <div className="flex items-center gap-2">
              {isRecordingActive && (
                <div className="flex items-center gap-2 text-red-400 animate-pulse">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="font-medium">LIVE</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Recording Controls */}
            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>

            {/* Playback Control */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all"
              disabled={isRecording}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>

            {/* Widget Toggles */}
            <div className="flex items-center gap-2 border-l border-white/20 pl-4">
              <button
                onClick={() => setShowPitchDisplay(!showPitchDisplay)}
                className={`px-3 py-2 rounded-lg text-sm ${
                  showPitchDisplay
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                Pitch
              </button>
              <button
                onClick={() => setShowLyrics(!showLyrics)}
                className={`px-3 py-2 rounded-lg text-sm ${
                  showLyrics
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                Lyrics
              </button>
              <button
                onClick={() => setShowAIChat(!showAIChat)}
                className={`px-3 py-2 rounded-lg text-sm ${
                  showAIChat
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                AI Chat
              </button>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-6 mt-4 text-sm text-white/70">
          <div>
            <span className="text-white/50">Duration:</span>{' '}
            <span className="font-mono">{Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}</span>
          </div>
          <div>
            <span className="text-white/50">Tracks Recording:</span>{' '}
            <span className="font-mono">{recordingTrackCount}</span>
          </div>
          <div>
            <span className="text-white/50">Dual Stream:</span>{' '}
            <span className={isDualStreamActive ? 'text-green-400' : 'text-red-400'}>
              {isDualStreamActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div>
            <span className="text-white/50">Session Cost:</span>{' '}
            <span className="font-mono text-green-400">${sessionCost.toFixed(4)}</span>
          </div>
        </div>
      </div>

      {/* Draggable Widgets */}
      <div className="pt-32 pb-8">
        {/* Live Pitch Display */}
        {showPitchDisplay && (
          <LivePitchDisplay
            isVisible={true}
            trackId="vocal-track-1"
            projectId="my-song"
            websocketUrl="http://localhost:3000"
            expectedKey="C"
            showHistory={true}
            historyDuration={10}
          />
        )}

        {/* Lyrics Widget */}
        {showLyrics && (
          <DraggableResizableWrapper
            id="lyrics-widget-vocal-analysis"
            initialPosition={{ x: 20, y: 100 }}
            initialSize={{ width: 400, height: 600 }}
            minWidth={300}
            minHeight={400}
          >
            <LyricsWidget
              isVisible={true}
              lyrics={lyrics}
              onLyricsEdit={handleLyricsUpdate}
              autoScroll={true}
              showTimestamps={true}
              allowEdit={true}
              currentTime={currentTime}
              trackId="vocal-track-1"
              projectId="my-song"
              websocketUrl="http://localhost:3000"
            />
          </DraggableResizableWrapper>
        )}

        {/* AI Chat Widget */}
        {showAIChat && (
          <DraggableResizableWrapper
            id="ai-chat-widget-vocal-analysis"
            initialPosition={{ x: window.innerWidth - 420, y: 100 }}
            initialSize={{ width: 400, height: 500 }}
            minWidth={350}
            minHeight={400}
          >
            <AIChatWidget
              isOpen={true}
              onClose={() => setShowAIChat(false)}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              onUpdateLyrics={handleLyricsUpdate}
            />
          </DraggableResizableWrapper>
        )}
      </div>

      {/* Info Panel */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-md rounded-lg px-6 py-3 border border-white/10">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-white/70">Real-time pitch detection</span>
          </div>
          <div className="w-px h-4 bg-white/20" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-white/70">Audio separation active</span>
          </div>
          <div className="w-px h-4 bg-white/20" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            <span className="text-white/70">AI recommendations enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VocalAnalysisExample;

/**
 * USAGE NOTES:
 *
 * 1. Make sure the WebSocket server is running on port 3000
 * 2. Ensure microphone permissions are granted
 * 3. Have at least one armed track in the timeline
 * 4. For best results, use headphones to avoid feedback
 * 5. Set the expected key and BPM before recording
 *
 * SHORTCUTS:
 * - Drag widgets by clicking and holding
 * - Resize by dragging corners/edges
 * - Widget positions persist in localStorage
 * - All audio processing is client-side (free)
 * - AI recommendations are batched every 5 seconds
 *
 * COST OPTIMIZATION:
 * - Disable AI recommendations if not needed
 * - Increase batch interval from 5s to 10s
 * - Use 'highpass' separation method instead of 'hybrid' for better performance
 * - Only enable vocal analysis when actively recording
 */
