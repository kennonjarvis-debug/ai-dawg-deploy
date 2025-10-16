import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format time in seconds to MM:SS.mmm format
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

/**
 * Format time in bars and beats (bar.beat.tick)
 */
export function formatBarsBeatsTicks(
  totalBeats: number,
  beatsPerBar: number = 4,
  ticksPerBeat: number = 960
): string {
  const bar = Math.floor(totalBeats / beatsPerBar) + 1;
  const beat = Math.floor(totalBeats % beatsPerBar) + 1;
  const tick = Math.floor((totalBeats % 1) * ticksPerBeat);

  return `${String(bar).padStart(3, '0')}.${beat}.${tick}`;
}

/**
 * Convert seconds to beats based on BPM
 */
export function secondsToBeats(seconds: number, bpm: number): number {
  return (seconds / 60) * bpm;
}
