/**
 * Voice Freestyle Integration Example
 *
 * This example demonstrates how to integrate the Voice Freestyle Commander
 * with a complete freestyle recording workflow.
 */

import { voiceFreestyleCommander, FreestyleCommandResult } from '../src/backend/services/voice-freestyle-commands';
import fs from 'fs/promises';
import path from 'path';

// ============================================================================
// Example 1: Simple Voice Command Processing
// ============================================================================

async function exampleSimpleCommand() {
  console.log('\n=== Example 1: Simple Voice Command ===\n');

  // Simulate audio buffer from microphone
  const audioPath = path.join(__dirname, '../test-audio/voice-command.wav');
  const audioBuffer = await fs.readFile(audioPath);

  const userId = 'user-123';
  const projectId = 'project-456';

  // Process voice command
  const result = await voiceFreestyleCommander.processFreestyleVoiceCommand(
    audioBuffer,
    userId,
    undefined, // sessionId (auto-generated)
    projectId
  );

  console.log('Command Result:');
  console.log(`✓ Success: ${result.success}`);
  console.log(`✓ Message: ${result.message}`);
  console.log(`✓ Speech Response: "${result.speechResponse}"`);

  if (result.session) {
    console.log('\nSession Info:');
    console.log(`✓ Session ID: ${result.session.sessionId}`);
    console.log(`✓ Recording Active: ${result.session.recordingActive}`);
    console.log(`✓ Beat Created: ${result.session.beatCreated}`);
    if (result.session.beatUrl) {
      console.log(`✓ Beat URL: ${result.session.beatUrl}`);
    }
  }
}

// ============================================================================
// Example 2: Complete Freestyle Workflow
// ============================================================================

async function exampleCompleteWorkflow() {
  console.log('\n=== Example 2: Complete Freestyle Workflow ===\n');

  const userId = 'user-123';
  const projectId = 'project-456';

  // Step 1: User says "record me freestyle with a trap beat"
  console.log('Step 1: User says "record me freestyle with a trap beat"\n');

  const startIntent = await voiceFreestyleCommander.detectFreestyleIntent(
    'record me freestyle with a trap beat'
  );

  console.log('Detected Intent:');
  console.log(`✓ Action: ${startIntent.action}`);
  console.log(`✓ Beat Style: ${startIntent.parameters.beatStyle}`);
  console.log(`✓ Target BPM: ${startIntent.parameters.targetBPM}`);
  console.log(`✓ Confidence: ${startIntent.confidence}`);

  const startResult = await voiceFreestyleCommander.handleFreestyleCommand(
    startIntent,
    'session-1',
    userId,
    projectId
  );

  console.log('\nSystem Response:');
  console.log(`🗣️  "${startResult.speechResponse}"`);

  // Step 2: Record audio (simulated)
  console.log('\n⏺️  Recording for 30 seconds...');
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate recording

  // Step 3: User says "stop recording"
  console.log('\nStep 3: User says "stop recording"\n');

  const stopIntent = await voiceFreestyleCommander.detectFreestyleIntent('stop recording');
  const stopResult = await voiceFreestyleCommander.handleFreestyleCommand(
    stopIntent,
    'session-1',
    userId,
    projectId
  );

  console.log('System Response:');
  console.log(`🗣️  "${stopResult.speechResponse}"`);

  // Step 4: User says "show me the melody"
  console.log('\nStep 4: User says "show me the melody"\n');

  const melodyIntent = await voiceFreestyleCommander.detectFreestyleIntent('show me the melody');
  const melodyResult = await voiceFreestyleCommander.handleFreestyleCommand(
    melodyIntent,
    'session-1',
    userId,
    projectId
  );

  console.log('System Response:');
  console.log(`🗣️  "${melodyResult.speechResponse}"`);

  // Step 5: User says "enhance the lyrics"
  console.log('\nStep 5: User says "enhance the lyrics"\n');

  const lyricsIntent = await voiceFreestyleCommander.detectFreestyleIntent('enhance the lyrics');
  const lyricsResult = await voiceFreestyleCommander.handleFreestyleCommand(
    lyricsIntent,
    'session-1',
    userId,
    projectId
  );

  console.log('System Response:');
  console.log(`🗣️  "${lyricsResult.speechResponse}"`);
}

