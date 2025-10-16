import { create } from 'zustand';

export interface TransportState {
  // Playback state
  isPlaying: boolean;
  isRecording: boolean;
  isLooping: boolean;
  loopStart: number; // seconds
  loopEnd: number; // seconds

  // Time and tempo
  currentTime: number; // in seconds
  bpm: number;
  timeSignature: { numerator: number; denominator: number };

  // Volume
  masterVolume: number; // 0 to 1

  // Punch recording
  punchMode: 'off' | 'quick-punch' | 'track-punch';
  punchInTime: number | null;
  punchOutTime: number | null;

  // Recording aids
  preRoll: number;       // bars
  postRoll: number;      // bars
  enablePreRoll: boolean;
  enablePostRoll: boolean;
  countIn: number;       // bars

  // Input monitoring
  globalInputMode: 'auto' | 'input-only';

  // Metronome
  metronomeEnabled: boolean;
  metronomeVolume: number;

  // Actions
  play: () => void;
  pause: () => void;
  stop: () => void;
  togglePlay: () => void;
  toggleLoop: () => void;
  toggleRecord: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  setLooping: (looping: boolean) => void;
  seek: (time: number) => void;
  reset: () => void;

  setBpm: (bpm: number) => void;
  setCurrentTime: (time: number) => void;
  setMasterVolume: (volume: number) => void;
  setTimeSignature: (numerator: number, denominator: number) => void;

  // Punch recording
  setPunchMode: (mode: 'off' | 'quick-punch' | 'track-punch') => void;
  setPunchRange: (inTime: number | null, outTime: number | null) => void;
  setPunchInTime: (time: number | null) => void;
  setPunchOutTime: (time: number | null) => void;
  clearPunchTimes: () => void;

  // Recording aids
  setPreRoll: (bars: number) => void;
  setPostRoll: (bars: number) => void;
  togglePreRoll: () => void;
  togglePostRoll: () => void;
  setPreRollEnabled: (enabled: boolean) => void;
  setPostRollEnabled: (enabled: boolean) => void;
  setCountIn: (bars: number) => void;

  // Input monitoring
  setGlobalInputMode: (mode: 'auto' | 'input-only') => void;

  // Metronome
  toggleMetronome: () => void;
  setMetronomeVolume: (volume: number) => void;
  setMetronomeEnabled: (enabled: boolean) => void;

  // Loop region
  setLoopRegion: (start: number, end: number) => void;
  getLoopDuration: () => number;
  getLoopDurationInBars: () => number;
  isInLoopRegion: () => boolean;

  // Transport controls
  skipBackward: () => void;
  skipForward: () => void;
  returnToStart: () => void;
  addMarker: () => void;

  // Time calculation helpers
  getSecondsPerBeat: () => number;
  getSecondsPerBar: () => number;
  getPreRollSeconds: () => number;
  getPostRollSeconds: () => number;
  getCountInSeconds: () => number;
  getTotalPreRecordingTime: () => number;
  barsToSeconds: (bars: number) => number;
}

