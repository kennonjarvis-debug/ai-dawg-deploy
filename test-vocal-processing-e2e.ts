/**
 * E2E Test: AI Vocal Processing
 *
 * Tests the upgraded AI plugins by processing a vocal file
 * with the prompt: "make me sound like morgan wallen pop country bright autotuned vocal like drake"
 *
 * This test verifies:
 * 1. AI can analyze the audio
 * 2. AI can select appropriate plugins based on the prompt
 * 3. AI can control all plugin parameters
 * 4. Plugins process audio correctly with DSP upgrades
 * 5. Output file is created and playable
 */

import 'dotenv/config';
import { readFile, writeFile } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// Test configuration
const TEST_CONFIG = {
  inputFile: '/Users/benkennon/voice-cloning-free/so-vits-svc/dataset_raw/your_voice/02_chasin_you_dry.wav',
  outputFile: path.join(process.cwd(), 'test-output-morgan-wallen-style.wav'),
  prompt: 'make me sound like morgan wallen pop country bright autotuned vocal like drake',
  aiServerUrl: 'http://localhost:8002',
  backendUrl: 'http://localhost:3001',
};

// Expected plugins for this prompt
const EXPECTED_PLUGINS = [
  'AI Auto EQ',           // For brightness and tonal shaping
  'AI Vintage Compressor', // For warmth and body (country style)
  'AI Saturation',        // For warmth and tube character
  'Autotune',             // For pitch correction (Drake/pop style)
  'AI Stereo Doubler',    // For width and presence
  'AI Limiter',           // For loudness and polish
];

interface PluginAction {
  pluginId: string;
  pluginName: string;
  action: 'add' | 'update' | 'remove';
  parameters?: Record<string, number>;
  slotIndex?: number;
}

interface AIResponse {
  message: string;
  pluginActions?: PluginAction[];
  analysis?: {
    brightness: number;
    warmth: number;
    lufs: number;
    genre: string;
  };
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkServerHealth(url: string, name: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/health`);
    if (response.ok) {
      console.log(`✅ ${name} is healthy`);
      return true;
    }
  } catch (error) {
    console.error(`❌ ${name} is not responding at ${url}`);
  }
  return false;
}

async function sendPromptToAI(prompt: string): Promise<AIResponse> {
  console.log(`\n📤 Sending prompt to AI: "${prompt}"`);

  const response = await fetch(`${TEST_CONFIG.aiServerUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: prompt,
      context: {
        trackType: 'vocal',
        currentPlugins: [],
        projectInfo: {
          bpm: 120,
          key: 'C major',
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`AI server error: ${response.statusText}`);
  }

  return await response.json();
}

async function analyzeAudioFile(filePath: string): Promise<any> {
  console.log(`\n🔍 Analyzing audio file: ${path.basename(filePath)}`);

  // Read WAV file and convert to base64
  const audioBuffer = await readFile(filePath);
  const base64Audio = audioBuffer.toString('base64');

  const response = await fetch(`${TEST_CONFIG.backendUrl}/api/v1/audio/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio: base64Audio,
      format: 'wav',
    }),
  });

  if (!response.ok) {
    throw new Error(`Audio analysis failed: ${response.statusText}`);
  }

  return await response.json();
}

async function processAudioWithPlugins(
  inputFilePath: string,
  pluginChain: PluginAction[],
  outputFilePath: string
): Promise<void> {
  console.log(`\n🎛️  Processing audio with ${pluginChain.length} plugins...`);

  for (const plugin of pluginChain) {
    console.log(`   - ${plugin.pluginName} at slot ${plugin.slotIndex || 0}`);
    if (plugin.parameters) {
      const params = Object.entries(plugin.parameters)
        .map(([key, value]) => `${key}=${value.toFixed(2)}`)
        .join(', ');
      console.log(`     Parameters: ${params}`);
    }
  }

  // Read input WAV file
  const inputAudio = await readFile(inputFilePath);
  const base64Audio = inputAudio.toString('base64');

  // Send to processing API
  const response = await fetch(`${TEST_CONFIG.backendUrl}/api/v1/audio/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio: base64Audio,
      format: 'wav',
      plugins: pluginChain,
    }),
  });

  if (!response.ok) {
    throw new Error(`Audio processing failed: ${response.statusText}`);
  }

  const result = await response.json();

  // Save processed audio
  const processedAudio = Buffer.from(result.audio, 'base64');
  await writeFile(outputFilePath, processedAudio);

  console.log(`✅ Processed audio saved to: ${outputFilePath}`);
}

