/**
 * E2E Tests for VocalProcessor
 * Tests vocal analysis and AI-powered effect recommendations
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { VocalProcessor, VocalAnalysis, Genre } from '../../src/audio/VocalProcessor';

describe('VocalProcessor E2E Tests', () => {
  let vocalProcessor: VocalProcessor;
  let testAudioBuffer: AudioBuffer;

  beforeAll(async () => {
    // Initialize vocal processor
    vocalProcessor = new VocalProcessor();

    // Create test audio buffer (simulated vocal recording)
    const audioContext = new (global as any).AudioContext();
    const sampleRate = 44100;
    const duration = 2; // 2 seconds
    const numSamples = sampleRate * duration;

    testAudioBuffer = audioContext.createBuffer(1, numSamples, sampleRate);
    const channelData = testAudioBuffer.getChannelData(0);

    // Generate test signal: mix of fundamental frequency (200Hz) + harmonics
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      // Fundamental + harmonics
      channelData[i] =
        Math.sin(2 * Math.PI * 200 * t) * 0.5 + // Fundamental
        Math.sin(2 * Math.PI * 400 * t) * 0.3 + // 2nd harmonic
        Math.sin(2 * Math.PI * 600 * t) * 0.2 + // 3rd harmonic
        Math.random() * 0.05; // Slight noise
    }
  });

  describe('Vocal Analysis', () => {
    it('should analyze vocal characteristics', () => {
      const analysis = vocalProcessor.analyzeVocal(testAudioBuffer);

      expect(analysis).toBeDefined();
      expect(analysis.timbre).toBeDefined();
      expect(analysis.dynamicRange).toBeGreaterThan(0);
      expect(analysis.peakLevel).toBeGreaterThan(0);
      expect(analysis.peakLevel).toBeLessThanOrEqual(1);
      expect(analysis.noiseFloor).toBeLessThan(0); // dB
      expect(['dark', 'balanced', 'bright']).toContain(analysis.spectralBalance);
      expect(typeof analysis.hasSibilance).toBe('boolean');
      expect(typeof analysis.hasRoomTone).toBe('boolean');
      expect(['low', 'moderate', 'high']).toContain(analysis.breathNoise);

      console.log('[VocalProcessor Test] Analysis:', analysis);
    });

    it('should detect clipping in overloaded signal', () => {
      // Create buffer with clipping
      const clippedBuffer = testAudioBuffer.audioContext.createBuffer(
        1,
        1000,
        testAudioBuffer.sampleRate
      );
      const data = clippedBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = i % 10 === 0 ? 1.0 : 0.5; // Periodic clipping
      }

      const analysis = vocalProcessor.analyzeVocal(clippedBuffer);
      expect(analysis.hasClipping).toBe(true);
      expect(analysis.peakLevel).toBeGreaterThanOrEqual(0.99);
    });

    it('should calculate dynamic range correctly', () => {
      const analysis = vocalProcessor.analyzeVocal(testAudioBuffer);

      // Dynamic range should be reasonable for a vocal recording
      expect(analysis.dynamicRange).toBeGreaterThan(0);
      expect(analysis.dynamicRange).toBeLessThan(80); // Max reasonable range
    });

    it('should estimate noise floor', () => {
      const analysis = vocalProcessor.analyzeVocal(testAudioBuffer);

      // Noise floor should be negative dB
      expect(analysis.noiseFloor).toBeLessThan(0);
      expect(analysis.noiseFloor).toBeGreaterThan(-100);
    });
  });

  describe('Effect Recommendations', () => {
    const genres: Genre[] = ['country', 'pop', 'rock', 'rnb', 'hip-hop', 'indie', 'folk', 'jazz'];

    it('should generate effect chain for each genre', () => {
      const analysis = vocalProcessor.analyzeVocal(testAudioBuffer);

      genres.forEach((genre) => {
        const effectChain = vocalProcessor.recommendEffects(analysis, genre);

        expect(effectChain).toBeDefined();
        expect(effectChain.preEffects).toBeDefined();
        expect(Array.isArray(effectChain.preEffects)).toBe(true);
        expect(effectChain.dynamics).toBeDefined();
        expect(Array.isArray(effectChain.dynamics)).toBe(true);
        expect(effectChain.tonal).toBeDefined();
        expect(Array.isArray(effectChain.tonal)).toBe(true);
        expect(effectChain.spatial).toBeDefined();
        expect(Array.isArray(effectChain.spatial)).toBe(true);
        expect(effectChain.postEffects).toBeDefined();
        expect(Array.isArray(effectChain.postEffects)).toBe(true);

        console.log(`[VocalProcessor Test] ${genre} chain:`, effectChain);
      });
    });

    it('should include high-pass filter in pre-effects', () => {
      const analysis = vocalProcessor.analyzeVocal(testAudioBuffer);
      const effectChain = vocalProcessor.recommendEffects(analysis, 'pop');

      const hasHighPass = effectChain.preEffects.some(
        (effect) => effect.name === 'High-Pass Filter'
      );
      expect(hasHighPass).toBe(true);
    });

    it('should include compressor in dynamics', () => {
      const analysis = vocalProcessor.analyzeVocal(testAudioBuffer);
      const effectChain = vocalProcessor.recommendEffects(analysis, 'pop');

      const hasCompressor = effectChain.dynamics.some(
        (effect) => effect.type === 'compressor'
      );
      expect(hasCompressor).toBe(true);
    });

    it('should include limiter in post-effects', () => {
      const analysis = vocalProcessor.analyzeVocal(testAudioBuffer);
      const effectChain = vocalProcessor.recommendEffects(analysis, 'pop');

      const hasLimiter = effectChain.postEffects.some(
        (effect) => effect.name === 'Output Limiter'
      );
      expect(hasLimiter).toBe(true);
    });

    it('should adapt compression settings by genre', () => {
      const analysis = vocalProcessor.analyzeVocal(testAudioBuffer);

      const countryChain = vocalProcessor.recommendEffects(analysis, 'country');
      const hipHopChain = vocalProcessor.recommendEffects(analysis, 'hip-hop');

      const countryComp = countryChain.dynamics.find((e) => e.type === 'compressor');
      const hipHopComp = hipHopChain.dynamics.find((e) => e.type === 'compressor');

      expect(countryComp).toBeDefined();
      expect(hipHopComp).toBeDefined();

      // Hip-hop should have higher ratio than country
      expect((hipHopComp!.parameters.ratio as number)).toBeGreaterThan(
        countryComp!.parameters.ratio as number
      );
    });

    it('should respect naturalSound preference', () => {
      const analysis = vocalProcessor.analyzeVocal(testAudioBuffer);

      const naturalChain = vocalProcessor.recommendEffects(analysis, 'pop', {
        naturalSound: true
      });

      // Natural sound should not include autotune
      expect(naturalChain.tuning).toBeUndefined();
    });

    it('should add de-esser when sibilance detected', () => {
      const analysis = vocalProcessor.analyzeVocal(testAudioBuffer);
      analysis.hasSibilance = true; // Force sibilance detection

      const effectChain = vocalProcessor.recommendEffects(analysis, 'pop');

      const hasDeEsser = effectChain.dynamics.some((effect) => effect.type === 'deesser');
      expect(hasDeEsser).toBe(true);
    });

    it('should add de-reverb when room tone detected', () => {
      const analysis = vocalProcessor.analyzeVocal(testAudioBuffer);
      analysis.hasRoomTone = true; // Force room tone detection

      const effectChain = vocalProcessor.recommendEffects(analysis, 'pop');

      const hasDereverb = effectChain.preEffects.some(
        (effect) => effect.type === 'dereverb'
      );
      expect(hasDereverb).toBe(true);
    });
  });

  describe('Genre-Specific Recommendations', () => {
    it('should recommend plate reverb for country', () => {
      const analysis = vocalProcessor.analyzeVocal(testAudioBuffer);
      const effectChain = vocalProcessor.recommendEffects(analysis, 'country');

      const reverb = effectChain.spatial.find((e) => e.type === 'reverb');
      expect(reverb).toBeDefined();
      expect((reverb!.parameters.type as string).toLowerCase()).toContain('plate');
    });

    it('should recommend autotune for pop and hip-hop', () => {
      const analysis = vocalProcessor.analyzeVocal(testAudioBuffer);

      const popChain = vocalProcessor.recommendEffects(analysis, 'pop');
      const hipHopChain = vocalProcessor.recommendEffects(analysis, 'hip-hop');

      expect(popChain.tuning).toBeDefined();
      expect(hipHopChain.tuning).toBeDefined();

      // Hip-hop should have faster retune speed
      expect((hipHopChain.tuning!.parameters.speed as number)).toBeLessThan(
        popChain.tuning!.parameters.speed as number
      );
    });

    it('should recommend saturation for rock', () => {
      const analysis = vocalProcessor.analyzeVocal(testAudioBuffer);
      const effectChain = vocalProcessor.recommendEffects(analysis, 'rock');

      const hasSaturation = effectChain.tonal.some((effect) => effect.type === 'saturation');
      expect(hasSaturation).toBe(true);
    });

    it('should recommend minimal compression for jazz and folk', () => {
      const analysis = vocalProcessor.analyzeVocal(testAudioBuffer);

      const jazzChain = vocalProcessor.recommendEffects(analysis, 'jazz');
      const folkChain = vocalProcessor.recommendEffects(analysis, 'folk');

      const jazzComp = jazzChain.dynamics.find((e) => e.type === 'compressor');
      const folkComp = folkChain.dynamics.find((e) => e.type === 'compressor');

      // Jazz and folk should have lower ratios (more natural)
      expect((jazzComp!.parameters.ratio as number)).toBeLessThan(4);
      expect((folkComp!.parameters.ratio as number)).toBeLessThan(4);
    });
  });

  describe('Effect Priority Levels', () => {
    it('should mark essential effects correctly', () => {
      const analysis = vocalProcessor.analyzeVocal(testAudioBuffer);
      const effectChain = vocalProcessor.recommendEffects(analysis, 'pop');

      const allEffects = [
        ...effectChain.preEffects,
        ...(effectChain.tuning ? [effectChain.tuning] : []),
        ...effectChain.dynamics,
        ...effectChain.tonal,
        ...effectChain.spatial,
        ...effectChain.postEffects
      ];

      const essentialEffects = allEffects.filter((e) => e.priority === 'essential');
      expect(essentialEffects.length).toBeGreaterThan(0);

      // High-pass and compressor should always be essential
      const essentialNames = essentialEffects.map((e) => e.name);
      expect(essentialNames).toContain('High-Pass Filter');
      expect(essentialNames.some((n) => n.includes('Compressor'))).toBe(true);
    });

    it('should have recommended and optional effects', () => {
      const analysis = vocalProcessor.analyzeVocal(testAudioBuffer);
      const effectChain = vocalProcessor.recommendEffects(analysis, 'pop');

      const allEffects = [
        ...effectChain.preEffects,
        ...(effectChain.tuning ? [effectChain.tuning] : []),
        ...effectChain.dynamics,
        ...effectChain.tonal,
        ...effectChain.spatial,
        ...effectChain.postEffects
      ];

      const hasRecommended = allEffects.some((e) => e.priority === 'recommended');
      const hasOptional = allEffects.some((e) => e.priority === 'optional');

      expect(hasRecommended || hasOptional).toBe(true);
    });
  });
});
