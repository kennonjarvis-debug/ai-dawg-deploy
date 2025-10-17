/**
 * Types for Notes and Voice Memos Integration
 */

export interface Note {
  id: string;
  title: string;
  content: string;
  sourceType: 'ios_notes' | 'voice_memo' | 'manual';
  createdAt: Date;
  updatedAt: Date;
  originalFilePath?: string;
  metadata: {
    wordCount?: number;
    duration?: number; // for voice memos in seconds
    transcriptionStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  };
}

export interface VoiceMemo {
  id: string;
  fileName: string;
  filePath: string;
  duration: number;
  createdAt: Date;
  transcription?: string;
  transcriptionStatus: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface AIAnalysis {
  id: string;
  noteId: string;
  analyzedAt: Date;
  contentType: 'song_lyrics' | 'song_idea' | 'reminder' | 'meeting_note' | 'todo' | 'general_note' | 'other';
  confidence: number;
  summary: string;
  extractedData: {
    keywords?: string[];
    entities?: string[];
    dates?: string[];
    actionItems?: string[];
    songStructure?: {
      verses?: string[];
      chorus?: string[];
      bridge?: string;
    };
  };
  suggestedActions: Action[];
}

export interface Action {
  type: 'finalize_song' | 'schedule_event' | 'create_reminder' | 'create_track' | 'suggest_improvements' | 'archive';
  priority: 'high' | 'medium' | 'low';
  description: string;
  appContext: 'jarvis' | 'dawg_ai' | 'both';
  metadata?: any;
}

export interface AnalysisRequest {
  noteId: string;
  appContext: 'jarvis' | 'dawg_ai';
  userPreferences?: {
    writingStyle?: string;
    musicGenre?: string;
  };
}

export interface SyncStatus {
  lastSyncAt: Date;
  notesProcessed: number;
  memosProcessed: number;
  errors: string[];
}
