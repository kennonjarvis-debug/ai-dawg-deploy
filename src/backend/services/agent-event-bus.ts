/**
 * Agent Event Bus
 * Shared communication protocol between AI Testing Agent and Chat AI Agent
 *
 * Enables bi-directional WebSocket communication for:
 * - Test execution requests from chat
 * - Real-time test progress streaming
 * - Test results and reports
 * - Auto-fix suggestions
 */

import { EventEmitter } from 'events';
import { Server as SocketIOServer, Socket } from 'socket.io';

export interface TestCommand {
  id: string;
  type: 'run_all' | 'run_workflow' | 'run_single' | 'create_test' | 'fix_tests' | 'get_report';
  payload: any;
  userId: string;
  timestamp: Date;
}

export interface TestProgress {
  testCommandId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  currentTest?: string;
  progress: number; // 0-100
  totalTests: number;
  completedTests: number;
  failedTests: number;
  timestamp: Date;
}

export interface TestResult {
  testCommandId: string;
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  screenshots?: string[];
  metrics?: Record<string, number>;
  timestamp: Date;
}

export interface TestReport {
  testCommandId: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  results: TestResult[];
  recommendations: string[];
  criticalIssues: string[];
  coverage?: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  timestamp: Date;
}

export interface AutoFixSuggestion {
  testCommandId: string;
  testName: string;
  issue: string;
  suggestedFix: string;
  confidence: number; // 0-1
  autoApplicable: boolean;
  filePath?: string;
  lineNumber?: number;
  timestamp: Date;
}

/**
 * Agent Event Bus - Singleton event system for agent communication
 */
export class AgentEventBus extends EventEmitter {
  private static instance: AgentEventBus;
  private io: SocketIOServer | null = null;
  private adminUserIds: Set<string> = new Set();

  // Active test sessions
  private activeTestSessions: Map<string, {
    command: TestCommand;
    startTime: Date;
    progress: TestProgress;
    results: TestResult[];
  }> = new Map();

  private constructor() {
    super();
    this.setMaxListeners(50); // Increase limit for multiple agents

    // Load admin user IDs from environment
    const adminIds = process.env.ADMIN_USER_IDS?.split(',') || [];
    adminIds.forEach(id => this.adminUserIds.add(id.trim()));

    console.log('Agent Event Bus initialized with', this.adminUserIds.size, 'admin users');
  }

  public static getInstance(): AgentEventBus {
    if (!AgentEventBus.instance) {
      AgentEventBus.instance = new AgentEventBus();
    }
    return AgentEventBus.instance;
  }

  /**
   * Initialize Socket.IO server for WebSocket communication
   */
  public initializeSocketIO(io: SocketIOServer): void {
    this.io = io;

    io.on('connection', (socket: Socket) => {
      console.log('Agent Event Bus: Client connected', socket.id);

      // Handle test commands from chat
      socket.on('test:command', (data: { command: TestCommand }) => {
        this.handleTestCommand(socket, data.command);
      });

      // Handle auto-fix approval
      socket.on('test:approve-fix', (data: { testCommandId: string; fixId: string }) => {
        this.emit('test:approve-fix', data);
      });

      // Handle test cancellation
      socket.on('test:cancel', (data: { testCommandId: string }) => {
        this.emit('test:cancel', data.testCommandId);
        socket.emit('test:cancelled', { testCommandId: data.testCommandId });
      });

      // Send current test sessions on connect
      socket.emit('test:sessions', Array.from(this.activeTestSessions.values()));

      socket.on('disconnect', () => {
        console.log('Agent Event Bus: Client disconnected', socket.id);
      });
    });

    // Listen to testing agent events and broadcast to connected clients
    this.setupTestingAgentListeners();

    console.log('Agent Event Bus: Socket.IO initialized');
  }

  /**
   * Check if user is admin
   */
  public isAdmin(userId: string): boolean {
    return this.adminUserIds.has(userId);
  }

