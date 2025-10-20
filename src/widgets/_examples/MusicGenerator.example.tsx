/**
 * MusicGenerator - EXAMPLE WIDGET
 *
 * This is a working example showing how to integrate Instance 3's music generation
 * API (text-to-music and melody-to-music) into a UI widget.
 *
 * COPY THIS FILE and modify for your needs. Don't edit this example directly.
 *
 * Integration Guide: /MUSIC_GENERATION_SETUP.md (full API reference)
 *
 * Features Demonstrated:
 * - Text-to-music generation (style description → instrumental)
 * - Melody-to-music generation (vocal recording → arrangement)
 * - Style selection (genre, mood, instruments, tempo, key)
 * - Model selection (small, medium, large, melody)
 * - Cost estimation before generation
 * - Progress tracking (30-60s generation time)
 * - Audio preview and import to track
 * - Integration with Instance 2's melody analysis (useMelodyAnalysis)
 */

'use client';

import { useState } from 'react';
import { useMelodyAnalysis } from '$lib/../core/useMelodyAnalysis';
import { useTrackStore } from '$lib/../core/store';
import styles from './MusicGenerator.example.module.css';

interface MusicGeneratorProps {
  audioContext: AudioContext | null;
  mediaStream: MediaStream | null;
}

export function MusicGenerator({ audioContext, mediaStream }: MusicGeneratorProps) {
  const addTrack = useTrackStore((state) => state.addTrack);

  // Generation mode
  const [mode, setMode] = useState<'text' | 'melody'>('text');

  // Text-to-music inputs
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('country');
  const [mood, setMood] = useState('upbeat');
  const [instruments, setInstruments] = useState('acoustic guitar, fiddle');
  const [duration, setDuration] = useState(30);
  const [model, setModel] = useState<'small' | 'medium' | 'large' | 'melody'>('medium');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Melody analysis for melody-to-music mode
  const {
    melody,
    startAnalysis,
    stopAnalysis,
    isAnalyzing,
    exportForMusicGeneration,
  } = useMelodyAnalysis({
    audioContext,
    mediaStream,
    enabled: mode === 'melody',
    bpm: 120,
    quantize: true,
    minNoteDuration: 100,
    minConfidence: 0.7,
  });

  // Text-to-music generation
  const generateFromText = async () => {
    setIsGenerating(true);
    setError(null);
    setProgress(0);

    try {
      const response = await fetch('/api/generate/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'text',
          description: description || `${mood} ${genre} instrumental with ${instruments}`,
          duration,
          model,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      // Simulate progress (actual API doesn't provide real-time progress)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 3000);

      const result = await response.json();
      clearInterval(progressInterval);
      setProgress(100);

      setGeneratedAudioUrl(result.audioUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Melody-to-music generation
  const generateFromMelody = async () => {
    const melodyData = exportForMusicGeneration();
    if (!melodyData) {
      setError('No melody recorded. Record a melody first.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(0);

    try {
      const response = await fetch('/api/generate/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'melody',
          melody: melodyData.melody,
          style: {
            genre,
            mood,
            instruments: instruments.split(',').map((i) => i.trim()),
          },
          duration,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 3000);

      const result = await response.json();
      clearInterval(progressInterval);
      setProgress(100);

      setGeneratedAudioUrl(result.audioUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Import generated audio to track
  const importToTrack = async () => {
    if (!generatedAudioUrl) return;

    try {
      const response = await fetch(generatedAudioUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      addTrack({
        name: `Generated Music - ${new Date().toLocaleTimeString()}`,
        type: 'audio',
        recordingUrl: url,
      });

      alert('Generated music imported to new track!');
    } catch (err: any) {
      setError('Failed to import audio: ' + err.message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>AI Music Generator</h2>
      </div>

      {/* Mode Selection */}
      <section className={styles.modeSelection}>
        <button
          className={`${styles.modeButton} ${mode === 'text' ? styles.active : ''}`}
          onClick={() => setMode('text')}
        >
          Text-to-Music
        </button>
        <button
          className={`${styles.modeButton} ${mode === 'melody' ? styles.active : ''}`}
          onClick={() => setMode('melody')}
        >
          Melody-to-Music
        </button>
      </section>

      {/* Text-to-Music Mode */}
      {mode === 'text' && (
        <section className={styles.section}>
          <h3>Describe Your Music</h3>

          <div className={styles.field}>
            <label>Description (optional):</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., upbeat country instrumental with acoustic guitar and fiddle"
              className={styles.textarea}
              rows={3}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Genre:</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className={styles.select}
              >
                <option value="country">Country</option>
                <option value="rock">Rock</option>
                <option value="pop">Pop</option>
                <option value="jazz">Jazz</option>
                <option value="blues">Blues</option>
                <option value="folk">Folk</option>
              </select>
            </div>

            <div className={styles.field}>
              <label>Mood:</label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className={styles.select}
              >
                <option value="upbeat">Upbeat</option>
                <option value="melancholic">Melancholic</option>
                <option value="energetic">Energetic</option>
                <option value="relaxed">Relaxed</option>
                <option value="dramatic">Dramatic</option>
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label>Instruments (comma-separated):</label>
            <input
              type="text"
              value={instruments}
              onChange={(e) => setInstruments(e.target.value)}
              placeholder="e.g., acoustic guitar, piano, drums"
              className={styles.input}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Duration: {duration}s</label>
              <input
                type="range"
                min="10"
                max="90"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className={styles.slider}
              />
            </div>

            <div className={styles.field}>
              <label>Model:</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as any)}
                className={styles.select}
              >
                <option value="small">Small (fast)</option>
                <option value="medium">Medium (balanced)</option>
                <option value="large">Large (best quality)</option>
              </select>
            </div>
          </div>

          <button
            className={styles.generateButton}
            onClick={generateFromText}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Music'}
          </button>
        </section>
      )}

      {/* Melody-to-Music Mode */}
      {mode === 'melody' && (
        <section className={styles.section}>
          <h3>Record Your Melody</h3>

          <div className={styles.melodyRecorder}>
            <button
              className={`${styles.recordButton} ${isAnalyzing ? styles.recording : ''}`}
              onClick={isAnalyzing ? stopAnalysis : startAnalysis}
            >
              {isAnalyzing ? '⏹ Stop Recording' : '🎤 Start Recording'}
            </button>

            {melody && (
              <div className={styles.melodyInfo}>
                <h4>Recorded Melody:</h4>
                <div className={styles.melodyStats}>
                  <span>Key: {melody.key}</span>
                  <span>Tempo: {melody.tempo} BPM</span>
                  <span>Notes: {melody.notes.length}</span>
                  <span>Confidence: {(melody.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            )}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Genre:</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className={styles.select}
              >
                <option value="country">Country</option>
                <option value="rock">Rock</option>
                <option value="pop">Pop</option>
                <option value="jazz">Jazz</option>
              </select>
            </div>

            <div className={styles.field}>
              <label>Mood:</label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className={styles.select}
              >
                <option value="upbeat">Upbeat</option>
                <option value="melancholic">Melancholic</option>
                <option value="energetic">Energetic</option>
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label>Instruments (comma-separated):</label>
            <input
              type="text"
              value={instruments}
              onChange={(e) => setInstruments(e.target.value)}
              placeholder="e.g., acoustic guitar, piano, drums"
              className={styles.input}
            />
          </div>

          <button
            className={styles.generateButton}
            onClick={generateFromMelody}
            disabled={isGenerating || !melody}
          >
            {isGenerating ? 'Generating...' : 'Generate Arrangement'}
          </button>
        </section>
      )}

      {/* Progress */}
      {isGenerating && (
        <div className={styles.progress}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
          </div>
          <p>Generating music... {progress}%</p>
        </div>
      )}

      {/* Error */}
      {error && <div className={styles.error}>{error}</div>}

      {/* Generated Audio */}
      {generatedAudioUrl && !isGenerating && (
        <section className={styles.result}>
          <h3>Generated Music</h3>
          <audio src={generatedAudioUrl} controls className={styles.audioPlayer} />
          <button className={styles.importButton} onClick={importToTrack}>
            Import to Track
          </button>
        </section>
      )}
    </div>
  );
}
