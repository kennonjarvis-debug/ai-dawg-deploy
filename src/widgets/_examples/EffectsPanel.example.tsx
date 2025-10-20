/**
 * EffectsPanel - EXAMPLE WIDGET
 *
 * This is a working example showing how to integrate Instance 2's audio effects
 * system (useEffects hook) into a UI widget.
 *
 * COPY THIS FILE and modify for your needs. Don't edit this example directly.
 *
 * Integration Guide: /AUDIO_EFFECTS_INTEGRATION.md (full API reference)
 *
 * Features Demonstrated:
 * - useEffects hook integration
 * - EQ preset selection
 * - Manual EQ band controls (frequency, gain, Q)
 * - Compressor controls (threshold, ratio, attack, release)
 * - Reverb controls (room size, damping, wet/dry mix)
 * - Delay controls (BPM sync, time, feedback, mix)
 * - Bypass/enable toggles for each effect
 */

'use client';

import { useState, useEffect } from 'react';
import { useEffects } from '$lib/../core/useEffects';
import { useTrackStore } from '$lib/../core/store';
import styles from './EffectsPanel.example.module.css';

interface EffectsPanelProps {
  trackId: string;
  audioContext: AudioContext | null;
}

export function EffectsPanel({ trackId, audioContext }: EffectsPanelProps) {
  const track = useTrackStore((state) => state.tracks.find((t) => t.id === trackId));
  const [selectedPreset, setSelectedPreset] = useState<string>('flat');

  // Initialize effects hook
  const {
    eq,
    compressor,
    reverb,
    delay,
    loadEQPreset,
    updateEQBand,
    toggleEQ,
    updateCompressor,
    toggleCompressor,
    updateReverb,
    toggleReverb,
    updateDelay,
    toggleDelay,
  } = useEffects({
    trackId,
    audioContext,
    enabled: true,
  });

  if (!track || !audioContext) {
    return <div className={styles.container}>No track selected or audio context unavailable</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Effects - {track.name}</h2>
      </div>

      {/* EQ Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Equalizer</h3>
          <button
            className={`${styles.toggleButton} ${eq?.enabled ? styles.active : ''}`}
            onClick={() => toggleEQ()}
          >
            {eq?.enabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* EQ Presets */}
        <div className={styles.presetRow}>
          <label>Preset:</label>
          <select
            value={selectedPreset}
            onChange={(e) => {
              const preset = e.target.value as any;
              setSelectedPreset(preset);
              loadEQPreset(preset);
            }}
            className={styles.select}
          >
            <option value="flat">Flat</option>
            <option value="vocal">Vocal</option>
            <option value="warmth">Warmth</option>
            <option value="presence">Presence</option>
            <option value="radio">Radio</option>
          </select>
        </div>

        {/* EQ Band Controls */}
        {eq && (
          <div className={styles.eqBands}>
            {/* Low Band */}
            <div className={styles.band}>
              <h4>Low ({eq.lowBand.frequency}Hz)</h4>
              <div className={styles.control}>
                <label>Frequency:</label>
                <input
                  type="range"
                  min="20"
                  max="500"
                  value={eq.lowBand.frequency}
                  onChange={(e) =>
                    updateEQBand('low', { frequency: Number(e.target.value) })
                  }
                />
                <span>{eq.lowBand.frequency}Hz</span>
              </div>
              <div className={styles.control}>
                <label>Gain:</label>
                <input
                  type="range"
                  min="-24"
                  max="24"
                  step="0.5"
                  value={eq.lowBand.gain}
                  onChange={(e) => updateEQBand('low', { gain: Number(e.target.value) })}
                />
                <span>{eq.lowBand.gain.toFixed(1)}dB</span>
              </div>
            </div>

            {/* Mid Band */}
            <div className={styles.band}>
              <h4>Mid ({eq.midBand.frequency}Hz)</h4>
              <div className={styles.control}>
                <label>Frequency:</label>
                <input
                  type="range"
                  min="200"
                  max="5000"
                  value={eq.midBand.frequency}
                  onChange={(e) =>
                    updateEQBand('mid', { frequency: Number(e.target.value) })
                  }
                />
                <span>{eq.midBand.frequency}Hz</span>
              </div>
              <div className={styles.control}>
                <label>Gain:</label>
                <input
                  type="range"
                  min="-24"
                  max="24"
                  step="0.5"
                  value={eq.midBand.gain}
                  onChange={(e) => updateEQBand('mid', { gain: Number(e.target.value) })}
                />
                <span>{eq.midBand.gain.toFixed(1)}dB</span>
              </div>
              <div className={styles.control}>
                <label>Q:</label>
                <input
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={eq.midBand.Q}
                  onChange={(e) => updateEQBand('mid', { Q: Number(e.target.value) })}
                />
                <span>{eq.midBand.Q.toFixed(1)}</span>
              </div>
            </div>

            {/* High Band */}
            <div className={styles.band}>
              <h4>High ({eq.highBand.frequency}Hz)</h4>
              <div className={styles.control}>
                <label>Frequency:</label>
                <input
                  type="range"
                  min="2000"
                  max="20000"
                  value={eq.highBand.frequency}
                  onChange={(e) =>
                    updateEQBand('high', { frequency: Number(e.target.value) })
                  }
                />
                <span>{eq.highBand.frequency}Hz</span>
              </div>
              <div className={styles.control}>
                <label>Gain:</label>
                <input
                  type="range"
                  min="-24"
                  max="24"
                  step="0.5"
                  value={eq.highBand.gain}
                  onChange={(e) => updateEQBand('high', { gain: Number(e.target.value) })}
                />
                <span>{eq.highBand.gain.toFixed(1)}dB</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Compressor Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Compressor</h3>
          <button
            className={`${styles.toggleButton} ${compressor?.enabled ? styles.active : ''}`}
            onClick={() => toggleCompressor()}
          >
            {compressor?.enabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {compressor && (
          <div className={styles.controls}>
            <div className={styles.control}>
              <label>Threshold:</label>
              <input
                type="range"
                min="-60"
                max="0"
                value={compressor.threshold}
                onChange={(e) => updateCompressor({ threshold: Number(e.target.value) })}
              />
              <span>{compressor.threshold}dB</span>
            </div>
            <div className={styles.control}>
              <label>Ratio:</label>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={compressor.ratio}
                onChange={(e) => updateCompressor({ ratio: Number(e.target.value) })}
              />
              <span>{compressor.ratio}:1</span>
            </div>
            <div className={styles.control}>
              <label>Attack:</label>
              <input
                type="range"
                min="0"
                max="1000"
                step="10"
                value={compressor.attack * 1000}
                onChange={(e) => updateCompressor({ attack: Number(e.target.value) / 1000 })}
              />
              <span>{(compressor.attack * 1000).toFixed(0)}ms</span>
            </div>
            <div className={styles.control}>
              <label>Release:</label>
              <input
                type="range"
                min="0"
                max="3000"
                step="10"
                value={compressor.release * 1000}
                onChange={(e) =>
                  updateCompressor({ release: Number(e.target.value) / 1000 })
                }
              />
              <span>{(compressor.release * 1000).toFixed(0)}ms</span>
            </div>
          </div>
        )}
      </section>

      {/* Reverb Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Reverb</h3>
          <button
            className={`${styles.toggleButton} ${reverb?.enabled ? styles.active : ''}`}
            onClick={() => toggleReverb()}
          >
            {reverb?.enabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {reverb && (
          <div className={styles.controls}>
            <div className={styles.control}>
              <label>Room Size:</label>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={reverb.roomSize}
                onChange={(e) => updateReverb({ roomSize: Number(e.target.value) })}
              />
              <span>{reverb.roomSize.toFixed(1)}s</span>
            </div>
            <div className={styles.control}>
              <label>Damping:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={reverb.damping}
                onChange={(e) => updateReverb({ damping: Number(e.target.value) })}
              />
              <span>{(reverb.damping * 100).toFixed(0)}%</span>
            </div>
            <div className={styles.control}>
              <label>Mix:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={reverb.mix}
                onChange={(e) => updateReverb({ mix: Number(e.target.value) })}
              />
              <span>{(reverb.mix * 100).toFixed(0)}%</span>
            </div>
          </div>
        )}
      </section>

      {/* Delay Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Delay</h3>
          <button
            className={`${styles.toggleButton} ${delay?.enabled ? styles.active : ''}`}
            onClick={() => toggleDelay()}
          >
            {delay?.enabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {delay && (
          <div className={styles.controls}>
            <div className={styles.control}>
              <label>
                <input
                  type="checkbox"
                  checked={delay.syncToBPM}
                  onChange={(e) => updateDelay({ syncToBPM: e.target.checked })}
                />
                Sync to BPM
              </label>
            </div>
            <div className={styles.control}>
              <label>{delay.syncToBPM ? 'Note Division:' : 'Time:'}</label>
              {delay.syncToBPM ? (
                <select
                  value={delay.division}
                  onChange={(e) => updateDelay({ division: e.target.value as any })}
                  className={styles.select}
                >
                  <option value="1/4">1/4 (Quarter)</option>
                  <option value="1/8">1/8 (Eighth)</option>
                  <option value="1/16">1/16 (Sixteenth)</option>
                  <option value="1/4T">1/4T (Triplet)</option>
                  <option value="1/8T">1/8T (Triplet)</option>
                </select>
              ) : (
                <>
                  <input
                    type="range"
                    min="0"
                    max="2000"
                    step="10"
                    value={delay.time * 1000}
                    onChange={(e) => updateDelay({ time: Number(e.target.value) / 1000 })}
                  />
                  <span>{(delay.time * 1000).toFixed(0)}ms</span>
                </>
              )}
            </div>
            <div className={styles.control}>
              <label>Feedback:</label>
              <input
                type="range"
                min="0"
                max="0.95"
                step="0.01"
                value={delay.feedback}
                onChange={(e) => updateDelay({ feedback: Number(e.target.value) })}
              />
              <span>{(delay.feedback * 100).toFixed(0)}%</span>
            </div>
            <div className={styles.control}>
              <label>Mix:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={delay.mix}
                onChange={(e) => updateDelay({ mix: Number(e.target.value) })}
              />
              <span>{(delay.mix * 100).toFixed(0)}%</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
