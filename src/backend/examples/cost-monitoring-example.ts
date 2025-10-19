/**
 * Cost Monitoring System - Usage Examples
 *
 * This file demonstrates how to use the cost monitoring system
 * to track OpenAI API usage and costs in the AI DAW.
 */

import { createCostTrackedClient } from '../middleware/cost-tracking-middleware';
import {
  calculateWhisperCost,
  calculateGPT4oCost,
  calculateTTSCost,
  calculateRealtimeAPICost
} from '../services/cost-monitoring-service';

/**
 * Example 1: Using the CostTrackedOpenAI client
 *
 * The CostTrackedOpenAI wrapper automatically logs usage and costs
 * for all OpenAI API calls.
 */
async function exampleAutomaticTracking() {
  const userId = 'user-123';

  // Create a cost-tracked OpenAI client
  const openai = createCostTrackedClient(userId);

  // 1. Whisper Transcription - Automatically tracked
  console.log('Example 1: Whisper Transcription');
  const audioFile = new File(['...'], 'audio.mp3');

  try {
    const transcription = await openai.transcribeAudio(audioFile);
    console.log('Transcription:', transcription);
    // Cost is automatically logged to database
  } catch (error) {
    console.error('Transcription failed:', error);
  }

  // 2. GPT-4o Chat Completion - Automatically tracked
  console.log('\nExample 2: GPT-4o Chat');
  try {
    const response = await openai.createChatCompletion([
      { role: 'user', content: 'Write a catchy hook for a hip-hop song about success' }
    ]);
    console.log('Response:', response.choices[0]?.message?.content);
    // Token usage and cost automatically logged
  } catch (error) {
    console.error('Chat failed:', error);
  }

  // 3. TTS Synthesis - Automatically tracked
  console.log('\nExample 3: TTS Synthesis');
  try {
    const audio = await openai.synthesizeSpeech('Hello, this is a test of the text-to-speech system.');
    console.log('Audio generated');
    // Character count and cost automatically logged
  } catch (error) {
    console.error('TTS failed:', error);
  }

  // 4. Realtime API Session - Manual tracking
  console.log('\nExample 4: Realtime API Session');
  const sessionId = 'session-' + Date.now();

  // Start tracking session
  openai.startRealtimeSession(sessionId);

  // Track token usage during conversation
  await openai.trackRealtimeTokens(sessionId, 100, 150);

  // Track audio input (2.5 minutes)
  await openai.trackRealtimeAudioInput(sessionId, 2.5);

  // Track audio output (3.0 minutes)
  await openai.trackRealtimeAudioOutput(sessionId, 3.0);

  // End session and get total metrics
  const sessionMetrics = openai.endRealtimeSession(sessionId);
  console.log('Session metrics:', sessionMetrics);
}

/**
 * Example 2: Manual Cost Calculations
 *
 * Calculate costs without making API calls
 */
function exampleCostCalculations() {
  console.log('\n=== Cost Calculations ===\n');

  // 1. Whisper transcription cost
  const audioMinutes = 5.5;
  const whisperCost = calculateWhisperCost(audioMinutes);
  console.log('Whisper Cost:');
  console.log(whisperCost.breakdown);
  console.log(`Total: $${whisperCost.totalCost.toFixed(6)}\n`);

  // 2. GPT-4o chat cost
  const inputTokens = 1500;
  const outputTokens = 2000;
  const gpt4oCost = calculateGPT4oCost(inputTokens, outputTokens);
  console.log('GPT-4o Cost:');
  console.log(gpt4oCost.breakdown);
  console.log(`Total: $${gpt4oCost.totalCost.toFixed(6)}\n`);

  // 3. TTS synthesis cost
  const characters = 5000;
  const ttsCost = calculateTTSCost(characters);
  console.log('TTS Cost:');
  console.log(ttsCost.breakdown);
  console.log(`Total: $${ttsCost.totalCost.toFixed(6)}\n`);

  // 4. Realtime API cost (comprehensive)
  const realtimeCost = calculateRealtimeAPICost(
    10000,  // input tokens
    15000,  // output tokens
    5.5,    // audio input minutes
    7.2     // audio output minutes
  );
  console.log('Realtime API Cost:');
  console.log(realtimeCost.breakdown);
  console.log(`Total: $${realtimeCost.totalCost.toFixed(6)}\n`);
}

/**
 * Example 3: Typical AI DAW Session
 *
 * Simulate a complete music production session with cost tracking
 */
async function exampleProductionSession() {
  console.log('\n=== Typical AI DAW Session ===\n');

  const userId = 'producer-456';
  const openai = createCostTrackedClient(userId);

  let totalSessionCost = 0;

  // Step 1: Chat with AI to brainstorm song ideas
  console.log('Step 1: Brainstorming with GPT-4o');
  const brainstormCost = calculateGPT4oCost(500, 800);
  console.log(`Cost: $${brainstormCost.totalCost.toFixed(6)}`);
  totalSessionCost += brainstormCost.totalCost;

  // Step 2: Record and transcribe vocals (3 takes, 2 minutes each)
  console.log('\nStep 2: Recording and transcribing vocals');
  const transcriptionCost = calculateWhisperCost(6.0); // 3 takes × 2 min
  console.log(`Cost: $${transcriptionCost.totalCost.toFixed(6)}`);
  totalSessionCost += transcriptionCost.totalCost;

  // Step 3: Generate reference vocals with TTS (testing different deliveries)
  console.log('\nStep 3: Generating reference vocals');
  const ttsCharacters = 2000; // ~500 words
  const ttsCost = calculateTTSCost(ttsCharacters);
  console.log(`Cost: $${ttsCost.totalCost.toFixed(6)}`);
  totalSessionCost += ttsCost.totalCost;

  // Step 4: Real-time vocal coaching session (10 minutes)
  console.log('\nStep 4: Real-time vocal coaching');
  const coachingCost = calculateRealtimeAPICost(
    5000,  // input tokens (coaching instructions)
    8000,  // output tokens (feedback)
    10.0,  // audio input (listening to vocals)
    10.0   // audio output (verbal feedback)
  );
  console.log(`Cost: $${coachingCost.totalCost.toFixed(6)}`);
  totalSessionCost += coachingCost.totalCost;

  // Step 5: Final analysis and mixing suggestions
  console.log('\nStep 5: Mixing suggestions');
  const mixingCost = calculateGPT4oCost(1200, 1500);
  console.log(`Cost: $${mixingCost.totalCost.toFixed(6)}`);
  totalSessionCost += mixingCost.totalCost;

  console.log('\n' + '='.repeat(50));
  console.log(`TOTAL SESSION COST: $${totalSessionCost.toFixed(6)}`);
  console.log('='.repeat(50) + '\n');
}

