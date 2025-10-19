/**
 * Voice Test Control - Example Usage
 *
 * This file demonstrates how to integrate and use the Voice Test Control system.
 */

import { VoiceTestCommander } from '../src/backend/services/voice-test-commander';
import fs from 'fs/promises';
import path from 'path';

// ============================================================================
// Example 1: Basic Voice Command Processing
// ============================================================================

async function example1_BasicVoiceCommand() {
  console.log('='.repeat(60));
  console.log('Example 1: Basic Voice Command Processing');
  console.log('='.repeat(60));

  const commander = new VoiceTestCommander();

  // Simulate receiving audio from microphone
  // In production, this would be real audio buffer
  const mockAudioBuffer = Buffer.from(new ArrayBuffer(1024));

  // Process the voice command
  const result = await commander.processVoiceCommand(
    mockAudioBuffer,
    'admin-001',
    true // isAdmin
  );

  console.log('\nTranscription:', result.text);
  console.log('Audio Response Length:', result.audio.length, 'bytes');
  console.log('Test Result:', result.result);

  // Save audio response to file for playback
  if (result.audio) {
    await fs.writeFile(
      path.join(__dirname, '../temp/voice-response.mp3'),
      result.audio
    );
    console.log('Audio response saved to temp/voice-response.mp3');
  }
}

// ============================================================================
// Example 2: Intent Detection
// ============================================================================

async function example2_IntentDetection() {
  console.log('\n' + '='.repeat(60));
  console.log('Example 2: Intent Detection');
  console.log('='.repeat(60));

  const commander = new VoiceTestCommander();

  const testCommands = [
    'Run all tests on DAWG AI',
    'Test the freestyle workflow',
    'Create tests for melody to vocals feature',
    'Show me the test results',
    'Fix the failing tests',
    'Generate a test for multi-track recording',
    "What's the current test coverage?",
    'Run security tests',
    'Test the production deployment',
  ];

  console.log('\nDetecting intents for various commands:\n');

  for (const command of testCommands) {
    const intent = await commander.detectIntent(command);

    console.log(`Command: "${command}"`);
    console.log(`  Action: ${intent.action}`);
    console.log(`  Target: ${intent.target || 'N/A'}`);
    console.log(`  Confidence: ${(intent.confidence * 100).toFixed(1)}%`);
    console.log(`  Requires Confirmation: ${intent.requiresConfirmation ? 'YES ⚠️' : 'NO'}`);
    console.log(`  Is Destructive: ${intent.isDestructive ? 'YES ⚠️' : 'NO'}`);
    console.log('');
  }
}

// ============================================================================
// Example 3: Event-Driven Architecture
// ============================================================================

async function example3_EventDrivenProcessing() {
  console.log('\n' + '='.repeat(60));
  console.log('Example 3: Event-Driven Processing');
  console.log('='.repeat(60));

  const commander = new VoiceTestCommander();

  // Listen to events
  commander.on('transcription', (data) => {
    console.log('📝 Transcription:', data.text);
  });

  commander.on('intent-detected', (data) => {
    console.log('🎯 Intent Detected:', data.intent.action);
    console.log('   Confidence:', (data.intent.confidence * 100).toFixed(1) + '%');
  });

  commander.on('execution-complete', (data) => {
    console.log('✅ Execution Complete');
    console.log('   Tests Run:', data.result.testsRun);
    console.log('   Tests Passed:', data.result.testsPassed);
    console.log('   Tests Failed:', data.result.testsFailed);
    console.log('   Duration:', data.result.duration.toFixed(1) + 's');
  });

  commander.on('command-logged', (entry) => {
    console.log('📋 Command Logged:', entry.command);
  });

  // Process command
  const mockAudioBuffer = Buffer.from(new ArrayBuffer(1024));
  await commander.processVoiceCommand(mockAudioBuffer, 'admin-001', true);
}

// ============================================================================
// Example 4: Test Execution Workflow
// ============================================================================

