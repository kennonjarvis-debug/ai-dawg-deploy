'use client';

import { useState, useMemo } from 'react';
import { useEffects } from '$lib/../core/useEffects';
import { EQ_PRESETS } from '@/src/utils/audioEffects';
import { Knob } from '@/src/components/Knob';
import { EQCurve, Spectrum } from '@/src/visualizers';
import type { EQCurveParams } from '@/src/visualizers';
import styles from './EffectsPanel.module.css';

interface EffectsPanelProps {
  trackId: string;
  audioContext: AudioContext | null;
  mediaStream?: MediaStream | null;
}

export function EffectsPanel({ trackId, audioContext, mediaStream }: EffectsPanelProps) {
  const effects = useEffects({ trackId, audioContext, enabled: true });

  const [eqEnabled, setEQEnabled] = useState(false);
  const [compressorEnabled, setCompressorEnabled] = useState(false);
  const [reverbEnabled, setReverbEnabled] = useState(false);
  const [delayEnabled, setDelayEnabled] = useState(false);

  // EQ State
  const [lowGain, setLowGain] = useState(0);
  const [midGain, setMidGain] = useState(0);
  const [highGain, setHighGain] = useState(0);

  // Compressor State
  const [threshold, setThreshold] = useState(-24);
  const [ratio, setRatio] = useState(4);
  const [attack, setAttack] = useState(0.003);
  const [release, setRelease] = useState(0.25);

  // Reverb State
  const [reverbMix, setReverbMix] = useState(0.3);
  const [reverbDecay, setReverbDecay] = useState(2.0);

  // Delay State
  const [delayTime, setDelayTime] = useState(0.375);
  const [delayFeedback, setDelayFeedback] = useState(0.3);
  const [delayMix, setDelayMix] = useState(0.3);

  // EQ parameters for visualization
  const eqParams: EQCurveParams = useMemo(() => ({
    low: { frequency: 100, gain: lowGain, Q: 1, type: 'lowshelf' },
    mid: { frequency: 1000, gain: midGain, Q: 1, type: 'peaking' },
    high: { frequency: 8000, gain: highGain, Q: 1, type: 'highshelf' },
  }), [lowGain, midGain, highGain]);

  // EQ Handlers
  const handleEQToggle = () => {
    const newState = !eqEnabled;
    setEQEnabled(newState);
    effects.toggleEQ(newState);
  };

  const handleEQChange = (band: 'low' | 'mid' | 'high', value: number) => {
    if (band === 'low') {
      setLowGain(value);
      effects.updateEQ({ low: { frequency: 100, gain: value, Q: 1, type: 'lowshelf' } });
    } else if (band === 'mid') {
      setMidGain(value);
      effects.updateEQ({ mid: { frequency: 1000, gain: value, Q: 1, type: 'peaking' } });
    } else {
      setHighGain(value);
      effects.updateEQ({ high: { frequency: 8000, gain: value, Q: 1, type: 'highshelf' } });
    }
  };

  const handleEQPreset = (preset: keyof typeof EQ_PRESETS) => {
    effects.loadEQPreset(preset);
    const params = effects.getEQParams();
    if (params) {
      setLowGain(params.low.gain);
      setMidGain(params.mid.gain);
      setHighGain(params.high.gain);
    }
  };

  // Compressor Handlers
  const handleCompressorToggle = () => {
    const newState = !compressorEnabled;
    setCompressorEnabled(newState);
    effects.toggleCompressor(newState);
  };

  const handleCompressorChange = (param: string, value: number) => {
    if (param === 'threshold') {
      setThreshold(value);
      effects.updateCompressor({ threshold: value });
    } else if (param === 'ratio') {
      setRatio(value);
      effects.updateCompressor({ ratio: value });
    } else if (param === 'attack') {
      setAttack(value);
      effects.updateCompressor({ attack: value });
    } else if (param === 'release') {
      setRelease(value);
      effects.updateCompressor({ release: value });
    }
  };

  // Reverb Handlers
  const handleReverbToggle = () => {
    const newState = !reverbEnabled;
    setReverbEnabled(newState);
    effects.toggleReverb(newState);
  };

  const handleReverbChange = (param: string, value: number) => {
    if (param === 'mix') {
      setReverbMix(value);
      effects.updateReverb({ wetDryMix: value });
    } else if (param === 'decay') {
      setReverbDecay(value);
      effects.updateReverb({ decay: value });
    }
  };

  // Delay Handlers
  const handleDelayToggle = () => {
    const newState = !delayEnabled;
    setDelayEnabled(newState);
    effects.toggleDelay(newState);
  };

  const handleDelayChange = (param: string, value: number) => {
    if (param === 'time') {
      setDelayTime(value);
      effects.updateDelay({ time: value });
    } else if (param === 'feedback') {
      setDelayFeedback(value);
      effects.updateDelay({ feedback: value });
    } else if (param === 'mix') {
      setDelayMix(value);
      effects.updateDelay({ wetDryMix: value });
    }
  };

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>Effects</h3>

      {/* EQ Section */}
      <div className={styles.effect}>
        <div className={styles.header}>
          <label className={styles.label}>
            <input
              type="checkbox"
              checked={eqEnabled}
              onChange={handleEQToggle}
              className={styles.checkbox}
            />
            EQ
          </label>
          <select
            className={styles.presetSelect}
            onChange={(e) => handleEQPreset(e.target.value as keyof typeof EQ_PRESETS)}
            disabled={!eqEnabled}
          >
            <option value="">Preset</option>
            <option value="flat">Flat</option>
            <option value="vocal">Vocal</option>
            <option value="warmth">Warmth</option>
            <option value="presence">Presence</option>
            <option value="radio">Radio</option>
          </select>
        </div>

        {eqEnabled && (
          <div className={styles.eqContent}>
            <div className={styles.knobGroup}>
              <Knob
                value={lowGain}
                min={-12}
                max={12}
                step={0.5}
                defaultValue={0}
                label="Low"
                unit="dB"
                size={60}
                color="#00e5ff"
                onChange={(value) => handleEQChange('low', value)}
              />
              <Knob
                value={midGain}
                min={-12}
                max={12}
                step={0.5}
                defaultValue={0}
                label="Mid"
                unit="dB"
                size={60}
                color="#00e5ff"
                onChange={(value) => handleEQChange('mid', value)}
              />
              <Knob
                value={highGain}
                min={-12}
                max={12}
                step={0.5}
                defaultValue={0}
                label="High"
                unit="dB"
                size={60}
                color="#00e5ff"
                onChange={(value) => handleEQChange('high', value)}
              />
            </div>
            <div className={styles.vizContainer}>
              <EQCurve
                audioContext={audioContext}
                eqParams={eqParams}
                width={320}
                height={140}
                curveColor="#00e5ff"
                showGrid={true}
                showLabels={true}
              />
            </div>
          </div>
        )}
      </div>

      {/* Compressor Section */}
      <div className={styles.effect}>
        <div className={styles.header}>
          <label className={styles.label}>
            <input
              type="checkbox"
              checked={compressorEnabled}
              onChange={handleCompressorToggle}
              className={styles.checkbox}
            />
            Compressor
          </label>
        </div>

        {compressorEnabled && (
          <div className={styles.knobGroup}>
            <Knob
              value={threshold}
              min={-60}
              max={0}
              step={1}
              defaultValue={-24}
              label="Threshold"
              unit="dB"
              size={60}
              color="#9d4edd"
              onChange={(value) => handleCompressorChange('threshold', value)}
            />
            <Knob
              value={ratio}
              min={1}
              max={20}
              step={0.5}
              defaultValue={4}
              label="Ratio"
              unit=":1"
              size={60}
              color="#9d4edd"
              onChange={(value) => handleCompressorChange('ratio', value)}
            />
            <Knob
              value={attack}
              min={0.001}
              max={0.1}
              step={0.001}
              defaultValue={0.003}
              label="Attack"
              unit="ms"
              formatValue={(v) => (v * 1000).toFixed(1)}
              size={60}
              color="#9d4edd"
              onChange={(value) => handleCompressorChange('attack', value)}
            />
            <Knob
              value={release}
              min={0.01}
              max={1.0}
              step={0.01}
              defaultValue={0.25}
              label="Release"
              unit="ms"
              formatValue={(v) => (v * 1000).toFixed(0)}
              size={60}
              color="#9d4edd"
              onChange={(value) => handleCompressorChange('release', value)}
            />
          </div>
        )}
      </div>

      {/* Reverb Section */}
      <div className={styles.effect}>
        <div className={styles.header}>
          <label className={styles.label}>
            <input
              type="checkbox"
              checked={reverbEnabled}
              onChange={handleReverbToggle}
              className={styles.checkbox}
            />
            Reverb
          </label>
        </div>

        {reverbEnabled && (
          <div className={styles.knobGroup}>
            <Knob
              value={reverbMix}
              min={0}
              max={1}
              step={0.01}
              defaultValue={0.3}
              label="Mix"
              unit="%"
              formatValue={(v) => (v * 100).toFixed(0)}
              size={60}
              color="#00ff88"
              onChange={(value) => handleReverbChange('mix', value)}
            />
            <Knob
              value={reverbDecay}
              min={0.1}
              max={10.0}
              step={0.1}
              defaultValue={2.0}
              label="Decay"
              unit="s"
              size={60}
              color="#00ff88"
              onChange={(value) => handleReverbChange('decay', value)}
            />
          </div>
        )}
      </div>

      {/* Delay Section */}
      <div className={styles.effect}>
        <div className={styles.header}>
          <label className={styles.label}>
            <input
              type="checkbox"
              checked={delayEnabled}
              onChange={handleDelayToggle}
              className={styles.checkbox}
            />
            Delay
          </label>
        </div>

        {delayEnabled && (
          <div className={styles.knobGroup}>
            <Knob
              value={delayTime}
              min={0.01}
              max={2.0}
              step={0.01}
              defaultValue={0.375}
              label="Time"
              unit="ms"
              formatValue={(v) => (v * 1000).toFixed(0)}
              size={60}
              color="#ffaa00"
              onChange={(value) => handleDelayChange('time', value)}
            />
            <Knob
              value={delayFeedback}
              min={0}
              max={0.9}
              step={0.01}
              defaultValue={0.3}
              label="Feedback"
              unit="%"
              formatValue={(v) => (v * 100).toFixed(0)}
              size={60}
              color="#ffaa00"
              onChange={(value) => handleDelayChange('feedback', value)}
            />
            <Knob
              value={delayMix}
              min={0}
              max={1}
              step={0.01}
              defaultValue={0.3}
              label="Mix"
              unit="%"
              formatValue={(v) => (v * 100).toFixed(0)}
              size={60}
              color="#ffaa00"
              onChange={(value) => handleDelayChange('mix', value)}
            />
          </div>
        )}
      </div>

      {/* Spectrum Analyzer */}
      {mediaStream && (
        <div className={styles.spectrumSection}>
          <h4 className={styles.sectionTitle}>Real-time Spectrum</h4>
          <Spectrum
            audioContext={audioContext}
            mediaStream={mediaStream}
            width={360}
            height={120}
            style="bars"
            scale="logarithmic"
            smoothingFactor={0.8}
            showPeakHold={true}
          />
        </div>
      )}
    </div>
  );
}
