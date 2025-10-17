/**
 * CompactVocalPresets - Quick access vocal preset selector
 * Shows in the bottom compact widget row for easy access to Auto-Tune and other vocal presets
 */

'use client';

import { useState, useEffect } from 'react';
import { Mic, Zap } from 'lucide-react';
import { useTrackStore } from '@/src/core/store';
import { usePlayback } from '@/src/core/usePlayback';
import { VOCAL_PRESETS } from '@/src/utils/vocalEffects';
import styles from './CompactVocalPresets.module.css';

interface CompactVocalPresetsProps {
  audioContext: AudioContext | null;
}

const PRESET_INFO = {
  natural: { name: 'Natural', icon: '🎤', color: '#55ff88' },
  radio: { name: 'Radio', icon: '📻', color: '#ffaa55' },
  autoTune: { name: 'Auto-Tune', icon: '✨', color: '#ff55ff' },
  thick: { name: 'Thick', icon: '🔊', color: '#5588ff' },
  telephone: { name: 'Lo-Fi', icon: '☎️', color: '#888888' },
};

export function CompactVocalPresets({ audioContext }: CompactVocalPresetsProps) {
  const { tracks, activeTrackId } = useTrackStore();
  const { getVocalEffects } = usePlayback();
  const activeTrack = tracks.find(t => t.id === activeTrackId);

  const [selectedPreset, setSelectedPreset] = useState<keyof typeof VOCAL_PRESETS>('natural');

  useEffect(() => {
    // Detect current preset based on pitch correction state
    if (!activeTrackId) return;

    const vocalEffects = getVocalEffects(activeTrackId);
    if (vocalEffects) {
      const pitchParams = vocalEffects.pitchCorrection.getParams();
      if (pitchParams.enabled && pitchParams.strength > 0.5) {
        setSelectedPreset('autoTune');
      }
    }
  }, [activeTrackId, getVocalEffects]);

  if (!activeTrack || !audioContext) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Mic size={14} />
          <span>Vocal Presets</span>
        </div>
        <div className={styles.disabled}>
          No track selected
        </div>
      </div>
    );
  }

  const handlePresetChange = (preset: keyof typeof VOCAL_PRESETS) => {
    if (!activeTrackId) return;

    const vocalEffects = getVocalEffects(activeTrackId);
    if (!vocalEffects) return;

    const presetConfig = VOCAL_PRESETS[preset];

    // Apply pitch correction settings
    if (presetConfig.pitchCorrection) {
      vocalEffects.pitchCorrection.updateParams(presetConfig.pitchCorrection);
    }

    // Apply doubler settings
    if (presetConfig.doubler) {
      vocalEffects.doubler.updateParams(presetConfig.doubler);
    }

    // Apply de-esser settings
    if (presetConfig.deEsser) {
      vocalEffects.deEsser.updateParams(presetConfig.deEsser);
    }

    setSelectedPreset(preset);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Mic size={14} />
        <span>Vocal FX</span>
        {selectedPreset === 'autoTune' && <Zap size={12} className={styles.activeBadge} />}
      </div>

      <div className={styles.presetGrid}>
        {(Object.keys(PRESET_INFO) as Array<keyof typeof PRESET_INFO>).map((preset) => {
          const info = PRESET_INFO[preset];
          const isActive = selectedPreset === preset;

          return (
            <button
              key={preset}
              className={`${styles.presetButton} ${isActive ? styles.active : ''}`}
              onClick={() => handlePresetChange(preset)}
              style={{
                borderColor: isActive ? info.color : 'transparent',
                boxShadow: isActive ? `0 0 10px ${info.color}40` : 'none',
              }}
              title={`${info.name} preset`}
            >
              <span className={styles.presetIcon}>{info.icon}</span>
              <span className={styles.presetName}>{info.name}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.footer}>
        Track: <span className={styles.trackName}>{activeTrack.name}</span>
      </div>
    </div>
  );
}
