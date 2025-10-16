/**
 * Session Manager
 * Manages SSH PTY sessions with lifecycle, TTL, and inactivity timeouts
 */

import { Client as SSHClient, ClientChannel } from 'ssh2';
import { Session, SessionConfig, HostConfig } from './types';
import { logger } from './logger';
import { config } from './config';
import { v4 as uuidv4 } from 'uuid';

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private userSessions: Map<string, Set<string>> = new Map();
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    // Start cleanup timer
    this.cleanupInterval = setInterval(() => {
      this.cleanupSessions();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Create a new SSH PTY session
   */
  async createSession(sessionConfig: SessionConfig): Promise<{ sessionId: string; session: Session }> {
    const { hostId, user, cols = 80, rows = 24 } = sessionConfig;

    // Check max sessions per user
    const userSessionIds = this.userSessions.get(user) || new Set();
    if (userSessionIds.size >= config.maxSessions) {
      throw new Error(`Maximum sessions (${config.maxSessions}) reached for user ${user}`);
    }

    // Find host config
    const hostConfig = config.hosts.find((h) => h.id === hostId);
    if (!hostConfig) {
      throw new Error(`Host ${hostId} not found`);
    }

    const sessionId = uuidv4();
    const session: Session = {
      id: sessionId,
      hostId,
      user,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      status: 'connecting',
      cols,
      rows,
      deniedCommands: 0,
    };

    this.sessions.set(sessionId, session);
    userSessionIds.add(sessionId);
    this.userSessions.set(user, userSessionIds);

    logger.info('Session created', {
      sessionId,
      hostId,
      user,
      totalSessions: this.sessions.size,
    });

    try {
      await this.connectSSH(sessionId, hostConfig, cols, rows);
      session.status = 'active';
      logger.info('SSH connection established', { sessionId, hostId });
    } catch (error) {
      session.status = 'terminated';
      logger.error('SSH connection failed', {
        sessionId,
        hostId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }

    return { sessionId, session };
  }

  /**
   * Connect to SSH host and create PTY
   */
  private connectSSH(sessionId: string, hostConfig: HostConfig, cols: number, rows: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return reject(new Error('Session not found'));
      }

      const ssh = new SSHClient();

      ssh.on('ready', () => {
        ssh.shell({ cols, rows, term: 'xterm-256color' }, (err, stream: ClientChannel) => {
          if (err) {
            ssh.end();
            return reject(err);
          }

          session.sshStream = stream;

          stream.on('close', () => {
            logger.info('SSH stream closed', { sessionId });
            this.terminateSession(sessionId);
          });

          stream.on('error', (err) => {
            logger.error('SSH stream error', { sessionId, error: err.message });
          });

          resolve();
        });
      });

      ssh.on('error', (err) => {
        logger.error('SSH connection error', {
          sessionId,
          host: hostConfig.host,
          error: err.message,
        });
        reject(err);
      });

      // Connect
      const connectionConfig: any = {
        host: hostConfig.host,
        port: hostConfig.port,
        username: hostConfig.username,
      };

      if (hostConfig.password) {
        connectionConfig.password = hostConfig.password;
      }

      if (hostConfig.privateKey) {
        connectionConfig.privateKey = hostConfig.privateKey;
        if (hostConfig.passphrase) {
          connectionConfig.passphrase = hostConfig.passphrase;
        }
      }

      ssh.connect(connectionConfig);
    });
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Update session activity timestamp
   */
  updateActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = Date.now();
    }
  }

  /**
   * Resize terminal
   */
  resizeTerminal(sessionId: string, cols: number, rows: number): void {
    const session = this.sessions.get(sessionId);
    if (session?.sshStream) {
      session.cols = cols;
      session.rows = rows;
      session.sshStream.setWindow(rows, cols, 0, 0);
      logger.debug('Terminal resized', { sessionId, cols, rows });
    }
  }

  /**
   * Write data to session
   */
  write(sessionId: string, data: string): void {
    const session = this.sessions.get(sessionId);
    if (session?.sshStream) {
      session.sshStream.write(data);
      this.updateActivity(sessionId);
    }
  }

  /**
   * Terminate session
   */
  terminateSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    if (session.sshStream) {
      session.sshStream.end();
    }

    session.status = 'terminated';

    // Remove from user sessions
    const userSessionIds = this.userSessions.get(session.user);
    if (userSessionIds) {
      userSessionIds.delete(sessionId);
      if (userSessionIds.size === 0) {
        this.userSessions.delete(session.user);
      }
    }

    this.sessions.delete(sessionId);

    logger.info('Session terminated', {
      sessionId,
      duration: Date.now() - session.createdAt,
      deniedCommands: session.deniedCommands,
    });
  }

  /**
   * Clean up expired and inactive sessions
   */
  private cleanupSessions(): void {
    const now = Date.now();
    const sessionsToTerminate: string[] = [];

    for (const [sessionId, session] of this.sessions) {
      // Check TTL
      if (now - session.createdAt > config.sessionTTL) {
        logger.info('Session expired (TTL)', { sessionId });
        sessionsToTerminate.push(sessionId);
        continue;
      }

      // Check inactivity
      if (now - session.lastActivity > config.inactivityTimeout) {
        logger.info('Session expired (inactivity)', { sessionId });
        sessionsToTerminate.push(sessionId);
      }
    }

    sessionsToTerminate.forEach((id) => this.terminateSession(id));
  }

  /**
   * Get session count for a user
   */
  getUserSessionCount(user: string): number {
    return this.userSessions.get(user)?.size || 0;
  }

  /**
   * Get all sessions for a user
   */
  getUserSessions(user: string): Session[] {
    const sessionIds = this.userSessions.get(user) || new Set();
    return Array.from(sessionIds)
      .map((id) => this.sessions.get(id))
      .filter((s): s is Session => s !== undefined);
  }

  /**
   * Increment denied command count
   */
  incrementDeniedCommands(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.deniedCommands++;
    }
  }

  /**
   * Cleanup on shutdown
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Terminate all sessions
    const sessionIds = Array.from(this.sessions.keys());
    sessionIds.forEach((id) => this.terminateSession(id));

    logger.info('Session manager shutdown complete');
  }
}
