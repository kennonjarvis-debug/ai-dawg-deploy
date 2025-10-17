'use client';

import { createContext, useContext, useRef, useCallback, ReactNode } from 'react';

interface AudioContextValue {
  getAudioContext: () => AudioContext;
  audioContext: AudioContext | null;
}

const AudioContextContext = createContext<AudioContextValue | null>(null);

export function AudioContextProvider({ children }: { children: ReactNode }) {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  return (
    <AudioContextContext.Provider
      value={{
        getAudioContext,
        audioContext: audioContextRef.current,
      }}
    >
      {children}
    </AudioContextContext.Provider>
  );
}

export function useAudioContext() {
  const context = useContext(AudioContextContext);
  if (!context) {
    throw new Error('useAudioContext must be used within AudioContextProvider');
  }
  return context;
}
