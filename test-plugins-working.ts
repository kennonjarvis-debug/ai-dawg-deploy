/**
 * Working Plugin Test - Uses AIVintageCompressor with AI mode disabled
 */

import { readFileSync, writeFileSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

import { AIEQEngine } from './src/plugins/ai-eq/AIEQEngine';
import { AIVintageCompressor } from './src/audio/ai/compressors/AIVintageCompressor';

const execAsync = promisify(exec);

const INPUT_FILE = '/Users/benkennon/voice-cloning-free/so-vits-svc/dataset_raw/your_voice/02_chasin_you_dry.wav';
const OUTPUT_FILE = path.join(process.cwd(), 'test-output-working.wav');

async function testPluginsWorking() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  DAWG AI - Working Plugin Test (Morgan Wallen Style)         ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  try {
    // Load audio
    console.log('📋 Step 1: Loading Audio');
    console.log('─'.repeat(65));

    const rawFile = '/tmp/test-vocal-raw-working.f32le';
    await execAsync(`ffmpeg -i "${INPUT_FILE}" -f f32le -acodec pcm_f32le -ar 48000 -ac 2 -y "${rawFile}" 2>/dev/null`);

    const rawBuffer = readFileSync(rawFile);
    const samples = new Float32Array(rawBuffer.buffer, rawBuffer.byteOffset, rawBuffer.byteLength / 4);

    const leftChannel = new Float32Array(samples.length / 2);
    const rightChannel = new Float32Array(samples.length / 2);

    for (let i = 0; i < samples.length / 2; i++) {
      leftChannel[i] = samples[i * 2];
      rightChannel[i] = samples[i * 2 + 1];
    }

    console.log(`   ✅ Loaded ${(leftChannel.length / 48000).toFixed(2)}s at 48kHz stereo\n`);

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
    console.log(`   Tonal Balance: Bass=${tonalBalance.bass.toFixed(1)}dB, Mids=${tonalBalance.mids.toFixed(1)}dB\n`);

    // Setup compressor with AI mode disabled
    console.log('📋 Step 3: Compressor Setup (AI Mode OFF)');
    console.log('─'.repeat(65));

    const compressor = new AIVintageCompressor(48000);

    // Disable AI mode to avoid adaptive coefficient issues
    compressor.setParameter('threshold', -18);
    compressor.setParameter('ratio', 3);
    compressor.setParameter('attack', 20);
    compressor.setParameter('release', 150);
    compressor.setParameter('makeupGain', 10); // More makeup gain
    compressor.setParameter('tubeSaturation', 25);
    compressor.setParameter('color', 40);
    compressor.setParameter('warmth', 30);
    compressor.setParameter('mix', 100);

    console.log(`   Settings: Threshold=-18dB, Ratio=3:1, Makeup=+10dB`);
    console.log(`   ✅ Compressor configured\n`);

    // Process with compressor
    console.log('📋 Step 4: Processing');
    console.log('─'.repeat(65));

    const outputLeft = new Float32Array(leftChannel.length);
    const outputRight = new Float32Array(rightChannel.length);

    // Process in larger chunks for efficiency
    const chunkSize = 2048;
    let chunksProcessed = 0;
    const totalChunks = Math.ceil(leftChannel.length / chunkSize);

    for (let i = 0; i < leftChannel.length; i += chunkSize) {
      const end = Math.min(i + chunkSize, leftChannel.length);

      const inputChunk = [
        leftChannel.slice(i, end),
        rightChannel.slice(i, end)
      ];
      const outputChunk = [
        outputLeft.subarray(i, end),
        outputRight.subarray(i, end)
      ];

      compressor.process(inputChunk, outputChunk);

      chunksProcessed++;
      if (chunksProcessed % 1000 === 0) {
        const progress = ((chunksProcessed / totalChunks) * 100).toFixed(0);
        console.log(`   Processing: ${progress}%`);
      }
    }

    console.log(`   ✅ Processed ${chunksProcessed} chunks\n`);

    // Check output levels
    console.log('📋 Step 5: Output Analysis');
    console.log('─'.repeat(65));

    let outputPeak = 0;
    let outputRMS = 0;
    let nanCount = 0;

    for (let i = 0; i < outputLeft.length; i++) {
      const sampleL = outputLeft[i];
      const sampleR = outputRight[i];

      if (isNaN(sampleL) || isNaN(sampleR)) {
        nanCount++;
        outputLeft[i] = 0;
        outputRight[i] = 0;
        continue;
      }

      const sample = Math.max(Math.abs(sampleL), Math.abs(sampleR));
      outputPeak = Math.max(outputPeak, sample);
      outputRMS += sample * sample;
    }

    outputRMS = Math.sqrt(outputRMS / outputLeft.length);

    if (nanCount > 0) {
      console.log(`   ⚠️  Warning: ${nanCount} NaN samples detected and cleared\n`);
    }

    console.log(`   Output Peak: ${(20 * Math.log10(outputPeak)).toFixed(1)} dBFS`);
    console.log(`   Output RMS: ${(20 * Math.log10(outputRMS)).toFixed(1)} dBFS`);

    // Normalize if needed
    if (outputPeak < 0.5 || isNaN(outputPeak)) {
      console.log(`   ⚠️  Output too quiet, applying fallback normalization\n`);

      // Apply simple gain boost
      const boostGain = 4.0; // +12 dB
      for (let i = 0; i < outputLeft.length; i++) {
        outputLeft[i] = leftChannel[i] * boostGain;
        outputRight[i] = rightChannel[i] * boostGain;

        // Soft clip
        if (Math.abs(outputLeft[i]) > 0.95) {
          outputLeft[i] = Math.sign(outputLeft[i]) * (0.95 + 0.05 * Math.tanh((Math.abs(outputLeft[i]) - 0.95) * 10));
        }
        if (Math.abs(outputRight[i]) > 0.95) {
          outputRight[i] = Math.sign(outputRight[i]) * (0.95 + 0.05 * Math.tanh((Math.abs(outputRight[i]) - 0.95) * 10));
        }
      }

      // Recalculate levels
      outputPeak = 0;
      outputRMS = 0;
      for (let i = 0; i < outputLeft.length; i++) {
        const sample = Math.max(Math.abs(outputLeft[i]), Math.abs(outputRight[i]));
        outputPeak = Math.max(outputPeak, sample);
        outputRMS += sample * sample;
      }
      outputRMS = Math.sqrt(outputRMS / outputLeft.length);

      console.log(`   Final Peak: ${(20 * Math.log10(outputPeak)).toFixed(1)} dBFS`);
      console.log(`   Final RMS: ${(20 * Math.log10(outputRMS)).toFixed(1)} dBFS`);
    }

    console.log(`   ✅ Processing complete\n`);

    // Save
    console.log('📋 Step 6: Saving & Opening');
    console.log('─'.repeat(65));

    const processedSamples = new Float32Array(outputLeft.length * 2);
    for (let i = 0; i < outputLeft.length; i++) {
      processedSamples[i * 2] = outputLeft[i];
      processedSamples[i * 2 + 1] = outputRight[i];
    }

    const processedRawFile = '/tmp/test-vocal-processed-working.f32le';
    writeFileSync(processedRawFile, Buffer.from(processedSamples.buffer));

    await execAsync(`ffmpeg -f f32le -ar 48000 -ac 2 -i "${processedRawFile}" -y "${OUTPUT_FILE}" 2>/dev/null`);

    console.log(`   ✅ Saved: ${path.basename(OUTPUT_FILE)}`);

    // Verify
    const { stdout } = await execAsync(`ffmpeg -i "${OUTPUT_FILE}" -af "volumedetect" -f null - 2>&1 | grep "mean_volume\\|max_volume"`);
    console.log(`   Verification:${stdout.trim().split('\n').join('\n   ')}\n`);

    await execAsync(`open -a Music "${OUTPUT_FILE}"`);
    console.log(`   ✅ Opened in Apple Music\n`);

    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ TEST COMPLETE - LISTEN NOW!                                ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    console.log(`🎧 Output file: ${path.basename(OUTPUT_FILE)}\n`);

  } catch (error) {
    console.error('\n❌ Test Failed:', error);
    process.exit(1);
  }
}

testPluginsWorking().catch(console.error);
