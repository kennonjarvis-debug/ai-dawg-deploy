export type SessionStatus = 'connected' | 'idle' | 'busy' | 'offline';

export interface TerminalSession {
  id: string;
  status: SessionStatus;
  title: string;
  rows: number;
  cols: number;
  scrollbackBuffer: string[];
  lastActivity: number;
  isActive: boolean;
}

export interface SessionDimensions {
  rows: number;
  cols: number;
}

export interface CommandHistoryItem {
  command: string;
  timestamp: number;
}

export interface AIAnalysis {
  sessionId: string;
  suggestions: string[];
  timestamp: number;
}

export interface LatencyInfo {
  ping: number;
  lastUpdate: number;
}
