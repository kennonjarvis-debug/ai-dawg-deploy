import React, { useState, useEffect, useRef } from 'react';
import { Music2, TrendingUp, Sparkles, AlertCircle, CheckCircle2, Info, Activity } from 'lucide-react';
import { VocalCoachClient, preparePitchVisualization } from '../../ai/integration';
import type { PitchAnalysisResult } from '../../ai/integration/VocalCoachClient';
import { apiClient } from '../../api';
import type { Track } from '../../api/types';

interface VocalCoachPanelProps {
  projectId: string;
}

export const VocalCoachPanel: React.FC<VocalCoachPanelProps> = ({ projectId }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pitchAnalysis, setPitchAnalysis] = useState<PitchAnalysisResult | null>(null);
  const [rhythmAnalysis, setRhythmAnalysis] = useState<{
    timingAccuracy: number;    // 0-1, how close to beat
    isRushing: boolean;        // singing ahead of beat
    isDragging: boolean;       // singing behind beat
    timingOffset: number;      // ms offset from beat
    consistency: number;       // 0-1, timing consistency
  } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [projectContext, setProjectContext] = useState<{
    instrumentTrack?: Track;
    beatInfo?: string;
    styleGuidance?: string[];
  } | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vocalCoachClient = useRef(new VocalCoachClient('http://localhost:8000'));

  // Rhythm analysis refs
  const lastOnsetTimeRef = useRef<number>(0);
  const onsetTimesRef = useRef<number[]>([]);
  const lastEnergyRef = useRef<number>(0);

  // Load tracks for the project
  useEffect(() => {
    loadTracks();
  }, [projectId]);

  // AudioContext will be created on user gesture (when starting analysis)
  // to comply with browser autoplay policy

  const loadTracks = async () => {
    try {
      const response = await apiClient.listTracks(projectId, { limit: 50 });
      setTracks(response.tracks);

      // Auto-select first track if available
      if (response.tracks.length > 0 && !selectedTrackId) {
        setSelectedTrackId(response.tracks[0].id);
      }

      // Analyze project context for context-aware coaching
      analyzeProjectContext(response.tracks);
    } catch (err: any) {
      console.error('Failed to load tracks:', err);
      setError(err.message || 'Failed to load tracks');
    }
  };

  /**
   * Analyze tracks to extract project context
   */
  const analyzeProjectContext = (allTracks: Track[]) => {
    // Find instrument/beat tracks with metadata
    const instrumentTrack = allTracks.find(
      (t) => t.trackType === 'INSTRUMENT' && t.metadata?.rhythmCharacteristics
    );

    if (!instrumentTrack?.metadata) {
      setProjectContext(null);
      return;
    }

    const { rhythmCharacteristics, style } = instrumentTrack.metadata;

    // Build beat info string
    let beatInfo = '';
    if (rhythmCharacteristics) {
      const { bpm, key, timeSignature } = rhythmCharacteristics;
      beatInfo = `${key || 'Unknown'} ${bpm} BPM (${timeSignature.numerator}/${timeSignature.denominator})`;
    }

    // Generate style-specific guidance
    const styleGuidance: string[] = [];

    if (style?.genre === 'country') {
      styleGuidance.push('Add warmth and twang to your vowels for authentic country tone');
      styleGuidance.push('Let your vibrato be natural and subtle (4-6 Hz)');

      if (style.subgenre === 'morgan-wallen') {
        styleGuidance.push('Modern country: Mix chest voice with slight rasp for Morgan Wallen style');
        styleGuidance.push('Slight southern drawl on "I" sounds adds authenticity');
      }
    } else if (style?.genre === 'pop') {
      styleGuidance.push('Keep your tone bright and clear with controlled vibrato');
      styleGuidance.push('Focus on precise pitch - pop demands tight tuning');
    } else if (style?.genre === 'rnb') {
      styleGuidance.push('Emphasize runs and riffs with smooth transitions');
      styleGuidance.push('Add warmth and breathiness for R&B soul');
    } else if (style?.genre === 'hip-hop') {
      styleGuidance.push('Tight rhythm and flow - lock in with the beat');
      styleGuidance.push('Slight auto-tune sound is authentic for modern hip-hop');
    }

    // Add BPM-specific guidance
    if (rhythmCharacteristics?.bpm) {
      if (rhythmCharacteristics.bpm < 80) {
        styleGuidance.push('Slow tempo: Focus on sustain and emotional delivery');
      } else if (rhythmCharacteristics.bpm > 140) {
        styleGuidance.push('Fast tempo: Maintain breath support for energy');
      }
    }

    setProjectContext({
      instrumentTrack,
      beatInfo,
      styleGuidance,
    });

    console.log('[VocalCoach] Project context loaded:', {
      genre: style?.genre,
      subgenre: style?.subgenre,
      beatInfo,
    });
  };

  /**
   * Analyze rhythm and timing relative to project BPM
   */
  const analyzeRhythm = (dataArray: Float32Array, currentTime: number) => {
    // Calculate RMS energy
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / dataArray.length);

    // Onset detection: detect when energy increases significantly
    const energyThreshold = 0.02;
    const onsetDetected = rms > energyThreshold && rms > lastEnergyRef.current * 1.5;
    lastEnergyRef.current = rms;

    if (onsetDetected) {
      onsetTimesRef.current.push(currentTime);
      lastOnsetTimeRef.current = currentTime;

      // Keep only last 20 onsets
      if (onsetTimesRef.current.length > 20) {
        onsetTimesRef.current.shift();
      }
    }

    // Get project BPM from context
    const projectBPM = projectContext?.instrumentTrack?.metadata?.rhythmCharacteristics?.bpm || 120;
    const beatIntervalMs = (60 / projectBPM) * 1000;

    if (onsetTimesRef.current.length >= 3) {
      // Calculate timing accuracy by comparing onsets to expected beat grid
      const onsets = onsetTimesRef.current;
      const timingOffsets: number[] = [];

      for (let i = 1; i < onsets.length; i++) {
        const timeSinceLastOnset = onsets[i] - onsets[i - 1];

        // Find nearest beat position
        const beatRatio = timeSinceLastOnset / beatIntervalMs;
        const nearestBeat = Math.round(beatRatio);
        const expectedTime = nearestBeat * beatIntervalMs;
        const offset = timeSinceLastOnset - expectedTime;

        timingOffsets.push(offset);
      }

      // Calculate statistics
      const avgOffset = timingOffsets.reduce((a, b) => a + b, 0) / timingOffsets.length;
      const absOffsets = timingOffsets.map(Math.abs);
      const avgAbsOffset = absOffsets.reduce((a, b) => a + b, 0) / absOffsets.length;

      // Calculate consistency (inverse of standard deviation)
      const variance =
        timingOffsets.reduce((sum, offset) => sum + Math.pow(offset - avgOffset, 2), 0) /
        timingOffsets.length;
      const stdDev = Math.sqrt(variance);
      const consistency = Math.max(0, 1 - stdDev / beatIntervalMs);

      // Calculate timing accuracy (0-1, where 1 is perfect)
      const maxAcceptableOffset = beatIntervalMs * 0.25; // 25% of beat interval
      const timingAccuracy = Math.max(0, 1 - avgAbsOffset / maxAcceptableOffset);

      // Determine rushing or dragging
      const rushingThreshold = 20; // ms early
      const draggingThreshold = 20; // ms late

      setRhythmAnalysis({
        timingAccuracy,
        isRushing: avgOffset < -rushingThreshold,
        isDragging: avgOffset > draggingThreshold,
        timingOffset: Math.round(avgOffset),
        consistency,
      });
    }
  };

  const startRealTimePitchAnalysis = async () => {
    try {
      setIsListening(true);
      setError(null);

      // Create AudioContext on user gesture (required for browser autoplay policy)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Resume AudioContext if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = audioContextRef.current!;
      const source = audioContext.createMediaStreamSource(stream);

      // Create analyser
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Analyze in intervals
      const analyzeInterval = setInterval(async () => {
        if (!isListening) {
          clearInterval(analyzeInterval);
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        // Get audio data
        const bufferLength = analyser.fftSize;
        const dataArray = new Float32Array(bufferLength);
        analyser.getFloatTimeDomainData(dataArray);

        try {
          // Send to Vocal Coach AI for pitch analysis
          const result = await vocalCoachClient.current.analyzePitch(
            dataArray,
            audioContext.sampleRate
          );
          setPitchAnalysis(result);

          // Analyze rhythm/timing
          analyzeRhythm(dataArray, performance.now());
        } catch (err) {
          console.error('Pitch analysis error:', err);
        }
      }, 200); // Analyze every 200ms

    } catch (err: any) {
      setError(err.message || 'Failed to access microphone');
      console.error('Microphone access error:', err);
      setIsListening(false);
    }
  };

  const stopRealTimePitchAnalysis = () => {
    setIsListening(false);
  };

  const handleAnalyzeTrack = async () => {
    if (!selectedTrackId) {
      setError('Please select a track to analyze');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Note: This would require fetching the actual audio data from the track
      // For MVP, we'll show a message that this feature requires audio loading
      setError('Track analysis requires audio loading - Use real-time analysis instead');
    } catch (err: any) {
      setError(err.message || 'Failed to analyze track');
      console.error('Track analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateHarmony = async () => {
    if (!selectedTrackId) {
      setError('Please select a track');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Note: This would require actual melody data
      // For MVP, show that this is under development
      setError('Harmony generation requires melody data - Feature under development');
    } catch (err: any) {
      setError(err.message || 'Failed to generate harmony');
      console.error('Harmony generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Prepare visualization data
  const vizData = pitchAnalysis ? preparePitchVisualization(pitchAnalysis) : null;

  return (
    <div className="h-full flex flex-col bg-daw-surface/40 backdrop-blur-xl border-l border-white/10">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Music2 className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI Vocal Coach</h2>
            <p className="text-sm text-gray-400">Real-time pitch analysis and feedback</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Project Context Display */}
        {projectContext && (
          <div className="p-5 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-xl space-y-4">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Context-Aware Coaching
              </h3>
            </div>

            {/* Beat Info Banner */}
            {projectContext.beatInfo && (
              <div className="p-3 bg-black/40 rounded-lg">
                <div className="text-xs text-gray-400 mb-1">Coaching for Track:</div>
                <div className="text-lg font-bold text-indigo-300">
                  {projectContext.beatInfo}
                </div>
                {projectContext.instrumentTrack && (
                  <div className="text-xs text-gray-500 mt-1">
                    {projectContext.instrumentTrack.name}
                  </div>
                )}
              </div>
            )}

            {/* Style-Specific Guidance */}
            {projectContext.styleGuidance && projectContext.styleGuidance.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                  Style Guidance
                </div>
                <ul className="space-y-2">
                  {projectContext.styleGuidance.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                      <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Real-Time Pitch Analysis */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Live Pitch Analysis
          </h3>

          <div className="p-4 bg-black/40 border border-purple-500/30 rounded-lg">
            <div className="flex items-start gap-3 mb-4">
              <Info className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-400">
                Analyze your voice in real-time. Click start, allow microphone access, and start singing!
              </p>
            </div>

            <button
              onClick={isListening ? stopRealTimePitchAnalysis : startRealTimePitchAnalysis}
              className={`w-full py-3 rounded-lg text-white font-medium transition-all shadow-lg ${
                isListening
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-red-500/25'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-purple-500/25'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                {isListening ? (
                  <>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5" />
                    Start Real-Time Analysis
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Live Analysis Display */}
          {pitchAnalysis && vizData && (
            <div className="p-5 bg-black/40 border border-purple-500/30 rounded-xl space-y-4 animate-in fade-in">
              {/* Note Display */}
              <div className="text-center">
                <div className="text-6xl font-bold text-purple-400 mb-2">
                  {vizData.noteDisplay.name}
                </div>
                <div className="text-2xl font-mono" style={{ color: vizData.pitchIndicator.color }}>
                  {vizData.noteDisplay.formattedCents}
                </div>
              </div>

              {/* Pitch Indicator */}
              <div className="relative h-4 bg-black/60 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 h-full w-1 transition-all duration-100"
                  style={{
                    left: `${((vizData.pitchIndicator.position + 50) / 100) * 100}%`,
                    backgroundColor: vizData.pitchIndicator.color,
                    boxShadow: `0 0 10px ${vizData.pitchIndicator.color}`,
                  }}
                />
                <div className="absolute left-1/2 top-0 h-full w-0.5 bg-white/30" />
              </div>

              {/* Stability */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-black/40 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">Stability</div>
                  <div className="text-lg font-bold" style={{ color: vizData.stability.color }}>
                    {vizData.stability.label}
                  </div>
                  <div className="text-xs text-gray-500">{Math.round(pitchAnalysis.stability * 100)}%</div>
                </div>

                <div className="p-3 bg-black/40 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">Confidence</div>
                  <div className="text-lg font-bold text-purple-400">
                    {Math.round(pitchAnalysis.pitch_confidence * 100)}%
                  </div>
                  <div className="text-xs text-gray-500">{pitchAnalysis.detected_pitch.toFixed(1)} Hz</div>
                </div>
              </div>

              {/* Vibrato */}
              {vizData.vibrato && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-purple-300">{vizData.vibrato.label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                    <div>Rate: <span className="text-purple-400">{vizData.vibrato.rate}</span></div>
                    <div>Extent: <span className="text-purple-400">{vizData.vibrato.extent}</span></div>
                  </div>
                </div>
              )}

              {/* Correction Guidance */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-300">{vizData.correction.message}</span>
                </div>
              </div>
            </div>
          )}

          {/* Rhythm Analysis Display */}
          {rhythmAnalysis && (
            <div className="p-5 bg-black/40 border border-green-500/30 rounded-xl space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-5 h-5 text-green-400" />
                <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Rhythm & Timing
                </h4>
              </div>

              {/* Timing Accuracy */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-black/40 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">Timing Accuracy</div>
                  <div
                    className="text-lg font-bold"
                    style={{
                      color:
                        rhythmAnalysis.timingAccuracy > 0.8
                          ? '#4ade80'
                          : rhythmAnalysis.timingAccuracy > 0.5
                          ? '#fbbf24'
                          : '#f87171',
                    }}
                  >
                    {Math.round(rhythmAnalysis.timingAccuracy * 100)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {rhythmAnalysis.timingAccuracy > 0.8
                      ? 'Excellent'
                      : rhythmAnalysis.timingAccuracy > 0.5
                      ? 'Good'
                      : 'Needs work'}
                  </div>
                </div>

                <div className="p-3 bg-black/40 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">Consistency</div>
                  <div
                    className="text-lg font-bold"
                    style={{
                      color:
                        rhythmAnalysis.consistency > 0.7
                          ? '#4ade80'
                          : rhythmAnalysis.consistency > 0.4
                          ? '#fbbf24'
                          : '#f87171',
                    }}
                  >
                    {Math.round(rhythmAnalysis.consistency * 100)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {rhythmAnalysis.consistency > 0.7
                      ? 'Steady'
                      : rhythmAnalysis.consistency > 0.4
                      ? 'Variable'
                      : 'Unsteady'}
                  </div>
                </div>
              </div>

              {/* Rushing/Dragging Indicator */}
              {(rhythmAnalysis.isRushing || rhythmAnalysis.isDragging) && (
                <div
                  className={`p-3 rounded-lg border ${
                    rhythmAnalysis.isRushing
                      ? 'bg-blue-500/10 border-blue-500/30'
                      : 'bg-orange-500/10 border-orange-500/30'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        rhythmAnalysis.isRushing ? 'text-blue-400' : 'text-orange-400'
                      }`}
                    />
                    <div>
                      <div
                        className={`text-sm font-medium ${
                          rhythmAnalysis.isRushing ? 'text-blue-300' : 'text-orange-300'
                        }`}
                      >
                        {rhythmAnalysis.isRushing ? 'Rushing' : 'Dragging'}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {rhythmAnalysis.isRushing
                          ? `You're ${Math.abs(rhythmAnalysis.timingOffset)}ms ahead of the beat`
                          : `You're ${Math.abs(rhythmAnalysis.timingOffset)}ms behind the beat`}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {rhythmAnalysis.isRushing
                          ? 'Tip: Take a breath and let the beat lead'
                          : 'Tip: Feel the groove and lock in with the beat'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* On Time Indicator */}
              {!rhythmAnalysis.isRushing && !rhythmAnalysis.isDragging && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-green-300">Perfect Timing!</div>
                      <div className="text-xs text-gray-400 mt-1">
                        You're locked in with the beat ({Math.abs(rhythmAnalysis.timingOffset)}ms
                        offset)
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Performance Tips */}
        <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl">
          <h4 className="text-sm font-semibold text-white mb-3">Performance Tips</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>Maintain consistent breath support for better pitch stability</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>Sing into the green zone (within ±10¢) for accurate pitch</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>Natural vibrato (4-7 Hz) adds warmth to your voice</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