// ============================================================================
// Example 3: Beat Creation Variations
// ============================================================================

async function exampleBeatCreationVariations() {
  console.log('\n=== Example 3: Beat Creation Variations ===\n');

  const testCommands = [
    'create a trap beat',
    'make a chill lo-fi beat at 80 BPM',
    'give me a fast drum and bass beat',
    'create a boom bap beat in C minor',
    'make a dark hip-hop beat',
  ];

  for (const command of testCommands) {
    console.log(`\nUser: "${command}"`);

    const intent = await voiceFreestyleCommander.detectFreestyleIntent(command);

    console.log('Detected Parameters:');
    console.log(`  ✓ Beat Style: ${intent.parameters.beatStyle || 'default'}`);
    console.log(`  ✓ BPM: ${intent.parameters.targetBPM || 'auto'}`);
    console.log(`  ✓ Key: ${intent.parameters.targetKey || 'auto'}`);
    console.log(`  ✓ Mood: ${intent.parameters.mood || 'default'}`);

    // Get default BPM for style
    const bpm = intent.parameters.targetBPM || getDefaultBPM(intent.parameters.beatStyle);
    console.log(`  → Actual BPM: ${bpm}`);
  }
}

function getDefaultBPM(style?: string): number {
  const bpmMap: Record<string, number> = {
    trap: 140,
    'hip-hop': 90,
    'lo-fi': 80,
    'drum and bass': 174,
    'boom bap': 90,
  };
  return bpmMap[style?.toLowerCase() || ''] || 120;
}

// ============================================================================
// Example 4: FreestyleOrchestrator Integration Pattern
// ============================================================================

/**
 * Mock FreestyleOrchestrator for demonstration
 */
class FreestyleOrchestrator {
  async startFreestyleSession(config: {
    projectId: string;
    userId: string;
    autoCreateBeat: boolean;
    beatStyle?: string;
    targetBPM?: number;
  }) {
    console.log('🎵 FreestyleOrchestrator: Starting session...');
    console.log(`   Project: ${config.projectId}`);
    console.log(`   Auto-create beat: ${config.autoCreateBeat}`);

    if (config.autoCreateBeat && config.beatStyle) {
      console.log(`   Creating ${config.beatStyle} beat at ${config.targetBPM} BPM...`);
      // In production: await beatService.generateBeat(...)
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate beat creation
    }

    return {
      sessionId: `session-${Date.now()}`,
      beatCreated: config.autoCreateBeat,
    };
  }

  async stopRecording(sessionId: string) {
    console.log(`⏹️  FreestyleOrchestrator: Stopping recording for ${sessionId}`);
    // In production: process audio, extract melody, transcribe lyrics
    return {
      transcription: 'Sample lyrics from recording...',
      melodyNotes: ['C4', 'D4', 'E4', 'G4'],
      duration: 30,
    };
  }

  async extractMelody(sessionId: string) {
    console.log(`🎼 FreestyleOrchestrator: Extracting melody for ${sessionId}`);
    // In production: use basic-pitch or crepe for melody extraction
    return {
      notes: ['C4', 'D4', 'E4', 'G4', 'A4', 'C5'],
      key: 'Am',
      midiData: new Uint8Array([/* MIDI bytes */]),
    };
  }

  async enhanceLyrics(sessionId: string, lyrics: string, mood?: string) {
    console.log(`✨ FreestyleOrchestrator: Enhancing lyrics for ${sessionId}`);
    // In production: use GPT-4 to enhance lyrics
    return {
      enhancedLyrics: 'Enhanced version of the lyrics...',
      lineCount: 8,
    };
  }
}

