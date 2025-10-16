/**
 * Gateway Service Type Definitions
 * Claude Instance 2 - Terminal Gateway & SSH PTY Multiplexer
 */

import { ClientChannel } from 'ssh2';

export interface HostConfig {
  id: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
}

export interface SessionConfig {
  hostId: string;
  user: string;
  cols?: number;
  rows?: number;
}

export interface Session {
  id: string;
  hostId: string;
  user: string;
  createdAt: number;
  lastActivity: number;
  sshStream?: ClientChannel;
  status: 'connecting' | 'active' | 'inactive' | 'terminated';
  cols: number;
  rows: number;
  deniedCommands: number;
}

export interface WebSocketMessage {
  type: 'input' | 'resize' | 'heartbeat';
  data?: string;
  cols?: number;
  rows?: number;
}

export interface WebSocketResponse {
  type: 'data' | 'status' | 'exit' | 'error';
  data?: string;
  status?: Session['status'];
  exitCode?: number;
  error?: string;
}

export interface GatewayConfig {
  port: number;
  sessionTTL: number; // milliseconds
  maxSessions: number;
  inactivityTimeout: number; // milliseconds
  heartbeatInterval: number; // milliseconds
  hosts: HostConfig[];
  allowedCommands: string[];
  deniedCommands: string[];
  enableAI: boolean;
  privilegedApproval: boolean;
}

export interface CommandAnalysis {
  command: string;
  allowed: boolean;
  reason?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export interface TranscriptEntry {
  sessionId: string;
  timestamp: number;
  type: 'input' | 'output' | 'command' | 'denied';
  content: string;
  redacted?: boolean;
}

export interface MonitorBuffer {
  sessionId: string;
  entries: TranscriptEntry[];
  maxSize: number;
  errorCount: number;
  exitCodes: number[];
  startTime: number;
  lastCommandTime?: number;
}

export interface AIAnalysisRequest {
  sessionId: string;
  tokenBudget?: number;
}

export interface AIAnalysisResponse {
  suggestions: Array<{
    command: string;
    description: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    requiresApproval: boolean;
  }>;
  summary: string;
  tokenUsage: number;
}
