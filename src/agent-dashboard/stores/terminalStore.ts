import { create } from 'zustand';
import { TerminalSession, SessionStatus, CommandHistoryItem, AIAnalysis, LatencyInfo } from '../types';

interface TerminalStore {
  // Sessions
  sessions: TerminalSession[];
  activeSessionId: string | null;
  maxSessions: number;

  // Command history
  commandHistory: CommandHistoryItem[];
  historyIndex: number;

  // AI Analysis
  analyses: Record<string, AIAnalysis>;

  // Connection
  isConnected: boolean;
  latency: LatencyInfo | null;

  // Notepad
  notepadContent: string;

  // Actions
  createSession: (id: string) => void;
  closeSession: (id: string) => void;
  setActiveSession: (id: string) => void;
  updateSessionStatus: (id: string, status: SessionStatus) => void;
  updateSessionActivity: (id: string) => void;
  updateSessionDimensions: (id: string, rows: number, cols: number) => void;
  setScrollback: (id: string, lines: string[]) => void;

  addCommandToHistory: (command: string) => void;
  navigateHistory: (direction: 'up' | 'down') => string | null;

  setAnalysis: (sessionId: string, analysis: AIAnalysis) => void;

  setConnected: (connected: boolean) => void;
  setLatency: (latency: LatencyInfo) => void;

  setNotepadContent: (content: string) => void;
}

export const useTerminalStore = create<TerminalStore>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  maxSessions: 6,
  commandHistory: [],
  historyIndex: -1,
  analyses: {},
  isConnected: false,
  latency: null,
  notepadContent: '',

  createSession: (id: string) => {
    const { sessions, maxSessions } = get();
    if (sessions.length >= maxSessions) {
      console.warn(`Maximum sessions (${maxSessions}) reached`);
      return;
    }

    const newSession: TerminalSession = {
      id,
      status: 'idle',
      title: `Terminal ${sessions.length + 1}`,
      rows: 24,
      cols: 80,
      scrollbackBuffer: [],
      lastActivity: Date.now(),
      isActive: sessions.length === 0,
    };

    set({
      sessions: [...sessions, newSession],
      activeSessionId: sessions.length === 0 ? id : get().activeSessionId,
    });
  },

  closeSession: (id: string) => {
    const { sessions, activeSessionId } = get();
    const newSessions = sessions.filter(s => s.id !== id);
    const newActiveId = activeSessionId === id
      ? (newSessions.length > 0 ? newSessions[0].id : null)
      : activeSessionId;

    set({
      sessions: newSessions,
      activeSessionId: newActiveId,
    });
  },

  setActiveSession: (id: string) => {
    set({ activeSessionId: id });
  },

  updateSessionStatus: (id: string, status: SessionStatus) => {
    set(state => ({
      sessions: state.sessions.map(s =>
        s.id === id ? { ...s, status } : s
      ),
    }));
  },

  updateSessionActivity: (id: string) => {
    set(state => ({
      sessions: state.sessions.map(s =>
        s.id === id ? { ...s, lastActivity: Date.now() } : s
      ),
    }));
  },

  updateSessionDimensions: (id: string, rows: number, cols: number) => {
    set(state => ({
      sessions: state.sessions.map(s =>
        s.id === id ? { ...s, rows, cols } : s
      ),
    }));
  },

  setScrollback: (id: string, lines: string[]) => {
    set(state => ({
      sessions: state.sessions.map(s =>
        s.id === id ? { ...s, scrollbackBuffer: lines } : s
      ),
    }));
  },

  addCommandToHistory: (command: string) => {
    const { commandHistory } = get();
    set({
      commandHistory: [...commandHistory, { command, timestamp: Date.now() }],
      historyIndex: -1,
    });
  },

  navigateHistory: (direction: 'up' | 'down') => {
    const { commandHistory, historyIndex } = get();
    if (commandHistory.length === 0) return null;

    let newIndex = historyIndex;
    if (direction === 'up') {
      newIndex = historyIndex === -1
        ? commandHistory.length - 1
        : Math.max(0, historyIndex - 1);
    } else {
      newIndex = historyIndex === -1
        ? -1
        : Math.min(commandHistory.length - 1, historyIndex + 1);
    }

    set({ historyIndex: newIndex });
    return newIndex === -1 ? '' : commandHistory[newIndex].command;
  },

  setAnalysis: (sessionId: string, analysis: AIAnalysis) => {
    set(state => ({
      analyses: {
        ...state.analyses,
        [sessionId]: analysis,
      },
    }));
  },

  setConnected: (connected: boolean) => {
    set({ isConnected: connected });
  },

  setLatency: (latency: LatencyInfo) => {
    set({ latency });
  },

  setNotepadContent: (content: string) => {
    set({ notepadContent: content });
  },
}));