async function exampleOrchestratorIntegration() {
  console.log('\n=== Example 4: FreestyleOrchestrator Integration ===\n');

  const orchestrator = new FreestyleOrchestrator();
  const userId = 'user-123';
  const projectId = 'project-456';

  // User command: "record me freestyle with a trap beat"
  const intent = await voiceFreestyleCommander.detectFreestyleIntent(
    'record me freestyle with a trap beat'
  );

  console.log('Processing command with orchestrator...\n');

  // Start session with orchestrator
  const session = await orchestrator.startFreestyleSession({
    projectId,
    userId,
    autoCreateBeat: true,
    beatStyle: intent.parameters.beatStyle,
    targetBPM: intent.parameters.targetBPM,
  });

  console.log(`✓ Session started: ${session.sessionId}`);

  // Simulate recording
  console.log('\n⏺️  Recording...');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Stop and process
  const recordingResult = await orchestrator.stopRecording(session.sessionId);
  console.log('\n✓ Recording processed:');
  console.log(`   Transcription: "${recordingResult.transcription}"`);
  console.log(`   Melody notes: ${recordingResult.melodyNotes.join(', ')}`);

  // Extract melody
  const melody = await orchestrator.extractMelody(session.sessionId);
  console.log('\n✓ Melody extracted:');
  console.log(`   Notes: ${melody.notes.join(', ')}`);
  console.log(`   Key: ${melody.key}`);

  // Enhance lyrics
  const enhanced = await orchestrator.enhanceLyrics(
    session.sessionId,
    recordingResult.transcription,
    'energetic'
  );
  console.log('\n✓ Lyrics enhanced:');
  console.log(`   Lines: ${enhanced.lineCount}`);
}

// ============================================================================
// Example 5: Error Handling
// ============================================================================

async function exampleErrorHandling() {
  console.log('\n=== Example 5: Error Handling ===\n');

  // Try to stop recording when none is active
  console.log('Test 1: Stop recording with no active session\n');

  const stopIntent = await voiceFreestyleCommander.detectFreestyleIntent('stop recording');
  const result = await voiceFreestyleCommander.handleFreestyleCommand(
    stopIntent,
    'nonexistent-session',
    'user-123'
  );

  console.log(`Success: ${result.success}`);
  console.log(`Message: "${result.message}"`);
  console.log(`Response: "${result.speechResponse}"`);

  // Try to start recording when already recording
  console.log('\n\nTest 2: Start recording while already recording\n');

  // First, start a recording
  const startIntent1 = await voiceFreestyleCommander.detectFreestyleIntent('record me');
  await voiceFreestyleCommander.handleFreestyleCommand(
    startIntent1,
    'session-2',
    'user-123'
  );

  // Try to start again
  const startIntent2 = await voiceFreestyleCommander.detectFreestyleIntent('record me');
  const result2 = await voiceFreestyleCommander.handleFreestyleCommand(
    startIntent2,
    'session-2',
    'user-123'
  );

  console.log(`Success: ${result2.success}`);
  console.log(`Message: "${result2.message}"`);
  console.log(`Response: "${result2.speechResponse}"`);
}

// ============================================================================
// Run Examples
// ============================================================================

async function main() {
  try {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   DAWG AI - Voice Freestyle Commander Examples            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    // Uncomment the examples you want to run:

    // await exampleSimpleCommand();
    await exampleCompleteWorkflow();
    // await exampleBeatCreationVariations();
    await exampleOrchestratorIntegration();
    await exampleErrorHandling();

    console.log('\n✅ All examples completed!\n');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export {
  exampleSimpleCommand,
  exampleCompleteWorkflow,
  exampleBeatCreationVariations,
  exampleOrchestratorIntegration,
  exampleErrorHandling,
};