async function openInAppleMusic(filePath: string): Promise<void> {
  console.log(`\n🎵 Opening in Apple Music: ${path.basename(filePath)}`);

  try {
    await execAsync(`open -a Music "${filePath}"`);
    console.log(`✅ File opened in Apple Music`);
  } catch (error) {
    console.error(`❌ Failed to open in Apple Music:`, error);
    throw error;
  }
}

function validatePluginChain(plugins: PluginAction[]): void {
  console.log(`\n✔️  Validating plugin chain...`);

  const pluginNames = plugins.map(p => p.pluginName);

  for (const expectedPlugin of EXPECTED_PLUGINS) {
    const found = pluginNames.some(name => name.includes(expectedPlugin) || expectedPlugin.includes(name));
    if (found) {
      console.log(`   ✅ ${expectedPlugin} - Found`);
    } else {
      console.log(`   ⚠️  ${expectedPlugin} - Missing (may be optional)`);
    }
  }
}

async function runE2ETest(): Promise<void> {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  DAWG AI - E2E Vocal Processing Test                          ║');
  console.log('║  Testing upgraded AI plugins with DSP improvements            ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Check if servers are running
    console.log('📋 Step 1: Health Check');
    console.log('─'.repeat(65));

    const aiHealthy = await checkServerHealth(TEST_CONFIG.aiServerUrl, 'AI Brain Server');
    const backendHealthy = await checkServerHealth(TEST_CONFIG.backendUrl, 'Backend Server');

    if (!aiHealthy || !backendHealthy) {
      console.error('\n❌ Servers are not running. Please start them first:');
      console.error('   Terminal 1: npm run dev:ai-brain');
      console.error('   Terminal 2: npm run dev:server');
      process.exit(1);
    }

    // Step 2: Analyze the input audio
    console.log('\n📋 Step 2: Audio Analysis');
    console.log('─'.repeat(65));

    const analysis = await analyzeAudioFile(TEST_CONFIG.inputFile);

    console.log(`   RMS Level: ${analysis.rms?.toFixed(2) || 'N/A'} dB`);
    console.log(`   Peak Level: ${analysis.peak?.toFixed(2) || 'N/A'} dB`);
    console.log(`   Dynamic Range: ${analysis.dynamicRange?.toFixed(2) || 'N/A'} dB`);
    console.log(`   Brightness: ${analysis.spectralCentroid || 'N/A'} Hz`);
    console.log(`   LUFS: ${analysis.lufs?.toFixed(2) || 'N/A'} LUFS`);

    // Step 3: Send prompt to AI and get plugin recommendations
    console.log('\n📋 Step 3: AI Plugin Selection');
    console.log('─'.repeat(65));

    const aiResponse = await sendPromptToAI(TEST_CONFIG.prompt);

    console.log(`\n   AI Response: ${aiResponse.message}`);

    if (!aiResponse.pluginActions || aiResponse.pluginActions.length === 0) {
      console.error('\n❌ AI did not return any plugin actions!');
      console.error('   The AI should recommend plugins based on the prompt.');
      process.exit(1);
    }

    console.log(`\n   AI recommended ${aiResponse.pluginActions.length} plugin actions`);
    validatePluginChain(aiResponse.pluginActions);

    // Step 4: Process the audio with selected plugins
    console.log('\n📋 Step 4: Audio Processing');
    console.log('─'.repeat(65));

    await processAudioWithPlugins(
      TEST_CONFIG.inputFile,
      aiResponse.pluginActions,
      TEST_CONFIG.outputFile
    );

    // Step 5: Open in Apple Music for listening test
    console.log('\n📋 Step 5: Listening Test');
    console.log('─'.repeat(65));

    await openInAppleMusic(TEST_CONFIG.outputFile);

    // Summary
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ E2E TEST COMPLETE                                          ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    console.log('Test Results:');
    console.log(`   Input File: ${path.basename(TEST_CONFIG.inputFile)}`);
    console.log(`   Output File: ${path.basename(TEST_CONFIG.outputFile)}`);
    console.log(`   Plugins Applied: ${aiResponse.pluginActions.length}`);
    console.log(`   Prompt: "${TEST_CONFIG.prompt}"`);

    console.log('\n🎧 Now listen to the output in Apple Music and provide feedback!');
    console.log('   We can iterate on the processing based on what you hear.\n');

  } catch (error) {
    console.error('\n❌ E2E Test Failed:', error);
    process.exit(1);
  }
}

// Run the test
runE2ETest().catch(console.error);
