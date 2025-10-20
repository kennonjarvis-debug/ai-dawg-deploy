/**
 * AI-Powered Audio Analysis Service
 * Analyzes voice memos to detect and classify instrumental backing tracks
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../../../../src/lib/utils/logger.js';

const execAsync = promisify(exec);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface InstrumentalAnalysis {
  hasInstrumental: boolean;
  confidence: number;
  genre?: string;
  subgenre?: string;
  instruments?: string[];
  tempo?: 'slow' | 'medium' | 'fast' | 'variable';
  bpm?: number;
  mood?: string;
  energy?: 'low' | 'medium' | 'high';
  vocalPresence?: 'none' | 'light' | 'heavy';
  productionQuality?: 'demo' | 'professional' | 'studio';
  styleDescription?: string;
}

export interface AudioFeatures {
  duration: number;
  sampleRate: number;
  channels: number;
  bitrate: string;
  // Spectral analysis
  bassEnergy: number;
  midEnergy: number;
  trebleEnergy: number;
  // Dynamic range
  dynamicRange: number;
  rmsLevel: number;
  peakLevel: number;
}

export class AudioAnalysisService {
  /**
   * Analyze audio file to detect and classify instrumental
   */
  async analyzeInstrumental(filePath: string): Promise<InstrumentalAnalysis> {
    try {
      logger.info('🎵 Analyzing audio for instrumental detection...');

      // Step 1: Extract audio features using ffmpeg
      const features = await this.extractAudioFeatures(filePath);

      // Step 2: Analyze spectral content to detect instruments
      const spectralAnalysis = await this.analyzeSpectrum(filePath);

      // Step 3: Use AI to classify the instrumental
      const aiAnalysis = await this.classifyWithAI(features, spectralAnalysis);

      logger.info('✅ Analysis complete:');
      logger.info('   Has instrumental: ${aiAnalysis.hasInstrumental}');
      if (aiAnalysis.genre) {
        logger.info('   Genre: ${aiAnalysis.genre}');
        logger.info('   Mood: ${aiAnalysis.mood}');
        logger.info('   Instruments: ${aiAnalysis.instruments?.join(', ')}');
      }

      return aiAnalysis;
    } catch (error) {
      logger.error('Audio analysis error', { error: error.message || String(error) });
      return {
        hasInstrumental: false,
        confidence: 0,
      };
    }
  }

  /**
   * Extract basic audio features using ffmpeg
   */
  private async extractAudioFeatures(filePath: string): Promise<AudioFeatures> {
    // Get audio metadata
    const { stdout: metadataOutput } = await execAsync(
      `ffprobe -v error -show_entries format=duration,bit_rate -show_entries stream=sample_rate,channels -of json "${filePath}"`
    );
    const metadata = JSON.parse(metadataOutput);

    // Analyze audio statistics (RMS, peak, dynamic range)
    const { stdout: statsOutput } = await execAsync(
      `ffmpeg -i "${filePath}" -af "astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-" -f null - 2>&1 | grep "Overall.RMS_level\\|Overall.Peak_level\\|Overall.Dynamic_range" || echo ""`
    );

    const parseValue = (output: string, key: string): number => {
      const match = output.match(new RegExp(`${key}\\s*dB:\\s*(-?\\d+\\.\\d+)`));
      return match ? parseFloat(match[1]) : 0;
    };

    return {
      duration: parseFloat(metadata.format.duration),
      sampleRate: parseInt(metadata.streams[0].sample_rate),
      channels: parseInt(metadata.streams[0].channels),
      bitrate: metadata.format.bit_rate || 'unknown',
      bassEnergy: 0, // Will be calculated in spectral analysis
      midEnergy: 0,
      trebleEnergy: 0,
      dynamicRange: parseValue(statsOutput, 'Overall.Dynamic_range'),
      rmsLevel: parseValue(statsOutput, 'Overall.RMS_level'),
      peakLevel: parseValue(statsOutput, 'Overall.Peak_level'),
    };
  }

  /**
   * Analyze frequency spectrum to detect instruments
   */
  private async analyzeSpectrum(filePath: string): Promise<string> {
    try {
      // Extract frequency analysis using ffmpeg spectrum
      // We'll analyze bass (20-250Hz), mid (250-4kHz), treble (4-20kHz)
      const { stdout } = await execAsync(
        `ffmpeg -i "${filePath}" -t 10 -af "highpass=f=20,lowpass=f=250,volumedetect" -f null - 2>&1 | grep "mean_volume\\|max_volume" || echo ""`
      );

      const bassPresence = stdout.includes('mean_volume') ? 'present' : 'absent';

      // Detect rhythmic patterns (indicates drums/percussion)
      const { stdout: beatOutput } = await execAsync(
        `ffmpeg -i "${filePath}" -t 10 -af "silencedetect=noise=-30dB:d=0.1" -f null - 2>&1 | grep "silence_" | wc -l`
      );
      const rhythmicComplexity = parseInt(beatOutput.trim());

      // Analyze stereo width (wider = more instrumentation)
      const { stdout: stereoOutput } = await execAsync(
        `ffmpeg -i "${filePath}" -t 5 -af "astat" -f null - 2>&1 | grep "RMS difference" || echo "mono"`
      );
      const stereoWidth = stereoOutput.includes('difference') ? 'stereo' : 'mono';

      return `Audio characteristics:
- Bass presence: ${bassPresence}
- Rhythmic complexity: ${rhythmicComplexity > 20 ? 'high (drums/percussion likely)' : rhythmicComplexity > 5 ? 'medium' : 'low'}
- Stereo width: ${stereoWidth}
- Duration: ${await this.getDuration(filePath)}s`;
    } catch (error) {
      return 'Unable to perform detailed spectral analysis';
    }
  }

  /**
   * Get audio duration
   */
  private async getDuration(filePath: string): Promise<number> {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
    );
    return parseFloat(stdout.trim());
  }

  /**
   * Use Claude AI to classify the instrumental from analysis
   */
  private async classifyWithAI(
    features: AudioFeatures,
    spectralAnalysis: string
  ): Promise<InstrumentalAnalysis> {
    const prompt = `You are an expert music producer analyzing a voice memo recording. Based on the audio analysis below, determine if there is instrumental backing music, and if so, classify it.

Audio Features:
- Duration: ${features.duration.toFixed(1)}s
- Channels: ${features.channels} (${features.channels > 1 ? 'stereo' : 'mono'})
- Dynamic Range: ${features.dynamicRange.toFixed(1)} dB
- RMS Level: ${features.rmsLevel.toFixed(1)} dB

Spectral Analysis:
${spectralAnalysis}

Based on this data, determine:

1. **Has Instrumental?** (true/false) - Is there backing music, or is it just a cappella vocals?
2. **Confidence** (0-1) - How confident are you?
3. **Genre** - If instrumental present, what genre? (country, pop, rock, hip-hop, R&B, folk, etc.)
4. **Subgenre** - More specific style (e.g., "modern country pop", "classic rock", "trap", etc.)
5. **Instruments** - List likely instruments (guitar, piano, drums, bass, synths, strings, etc.)
6. **Tempo** - slow/medium/fast/variable
7. **BPM** - Estimated beats per minute (60-80 slow, 80-120 medium, 120-180 fast)
8. **Mood** - Emotional vibe (uplifting, melancholic, energetic, chill, aggressive, romantic, etc.)
9. **Energy** - low/medium/high
10. **Vocal Presence** - none/light/heavy (how much of the track is vocals vs instrumental)
11. **Production Quality** - demo/professional/studio
12. **Style Description** - 1-2 sentence description of the instrumental style

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "hasInstrumental": boolean,
  "confidence": number,
  "genre": "string",
  "subgenre": "string",
  "instruments": ["string"],
  "tempo": "slow|medium|fast|variable",
  "bpm": number,
  "mood": "string",
  "energy": "low|medium|high",
  "vocalPresence": "none|light|heavy",
  "productionQuality": "demo|professional|studio",
  "styleDescription": "string"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';

    try {
      const analysis = JSON.parse(responseText);
      return analysis;
    } catch (error) {
      logger.error('Failed to parse AI response', { error: error.message || String(error) });
      return {
        hasInstrumental: false,
        confidence: 0,
      };
    }
  }

  /**
   * Separate instrumental track from vocals (saves both)
   */
  async separateInstrumental(filePath: string, outputDir: string): Promise<{
    vocalsPath: string;
    instrumentalPath: string;
  }> {
    const baseName = path.basename(filePath, path.extname(filePath));
    const vocalsPath = path.join(outputDir, `${baseName}_vocals.m4a`);
    const instrumentalPath = path.join(outputDir, `${baseName}_instrumental.m4a`);

    logger.info('🎸 Separating vocals and instrumental...');

    // Extract vocals (center channel with vocal frequency focus)
    await execAsync(
      `ffmpeg -i "${filePath}" -af "pan=1c|c0=0.5*c0+0.5*c1,highpass=f=80,lowpass=f=12000,afftdn=nf=-25" -c:a aac -b:a 192k "${vocalsPath}" -y`
    );

    // Extract instrumental (subtract center, keep sides)
    await execAsync(
      `ffmpeg -i "${filePath}" -af "pan=stereo|c0=c0-c1|c1=c1-c0,highpass=f=20,lowpass=f=15000" -c:a aac -b:a 192k "${instrumentalPath}" -y`
    );

    logger.info('✅ Separation complete');
    logger.info('   Vocals: ${path.basename(vocalsPath)}');
    logger.info('   Instrumental: ${path.basename(instrumentalPath)}');

    return {
      vocalsPath,
      instrumentalPath,
    };
  }
}

export const audioAnalysisService = new AudioAnalysisService();
