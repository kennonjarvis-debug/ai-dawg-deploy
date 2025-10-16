/**
 * Session Monitor with Ring Buffer
 * Tracks session activity, errors, and exit codes for AI analysis
 */

import { MonitorBuffer, TranscriptEntry } from './types';
import { logger } from './logger';
import * as fs from 'fs';
import * as path from 'path';

export class SessionMonitor {
  private buffers: Map<string, MonitorBuffer> = new Map();
  private readonly maxBufferSize = 1000; // Max entries per session
  private transcriptDir: string;

  constructor(transcriptDir = './logs/transcripts') {
    this.transcriptDir = transcriptDir;

    // Ensure transcript directory exists
    if (!fs.existsSync(transcriptDir)) {
      fs.mkdirSync(transcriptDir, { recursive: true });
    }
  }

  /**
   * Initialize monitoring for a session
   */
  initializeSession(sessionId: string): void {
    if (!this.buffers.has(sessionId)) {
      this.buffers.set(sessionId, {
        sessionId,
        entries: [],
        maxSize: this.maxBufferSize,
        errorCount: 0,
        exitCodes: [],
        startTime: Date.now(),
      });
      logger.debug('Monitor initialized for session', { sessionId });
    }
  }

  /**
   * Record input to session
   */
  recordInput(sessionId: string, content: string): void {
    const buffer = this.buffers.get(sessionId);
    if (!buffer) return;

    const entry: TranscriptEntry = {
      sessionId,
      timestamp: Date.now(),
      type: 'input',
      content: this.redactSensitive(content),
      redacted: content !== this.redactSensitive(content),
    };

    this.addEntry(buffer, entry);
    this.writeToFile(sessionId, entry);
  }

  /**
   * Record output from session
   */
  recordOutput(sessionId: string, content: string): void {
    const buffer = this.buffers.get(sessionId);
    if (!buffer) return;

    const entry: TranscriptEntry = {
      sessionId,
      timestamp: Date.now(),
      type: 'output',
      content: this.redactSensitive(content),
      redacted: content !== this.redactSensitive(content),
    };

    this.addEntry(buffer, entry);

    // Check for errors in output
    if (this.containsError(content)) {
      buffer.errorCount++;
    }
  }

  /**
   * Record a command execution
   */
  recordCommand(sessionId: string, command: string): void {
    const buffer = this.buffers.get(sessionId);
    if (!buffer) return;

    const entry: TranscriptEntry = {
      sessionId,
      timestamp: Date.now(),
      type: 'command',
      content: this.redactSensitive(command),
      redacted: command !== this.redactSensitive(command),
    };

    this.addEntry(buffer, entry);
    this.writeToFile(sessionId, entry);

    buffer.lastCommandTime = Date.now();
  }

  /**
   * Record a denied command
   */
  recordDenied(sessionId: string, command: string, reason: string): void {
    const buffer = this.buffers.get(sessionId);
    if (!buffer) return;

    const entry: TranscriptEntry = {
      sessionId,
      timestamp: Date.now(),
      type: 'denied',
      content: `${this.redactSensitive(command)} [DENIED: ${reason}]`,
      redacted: true,
    };

    this.addEntry(buffer, entry);
    this.writeToFile(sessionId, entry);
  }

  /**
   * Record exit code
   */
  recordExit(sessionId: string, exitCode: number): void {
    const buffer = this.buffers.get(sessionId);
    if (buffer) {
      buffer.exitCodes.push(exitCode);
    }
  }

  /**
   * Get buffer for a session
   */
  getBuffer(sessionId: string): MonitorBuffer | undefined {
    return this.buffers.get(sessionId);
  }

  /**
   * Get recent entries from buffer
   */
  getRecentEntries(sessionId: string, count = 100): TranscriptEntry[] {
    const buffer = this.buffers.get(sessionId);
    if (!buffer) return [];

    return buffer.entries.slice(-count);
  }

  /**
   * Get session summary for AI analysis
   */
  getSessionSummary(sessionId: string): string {
    const buffer = this.buffers.get(sessionId);
    if (!buffer) return 'No data available';

    const duration = Date.now() - buffer.startTime;
    const durationMinutes = Math.floor(duration / 60000);

    const commandCount = buffer.entries.filter((e) => e.type === 'command').length;
    const deniedCount = buffer.entries.filter((e) => e.type === 'denied').length;

    let summary = `Session Duration: ${durationMinutes} minutes\n`;
    summary += `Commands Executed: ${commandCount}\n`;
    summary += `Commands Denied: ${deniedCount}\n`;
    summary += `Errors Detected: ${buffer.errorCount}\n`;

    if (buffer.exitCodes.length > 0) {
      summary += `Exit Codes: ${buffer.exitCodes.join(', ')}\n`;
    }

    if (buffer.lastCommandTime) {
      const idleTime = Math.floor((Date.now() - buffer.lastCommandTime) / 1000);
      summary += `Idle Time: ${idleTime} seconds\n`;
    }

    summary += '\n--- Recent Commands ---\n';
    const recentCommands = buffer.entries.filter((e) => e.type === 'command').slice(-10);
    recentCommands.forEach((cmd) => {
      summary += `${cmd.content}\n`;
    });

    return summary;
  }

  /**
   * Clean up session monitor
   */
  cleanupSession(sessionId: string): void {
    this.buffers.delete(sessionId);
    logger.debug('Monitor cleaned up for session', { sessionId });
  }

  /**
   * Add entry to buffer (ring buffer implementation)
   */
  private addEntry(buffer: MonitorBuffer, entry: TranscriptEntry): void {
    buffer.entries.push(entry);

    // Ring buffer: remove oldest if exceeds max size
    if (buffer.entries.length > buffer.maxSize) {
      buffer.entries.shift();
    }
  }

  /**
   * Write entry to transcript file
   */
  private writeToFile(sessionId: string, entry: TranscriptEntry): void {
    try {
      const filename = path.join(this.transcriptDir, `${sessionId}.jsonl`);
      const line = JSON.stringify(entry) + '\n';
      fs.appendFileSync(filename, line);
    } catch (error) {
      logger.error('Failed to write transcript', {
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Redact sensitive information
   */
  private redactSensitive(content: string): string {
    // Redact patterns for passwords, tokens, keys
    const patterns = [
      { regex: /password[=:]\s*\S+/gi, replacement: 'password=***' },
      { regex: /token[=:]\s*\S+/gi, replacement: 'token=***' },
      { regex: /key[=:]\s*\S+/gi, replacement: 'key=***' },
      { regex: /secret[=:]\s*\S+/gi, replacement: 'secret=***' },
      { regex: /--password\s+\S+/gi, replacement: '--password ***' },
      { regex: /--token\s+\S+/gi, replacement: '--token ***' },
      { regex: /Bearer\s+\S+/gi, replacement: 'Bearer ***' },
      { regex: /sk-[a-zA-Z0-9]+/gi, replacement: 'sk-***' }, // OpenAI API keys
    ];

    let redacted = content;
    for (const { regex, replacement } of patterns) {
      redacted = redacted.replace(regex, replacement);
    }

    return redacted;
  }

  /**
   * Check if output contains error indicators
   */
  private containsError(output: string): boolean {
    const errorPatterns = [
      /error:/i,
      /exception:/i,
      /failed/i,
      /fatal/i,
      /cannot/i,
      /denied/i,
      /permission denied/i,
      /command not found/i,
    ];

    return errorPatterns.some((pattern) => pattern.test(output));
  }
}
