/**
 * Live Studio Page
 *
 * Integrated freestyle recording with advanced features:
 * - Real-time pitch correction
 * - Rhythm quantization
 * - AI coaching with Claude
 * - Live visualizations
 * - Backing track playback
 *
 * Merged from Freestyle Studio into AI DAWG
 */

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Mic, Square, Play, Pause, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './studio.css';

export const LiveStudioPage: React.FC = () => {
  const navigate = useNavigate();

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Audio state
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  // Correction settings
  const [pitchCorrection, setPitchCorrection] = useState(true);
  const [correctionAmount, setCorrectionAmount] = useState(50);
  const [rhythmQuant, setRhythmQuant] = useState(false);
  const [bpm, setBpm] = useState(120);

  // Transcription & AI
  const [transcript, setTranscript] = useState<string[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Initialize audio on mount
   */
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioContext) audioContext.close();
    };
  }, [audioContext]);

  /**
   * Start recording
   */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyzer = ctx.createAnalyser();
      analyzer.fftSize = 2048;
      source.connect(analyzer);

      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        setAudioChunks(chunks);
        processRecording(chunks);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setAudioContext(ctx);
      analyzerRef.current = analyzer;
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);

      // Start visualization
      visualize(analyzer);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone');
    }
  };

  /**
   * Stop recording
   */
  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  /**
   * Process recorded audio
   */
  const processRecording = async (chunks: Blob[]) => {
    const audioBlob = new Blob(chunks, { type: 'audio/webm' });

    // Apply pitch correction if enabled
    if (pitchCorrection) {
      console.log('Applying pitch correction...', correctionAmount);
      // TODO: Implement pitch correction via backend
    }

    // Apply rhythm quantization if enabled
    if (rhythmQuant) {
      console.log('Applying rhythm quantization...', bpm);
      // TODO: Implement rhythm quantization via backend
    }

    // Transcribe audio
    transcribeAudio(audioBlob);

    // Get AI suggestions
    getAISuggestions();
  };

  /**
   * Transcribe audio
   */
  const transcribeAudio = async (audioBlob: Blob) => {
    // TODO: Call Whisper API via backend
    console.log('Transcribing audio...', audioBlob.size);
    // Placeholder
    setTranscript([...transcript, '[Transcribed lyrics will appear here]']);
  };

  /**
   * Get AI suggestions from Claude
   */
  const getAISuggestions = async () => {
    // TODO: Call Claude API via Jarvis
    console.log('Getting AI suggestions...');
    setAiSuggestions([
      'Try varying your flow in the second verse',
      'Great energy! Consider adding a hook here',
      'Your rhyme scheme is solid'
    ]);
  };

  /**
   * Visualize audio waveform
   */
  const visualize = (analyzer: AnalyserNode) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isRecording) return;

      requestAnimationFrame(draw);
      analyzer.getByteTimeDomainData(dataArray);

      ctx.fillStyle = 'rgb(20, 20, 30)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgb(147, 51, 234)'; // Purple
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
  };

  /**
   * Format time
   */
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="live-studio-page">
      {/* Header */}
      <header className="studio-header">
        <button
          onClick={() => navigate('/app')}
          className="back-button"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <h1 className="studio-title">🎙️ Live Studio</h1>

        <div className="header-info">
          <span className="recording-time">{formatTime(recordingTime)}</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="studio-content">
        {/* Left Panel - Recording Controls */}
        <div className="studio-panel left-panel">
          <h2>Recording</h2>

          <div className="recording-controls">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="record-button"
              >
                <Mic className="w-8 h-8" />
                Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="stop-button"
              >
                <Square className="w-8 h-8" />
                Stop
              </button>
            )}
          </div>

          {/* Waveform Visualization */}
          <canvas
            ref={canvasRef}
            width={400}
            height={200}
            className="waveform-canvas"
          />

          {/* Correction Settings */}
          <div className="correction-settings">
            <h3>Vocal Correction</h3>

            <label className="setting-item">
              <input
                type="checkbox"
                checked={pitchCorrection}
                onChange={(e) => setPitchCorrection(e.target.checked)}
              />
              <span>Pitch Correction</span>
            </label>

            {pitchCorrection && (
              <div className="slider-group">
                <label>Amount: {correctionAmount}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={correctionAmount}
                  onChange={(e) => setCorrectionAmount(parseInt(e.target.value))}
                />
              </div>
            )}

            <label className="setting-item">
              <input
                type="checkbox"
                checked={rhythmQuant}
                onChange={(e) => setRhythmQuant(e.target.checked)}
              />
              <span>Rhythm Quantization</span>
            </label>

            {rhythmQuant && (
              <div className="slider-group">
                <label>BPM: {bpm}</label>
                <input
                  type="range"
                  min="60"
                  max="200"
                  value={bpm}
                  onChange={(e) => setBpm(parseInt(e.target.value))}
                />
              </div>
            )}
          </div>
        </div>

        {/* Center Panel - Lyrics Transcript */}
        <div className="studio-panel center-panel">
          <h2>Lyrics</h2>
          <div className="transcript-container">
            {transcript.length === 0 ? (
              <p className="placeholder">Your lyrics will appear here as you record...</p>
            ) : (
              transcript.map((line, i) => (
                <p key={i} className="transcript-line">{line}</p>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - AI Suggestions */}
        <div className="studio-panel right-panel">
          <h2>🤖 AI Coach</h2>
          <div className="suggestions-container">
            {aiSuggestions.length === 0 ? (
              <p className="placeholder">AI suggestions will appear here...</p>
            ) : (
              aiSuggestions.map((suggestion, i) => (
                <div key={i} className="suggestion-card">
                  <p>{suggestion}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStudioPage;
