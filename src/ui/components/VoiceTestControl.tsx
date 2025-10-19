/**
 * Voice Test Control Component
 *
 * Admin UI for controlling test execution via voice commands.
 * Integrates with Voice Test Commander service.
 *
 * Features:
 * - Real-time voice recording
 * - Live transcription display
 * - Intent visualization
 * - Test execution status
 * - Audio response playback
 * - Command history
 * - Admin verification
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Square,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Shield,
  Activity,
  FileText,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

interface VoiceTestControlProps {
  userId: string;
  isAdmin: boolean;
  onClose?: () => void;
}

interface TranscriptionResult {
  text: string;
  timestamp: Date;
}

interface IntentResult {
  action: string;
  target?: string;
  confidence: number;
  requiresConfirmation: boolean;
  isDestructive: boolean;
}

interface TestResult {
  success: boolean;
  testsRun: number;
  testsPassed: number;
  testsFailed: number;
  duration: number;
  coverage?: {
    lines: number;
    functions: number;
    branches: number;
  };
}

interface CommandHistoryEntry {
  id: string;
  timestamp: Date;
  command: string;
  intent: IntentResult;
  result: TestResult | null;
  status: 'success' | 'error' | 'pending';
}

// ============================================================================
// Voice Test Control Component
// ============================================================================

export const VoiceTestControl: React.FC<VoiceTestControlProps> = ({
  userId,
  isAdmin,
  onClose,
}) => {
  // State
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [intent, setIntent] = useState<IntentResult | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isPlayingResponse, setIsPlayingResponse] = useState(false);
  const [commandHistory, setCommandHistory] = useState<CommandHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const responseAudioRef = useRef<HTMLAudioElement | null>(null);

  // WebSocket connection for real-time updates
  const wsRef = useRef<WebSocket | null>(null);

  // ========================================================================
  // Lifecycle
  // ========================================================================

  useEffect(() => {
    // Initialize WebSocket connection
    initializeWebSocket();

    // Initialize audio context for visualization
    audioContextRef.current = new AudioContext();

    return () => {
      // Cleanup
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // ========================================================================
  // WebSocket Communication
  // ========================================================================

  const initializeWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/voice-test-commander`;

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('Voice Test Commander WebSocket connected');
      // Authenticate
      wsRef.current?.send(
        JSON.stringify({
          type: 'auth',
          userId,
          isAdmin,
        })
      );
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast.error('Connection error. Please refresh.');
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket closed. Reconnecting...');
      setTimeout(initializeWebSocket, 3000);
    };
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'transcription':
        setTranscription({
          text: data.text,
          timestamp: new Date(data.timestamp),
        });
        break;

      case 'intent-detected':
        setIntent(data.intent);
        if (data.intent.requiresConfirmation) {
          setPendingConfirmation(true);
        }
        break;

      case 'execution-complete':
        setTestResult(data.result);
        setIsProcessing(false);
        addToHistory({
          id: `cmd-${Date.now()}`,
          timestamp: new Date(),
          command: transcription?.text || '',
          intent: intent!,
          result: data.result,
          status: data.result.success ? 'success' : 'error',
        });
        break;

      case 'response-audio':
        playResponseAudio(data.audioBase64);
        break;

      case 'error':
        toast.error(data.message);
        setIsProcessing(false);
        break;
    }
  };

  // ========================================================================
  // Voice Recording
  // ========================================================================

  const startRecording = async () => {
    if (!isAdmin) {
      toast.error('Admin privileges required');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendAudioForProcessing(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      // Setup audio visualization
      if (audioContextRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048;
        source.connect(analyserRef.current);
      }

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.success('Recording started. Speak your command.');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
      toast.info('Processing your command...');
    }
  };

  const sendAudioForProcessing = async (audioBlob: Blob) => {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(
        String.fromCharCode(...new Uint8Array(arrayBuffer))
      );

      wsRef.current?.send(
        JSON.stringify({
          type: 'process-voice-command',
          userId,
          audioBase64: base64Audio,
        })
      );
    } catch (error) {
      console.error('Error sending audio:', error);
      toast.error('Failed to send audio');
      setIsProcessing(false);
    }
  };

  // ========================================================================
  // Response Playback
  // ========================================================================

  const playResponseAudio = (audioBase64: string) => {
    try {
      const audioBlob = new Blob(
        [Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))],
        { type: 'audio/mpeg' }
      );

      const audioUrl = URL.createObjectURL(audioBlob);

      if (responseAudioRef.current) {
        responseAudioRef.current.src = audioUrl;
        responseAudioRef.current.play();
        setIsPlayingResponse(true);
      } else {
        const audio = new Audio(audioUrl);
        audio.onended = () => setIsPlayingResponse(false);
        audio.play();
        setIsPlayingResponse(true);
      }
    } catch (error) {
      console.error('Error playing response audio:', error);
      toast.error('Failed to play response');
    }
  };

  // ========================================================================
  // Confirmation Handling
  // ========================================================================

  const confirmOperation = () => {
    wsRef.current?.send(
      JSON.stringify({
        type: 'confirm-operation',
        userId,
      })
    );
    setPendingConfirmation(false);
  };

  const cancelOperation = () => {
    setPendingConfirmation(false);
    setIntent(null);
    setTranscription(null);
    toast.info('Operation cancelled');
  };

  // ========================================================================
  // History Management
  // ========================================================================

  const addToHistory = (entry: CommandHistoryEntry) => {
    setCommandHistory(prev => [entry, ...prev].slice(0, 50)); // Keep last 50
  };

  // ========================================================================
  // Render Helpers
  // ========================================================================

  const renderStatusBadge = () => {
    if (isRecording) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-full">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-400 text-sm font-medium">Recording</span>
        </div>
      );
    }

    if (isProcessing) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full">
          <Activity className="w-4 h-4 text-blue-400 animate-spin" />
          <span className="text-blue-400 text-sm font-medium">Processing</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full">
        <CheckCircle className="w-4 h-4 text-green-400" />
        <span className="text-green-400 text-sm font-medium">Ready</span>
      </div>
    );
  };

  const renderTestResult = () => {
    if (!testResult) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Test Results</h3>
          {testResult.success ? (
            <CheckCircle className="w-6 h-6 text-green-400" />
          ) : (
            <XCircle className="w-6 h-6 text-red-400" />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-gray-400 text-sm">Tests Run</div>
            <div className="text-2xl font-bold text-white">{testResult.testsRun}</div>
          </div>

          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-gray-400 text-sm">Passed</div>
            <div className="text-2xl font-bold text-green-400">{testResult.testsPassed}</div>
          </div>

          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-gray-400 text-sm">Failed</div>
            <div className="text-2xl font-bold text-red-400">{testResult.testsFailed}</div>
          </div>

          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-gray-400 text-sm">Duration</div>
            <div className="text-2xl font-bold text-white">{testResult.duration.toFixed(1)}s</div>
          </div>
        </div>

        {testResult.coverage && (
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-400 mb-3">Coverage</h4>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Lines</span>
                  <span className="text-white font-medium">{testResult.coverage.lines}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${testResult.coverage.lines}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Functions</span>
                  <span className="text-white font-medium">{testResult.coverage.functions}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${testResult.coverage.functions}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Branches</span>
                  <span className="text-white font-medium">{testResult.coverage.branches}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all"
                    style={{ width: `${testResult.coverage.branches}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ========================================================================
  // Main Render
  // ========================================================================

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-900 border border-red-500/50 rounded-lg p-8 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-red-400" />
            <h2 className="text-2xl font-bold text-white">Access Denied</h2>
          </div>
          <p className="text-gray-400 mb-6">
            Voice Test Control requires admin privileges. Please contact your system administrator.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Voice Test Control</h2>
                <p className="text-gray-400 text-sm">AI-powered test execution via voice</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {renderStatusBadge()}
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-2 hover:bg-gray-800 rounded-lg transition"
              >
                <FileText className="w-5 h-5 text-gray-400" />
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {/* Voice Control */}
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6">
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`
                  relative w-24 h-24 rounded-full flex items-center justify-center transition-all
                  ${isRecording
                    ? 'bg-red-500 hover:bg-red-600 shadow-[0_0_30px_rgba(239,68,68,0.5)]'
                    : 'bg-blue-500 hover:bg-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                  }
                  ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {isRecording ? (
                  <Square className="w-10 h-10 text-white" />
                ) : (
                  <Mic className="w-10 h-10 text-white" />
                )}
                {isRecording && (
                  <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping" />
                )}
              </button>

              <div className="text-center">
                <p className="text-white font-medium text-lg">
                  {isRecording
                    ? 'Listening...'
                    : isProcessing
                    ? 'Processing...'
                    : 'Click to start voice command'}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Speak naturally. Say things like "Run all tests" or "Check coverage"
                </p>
              </div>
            </div>
          </div>

          {/* Transcription */}
          {transcription && (
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-medium text-gray-400">Transcription</h3>
              </div>
              <p className="text-white text-lg">{transcription.text}</p>
            </div>
          )}

          {/* Intent Detection */}
          {intent && (
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-medium text-gray-400">Detected Intent</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Action</span>
                  <span className="text-white font-medium px-3 py-1 bg-blue-500/20 rounded-full">
                    {intent.action.replace(/_/g, ' ')}
                  </span>
                </div>
                {intent.target && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Target</span>
                    <span className="text-white font-medium">{intent.target}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Confidence</span>
                  <span className="text-white font-medium">{(intent.confidence * 100).toFixed(0)}%</span>
                </div>
                {intent.isDestructive && (
                  <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 text-sm">Destructive operation</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Confirmation Dialog */}
          {pendingConfirmation && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">Confirmation Required</h3>
              </div>
              <p className="text-gray-300 mb-6">
                This operation requires confirmation. Please verify you want to proceed with: <strong>{transcription?.text}</strong>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmOperation}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                >
                  Confirm
                </button>
                <button
                  onClick={cancelOperation}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Test Results */}
          {renderTestResult()}

          {/* Command History */}
          {showHistory && (
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Command History</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {commandHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-white/5 rounded p-3 border border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">
                        {entry.timestamp.toLocaleTimeString()}
                      </span>
                      {entry.status === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <p className="text-white text-sm">{entry.command}</p>
                    {entry.result && (
                      <div className="text-gray-400 text-xs mt-2">
                        {entry.result.testsPassed}/{entry.result.testsRun} passed
                      </div>
                    )}
                  </div>
                ))}
                {commandHistory.length === 0 && (
                  <p className="text-gray-400 text-center py-4">No commands yet</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Hidden audio element for response playback */}
        <audio ref={responseAudioRef} onEnded={() => setIsPlayingResponse(false)} />
      </div>
    </div>
  );
};