/**
 * Example 4: Budget Scenarios
 *
 * Compare costs under different usage scenarios
 */
function exampleBudgetScenarios() {
  console.log('\n=== Budget Scenarios ===\n');

  // Scenario 1: Casual User (5 sessions/month)
  console.log('Scenario 1: Casual User (5 sessions/month)');
  const casualCost = {
    whisper: calculateWhisperCost(10).totalCost,  // 10 min audio
    gpt4o: calculateGPT4oCost(2500, 3000).totalCost,
    tts: calculateTTSCost(1000).totalCost,
    realtime: calculateRealtimeAPICost(2000, 3000, 5, 5).totalCost,
  };
  const casualTotal = Object.values(casualCost).reduce((a, b) => a + b, 0);
  console.log(`  Whisper: $${casualCost.whisper.toFixed(4)}`);
  console.log(`  GPT-4o:  $${casualCost.gpt4o.toFixed(4)}`);
  console.log(`  TTS:     $${casualCost.tts.toFixed(4)}`);
  console.log(`  Realtime: $${casualCost.realtime.toFixed(4)}`);
  console.log(`  Per Session: $${casualTotal.toFixed(4)}`);
  console.log(`  Monthly (5 sessions): $${(casualTotal * 5).toFixed(2)}\n`);

  // Scenario 2: Active Producer (20 sessions/month)
  console.log('Scenario 2: Active Producer (20 sessions/month)');
  const activeCost = {
    whisper: calculateWhisperCost(30).totalCost,  // 30 min audio
    gpt4o: calculateGPT4oCost(5000, 6000).totalCost,
    tts: calculateTTSCost(3000).totalCost,
    realtime: calculateRealtimeAPICost(8000, 10000, 15, 15).totalCost,
  };
  const activeTotal = Object.values(activeCost).reduce((a, b) => a + b, 0);
  console.log(`  Whisper: $${activeCost.whisper.toFixed(4)}`);
  console.log(`  GPT-4o:  $${activeCost.gpt4o.toFixed(4)}`);
  console.log(`  TTS:     $${activeCost.tts.toFixed(4)}`);
  console.log(`  Realtime: $${activeCost.realtime.toFixed(4)}`);
  console.log(`  Per Session: $${activeTotal.toFixed(4)}`);
  console.log(`  Monthly (20 sessions): $${(activeTotal * 20).toFixed(2)}\n`);

  // Scenario 3: Professional Studio (100 sessions/month)
  console.log('Scenario 3: Professional Studio (100 sessions/month)');
  const proCost = {
    whisper: calculateWhisperCost(60).totalCost,  // 1 hour audio
    gpt4o: calculateGPT4oCost(10000, 12000).totalCost,
    tts: calculateTTSCost(5000).totalCost,
    realtime: calculateRealtimeAPICost(15000, 20000, 30, 30).totalCost,
  };
  const proTotal = Object.values(proCost).reduce((a, b) => a + b, 0);
  console.log(`  Whisper: $${proCost.whisper.toFixed(4)}`);
  console.log(`  GPT-4o:  $${proCost.gpt4o.toFixed(4)}`);
  console.log(`  TTS:     $${proCost.tts.toFixed(4)}`);
  console.log(`  Realtime: $${proCost.realtime.toFixed(4)}`);
  console.log(`  Per Session: $${proTotal.toFixed(4)}`);
  console.log(`  Monthly (100 sessions): $${(proTotal * 100).toFixed(2)}\n`);

  // Budget Recommendations
  console.log('=== Recommended Budget Limits ===');
  console.log(`Casual User:       $${((casualTotal * 5) * 1.2).toFixed(2)}/month (20% buffer)`);
  console.log(`Active Producer:   $${((activeTotal * 20) * 1.2).toFixed(2)}/month (20% buffer)`);
  console.log(`Professional:      $${((proTotal * 100) * 1.2).toFixed(2)}/month (20% buffer)`);
  console.log();
}

/**
 * Main function to run all examples
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         OpenAI API Cost Monitoring - Usage Examples           ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Run cost calculation examples
  exampleCostCalculations();

  // Run production session example
  await exampleProductionSession();

  // Run budget scenario examples
  exampleBudgetScenarios();

  console.log('═'.repeat(64));
  console.log('For more information, visit the cost monitoring dashboard!');
  console.log('═'.repeat(64));
}

// Run examples if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  exampleAutomaticTracking,
  exampleCostCalculations,
  exampleProductionSession,
  exampleBudgetScenarios,
};