  /**
   * Handle test command from chat
   */
  private handleTestCommand(socket: Socket, command: TestCommand): void {
    // Verify admin access
    if (!this.isAdmin(command.userId)) {
      socket.emit('test:error', {
        testCommandId: command.id,
        error: 'Unauthorized: Only admin users can execute tests',
        timestamp: new Date()
      });
      return;
    }

    // Audit log
    console.log('Test command received:', {
      id: command.id,
      type: command.type,
      userId: command.userId,
      timestamp: command.timestamp
    });

    // Create test session
    const session = {
      command,
      startTime: new Date(),
      progress: {
        testCommandId: command.id,
        status: 'queued' as const,
        progress: 0,
        totalTests: 0,
        completedTests: 0,
        failedTests: 0,
        timestamp: new Date()
      },
      results: []
    };

    this.activeTestSessions.set(command.id, session);

    // Emit to testing agent
    this.emit('test:command', command);

    // Send acknowledgment to chat
    socket.emit('test:queued', {
      testCommandId: command.id,
      timestamp: new Date()
    });
  }

  /**
   * Setup listeners for testing agent events
   */
  private setupTestingAgentListeners(): void {
    // Test progress updates
    this.on('testing-agent:progress', (progress: TestProgress) => {
      const session = this.activeTestSessions.get(progress.testCommandId);
      if (session) {
        session.progress = progress;
      }
      this.broadcastToClients('test:progress', progress);
    });

    // Individual test results
    this.on('testing-agent:result', (result: TestResult) => {
      const session = this.activeTestSessions.get(result.testCommandId);
      if (session) {
        session.results.push(result);
      }
      this.broadcastToClients('test:result', result);
    });

    // Test completion
    this.on('testing-agent:complete', (report: TestReport) => {
      const session = this.activeTestSessions.get(report.testCommandId);
      if (session) {
        session.progress.status = 'completed';
      }
      this.broadcastToClients('test:complete', report);

      // Clean up session after 1 hour
      setTimeout(() => {
        this.activeTestSessions.delete(report.testCommandId);
      }, 3600000);
    });

    // Auto-fix suggestions
    this.on('testing-agent:auto-fix', (suggestion: AutoFixSuggestion) => {
      this.broadcastToClients('test:auto-fix', suggestion);
    });

    // Test errors
    this.on('testing-agent:error', (data: { testCommandId: string; error: string }) => {
      const session = this.activeTestSessions.get(data.testCommandId);
      if (session) {
        session.progress.status = 'failed';
      }
      this.broadcastToClients('test:error', data);
    });
  }

  /**
   * Broadcast event to all connected Socket.IO clients
   */
  private broadcastToClients(event: string, data: any): void {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  /**
   * Send test command to testing agent
   */
  public sendTestCommand(command: TestCommand): void {
    this.emit('test:command', command);
  }

  /**
   * Update test progress
   */
  public updateTestProgress(progress: TestProgress): void {
    this.emit('testing-agent:progress', progress);
  }

  /**
   * Send test result
   */
  public sendTestResult(result: TestResult): void {
    this.emit('testing-agent:result', result);
  }

  /**
   * Send test report
   */
  public sendTestReport(report: TestReport): void {
    this.emit('testing-agent:complete', report);
  }

  /**
   * Send auto-fix suggestion
   */
  public sendAutoFixSuggestion(suggestion: AutoFixSuggestion): void {
    this.emit('testing-agent:auto-fix', suggestion);
  }

  /**
   * Send error
   */
  public sendError(testCommandId: string, error: string): void {
    this.emit('testing-agent:error', { testCommandId, error });
  }

  /**
   * Get active test sessions
   */
  public getActiveSessions(): any[] {
    return Array.from(this.activeTestSessions.values());
  }

  /**
   * Get session by ID
   */
  public getSession(testCommandId: string): any | undefined {
    return this.activeTestSessions.get(testCommandId);
  }
}

// Export singleton instance
export const agentEventBus = AgentEventBus.getInstance();
