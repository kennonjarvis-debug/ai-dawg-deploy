/**
 * Integration Example: DAWG AI Chatbot with Backend APIs
 * Shows how to connect the chatbot to AutoTopline and Lyric Engine
 */

import React from 'react';
import { ChatbotWidget } from './ChatbotWidget';

/**
 * Example integration component
 */
export const ChatbotIntegrationExample: React.FC = () => {
  /**
   * Handle generation requests from chatbot
   */
  const handleGenerationRequest = async (type: string, params: any): Promise<any> => {
    console.log(`Generation request: ${type}`, params);

    try {
      switch (type) {
        case 'lyrics':
          return await generateLyrics(params);

        case 'melody':
          return await generateMelody(params);

        case 'topline':
          return await generateTopline(params);

        case 'full_song':
          return await generateFullSong(params);

        default:
          throw new Error(`Unknown generation type: ${type}`);
      }
    } catch (error) {
      console.error('Generation error:', error);
      throw error;
    }
  };

  /**
   * Handle audio preview requests
   */
  const handleAudioPreview = (audioUrl: string) => {
    console.log('Play audio:', audioUrl);
    // Implement audio playback logic here
    // Example: Use HTML5 Audio API or Web Audio API
    const audio = new Audio(audioUrl);
    audio.play().catch(err => console.error('Audio playback error:', err));
  };

  return (
    <ChatbotWidget
      onGenerationRequest={handleGenerationRequest}
      onAudioPreview={handleAudioPreview}
    />
  );
};

/**
 * Generate lyrics using Lyric Engine API
 */
async function generateLyrics(params: {
  genre: string;
  mood: string;
  theme?: string;
  section?: string;
  lineCount?: number;
}): Promise<any> {
  const { genre, mood, theme, section = 'verse', lineCount = 8 } = params;

  const response = await fetch('/api/v1/lyrics/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      genre,
      mood,
      theme,
      section,
      lineCount,
    }),
  });

  if (!response.ok) {
    throw new Error(`Lyric generation failed: ${response.statusText}`);
  }

  const result = await response.json();

  return {
    lyrics: result.lyrics,
    metadata: {
      genre,
      mood,
      theme,
      section,
      generatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Generate melody using Melody Generator API
 */
async function generateMelody(params: {
  genre: string;
  mood: string;
  key?: string;
  tempo?: number;
  bars?: number;
}): Promise<any> {
  const { genre, mood, key = 'C', tempo = 120, bars = 8 } = params;

  const response = await fetch('/api/v1/melody/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      genre,
      mood,
      key,
      tempo,
      bars,
    }),
  });

  if (!response.ok) {
    throw new Error(`Melody generation failed: ${response.statusText}`);
  }

  const result = await response.json();

  return {
    notes: result.notes,
    midiData: result.midi_data,
    duration: result.metadata?.duration,
    metadata: {
      genre,
      mood,
      key,
      tempo,
      bars,
      generatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Generate topline using AutoTopline API
 */
async function generateTopline(params: {
  genre: string;
  mood: string;
  key?: string;
  section?: string;
  theme?: string;
}): Promise<any> {
  const { genre, mood, key = 'C', section = 'chorus', theme } = params;

  const response = await fetch('/api/v1/topline/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      genre,
      mood,
      key,
      section,
      theme,
    }),
  });

  if (!response.ok) {
    throw new Error(`Topline generation failed: ${response.statusText}`);
  }

  const result = await response.json();

  return {
    melody: result.melody,
    lyrics: result.lyrics,
    midiData: result.midi_data,
    audioUrl: result.audio_url, // If synthesis available
    metadata: {
      genre,
      mood,
      key,
      section,
      theme,
      generatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Generate full song using Full Composer API
 */
async function generateFullSong(params: {
  genre: string;
  mood: string;
  key?: string;
  tempo?: number;
  structure?: string;
}): Promise<any> {
  const { genre, mood, key = 'C', tempo = 120, structure = 'simple' } = params;

  const response = await fetch('/api/v1/compose', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      genre,
      mood,
      key,
      tempo,
      structure,
    }),
  });

  if (!response.ok) {
    throw new Error(`Composition failed: ${response.statusText}`);
  }

  const result = await response.json();

  return {
    parts: result.parts,
    arrangement: result.arrangement,
    midiData: result.midi_data,
    metadata: {
      genre,
      mood,
      key,
      tempo,
      structure,
      duration: result.metadata?.duration,
      generatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Alternative: Using React Query or SWR
 */
export function useLyricGeneration() {
  const generate = async (params: any) => {
    return await generateLyrics(params);
  };

  return { generate };
}

export function useToplineGeneration() {
  const generate = async (params: any) => {
    return await generateTopline(params);
  };

  return { generate };
}

export function useFullSongGeneration() {
  const generate = async (params: any) => {
    return await generateFullSong(params);
  };

  return { generate };
}
