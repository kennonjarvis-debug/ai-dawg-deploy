/**
 * Fixed Plugin Test with Proper Gain Staging
 */

import { readFileSync, writeFileSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

import { AIEQEngine } from './src/plugins/ai-eq/AIEQEngine';
import { AIVintageCompressor } from './src/audio/ai/compressors/AIVintageCompressor';

const execAsync = promisify(exec);

const INPUT_FILE = '/Users/benkennon/voice-cloning-free/so-vits-svc/dataset_raw/your_voice/02_chasin_you_dry.wav';
const OUTPUT_FILE = path.join(process.cwd(), 'test-output-morgan-wallen-v2.wav');

async function testPluginsFixed() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  DAWG AI - Fixed Plugin Test (Proper Gain Staging)           ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  try {
    // Load audio
    console.log('📋 Step 1: Loading & Analyzing Audio');
    console.log('─'.repeat(65));

    const rawFile = '/tmp/test-vocal-raw.f32le';
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

    console.log(`   ✅ Loaded ${(leftChannel.length / 48000).toFixed(2)}s at 48kHz stereo`);

    // Check input levels
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

    // AI Analysis
    console.log('📋 Step 2: AI Analysis');
    console.log('─'.repeat(65));

    const eqEngine = new AIEQEngine(48000);
    const analyzeChunk = [
      leftChannel.slice(0, 8192),
      rightChannel.slice(0, 8192)
    ];

    const tonalBalance = eqEngine.analyzeTonalBalance(analyzeChunk);
    const sourceType = eqEngine.detectSourceType(analyzeChunk);

    console.log(`   Source: ${sourceType.type} (${(sourceType.confidence * 100).toFixed(0)}%)`);
    console.log(`   Tonal Balance: Bass=${tonalBalance.bass.toFixed(1)}dB, Mids=${tonalBalance.mids.toFixed(1)}dB, Highs=${tonalBalance.presence.toFixed(1)}dB\n`);

    // Process with compressor
    console.log('📋 Step 3: Processing (Morgan Wallen Style)');
    console.log('─'.repeat(65));

    const compressor = new AIVintageCompressor(48000);

    // Gentle settings for vocal
    compressor.setParameter('threshold', -18);  // Higher threshold (less compression)
    compressor.setParameter('ratio', 3);        // Gentler ratio
    compressor.setParameter('attack', 20);
    compressor.setParameter('release', 150);
    compressor.setParameter('makeupGain', 6);   // Add makeup gain
    compressor.setParameter('tubeSaturation', 25);
    compressor.setParameter('color', 40);
    compressor.setParameter('warmth', 30);

    console.log(`   Settings: Threshold=-18dB, Ratio=3:1, Makeup=+6dB`);

    const outputLeft = new Float32Array(leftChannel.length);
    const outputRight = new Float32Array(rightChannel.length);

    // Process in chunks
    const chunkSize = 512;
    let totalGR = 0;
    let grSamples = 0;

    for (let i = 0; i < leftChannel.length; i += chunkSize) {
      const end = Math.min(i + chunkSize, leftChannel.length);
      const len = end - i;

      const inputChunk = [
        leftChannel.slice(i, end),
        rightChannel.slice(i, end)
      ];
      const outputChunk = [
        outputLeft.subarray(i, end),
        outputRight.subarray(i, end)
      ];

      compressor.process(inputChunk, outputChunk);

      const analysis = compressor.getAnalysis();
      if (!isNaN(analysis.gainReduction)) {
        totalGR += analysis.gainReduction;
        grSamples++;
      }
    }

    const avgGR = grSamples > 0 ? totalGR / grSamples : 0;

    // Check output levels
    let outputPeak = 0;
    let outputRMS = 0;
    for (let i = 0; i < outputLeft.length; i++) {
      const sample = Math.max(Math.abs(outputLeft[i]), Math.abs(outputRight[i]));
      outputPeak = Math.max(outputPeak, sample);
      outputRMS += sample * sample;
    }
    outputRMS = Math.sqrt(outputRMS / outputLeft.length);

    console.log(`   Avg Gain Reduction: ${avgGR.toFixed(1)} dB`);
    console.log(`   Output Peak: ${(20 * Math.log10(outputPeak)).toFixed(1)} dBFS`);
    console.log(`   Output RMS: ${(20 * Math.log10(outputRMS)).toFixed(1)} dBFS`);

    // Normalize output if too quiet
    if (outputPeak < 0.5) {
      const normGain = 0.7 / outputPeak;  // Target -3 dBFS peak
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
    console.log('📋 Step 4: Saving & Opening');
    console.log('─'.repeat(65));

    // Interleave
    const processedSamples = new Float32Array(outputLeft.length * 2);
    for (let i = 0; i < outputLeft.length; i++) {
      processedSamples[i * 2] = outputLeft[i];
      processedSamples[i * 2 + 1] = outputRight[i];
    }

    const processedRawFile = '/tmp/test-vocal-processed-v2.f32le';
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
    console.log('   1. AI Spectral Analysis (fft.js)');
    console.log('   2. AI Vintage Compressor (fixed harmonics)');
    console.log('   3. Auto-normalization for proper levels');
    console.log('   4. Morgan Wallen / pop country style\n');

    console.log(`🎧 Output file: ${path.basename(OUTPUT_FILE)}\n`);

  } catch (error) {
    console.error('\n❌ Test Failed:', error);
    process.exit(1);
  }
}

testPluginsFixed().catch(console.error);
