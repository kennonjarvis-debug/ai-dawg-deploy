/**
 * Example usage component for testing and demonstrating the visualization system
 *
 * This component shows how to integrate all visualizations with mock data
 * and can be used for testing and development.
 */

import { useState, useEffect, useRef } from 'react';
import { VisualizationDashboard } from './VisualizationDashboard';
import type { PitchData } from './PitchDisplay';
import type { BeatData } from './RhythmGrid';

export function VisualizationExample() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [pitchData, setPitchData] = useState<PitchData[]>([]);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Beat data for rhythm visualization
  const [beatData] = useState<BeatData>({
    bpm: 120,
    beatTimes: [],
    currentTime: 0,
    beatsPerMeasure: 4
  });

  // Update beat data current time
  useEffect(() => {
    const interval = setInterval(() => {
      beatData.currentTime += 0.1;
    }, 100);

    return () => clearInterval(interval);
  }, [beatData]);

  // Generate mock pitch data for demonstration
  useEffect(() => {
    if (!isRecording && !isPlaying) return;

    const interval = setInterval(() => {
      const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
      const frequencies = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];

      const randomIndex = Math.floor(Math.random() * notes.length);
      const randomCents = (Math.random() - 0.5) * 40; // ±20 cents

      const newPitchData: PitchData = {
        frequency: frequencies[randomIndex] * Math.pow(2, randomCents / 1200),
        note: notes[randomIndex],
        cents: randomCents,
        confidence: 0.8 + Math.random() * 0.2,
        timestamp: Date.now()
      };

      setPitchData(prev => {
        const updated = [...prev, newPitchData];
        // Keep only last 500 data points for performance
        return updated.slice(-500);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isRecording, isPlaying]);

  // Initialize audio context and analyser
  const initializeAudio = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const analyserNode = audioContextRef.current.createAnalyser();
      analyserNode.fftSize = 2048;
      analyserNode.smoothingTimeConstant = 0.8;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserNode);

      sourceRef.current = source;
      setAnalyser(analyserNode);
    } catch (error) {
      console.error('Error initializing audio:', error);
      alert('Could not access microphone. Some visualizations will not work.');
    }
  };

  const handleStartRecording = async () => {
    await initializeAudio();
    setIsRecording(true);
    setRecordingStartTime(Date.now());
    setPitchData([]);
  };

  const handleStopRecording = () => {
    setIsRecording(false);

    // Create a mock audio buffer for demonstration
    if (audioContextRef.current) {
      const sampleRate = audioContextRef.current.sampleRate;
      const duration = 5; // 5 seconds
      const buffer = audioContextRef.current.createBuffer(2, sampleRate * duration, sampleRate);

      // Fill with mock audio data (sine wave)
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < channelData.length; i++) {
          channelData[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.3;
        }
      }

      setAudioBuffer(buffer);
    }
  };

  const handleTogglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (time: number) => {
    console.log('Seek to:', time);
  };

  const handleReset = () => {
    setIsRecording(false);
    setIsPlaying(false);
    setRecordingStartTime(null);
    setAudioBuffer(null);
    setPitchData([]);

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Audio Visualization Test Suite</h1>

      {/* Control Panel */}
      <div style={{
        background: '#2a2a2a',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={handleStartRecording}
          disabled={isRecording}
          style={{
            padding: '10px 20px',
            background: isRecording ? '#666' : '#00ff00',
            color: '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: isRecording ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          Start Recording
        </button>

        <button
          onClick={handleStopRecording}
          disabled={!isRecording}
          style={{
            padding: '10px 20px',
            background: !isRecording ? '#666' : '#ff0000',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: !isRecording ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          Stop Recording
        </button>

        <button
          onClick={handleTogglePlayback}
          disabled={!audioBuffer}
          style={{
            padding: '10px 20px',
            background: !audioBuffer ? '#666' : isPlaying ? '#ff8800' : '#4a9eff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: !audioBuffer ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <button
          onClick={handleReset}
          style={{
            padding: '10px 20px',
            background: '#666',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Reset
        </button>

        <div style={{ marginLeft: 'auto', color: '#aaa', fontSize: '14px' }}>
          <div>Pitch Data Points: {pitchData.length}</div>
          <div>Audio Buffer: {audioBuffer ? 'Loaded' : 'None'}</div>
          <div>Analyser: {analyser ? 'Active' : 'Inactive'}</div>
        </div>
      </div>

      {/* Visualization Dashboard */}
      <VisualizationDashboard
        audioBuffer={audioBuffer}
        pitchData={pitchData}
        beatData={beatData}
        analyser={analyser}
        isRecording={isRecording}
        isPlaying={isPlaying}
        recordingStartTime={recordingStartTime}
        onSeek={handleSeek}
        showVolumeMeter={true}
        defaultView="waveform"
      />

      {/* Instructions */}
      <div style={{
        marginTop: '20px',
        padding: '16px',
        background: '#2a2a2a',
        borderRadius: '8px',
        fontSize: '14px',
        lineHeight: '1.6',
        color: '#aaa'
      }}>
        <h3 style={{ marginTop: 0, color: '#fff' }}>Instructions</h3>
        <ol>
          <li>Click "Start Recording" to begin capturing audio (you'll be asked for microphone permission)</li>
          <li>The system will generate mock pitch data and display real-time audio levels</li>
          <li>Click "Stop Recording" to end the recording session</li>
          <li>Use the tabs to switch between different visualization modes</li>
          <li>The volume meter on the right shows real-time audio levels</li>
          <li>Click "Reset" to clear all data and start over</li>
        </ol>

        <h3 style={{ color: '#fff' }}>Visualization Modes</h3>
        <ul>
          <li><strong>Waveform:</strong> Visual representation of the audio signal amplitude over time</li>
          <li><strong>Pitch:</strong> Real-time pitch tracking showing note accuracy and cents deviation</li>
          <li><strong>Rhythm:</strong> Beat grid with measure markers and timing indicators</li>
          <li><strong>Spectrum:</strong> Frequency spectrum over time (spectrogram)</li>
        </ul>
      </div>
    </div>
  );
}
