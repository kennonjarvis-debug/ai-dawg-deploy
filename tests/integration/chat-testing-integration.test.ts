/**
 * Chat-Testing Integration Test Suite
 * Tests bi-directional communication between Chat AI Agent and Testing Agent
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { io, Socket } from 'socket.io-client';
import { agentEventBus } from '../../src/backend/services/agent-event-bus';
import { testCommandHandler } from '../../src/backend/services/test-command-handler';

describe('Chat-Testing Integration', () => {
  let chatSocket: Socket;
  let testingSocket: Socket;
  const TEST_SERVER_URL = 'http://localhost:3100';
  const TEST_USER_ID = 'admin-test-user';

  beforeAll(async () => {
    // Set admin user for testing
    process.env.ADMIN_USER_IDS = TEST_USER_ID;

    // Connect sockets
    chatSocket = io(TEST_SERVER_URL, {
      transports: ['websocket']
    });

    testingSocket = io(TEST_SERVER_URL, {
      transports: ['websocket']
    });

    // Wait for connections
    await new Promise<void>((resolve) => {
      let connected = 0;
      const checkConnected = () => {
        connected++;
        if (connected === 2) resolve();
      };

      chatSocket.on('connect', checkConnected);
      testingSocket.on('connect', checkConnected);
    });
  });

  afterAll(() => {
    chatSocket.disconnect();
    testingSocket.disconnect();
  });

  beforeEach(() => {
    // Clear any pending events
    chatSocket.removeAllListeners('test:progress');
    chatSocket.removeAllListeners('test:result');
    chatSocket.removeAllListeners('test:complete');
    chatSocket.removeAllListeners('test:auto-fix');
    chatSocket.removeAllListeners('test:error');
  });

  describe('Test Command Flow', () => {
    test('should send test command from chat and receive acknowledgment', (done) => {
      const testCommand = {
        id: `test-${Date.now()}`,
        type: 'run_all',
        payload: {},
        userId: TEST_USER_ID,
        timestamp: new Date()
      };

      chatSocket.once('test:queued', (data) => {
        expect(data.testCommandId).toBe(testCommand.id);
        expect(data.timestamp).toBeDefined();
        done();
      });

      chatSocket.emit('test:command', { command: testCommand });
    });

    test('should reject command from non-admin user', (done) => {
      const testCommand = {
        id: `test-${Date.now()}`,
        type: 'run_all',
        payload: {},
        userId: 'non-admin-user',
        timestamp: new Date()
      };

      chatSocket.once('test:error', (data) => {
        expect(data.error).toContain('Unauthorized');
        done();
      });

      chatSocket.emit('test:command', { command: testCommand });
    });
  });

  describe('Progress Streaming', () => {
    test('should stream test progress updates', (done) => {
      const testCommandId = `test-${Date.now()}`;
      let progressUpdates = 0;

      chatSocket.on('test:progress', (progress) => {
        expect(progress.testCommandId).toBe(testCommandId);
        expect(progress.status).toBeDefined();
        expect(progress.progress).toBeGreaterThanOrEqual(0);
        expect(progress.progress).toBeLessThanOrEqual(100);

        progressUpdates++;

        // After receiving multiple updates, complete test
        if (progressUpdates >= 3) {
          chatSocket.removeAllListeners('test:progress');
          done();
        }
      });

      // Simulate progress updates from testing agent
      setTimeout(() => {
        agentEventBus.updateTestProgress({
          testCommandId,
          status: 'running',
          progress: 25,
          totalTests: 10,
          completedTests: 2,
          failedTests: 0,
          timestamp: new Date()
        });
      }, 100);

      setTimeout(() => {
        agentEventBus.updateTestProgress({
          testCommandId,
          status: 'running',
          progress: 50,
          totalTests: 10,
          completedTests: 5,
          failedTests: 1,
          timestamp: new Date()
        });
      }, 200);

      setTimeout(() => {
        agentEventBus.updateTestProgress({
          testCommandId,
          status: 'running',
          progress: 75,
          totalTests: 10,
          completedTests: 7,
          failedTests: 1,
          timestamp: new Date()
        });
      }, 300);
    });

    test('should receive individual test results', (done) => {
      const testCommandId = `test-${Date.now()}`;

      chatSocket.once('test:result', (result) => {
        expect(result.testCommandId).toBe(testCommandId);
        expect(result.testName).toBe('Sample Test');
        expect(result.status).toBe('passed');
        expect(result.duration).toBeGreaterThan(0);
        done();
      });

      // Simulate test result from testing agent
      setTimeout(() => {
        agentEventBus.sendTestResult({
          testCommandId,
          testName: 'Sample Test',
          status: 'passed',
          duration: 1500,
          timestamp: new Date()
        });
      }, 100);
    });
  });

  describe('Test Completion', () => {
    test('should receive complete test report', (done) => {
      const testCommandId = `test-${Date.now()}`;

      chatSocket.once('test:complete', (report) => {
        expect(report.testCommandId).toBe(testCommandId);
        expect(report.totalTests).toBe(10);
        expect(report.passed).toBe(8);
        expect(report.failed).toBe(2);
        expect(report.skipped).toBe(0);
        expect(report.results).toHaveLength(10);
        expect(report.recommendations).toBeDefined();
        expect(report.criticalIssues).toBeDefined();
        done();
      });

      // Simulate test completion from testing agent
      setTimeout(() => {
        agentEventBus.sendTestReport({
          testCommandId,
          totalTests: 10,
          passed: 8,
          failed: 2,
          skipped: 0,
          duration: 15000,
          results: Array(10).fill(null).map((_, i) => ({
            testCommandId,
            testName: `Test ${i + 1}`,
            status: i < 8 ? 'passed' : 'failed',
            duration: 1500,
            timestamp: new Date()
          })),
          recommendations: ['All tests completed'],
          criticalIssues: [],
          timestamp: new Date()
        });
      }, 100);
    });

    test('should include coverage report when available', (done) => {
      const testCommandId = `test-${Date.now()}`;

      chatSocket.once('test:complete', (report) => {
        expect(report.coverage).toBeDefined();
        expect(report.coverage.statements).toBe(85.5);
        expect(report.coverage.branches).toBe(78.2);
        expect(report.coverage.functions).toBe(90.1);
        expect(report.coverage.lines).toBe(84.7);
        done();
      });

      setTimeout(() => {
        agentEventBus.sendTestReport({
          testCommandId,
          totalTests: 5,
          passed: 5,
          failed: 0,
          skipped: 0,
          duration: 7500,
          results: [],
          recommendations: [],
          criticalIssues: [],
          coverage: {
            statements: 85.5,
            branches: 78.2,
            functions: 90.1,
            lines: 84.7
          },
          timestamp: new Date()
        });
      }, 100);
    });
  });

  describe('Auto-Fix Suggestions', () => {
    test('should receive auto-fix suggestions', (done) => {
      const testCommandId = `test-${Date.now()}`;

      chatSocket.once('test:auto-fix', (suggestion) => {
        expect(suggestion.testCommandId).toBe(testCommandId);
        expect(suggestion.testName).toBe('Failing Test');
        expect(suggestion.issue).toBeDefined();
        expect(suggestion.suggestedFix).toBeDefined();
        expect(suggestion.confidence).toBeGreaterThan(0);
        expect(suggestion.confidence).toBeLessThanOrEqual(1);
        expect(suggestion.autoApplicable).toBeDefined();
        done();
      });

      setTimeout(() => {
        agentEventBus.sendAutoFixSuggestion({
          testCommandId,
          testName: 'Failing Test',
          issue: 'Element not found: button[data-testid="submit"]',
          suggestedFix: 'Update selector to button[data-testid="submit-button"]',
          confidence: 0.85,
          autoApplicable: true,
          filePath: 'tests/e2e/workflow.spec.ts',
          lineNumber: 45,
          timestamp: new Date()
        });
      }, 100);
    });

    test('should approve and apply auto-fix', (done) => {
      const testCommandId = `test-${Date.now()}`;
      const fixId = 'fix-1';

      // Listen for approval event
      agentEventBus.once('test:approve-fix', (data) => {
        expect(data.testCommandId).toBe(testCommandId);
        expect(data.fixId).toBe(fixId);
        done();
      });

      // Send approval from chat
      chatSocket.emit('test:approve-fix', {
        testCommandId,
        fixId
      });
    });
  });

  describe('Voice Command Processing', () => {
    test('should process "run all tests" voice command', async () => {
      const result = await testCommandHandler.processVoiceCommand({
        command: 'run all tests',
        userId: TEST_USER_ID
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Running full test suite');
      expect(result.testCommandId).toBeDefined();
    });

    test('should process "run workflow tests" voice command', async () => {
      const result = await testCommandHandler.processVoiceCommand({
        command: 'run workflow tests',
        userId: TEST_USER_ID
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('workflow');
      expect(result.testCommandId).toBeDefined();
    });

    test('should process "create test for login" voice command', async () => {
      const result = await testCommandHandler.processVoiceCommand({
        command: 'create test for login',
        parameters: { feature: 'login' },
        userId: TEST_USER_ID
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Generating');
      expect(result.testCommandId).toBeDefined();
    });

    test('should process "fix failing tests" voice command', async () => {
      const result = await testCommandHandler.processVoiceCommand({
        command: 'fix failing tests',
        userId: TEST_USER_ID
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('auto-fix');
      expect(result.testCommandId).toBeDefined();
    });

    test('should process "show test report" voice command', async () => {
      const result = await testCommandHandler.processVoiceCommand({
        command: 'show test report',
        userId: TEST_USER_ID
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('report');
      expect(result.testCommandId).toBeDefined();
    });

    test('should reject voice command from non-admin', async () => {
      const result = await testCommandHandler.processVoiceCommand({
        command: 'run all tests',
        userId: 'non-admin-user'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('admin privileges');
    });
  });

  describe('Test Cancellation', () => {
    test('should cancel running test', (done) => {
      const testCommandId = `test-${Date.now()}`;

      chatSocket.once('test:cancelled', (data) => {
        expect(data.testCommandId).toBe(testCommandId);
        done();
      });

      chatSocket.emit('test:cancel', { testCommandId });
    });
  });

  describe('Error Handling', () => {
    test('should handle test execution errors', (done) => {
      const testCommandId = `test-${Date.now()}`;
      const errorMessage = 'Test framework not found';

      chatSocket.once('test:error', (data) => {
        expect(data.testCommandId).toBe(testCommandId);
        expect(data.error).toBe(errorMessage);
        done();
      });

      setTimeout(() => {
        agentEventBus.sendError(testCommandId, errorMessage);
      }, 100);
    });

    test('should handle malformed commands', (done) => {
      const malformedCommand = {
        // Missing required fields
        type: 'invalid_type',
        userId: TEST_USER_ID
      };

      chatSocket.once('test:error', (data) => {
        expect(data.error).toBeDefined();
        done();
      });

      chatSocket.emit('test:command', { command: malformedCommand });
    });
  });

  describe('Session Management', () => {
    test('should track active test sessions', () => {
      const sessions = agentEventBus.getActiveSessions();
      expect(Array.isArray(sessions)).toBe(true);
    });

    test('should retrieve specific session by ID', () => {
      const testCommandId = `test-${Date.now()}`;

      // Create a session
      agentEventBus.updateTestProgress({
        testCommandId,
        status: 'running',
        progress: 50,
        totalTests: 10,
        completedTests: 5,
        failedTests: 0,
        timestamp: new Date()
      });

      const session = agentEventBus.getSession(testCommandId);
      expect(session).toBeDefined();
    });
  });
});
