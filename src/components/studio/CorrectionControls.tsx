/**
 * Correction Controls Component
 * UI for adjusting pitch and rhythm correction parameters
 */

import { useEffect } from 'react';
import { useCorrection } from '../../hooks/useCorrection';
import { exportAndDownload } from '../../correction/audioExport';
import { useAudioStore } from '../../store/audioStore';
import { getRVCClient } from '../../services/rvcClient';
import './CorrectionControls.css';

export function CorrectionControls() {
  const {
    applyCorrection,
    mixWithBackingTrack,
    updateCorrectionOption,
    updateMixingOption,
    resetOptions,
    applyRecommendations,
    getRecommendations,
    isProcessing,
    progress,
    stage,
    correctionOptions,
    mixingOptions,
    hasRecordedAudio,
    hasCorrectedAudio,
    hasBackingTrack,
    hasPitchData,
    hasBeatData,
  } = useCorrection();

  const correctedAudioBuffer = useAudioStore((state) => state.correctedAudioBuffer);

  // RVC state
  const rvcEnabled = useAudioStore((state) => state.rvcEnabled);
  const rvcBackendHealthy = useAudioStore((state) => state.rvcBackendHealthy);
  const rvcAvailableModels = useAudioStore((state) => state.rvcAvailableModels);
  const rvcOptions = useAudioStore((state) => state.rvcOptions);
  const setRVCEnabled = useAudioStore((state) => state.setRVCEnabled);
  const setRVCBackendHealthy = useAudioStore((state) => state.setRVCBackendHealthy);
  const setRVCAvailableModels = useAudioStore((state) => state.setRVCAvailableModels);
  const setRVCOption = useAudioStore((state) => state.setRVCOption);

  // Check RVC backend health and load models on mount
  useEffect(() => {
    const checkRVCBackend = async () => {
      const rvcClient = getRVCClient();

      // Check health
      const healthy = await rvcClient.checkHealth();
      setRVCBackendHealthy(healthy);

      // Load available models if healthy
      if (healthy) {
        const models = await rvcClient.listModels();
        setRVCAvailableModels(models.map(m => m.name));

        // Set first model as default if available
        if (models.length > 0 && rvcOptions.modelName === 'default') {
          setRVCOption('modelName', models[0].name);
        }
      }
    };

    checkRVCBackend();

    // Re-check every 30 seconds
    const interval = setInterval(checkRVCBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleApplyCorrection = async () => {
    await applyCorrection();
  };

  const handleMixWithBackingTrack = async () => {
    await mixWithBackingTrack();
  };

  const handleExport = async () => {
    if (!correctedAudioBuffer) {
      alert('No corrected audio to export');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `freestyle-corrected-${timestamp}.wav`;

    try {
      await exportAndDownload(correctedAudioBuffer, filename, {
        bitDepth: 16,
        normalize: true,
        filename,
      });
    } catch (error) {
      console.error('Error exporting audio:', error);
      alert('Failed to export audio');
    }
  };

  const handleAutoRecommend = () => {
    const recommendations = getRecommendations();
    if (recommendations) {
      const message = `Recommendations:\n\nPitch Strength: ${recommendations.recommendedPitchStrength}%\nRhythm Strength: ${recommendations.recommendedRhythmStrength}%\nSuggested Key: ${recommendations.suggestedKey} ${recommendations.suggestedScale}\n\nPitch Accuracy: ${recommendations.pitchAccuracy.toFixed(1)}%\nTiming Accuracy: ${recommendations.timingAccuracy.toFixed(1)}%\n\nApply these settings?`;

      if (confirm(message)) {
        applyRecommendations();
      }
    } else {
      alert('No analysis data available. Please record audio first.');
    }
  };

  return (
    <div className="correction-controls">
      <h2>Vocal Correction</h2>

      {/* Status Display */}
      {isProcessing && (
        <div className="processing-status">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="status-text">
            {stage === 'pitch' && 'Applying pitch correction...'}
            {stage === 'rhythm' && 'Quantizing rhythm...'}
            {stage === 'mixing' && 'Mixing tracks...'}
            {stage === 'complete' && 'Complete!'}
          </p>
        </div>
      )}

      {/* Pitch Correction Section */}
      <section className="correction-section">
        <h3>Pitch Correction</h3>

        <div className="control-row">
          <label>
            <input
              type="checkbox"
              checked={correctionOptions.enablePitchCorrection}
              onChange={(e) =>
                updateCorrectionOption('enablePitchCorrection', e.target.checked)
              }
              disabled={isProcessing}
            />
            Enable Pitch Correction
          </label>
        </div>

        {correctionOptions.enablePitchCorrection && (
          <>
            <div className="control-row">
              <label>
                Strength: {correctionOptions.pitchStrength}%
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={correctionOptions.pitchStrength}
                  onChange={(e) =>
                    updateCorrectionOption('pitchStrength', parseInt(e.target.value))
                  }
                  disabled={isProcessing}
                />
              </label>
            </div>

            <div className="control-row">
              <label>
                Target Key:
                <select
                  value={correctionOptions.targetKey}
                  onChange={(e) => updateCorrectionOption('targetKey', e.target.value)}
                  disabled={isProcessing}
                >
                  <option value="C">C</option>
                  <option value="Db">C#/Db</option>
                  <option value="D">D</option>
                  <option value="Eb">D#/Eb</option>
                  <option value="E">E</option>
                  <option value="F">F</option>
                  <option value="Gb">F#/Gb</option>
                  <option value="G">G</option>
                  <option value="Ab">G#/Ab</option>
                  <option value="A">A</option>
                  <option value="Bb">A#/Bb</option>
                  <option value="B">B</option>
                </select>
              </label>

              <label>
                Scale:
                <select
                  value={correctionOptions.targetScale}
                  onChange={(e) =>
                    updateCorrectionOption('targetScale', e.target.value as 'major' | 'minor' | 'chromatic')
                  }
                  disabled={isProcessing}
                >
                  <option value="chromatic">Chromatic (All Notes)</option>
                  <option value="major">Major</option>
                  <option value="minor">Minor</option>
                </select>
              </label>
            </div>

            <div className="control-row">
              <label>
                Smoothing: {(correctionOptions.smoothing * 100).toFixed(0)}%
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={correctionOptions.smoothing * 100}
                  onChange={(e) =>
                    updateCorrectionOption('smoothing', parseInt(e.target.value) / 100)
                  }
                  disabled={isProcessing}
                />
              </label>
            </div>

            <div className="control-row">
              <label>
                <input
                  type="checkbox"
                  checked={correctionOptions.preserveFormants}
                  onChange={(e) =>
                    updateCorrectionOption('preserveFormants', e.target.checked)
                  }
                  disabled={isProcessing}
                />
                Preserve Voice Character
              </label>
            </div>
          </>
        )}
      </section>

      {/* Rhythm Quantization Section */}
      <section className="correction-section">
        <h3>Rhythm Quantization</h3>

        <div className="control-row">
          <label>
            <input
              type="checkbox"
              checked={correctionOptions.enableRhythmQuantization}
              onChange={(e) =>
                updateCorrectionOption('enableRhythmQuantization', e.target.checked)
              }
              disabled={isProcessing || !hasBeatData}
            />
            Enable Rhythm Quantization
            {!hasBeatData && ' (No beat data available)'}
          </label>
        </div>

        {correctionOptions.enableRhythmQuantization && (
          <>
            <div className="control-row">
              <label>
                Strength: {correctionOptions.rhythmStrength}%
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={correctionOptions.rhythmStrength}
                  onChange={(e) =>
                    updateCorrectionOption('rhythmStrength', parseInt(e.target.value))
                  }
                  disabled={isProcessing}
                />
              </label>
            </div>

            <div className="control-row">
              <label>
                Grid:
                <select
                  value={correctionOptions.quantizeSubdivision}
                  onChange={(e) =>
                    updateCorrectionOption('quantizeSubdivision', parseInt(e.target.value))
                  }
                  disabled={isProcessing}
                >
                  <option value="4">Quarter Notes</option>
                  <option value="8">8th Notes</option>
                  <option value="16">16th Notes</option>
                </select>
              </label>
            </div>

            <div className="control-row">
              <label>
                Humanize: {correctionOptions.humanize}%
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={correctionOptions.humanize}
                  onChange={(e) =>
                    updateCorrectionOption('humanize', parseInt(e.target.value))
                  }
                  disabled={isProcessing}
                />
              </label>
            </div>
          </>
        )}
      </section>

      {/* RVC Voice Cloning Section */}
      <section className="correction-section rvc-section">
        <h3>Voice Cloning (RVC)</h3>

        <div className="control-row">
          <label>
            <input
              type="checkbox"
              checked={rvcEnabled}
              onChange={(e) => setRVCEnabled(e.target.checked)}
              disabled={isProcessing || !rvcBackendHealthy}
            />
            Enable Voice Cloning
            {!rvcBackendHealthy && ' (Backend not available)'}
          </label>
        </div>

        {rvcBackendHealthy && (
          <div className="rvc-status">
            <span className="status-indicator healthy">✓ RVC Backend Connected</span>
            {rvcAvailableModels.length === 0 && (
              <p className="info-text">No voice models found. Upload models to get started.</p>
            )}
          </div>
        )}

        {!rvcBackendHealthy && (
          <div className="rvc-status">
            <span className="status-indicator unhealthy">✗ RVC Backend Offline</span>
            <p className="info-text">
              Start the RVC backend: <code>cd rvc-backend && python3 server.py</code>
            </p>
          </div>
        )}

        {rvcEnabled && rvcBackendHealthy && (
          <>
            <div className="control-row">
              <label>
                Voice Model:
                <select
                  value={rvcOptions.modelName}
                  onChange={(e) => setRVCOption('modelName', e.target.value)}
                  disabled={isProcessing || rvcAvailableModels.length === 0}
                >
                  {rvcAvailableModels.length === 0 ? (
                    <option value="default">No models available</option>
                  ) : (
                    rvcAvailableModels.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))
                  )}
                </select>
              </label>
            </div>

            <div className="control-row">
              <label>
                Pitch Shift: {rvcOptions.pitchShift > 0 ? '+' : ''}{rvcOptions.pitchShift} semitones
                <input
                  type="range"
                  min="-12"
                  max="12"
                  value={rvcOptions.pitchShift}
                  onChange={(e) => setRVCOption('pitchShift', parseInt(e.target.value))}
                  disabled={isProcessing}
                />
              </label>
            </div>

            <div className="control-row">
              <label>
                Voice Accent: {(rvcOptions.indexRate * 100).toFixed(0)}%
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={rvcOptions.indexRate * 100}
                  onChange={(e) => setRVCOption('indexRate', parseInt(e.target.value) / 100)}
                  disabled={isProcessing}
                />
              </label>
              <small>Lower = more model voice, Higher = preserve original accent</small>
            </div>

            <div className="control-row">
              <label>
                Smoothness: {rvcOptions.filterRadius}
                <input
                  type="range"
                  min="0"
                  max="7"
                  value={rvcOptions.filterRadius}
                  onChange={(e) => setRVCOption('filterRadius', parseInt(e.target.value))}
                  disabled={isProcessing}
                />
              </label>
              <small>0 = natural, 7 = very smooth</small>
            </div>

            <div className="control-row">
              <label>
                Consonant Protection: {(rvcOptions.protect * 100).toFixed(0)}%
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={rvcOptions.protect * 100}
                  onChange={(e) => setRVCOption('protect', parseInt(e.target.value) / 100)}
                  disabled={isProcessing}
                />
              </label>
              <small>Protects clarity of consonants (s, t, p, k sounds)</small>
            </div>
          </>
        )}
      </section>

      {/* Mixing Section */}
      {hasBackingTrack && (
        <section className="correction-section">
          <h3>Mixing</h3>

          <div className="control-row">
            <label>
              Vocal Volume: {(mixingOptions.vocalVolume * 100).toFixed(0)}%
              <input
                type="range"
                min="0"
                max="100"
                value={mixingOptions.vocalVolume * 100}
                onChange={(e) =>
                  updateMixingOption('vocalVolume', parseInt(e.target.value) / 100)
                }
                disabled={isProcessing}
              />
            </label>
          </div>

          <div className="control-row">
            <label>
              Track Volume: {(mixingOptions.trackVolume * 100).toFixed(0)}%
              <input
                type="range"
                min="0"
                max="100"
                value={mixingOptions.trackVolume * 100}
                onChange={(e) =>
                  updateMixingOption('trackVolume', parseInt(e.target.value) / 100)
                }
                disabled={isProcessing}
              />
            </label>
          </div>

          <div className="control-row">
            <label>
              <input
                type="checkbox"
                checked={mixingOptions.addReverb}
                onChange={(e) => updateMixingOption('addReverb', e.target.checked)}
                disabled={isProcessing}
              />
              Add Reverb
            </label>
          </div>

          <div className="control-row">
            <label>
              <input
                type="checkbox"
                checked={mixingOptions.addCompression}
                onChange={(e) => updateMixingOption('addCompression', e.target.checked)}
                disabled={isProcessing}
              />
              Add Compression
            </label>
          </div>
        </section>
      )}

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          onClick={handleAutoRecommend}
          disabled={isProcessing || !hasPitchData}
          className="btn btn-secondary"
        >
          Auto Recommend
        </button>

        <button
          onClick={resetOptions}
          disabled={isProcessing}
          className="btn btn-secondary"
        >
          Reset to Defaults
        </button>

        <button
          onClick={handleApplyCorrection}
          disabled={isProcessing || !hasRecordedAudio}
          className="btn btn-primary"
        >
          {isProcessing ? `Processing... ${progress}%` : 'Apply Corrections'}
        </button>

        {hasBackingTrack && hasCorrectedAudio && (
          <button
            onClick={handleMixWithBackingTrack}
            disabled={isProcessing}
            className="btn btn-primary"
          >
            Mix with Track
          </button>
        )}

        {hasCorrectedAudio && (
          <button
            onClick={handleExport}
            disabled={isProcessing}
            className="btn btn-success"
          >
            Export Audio
          </button>
        )}
      </div>

      {/* Info Messages */}
      <div className="info-messages">
        {!hasRecordedAudio && (
          <p className="info-text">Record audio to enable corrections</p>
        )}
        {hasRecordedAudio && !hasPitchData && (
          <p className="info-text">Pitch detection data not available</p>
        )}
        {hasRecordedAudio && !hasBeatData && (
          <p className="info-text">Beat detection data not available</p>
        )}
        {hasCorrectedAudio && (
          <p className="success-text">Corrected audio ready!</p>
        )}
      </div>
    </div>
  );
}