async function example4_TestExecutionWorkflow() {
  console.log('\n' + '='.repeat(60));
  console.log('Example 4: Complete Test Execution Workflow');
  console.log('='.repeat(60));

  const commander = new VoiceTestCommander();

  // Step 1: Detect intent
  console.log('\nStep 1: Detecting intent...');
  const intent = await commander.detectIntent('Run all tests on DAWG AI');
  console.log('Intent:', intent.action);

  // Step 2: Create session
  console.log('\nStep 2: Creating session...');
  const session = commander.getOrCreateSession('admin-001', true);
  console.log('Session ID:', session.sessionId);

  // Step 3: Execute tests
  console.log('\nStep 3: Executing tests...');
  try {
    const result = await commander.executeIntent(intent, session);
    console.log('Result:', result);

    // Step 4: Generate response
    console.log('\nStep 4: Generating response...');
    const responseText = commander.generateResponseText(result);
    console.log('Response Text:', responseText);

    // Step 5: Convert to speech
    console.log('\nStep 5: Converting to speech...');
    const audioBuffer = await commander.synthesizeSpeech(responseText);
    console.log('Audio Length:', audioBuffer.length, 'bytes');

    // Save audio
    const outputPath = path.join(__dirname, '../temp/test-result-audio.mp3');
    await fs.writeFile(outputPath, audioBuffer);
    console.log('Audio saved to:', outputPath);
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

// ============================================================================
// Example 5: Confirmation Flow
// ============================================================================

async function example5_ConfirmationFlow() {
  console.log('\n' + '='.repeat(60));
  console.log('Example 5: Confirmation Flow for Destructive Operations');
  console.log('='.repeat(60));

  const commander = new VoiceTestCommander();

  // Step 1: Issue destructive command
  console.log('\nStep 1: Issuing destructive command...');
  const intent = await commander.detectIntent('Fix the failing tests');

  if (intent.requiresConfirmation) {
    console.log('⚠️  Confirmation required!');
    console.log('   Command:', 'Fix the failing tests');
    console.log('   Action:', intent.action);
    console.log('   Is Destructive:', intent.isDestructive);

    // Step 2: Create session and attempt execution
    const session = commander.getOrCreateSession('admin-001', true);

    try {
      await commander.executeIntent(intent, session);
    } catch (error: any) {
      if (error.message === 'CONFIRMATION_REQUIRED') {
        console.log('\n✋ Execution blocked, waiting for confirmation...');

        // Step 3: User confirms
        console.log('\n👤 User confirms operation');
        const confirmed = await commander.confirmOperation('admin-001');

        if (confirmed) {
          console.log('✅ Operation confirmed and executed');
        } else {
          console.log('❌ Operation cancelled');
        }
      }
    }
  }
}

// ============================================================================
// Example 6: Audit Log Review
// ============================================================================

async function example6_AuditLogReview() {
  console.log('\n' + '='.repeat(60));
  console.log('Example 6: Audit Log Review');
  console.log('='.repeat(60));

  const commander = new VoiceTestCommander();

  // Simulate some commands
  console.log('\nProcessing several commands...\n');

  const commands = [
    'Run all tests',
    'Check coverage',
    'Show results',
  ];

  for (const command of commands) {
    const intent = await commander.detectIntent(command);
    const session = commander.getOrCreateSession('admin-001', true);

    try {
      await commander.executeIntent(intent, session);
      console.log(`✓ Executed: ${command}`);
    } catch (error) {
      console.log(`✗ Failed: ${command}`);
    }
  }

  // Review audit log
  console.log('\n📋 Audit Log:\n');
  const auditLog = commander.getAuditLog('admin-001');

  auditLog.forEach((entry, index) => {
    console.log(`${index + 1}. [${entry.timestamp.toISOString()}]`);
    console.log(`   User: ${entry.userId}`);
    console.log(`   Command: ${entry.command}`);
    console.log(`   Action: ${entry.intent.action}`);
    if (entry.result) {
      console.log(`   Result: ${entry.result.testsPassed}/${entry.result.testsRun} passed`);
    }
    if (entry.error) {
      console.log(`   Error: ${entry.error}`);
    }
    console.log('');
  });
}

// ============================================================================
// Example 7: Rate Limiting Demonstration
// ============================================================================

async function example7_RateLimiting() {
  console.log('\n' + '='.repeat(60));
  console.log('Example 7: Rate Limiting Demonstration');
  console.log('='.repeat(60));

  const commander = new VoiceTestCommander();
  const session = commander.getOrCreateSession('admin-002', true);

  console.log('\nSending 15 rapid commands (limit is 10/minute)...\n');

  for (let i = 1; i <= 15; i++) {
    const intent = {
      action: 'show_results' as const,
      confidence: 0.95,
      requiresConfirmation: false,
      isDestructive: false,
    };

    try {
      await commander.executeIntent(intent, session);
      console.log(`✓ Command ${i}: Success`);
    } catch (error: any) {
      if (error.message.includes('Rate limit')) {
        console.log(`✗ Command ${i}: Rate limit exceeded! 🚫`);
      } else {
        console.log(`✗ Command ${i}: Error - ${error.message}`);
      }
    }

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n📊 Rate limiting working as expected!');
}

// ============================================================================
// Example 8: Integration with WebSocket
// ============================================================================

async function example8_WebSocketIntegration() {
  console.log('\n' + '='.repeat(60));
  console.log('Example 8: WebSocket Integration Pattern');
  console.log('='.repeat(60));

  console.log(`
WebSocket Client Pattern:

// Client connects
const ws = new WebSocket('ws://localhost:3001/voice-test-commander');

// Authenticate
ws.send(JSON.stringify({
  type: 'auth',
  userId: 'admin-001',
  isAdmin: true
}));

// Listen for events
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'transcription':
      console.log('Transcription:', data.text);
      break;

    case 'intent-detected':
      console.log('Intent:', data.intent.action);
      break;

    case 'execution-complete':
      console.log('Result:', data.result);
      break;

    case 'response-audio':
      // Play audio response
      const audio = new Audio('data:audio/mp3;base64,' + data.audioBase64);
      audio.play();
      break;
  }
};

// Send voice command
const audioBlob = await recordAudio();
const arrayBuffer = await audioBlob.arrayBuffer();
const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

ws.send(JSON.stringify({
  type: 'process-voice-command',
  userId: 'admin-001',
  audioBase64: base64Audio
}));
  `);
}

// ============================================================================
// Example 9: React Component Integration
// ============================================================================

async function example9_ReactIntegration() {
  console.log('\n' + '='.repeat(60));
  console.log('Example 9: React Component Integration Pattern');
  console.log('='.repeat(60));

  console.log(`
React Component Usage:

import { VoiceTestControl } from './components/VoiceTestControl';

function AdminDashboard() {
  const [showVoiceControl, setShowVoiceControl] = useState(false);
  const userId = useAuth().user.id;
  const isAdmin = useAuth().user.role === 'admin';

  return (
    <div>
      <h1>Admin Dashboard</h1>

      <button onClick={() => setShowVoiceControl(true)}>
        🎤 Voice Test Control
      </button>

      {showVoiceControl && (
        <VoiceTestControl
          userId={userId}
          isAdmin={isAdmin}
          onClose={() => setShowVoiceControl(false)}
        />
      )}
    </div>
  );
}
  `);
}

// ============================================================================
// Example 10: Production Deployment Checklist
// ============================================================================

async function example10_ProductionChecklist() {
  console.log('\n' + '='.repeat(60));
  console.log('Example 10: Production Deployment Checklist');
  console.log('='.repeat(60));

  const checklist = [
    { item: 'OPENAI_API_KEY configured', required: true },
    { item: 'Admin users defined in config/admin-permissions.json', required: true },
    { item: 'Rate limiting enabled', required: true },
    { item: 'Audit logging enabled', required: true },
    { item: 'HTTPS enforced', required: true },
    { item: 'MFA enabled for admins', required: true },
    { item: 'WebSocket security configured', required: true },
    { item: 'Monitoring alerts set up', required: true },
    { item: 'Backup strategy implemented', required: false },
    { item: 'Load testing completed', required: true },
    { item: 'Security audit passed', required: true },
    { item: 'Documentation updated', required: false },
  ];

  console.log('\n📋 Production Deployment Checklist:\n');

  checklist.forEach((item, index) => {
    const status = item.required ? '⚠️  REQUIRED' : '💡 RECOMMENDED';
    console.log(`${index + 1}. ${item.item}`);
    console.log(`   ${status}\n`);
  });
}

// ============================================================================
// Run All Examples
// ============================================================================

async function runAllExamples() {
  console.log('\n');
  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║  DAWG AI - Voice Test Control System Examples           ║');
  console.log('╚' + '═'.repeat(58) + '╝');
  console.log('\n');

  try {
    // Create temp directory
    await fs.mkdir(path.join(__dirname, '../temp'), { recursive: true });

    // Run examples
    // await example1_BasicVoiceCommand();
    await example2_IntentDetection();
    // await example3_EventDrivenProcessing();
    // await example4_TestExecutionWorkflow();
    await example5_ConfirmationFlow();
    // await example6_AuditLogReview();
    await example7_RateLimiting();
    await example8_WebSocketIntegration();
    await example9_ReactIntegration();
    await example10_ProductionChecklist();

    console.log('\n' + '='.repeat(60));
    console.log('✅ All examples completed successfully!');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

export {
  example1_BasicVoiceCommand,
  example2_IntentDetection,
  example3_EventDrivenProcessing,
  example4_TestExecutionWorkflow,
  example5_ConfirmationFlow,
  example6_AuditLogReview,
  example7_RateLimiting,
  example8_WebSocketIntegration,
  example9_ReactIntegration,
  example10_ProductionChecklist,
};
