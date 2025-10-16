import { useState } from 'react';
import { WaveformDisplay } from './WaveformDisplay';
import { PitchDisplay } from './PitchDisplay';
import type { PitchData } from './PitchDisplay';
import { RhythmGrid } from './RhythmGrid';
import type { BeatData } from './RhythmGrid';
import { VolumeMeter } from './VolumeMeter';
import { Spectrogram } from './Spectrogram';
import { RecordingIndicator } from './RecordingIndicator';

export interface VisualizationDashboardProps {
  // Audio data
  audioBuffer: AudioBuffer | null;
  backingTrackBuffer?: AudioBuffer | null;

  // Analysis data
  pitchData: PitchData[];
  beatData: BeatData;
  analyser: AnalyserNode | null;

  // State
  isRecording: boolean;
  isPlaying: boolean;
  recordingStartTime: number | null;

  // Callbacks
  onSeek?: (time: number) => void;

  // Configuration
  showVolumeMeter?: boolean;
  defaultView?: 'waveform' | 'pitch' | 'rhythm' | 'spectrum';
}

export function VisualizationDashboard({
  audioBuffer,
  backingTrackBuffer,
  pitchData,
  beatData,
  analyser,
  isRecording,
  isPlaying,
  recordingStartTime,
  onSeek,
  showVolumeMeter = true,
  defaultView = 'waveform'
}: VisualizationDashboardProps) {
  const [activeView, setActiveView] = useState<'waveform' | 'pitch' | 'rhythm' | 'spectrum'>(defaultView);
  const [spectrogramColorScheme, setSpectrogramColorScheme] = useState<'hot' | 'cool' | 'rainbow' | 'grayscale'>('hot');

  return (
    <div className="visualization-dashboard">
      {/* Recording Status */}
      <RecordingIndicator
        isRecording={isRecording}
        startTime={recordingStartTime}
        sampleRate={48000}
        channels={2}
        bitDepth={16}
      />

      {/* View Tabs */}
      <div className="viz-tabs">
        <button
          className={`viz-tab ${activeView === 'waveform' ? 'active' : ''}`}
          onClick={() => setActiveView('waveform')}
          title="View waveform display"
        >
          <span className="icon">〰️</span>
          <span className="label">Waveform</span>
        </button>

        <button
          className={`viz-tab ${activeView === 'pitch' ? 'active' : ''}`}
          onClick={() => setActiveView('pitch')}
          title="View pitch tracking"
        >
          <span className="icon">🎵</span>
          <span className="label">Pitch</span>
        </button>

        <button
          className={`viz-tab ${activeView === 'rhythm' ? 'active' : ''}`}
          onClick={() => setActiveView('rhythm')}
          title="View rhythm grid"
        >
          <span className="icon">🥁</span>
          <span className="label">Rhythm</span>
        </button>

        <button
          className={`viz-tab ${activeView === 'spectrum' ? 'active' : ''}`}
          onClick={() => setActiveView('spectrum')}
          title="View spectrogram"
        >
          <span className="icon">📊</span>
          <span className="label">Spectrum</span>
        </button>
      </div>

      {/* Main Visualization Area */}
      <div className="viz-content">
        <div className="viz-main">
          {activeView === 'waveform' && (
            <div className="viz-section">
              {backingTrackBuffer && (
                <div className="waveform-track">
                  <h3>Backing Track</h3>
                  <WaveformDisplay
                    audioBuffer={backingTrackBuffer}
                    isPlaying={isPlaying}
                    onSeek={onSeek}
                    color="#4a9eff"
                    height={100}
                    showControls={false}
                  />
                </div>
              )}

              {audioBuffer && (
                <div className="waveform-track">
                  <h3>Recording</h3>
                  <WaveformDisplay
                    audioBuffer={audioBuffer}
                    isPlaying={isPlaying}
                    onSeek={onSeek}
                    color="#ff4444"
                    height={100}
                    showControls={true}
                  />
                </div>
              )}

              {!audioBuffer && !backingTrackBuffer && (
                <div className="viz-placeholder">
                  <p>No audio loaded</p>
                  <p className="hint">Start recording or load a backing track to see waveforms</p>
                </div>
              )}
            </div>
          )}

          {activeView === 'pitch' && (
            <div className="viz-section">
              <PitchDisplay
                pitchData={pitchData}
                width={800}
                height={250}
                showHistory={true}
              />

              {pitchData.length === 0 && (
                <div className="viz-placeholder">
                  <p>No pitch data</p>
                  <p className="hint">Start singing to see pitch visualization</p>
                </div>
              )}
            </div>
          )}

          {activeView === 'rhythm' && (
            <div className="viz-section">
              <RhythmGrid
                beatData={beatData}
                width={800}
                height={120}
                beatsVisible={8}
              />

              <div className="rhythm-help">
                <p>
                  <strong>Green lines:</strong> Downbeats (measure start)
                  <br />
                  <strong>Gray lines:</strong> Beat divisions
                  <br />
                  <strong>Red cursor:</strong> Current playback position
                </p>
              </div>
            </div>
          )}

          {activeView === 'spectrum' && (
            <div className="viz-section">
              <Spectrogram
                analyser={analyser}
                width={800}
                height={300}
                colorScheme={spectrogramColorScheme}
                minFrequency={0}
                maxFrequency={8000}
              />

              <div className="spectrum-controls">
                <label>
                  Color Scheme:
                  <select
                    value={spectrogramColorScheme}
                    onChange={(e) => setSpectrogramColorScheme(e.target.value as any)}
                  >
                    <option value="hot">Hot</option>
                    <option value="cool">Cool</option>
                    <option value="rainbow">Rainbow</option>
                    <option value="grayscale">Grayscale</option>
                  </select>
                </label>
              </div>

              {!analyser && (
                <div className="viz-placeholder">
                  <p>No audio analyzer available</p>
                  <p className="hint">Start recording or playing to see the spectrogram</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Volume Meter Sidebar */}
        {showVolumeMeter && analyser && (
          <div className="viz-sidebar">
            <h4>Level</h4>
            <VolumeMeter
              analyser={analyser}
              width={40}
              height={300}
              orientation="vertical"
              showPeak={true}
              showClipWarning={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
