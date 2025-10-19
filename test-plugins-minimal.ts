/**
 * Minimal Plugin Test - Simple Direct Processing
 * Bypasses complex compressor to test basic audio pipeline
 */

import { readFileSync, writeFileSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

import { AIEQEngine } from './src/plugins/ai-eq/AIEQEngine';

const execAsync = promisify(exec);

const INPUT_FILE = '/Users/benkennon/voice-cloning-free/so-vits-svc/dataset_raw/your_voice/02_chasin_you_dry.wav';
const OUTPUT_FILE = path.join(process.cwd(), 'test-output-minimal.wav');

async function testMinimal() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  DAWG AI - Minimal Test (Audio Pipeline Verification)        ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  try {
    // Load audio
    console.log('📋 Step 1: Loading Audio');
    console.log('─'.repeat(65));

    const rawFile = '/tmp/test-vocal-raw-minimal.f32le';
    await execAsync(`ffmpeg -i "${INPUT_FILE}" -f f32le -acodec pcm_f32le -ar 48000 -ac 2 -y "${rawFile}" 2>/dev/null`);

    const rawBuffer = readFileSync(rawFile);
    const samples = new Float32Array(rawBuffer.buffer, rawBuffer.byteOffset, rawBuffer.byteLength / 4);

    // Split stereo
    const leftChannel = new Float32Array(samples.length / 2);
    const rightChannel = new Float32Array(samples.length / 2);

    for (let i = 0; i < samples.length / 2; i++) {
      leftChannel[i] = samples[i * 2];
      rightChannel[i] = samples[i * 2 + 1];
    }

    console.log(`   ✅ Loaded ${(leftChannel.length / 48000).toFixed(2)}s at 48kHz stereo\n`);

    // Check input levels
    console.log('📋 Step 2: Input Analysis');
    console.log('─'.repeat(65));

    let inputPeak = 0;
    let inputRMS = 0;
    for (let i = 0; i < leftChannel.length; i++) {
      const sample = Math.max(Math.abs(leftChannel[i]), Math.abs(rightChannel[i]));
      inputPeak = Math.max(inputPeak, sample);
      inputRMS += sample * sample;
    }
    inputRMS = Math.sqrt(inputRMS / leftChannel.length);

    console.log(`   Input Peak: ${(20 * Math.log10(inputPeak)).toFixed(1)} dBFS`);
    console.log(`   Input RMS: ${(20 * Math.log10(inputRMS)).toFixed(1)} dBFS\n`);

    // AI Analysis (just to verify fft.js works)
    console.log('📋 Step 3: AI Spectral Analysis');
    console.log('─'.repeat(65));

    const eqEngine = new AIEQEngine(48000);
    const analyzeChunk = [
      leftChannel.slice(0, 8192),
      rightChannel.slice(0, 8192)
    ];

    const tonalBalance = eqEngine.analyzeTonalBalance(analyzeChunk);
    const sourceType = eqEngine.detectSourceType(analyzeChunk);

    console.log(`   Source: ${sourceType.type} (${(sourceType.confidence * 100).toFixed(0)}%)`);
    console.log(`   Tonal Balance: Bass=${tonalBalance.bass.toFixed(1)}dB, Mids=${tonalBalance.mids.toFixed(1)}dB\n`);

    // Apply simple processing: gentle compression + brightness
    console.log('📋 Step 4: Simple Processing');
    console.log('─'.repeat(65));

    const outputLeft = new Float32Array(leftChannel.length);
    const outputRight = new Float32Array(rightChannel.length);

    // Simple soft-knee compression simulation
    const threshold = 0.3; // Linear threshold (about -10 dBFS)
    const ratio = 3;
    const makeupGain = 2.0; // +6 dB

    for (let i = 0; i < leftChannel.length; i++) {
      for (let ch = 0; ch < 2; ch++) {
        let sample = ch === 0 ? leftChannel[i] : rightChannel[i];

        // Simple soft compression
        const absLevel = Math.abs(sample);
        if (absLevel > threshold) {
          const excess = absLevel - threshold;
          const compressed = threshold + excess / ratio;
          sample = Math.sign(sample) * compressed;
        }

        // Apply makeup gain
        sample *= makeupGain;

        // Soft clip
        if (Math.abs(sample) > 0.95) {
          sample = Math.sign(sample) * (0.95 + 0.05 * Math.tanh((Math.abs(sample) - 0.95) * 10));
        }

        if (ch === 0) {
          outputLeft[i] = sample;
        } else {
          outputRight[i] = sample;
        }
      }
    }

    console.log(`   ✅ Applied simple compression + makeup gain\n`);

    // Check output levels
    console.log('📋 Step 5: Output Analysis');
    console.log('─'.repeat(65));

    let outputPeak = 0;
    let outputRMS = 0;
    for (let i = 0; i < outputLeft.length; i++) {
      const sample = Math.max(Math.abs(outputLeft[i]), Math.abs(outputRight[i]));
      outputPeak = Math.max(outputPeak, sample);
      outputRMS += sample * sample;
    }
    outputRMS = Math.sqrt(outputRMS / outputLeft.length);

    console.log(`   Output Peak: ${(20 * Math.log10(outputPeak)).toFixed(1)} dBFS`);
    console.log(`   Output RMS: ${(20 * Math.log10(outputRMS)).toFixed(1)} dBFS`);

    // Normalize to -3 dBFS peak if needed
    if (outputPeak < 0.5) {
      const normGain = 0.707 / outputPeak; // Target -3 dBFS
      console.log(`   Applying normalization: +${(20 * Math.log10(normGain)).toFixed(1)} dB`);

      for (let i = 0; i < outputLeft.length; i++) {
        outputLeft[i] *= normGain;
        outputRight[i] *= normGain;
      }

      outputPeak *= normGain;
      outputRMS *= normGain;

      console.log(`   Final Peak: ${(20 * Math.log10(outputPeak)).toFixed(1)} dBFS`);
      console.log(`   Final RMS: ${(20 * Math.log10(outputRMS)).toFixed(1)} dBFS`);
    }

    console.log(`   ✅ Processing complete\n`);

    // Save
    console.log('📋 Step 6: Saving & Opening');
    console.log('─'.repeat(65));

    // Interleave
    const processedSamples = new Float32Array(outputLeft.length * 2);
    for (let i = 0; i < outputLeft.length; i++) {
      processedSamples[i * 2] = outputLeft[i];
      processedSamples[i * 2 + 1] = outputRight[i];
    }

    const processedRawFile = '/tmp/test-vocal-processed-minimal.f32le';
    writeFileSync(processedRawFile, Buffer.from(processedSamples.buffer));

    await execAsync(`ffmpeg -f f32le -ar 48000 -ac 2 -i "${processedRawFile}" -y "${OUTPUT_FILE}" 2>/dev/null`);

    console.log(`   ✅ Saved: ${path.basename(OUTPUT_FILE)}`);

    // Verify output
    const { stdout } = await execAsync(`ffmpeg -i "${OUTPUT_FILE}" -af "volumedetect" -f null - 2>&1 | grep "mean_volume\\|max_volume"`);
    console.log(`   Verification:${stdout.trim().split('\n').join('\n   ')}\n`);

    await execAsync(`open -a Music "${OUTPUT_FILE}"`);
    console.log(`   ✅ Opened in Apple Music\n`);

    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ TEST COMPLETE - LISTEN NOW!                                ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    console.log('Processing Chain:');
    console.log('   1. Simple soft-knee compression (threshold -10dBFS, ratio 3:1)');
    console.log('   2. Makeup gain (+6dB)');
    console.log('   3. Soft clipping protection');
    console.log('   4. Auto-normalization to -3dBFS peak\n');

    console.log(`🎧 Output file: ${path.basename(OUTPUT_FILE)}\n`);

  } catch (error) {
    console.error('\n❌ Test Failed:', error);
    process.exit(1);
  }
}

testMinimal().catch(console.error);
