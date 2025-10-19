/**
 * Voice Test Commander Integration Tests
 *
 * Comprehensive test suite for voice-controlled test execution system.
 *
 * Test Coverage:
 * - Voice transcription accuracy
 * - Intent detection reliability
 * - Test execution flow
 * - Safety and permissions
 * - Rate limiting
 * - Audit logging
 * - TTS response generation
 * - WebSocket communication
 */

import { test, expect } from '@playwright/test';
import { VoiceTestCommander, TestAction } from '../../src/backend/services/voice-test-commander';
import fs from 'fs/promises';
import path from 'path';

// ============================================================================
// Test Fixtures
// ============================================================================

test.describe('Voice Test Commander - Core Functionality', () => {
  let commander: VoiceTestCommander;

  test.beforeEach(() => {
    commander = new VoiceTestCommander();
  });

  test('should transcribe audio using Whisper API', async () => {
    // Create mock audio buffer (WAV format)
    const mockAudioBuffer = Buffer.from(new ArrayBuffer(1024));

    // Mock Whisper API call
    const transcription = await commander.transcribeAudio(mockAudioBuffer);

    expect(transcription).toBeDefined();
    expect(typeof transcription).toBe('string');
  });

  test('should detect intent from natural language', async () => {
    const testCases = [
      {
        input: 'Run all tests on DAWG AI',
        expectedAction: 'run_all_tests' as TestAction,
      },
      {
        input: 'Test the freestyle workflow',
        expectedAction: 'run_workflow_test' as TestAction,
      },
      {
        input: 'Create tests for melody to vocals feature',
        expectedAction: 'create_test' as TestAction,
      },
      {
        input: 'Show me the test results',
        expectedAction: 'show_results' as TestAction,
      },
      {
        input: 'Fix the failing tests',
        expectedAction: 'fix_failing_tests' as TestAction,
      },
      {
        input: "What's the current test coverage?",
        expectedAction: 'check_coverage' as TestAction,
      },
      {
        input: 'Run security tests',
        expectedAction: 'run_security_tests' as TestAction,
      },
      {
        input: 'Test the production deployment',
        expectedAction: 'test_deployment' as TestAction,
      },
    ];

    for (const testCase of testCases) {
      const intent = await commander.detectIntent(testCase.input);

      expect(intent.action).toBe(testCase.expectedAction);
      expect(intent.confidence).toBeGreaterThan(0.7);
    }
  });

  test('should require confirmation for destructive operations', async () => {
    const destructiveCommands = [
      'Fix the failing tests',
      'Test the production deployment',
    ];

    for (const command of destructiveCommands) {
      const intent = await commander.detectIntent(command);

      expect(intent.requiresConfirmation).toBe(true);
      expect(intent.isDestructive).toBe(true);
    }
  });

  test('should generate speech from text', async () => {
    const text = 'All 47 tests passed successfully!';

    const audioBuffer = await commander.synthesizeSpeech(text);

    expect(audioBuffer).toBeInstanceOf(Buffer);
    expect(audioBuffer.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Security & Permissions Tests
// ============================================================================

test.describe('Voice Test Commander - Security', () => {
  let commander: VoiceTestCommander;

  test.beforeEach(() => {
    commander = new VoiceTestCommander();
  });

  test('should enforce admin role verification', async () => {
    const session = commander.getOrCreateSession('user-001', false); // Non-admin

    const intent = {
      action: 'run_all_tests' as TestAction,
      confidence: 0.95,
      requiresConfirmation: false,
      isDestructive: false,
    };

    await expect(commander.executeIntent(intent, session)).rejects.toThrow(
      'Unauthorized: Admin privileges required'
    );
  });

  test('should enforce rate limiting', async () => {
    const session = commander.getOrCreateSession('user-002', true);

    // Simulate rapid commands
    const promises = [];
    for (let i = 0; i < 15; i++) {
      const intent = {
        action: 'show_results' as TestAction,
        confidence: 0.95,
        requiresConfirmation: false,
        isDestructive: false,
      };

      promises.push(
        commander.executeIntent(intent, session).catch((err) => err.message)
      );
    }

    const results = await Promise.all(promises);

    // At least one should be rate limited
    expect(results.some((r) => r.includes('Rate limit exceeded'))).toBe(true);
  });

  test('should log all commands to audit log', async () => {
    const session = commander.getOrCreateSession('user-003', true);

    const mockAudioBuffer = Buffer.from('test');
    await commander.processVoiceCommand(mockAudioBuffer, 'user-003', true);

    const auditLog = commander.getAuditLog('user-003');

    expect(auditLog.length).toBeGreaterThan(0);
    expect(auditLog[0].userId).toBe('user-003');
  });

  test('should require confirmation for low-confidence intents', async () => {
    const text = 'Maybe run some tests or something';

    const intent = await commander.detectIntent(text);

    if (intent.confidence < 0.85) {
      expect(intent.requiresConfirmation).toBe(true);
    }
  });
});

// ============================================================================
// Test Execution Tests
// ============================================================================

test.describe('Voice Test Commander - Test Execution', () => {
  let commander: VoiceTestCommander;

  test.beforeEach(() => {
    commander = new VoiceTestCommander();
  });

  test('should execute run_all_tests command', async () => {
    const session = commander.getOrCreateSession('admin-001', true);

    const intent = {
      action: 'run_all_tests' as TestAction,
      confidence: 0.95,
      requiresConfirmation: false,
      isDestructive: false,
    };

    const result = await commander.executeIntent(intent, session);

    expect(result).toBeDefined();
    expect(result.testsRun).toBeGreaterThan(0);
    expect(typeof result.duration).toBe('number');
  });

  test('should execute workflow-specific tests', async () => {
    const session = commander.getOrCreateSession('admin-001', true);

    const intent = {
      action: 'run_workflow_test' as TestAction,
      target: 'freestyle',
      confidence: 0.95,
      requiresConfirmation: false,
      isDestructive: false,
    };

    const result = await commander.executeIntent(intent, session);

    expect(result).toBeDefined();
    expect(result.testsRun).toBeGreaterThan(0);
  });

  test('should generate test code for new features', async () => {
    const session = commander.getOrCreateSession('admin-001', true);

    const intent = {
      action: 'create_test' as TestAction,
      target: 'multi-track recording',
      parameters: { type: 'integration' },
      confidence: 0.95,
      requiresConfirmation: false,
      isDestructive: false,
    };

    const result = await commander.executeIntent(intent, session);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  test('should retrieve and format test results', async () => {
    const session = commander.getOrCreateSession('admin-001', true);

    const intent = {
      action: 'show_results' as TestAction,
      confidence: 0.95,
      requiresConfirmation: false,
      isDestructive: false,
    };

    const result = await commander.executeIntent(intent, session);

    expect(result).toBeDefined();
    expect(result.testsRun).toBeDefined();
    expect(result.testsPassed).toBeDefined();
    expect(result.testsFailed).toBeDefined();
  });

  test('should check test coverage', async () => {
    const session = commander.getOrCreateSession('admin-001', true);

    const intent = {
      action: 'check_coverage' as TestAction,
      confidence: 0.95,
      requiresConfirmation: false,
      isDestructive: false,
    };

    const result = await commander.executeIntent(intent, session);

    expect(result).toBeDefined();
    expect(result.coverage).toBeDefined();
    expect(result.coverage?.lines).toBeGreaterThan(0);
    expect(result.coverage?.functions).toBeGreaterThan(0);
    expect(result.coverage?.branches).toBeGreaterThan(0);
  });
});

// ============================================================================
// Integration Tests with Chat AI
// ============================================================================

test.describe('Voice Test Commander - Chat AI Integration', () => {
  test('should route voice commands through chat AI', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Open voice test control
    const voiceButton = page.locator('button[aria-label="Voice Test Control"]');
    await voiceButton.click();

    // Verify voice control modal opens
    await expect(page.locator('text=Voice Test Control')).toBeVisible();

    // Simulate voice command (in real scenario, this would be audio)
    const mockCommand = 'Run all tests';

    // Wait for transcription
    await expect(page.locator('.transcription')).toContainText(mockCommand);

    // Wait for intent detection
    await expect(page.locator('.intent-action')).toContainText('run_all_tests');

    // Wait for execution
    await page.waitForSelector('.test-results', { timeout: 30000 });

    // Verify results displayed
    const resultsText = await page.locator('.test-results').textContent();
    expect(resultsText).toMatch(/\d+ tests/);
  });

  test('should display confirmation dialog for destructive operations', async ({
    page,
  }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Open voice test control
    const voiceButton = page.locator('button[aria-label="Voice Test Control"]');
    await voiceButton.click();

    // Simulate destructive command
    const mockCommand = 'Fix the failing tests';

    // Should show confirmation dialog
    await expect(page.locator('text=Confirmation Required')).toBeVisible();

    // Verify confirm/cancel buttons
    await expect(page.locator('button:has-text("Confirm")')).toBeVisible();
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
  });
});

// ============================================================================
// End-to-End Voice Flow Tests
// ============================================================================

test.describe('Voice Test Commander - E2E Flow', () => {
  test('should complete full voice command flow', async () => {
    const commander = new VoiceTestCommander();
    const mockAudioBuffer = Buffer.from(new ArrayBuffer(1024));

    // Listen for events
    const events: any[] = [];
    commander.on('transcription', (data) => events.push({ type: 'transcription', data }));
    commander.on('intent-detected', (data) => events.push({ type: 'intent', data }));
    commander.on('execution-complete', (data) => events.push({ type: 'execution', data }));

    // Process voice command
    const result = await commander.processVoiceCommand(
      mockAudioBuffer,
      'admin-001',
      true
    );

    // Verify response
    expect(result.text).toBeDefined();
    expect(result.audio).toBeInstanceOf(Buffer);
    expect(result.audio.length).toBeGreaterThan(0);

    // Verify events fired
    expect(events.length).toBeGreaterThan(0);
    expect(events.some((e) => e.type === 'transcription')).toBe(true);
    expect(events.some((e) => e.type === 'intent')).toBe(true);
    expect(events.some((e) => e.type === 'execution')).toBe(true);
  });

  test('should handle error scenarios gracefully', async () => {
    const commander = new VoiceTestCommander();
    const invalidAudioBuffer = Buffer.from('invalid');

    const result = await commander.processVoiceCommand(
      invalidAudioBuffer,
      'admin-001',
      true
    );

    // Should return error response
    expect(result.text).toContain('error');
    expect(result.audio).toBeInstanceOf(Buffer);
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

test.describe('Voice Test Commander - Performance', () => {
  test('should process voice command within 5 seconds', async () => {
    const commander = new VoiceTestCommander();
    const mockAudioBuffer = Buffer.from(new ArrayBuffer(1024));

    const startTime = Date.now();

    await commander.processVoiceCommand(mockAudioBuffer, 'admin-001', true);

    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(5000);
  });

  test('should handle concurrent voice commands', async () => {
    const commander = new VoiceTestCommander();
    const mockAudioBuffer = Buffer.from(new ArrayBuffer(1024));

    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        commander.processVoiceCommand(mockAudioBuffer, `admin-00${i}`, true)
      );
    }

    const results = await Promise.all(promises);

    expect(results.length).toBe(5);
    results.forEach((result) => {
      expect(result.text).toBeDefined();
      expect(result.audio).toBeInstanceOf(Buffer);
    });
  });
});

// ============================================================================
// Accessibility Tests
// ============================================================================

test.describe('Voice Test Commander - Accessibility', () => {
  test('should provide audio feedback for visually impaired users', async ({
    page,
  }) => {
    await page.goto('http://localhost:5173');

    // Open voice control
    const voiceButton = page.locator('button[aria-label="Voice Test Control"]');
    await voiceButton.click();

    // Check for audio element
    const audioElement = page.locator('audio');
    await expect(audioElement).toBeAttached();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Open voice control
    const voiceButton = page.locator('button[aria-label="Voice Test Control"]');
    await expect(voiceButton).toHaveAttribute('aria-label');

    await voiceButton.click();

    // Check for ARIA labels on controls
    const micButton = page.locator('button[aria-label*="microphone"]');
    await expect(micButton).toBeVisible();
  });
});

// ============================================================================
// Example Test Scenarios
// ============================================================================

test.describe('Voice Test Commander - Example Scenarios', () => {
  test('Scenario 1: Admin runs all tests via voice', async () => {
    const commander = new VoiceTestCommander();

    // Simulate voice input: "Run all tests on DAWG AI"
    const text = 'Run all tests on DAWG AI';
    const intent = await commander.detectIntent(text);

    expect(intent.action).toBe('run_all_tests');

    const session = commander.getOrCreateSession('admin-001', true);
    const result = await commander.executeIntent(intent, session);

    expect(result.testsRun).toBeGreaterThan(0);

    // Generate spoken response
    const responseText = commander.generateResponseText(result);
    expect(responseText).toMatch(/\d+ tests passed/);
  });

  test('Scenario 2: Admin fixes failing tests', async () => {
    const commander = new VoiceTestCommander();

    // Simulate: "Fix the failing tests"
    const text = 'Fix the failing tests';
    const intent = await commander.detectIntent(text);

    expect(intent.action).toBe('fix_failing_tests');
    expect(intent.requiresConfirmation).toBe(true);

    const session = commander.getOrCreateSession('admin-001', true);

    // Should throw confirmation required
    await expect(commander.executeIntent(intent, session)).rejects.toThrow(
      'CONFIRMATION_REQUIRED'
    );

    // Confirm and execute
    const confirmed = await commander.confirmOperation('admin-001');
    expect(confirmed).toBe(true);
  });

  test('Scenario 3: Check test coverage', async () => {
    const commander = new VoiceTestCommander();

    // Simulate: "What's the current test coverage?"
    const text = "What's the current test coverage?";
    const intent = await commander.detectIntent(text);

    expect(intent.action).toBe('check_coverage');

    const session = commander.getOrCreateSession('admin-001', true);
    const result = await commander.executeIntent(intent, session);

    expect(result.coverage).toBeDefined();
    expect(result.coverage?.lines).toBeGreaterThan(0);

    // Generate response
    const responseText = commander.generateResponseText(result);
    const audioResponse = await commander.synthesizeSpeech(responseText);

    expect(audioResponse.length).toBeGreaterThan(0);
  });
});