export const useTransportStore = create<TransportState>((set, get) => ({
  // Initial state
  isPlaying: false,
  isRecording: false,
  isLooping: false,
  loopStart: 0,
  loopEnd: 8,
  currentTime: 0,
  bpm: 120,
  timeSignature: { numerator: 4, denominator: 4 },
  masterVolume: 0.75,

  // Punch recording
  punchMode: 'off',
  punchInTime: null,
  punchOutTime: null,

  // Recording aids
  preRoll: 0,
  postRoll: 0,
  enablePreRoll: false,
  enablePostRoll: false,
  countIn: 0,

  // Input monitoring
  globalInputMode: 'auto',

  // Metronome
  metronomeEnabled: false,
  metronomeVolume: 0.5,

  // Actions
  play: () => {
    set({ isPlaying: true });
    console.log('[Transport] Playing');
  },

  pause: () => {
    set({ isPlaying: false });
    console.log('[Transport] Paused');
  },

  stop: () => {
    set({ isPlaying: false, currentTime: 0 });
    console.log('[Transport] Stopped');
  },

  togglePlay: () => {
    const { isPlaying, play, pause } = get();
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  },

  toggleLoop: () => {
    set((state) => ({ isLooping: !state.isLooping }));
    console.log('[Transport] Loop:', !get().isLooping);
  },

  toggleRecord: () => {
    set((state) => ({ isRecording: !state.isRecording }));
    console.log('[Transport] Record:', !get().isRecording);
  },

  startRecording: () => {
    set({ isRecording: true, isPlaying: true });
    console.log('[Transport] Recording started');
  },

  stopRecording: () => {
    set({ isRecording: false });
    console.log('[Transport] Recording stopped');
  },

  setLooping: (looping: boolean) => {
    set({ isLooping: looping });
    console.log('[Transport] Looping set to:', looping);
  },

  seek: (time: number) => {
    set({ currentTime: Math.max(0, time) });
    console.log('[Transport] Seeked to:', time);
  },

  reset: () => {
    set({
      isPlaying: false,
      isRecording: false,
      isLooping: false,
      loopStart: 0,
      loopEnd: 8,
      currentTime: 0,
      bpm: 120,
      timeSignature: { numerator: 4, denominator: 4 },
      masterVolume: 0.75,
      punchMode: 'off',
      punchInTime: null,
      punchOutTime: null,
      preRoll: 0,
      postRoll: 0,
      enablePreRoll: false,
      enablePostRoll: false,
      countIn: 0,
      metronomeEnabled: false,
      metronomeVolume: 0.5,
    });
    console.log('[Transport] Reset to initial state');
  },

  setBpm: (bpm: number) => {
    // Validate BPM range (Pro Tools standard: 20-300)
    if (bpm < 20 || bpm > 300) {
      throw new Error('BPM must be between 20 and 300');
    }
    set({ bpm });
    console.log('[Transport] BPM set to:', bpm);
  },

  setCurrentTime: (time: number) => {
    set({ currentTime: Math.max(0, time) });
  },

  setMasterVolume: (volume: number) => {
    // Clamp volume between 0 and 1
    const clampedVolume = Math.max(0, Math.min(1, volume));
    set({ masterVolume: clampedVolume });
    console.log('[Transport] Master volume set to:', clampedVolume);
  },

  setTimeSignature: (numerator: number, denominator: number) => {
    set({ timeSignature: { numerator, denominator } });
    console.log('[Transport] Time signature set to:', `${numerator}/${denominator}`);
  },

  skipBackward: () => {
    const { currentTime, bpm, timeSignature } = get();
    // Skip backward by one bar
    const beatsPerBar = timeSignature.numerator;
    const secondsPerBeat = 60 / bpm;
    const secondsPerBar = beatsPerBar * secondsPerBeat;
    const newTime = Math.max(0, currentTime - secondsPerBar);
    set({ currentTime: newTime });
    console.log('[Transport] Skip backward to:', newTime);
  },

  skipForward: () => {
    const { currentTime, bpm, timeSignature } = get();
    // Skip forward by one bar
    const beatsPerBar = timeSignature.numerator;
    const secondsPerBeat = 60 / bpm;
    const secondsPerBar = beatsPerBar * secondsPerBeat;
    const newTime = currentTime + secondsPerBar;
    set({ currentTime: newTime });
    console.log('[Transport] Skip forward to:', newTime);
  },

  returnToStart: () => {
    set({ currentTime: 0 });
    console.log('[Transport] Returned to start');
  },

  addMarker: () => {
    const { currentTime } = get();
    console.log('[Transport] Marker added at:', currentTime);
    // TODO: Implement marker storage
  },

  // Punch recording
  setPunchMode: (mode: 'off' | 'quick-punch' | 'track-punch') => {
    set({ punchMode: mode });
    console.log('[Transport] Punch mode set to:', mode);
  },

  setPunchRange: (inTime: number | null, outTime: number | null) => {
    if (inTime !== null && outTime !== null && outTime <= inTime) {
      throw new Error('Punch out time must be after punch in time');
    }
    set({ punchInTime: inTime, punchOutTime: outTime });
    console.log('[Transport] Punch range set:', { inTime, outTime });
  },

  setPunchInTime: (time: number | null) => {
    const { punchOutTime } = get();
    if (time !== null && punchOutTime !== null && time >= punchOutTime) {
      throw new Error('Punch in time must be before punch out time');
    }
    set({ punchInTime: time });
    console.log('[Transport] Punch in time set to:', time);
  },

  setPunchOutTime: (time: number | null) => {
    const { punchInTime } = get();
    if (time !== null && punchInTime !== null && time <= punchInTime) {
      throw new Error('Punch out time must be after punch in time');
    }
    set({ punchOutTime: time });
    console.log('[Transport] Punch out time set to:', time);
  },

  clearPunchTimes: () => {
    set({ punchInTime: null, punchOutTime: null });
    console.log('[Transport] Punch times cleared');
  },

  // Recording aids
  setPreRoll: (bars: number) => {
    if (bars < 0 || bars > 4) {
      throw new Error('Pre-roll must be between 0 and 4 bars');
    }
    set({ preRoll: bars });
    console.log('[Transport] Pre-roll set to:', bars, 'bars');
  },

  setPostRoll: (bars: number) => {
    if (bars < 0 || bars > 4) {
      throw new Error('Post-roll must be between 0 and 4 bars');
    }
    set({ postRoll: bars });
    console.log('[Transport] Post-roll set to:', bars, 'bars');
  },

  togglePreRoll: () => {
    set((state) => ({ enablePreRoll: !state.enablePreRoll }));
    console.log('[Transport] Pre-roll enabled:', !get().enablePreRoll);
  },

  togglePostRoll: () => {
    set((state) => ({ enablePostRoll: !state.enablePostRoll }));
    console.log('[Transport] Post-roll enabled:', !get().enablePostRoll);
  },

  setPreRollEnabled: (enabled: boolean) => {
    set({ enablePreRoll: enabled });
    console.log('[Transport] Pre-roll enabled:', enabled);
  },

  setPostRollEnabled: (enabled: boolean) => {
    set({ enablePostRoll: enabled });
    console.log('[Transport] Post-roll enabled:', enabled);
  },

  setCountIn: (bars: number) => {
    if (bars < 0 || bars > 4) {
      throw new Error('Count-in must be between 0 and 4 bars');
    }
    set({ countIn: bars });
    console.log('[Transport] Count-in set to:', bars, 'bars');
  },

  // Input monitoring
  setGlobalInputMode: (mode: 'auto' | 'input-only') => {
    set({ globalInputMode: mode });
    console.log('[Transport] Global input mode set to:', mode);
  },

  // Metronome
  toggleMetronome: () => {
    set((state) => ({ metronomeEnabled: !state.metronomeEnabled }));
    console.log('[Transport] Metronome enabled:', !get().metronomeEnabled);
  },

  setMetronomeVolume: (volume: number) => {
    if (volume < 0 || volume > 1) {
      throw new Error('Metronome volume must be between 0 and 1');
    }
    set({ metronomeVolume: volume });
    console.log('[Transport] Metronome volume set to:', volume);
  },

  setMetronomeEnabled: (enabled: boolean) => {
    set({ metronomeEnabled: enabled });
    console.log('[Transport] Metronome enabled:', enabled);
  },

  // Loop region
  setLoopRegion: (start: number, end: number) => {
    if (end <= start) {
      throw new Error('Loop end must be after loop start');
    }
    set({ loopStart: start, loopEnd: end });
    console.log('[Transport] Loop region set:', { start, end });
  },

  getLoopDuration: () => {
    const { loopStart, loopEnd } = get();
    return loopEnd - loopStart;
  },

  getLoopDurationInBars: () => {
    const { loopStart, loopEnd } = get();
    const loopDuration = loopEnd - loopStart;
    const secondsPerBar = get().getSecondsPerBar();
    return Math.round(loopDuration / secondsPerBar);
  },

  isInLoopRegion: () => {
    const { currentTime, loopStart, loopEnd } = get();
    return currentTime >= loopStart && currentTime < loopEnd;
  },

  // Time calculation helpers
  getSecondsPerBeat: () => {
    const { bpm } = get();
    return 60 / bpm;
  },

  getSecondsPerBar: () => {
    const { bpm, timeSignature } = get();
    const secondsPerBeat = 60 / bpm;
    const beatsPerBar = timeSignature.numerator;
    return beatsPerBar * secondsPerBeat;
  },

  barsToSeconds: (bars: number) => {
    const { bpm, timeSignature } = get();
    const secondsPerBeat = 60 / bpm;
    const beatsPerBar = timeSignature.numerator;
    const secondsPerBar = beatsPerBar * secondsPerBeat;
    return bars * secondsPerBar;
  },

  getPreRollSeconds: () => {
    const { preRoll } = get();
    return get().barsToSeconds(preRoll);
  },

  getPostRollSeconds: () => {
    const { postRoll } = get();
    return get().barsToSeconds(postRoll);
  },

  getCountInSeconds: () => {
    const { countIn } = get();
    return get().barsToSeconds(countIn);
  },

  getTotalPreRecordingTime: () => {
    const { countIn, preRoll, enablePreRoll } = get();
    const countInSeconds = get().barsToSeconds(countIn);
    const preRollSeconds = enablePreRoll ? get().barsToSeconds(preRoll) : 0;
    return countInSeconds + preRollSeconds;
  },
}));
