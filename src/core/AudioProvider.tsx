'use client';

import { createContext, useContext, useEffect, useRef, ReactNode } from 'react';

interface AudioContextValue {
  audioContext: AudioContext | null;
  getAudioContext: () => AudioContext;
}

const AudioContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new window.AudioContext();
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      if (typeof window !== 'undefined') {
        audioContextRef.current = new window.AudioContext();
      } else {
        throw new Error('AudioContext can only be created in browser');
      }
    }
    return audioContextRef.current;
  };

  return (
    <AudioContext.Provider
      value={{
        audioContext: audioContextRef.current,
        getAudioContext,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudioContext() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudioContext must be used within AudioProvider');
  }
  return context;
}
