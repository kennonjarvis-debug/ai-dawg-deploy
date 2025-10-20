import { logger } from './logger';

/**
 * Export Audio Utilities
 * Functions for exporting audio recordings in various formats
 */

export interface ExportOptions {
  format: 'webm' | 'wav';
  filename?: string;
}

/**
 * Export a recording as WebM (original format)
 */
export const exportAsWebM = (blob: Blob, filename: string = 'recording.webm') => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Convert WebM blob to WAV format and export
 */
export const exportAsWAV = async (blob: Blob, filename: string = 'recording.wav') => {
  try {
    // Create audio context
    const audioContext = new AudioContext();

    // Decode audio data
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Convert to WAV
    const wavBlob = audioBufferToWav(audioBuffer);

    // Download
    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Close audio context
    await audioContext.close();
  } catch (error) {
    logger.error('Failed to export as WAV:', error);
    throw error;
  }
};

/**
 * Convert AudioBuffer to WAV blob
 */
const audioBufferToWav = (audioBuffer: AudioBuffer): Blob => {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numberOfChannels * bytesPerSample;

  const data = interleave(audioBuffer);
  const dataLength = data.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  // Write WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, format, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // byte rate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Write audio data
  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    const rawSample = data[i];
    if (rawSample === undefined) continue;
    const sample = Math.max(-1, Math.min(1, rawSample));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
};

/**
 * Interleave multi-channel audio data
 */
const interleave = (audioBuffer: AudioBuffer): Float32Array => {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * numberOfChannels;
  const result = new Float32Array(length);

  const channels: Float32Array[] = [];
  for (let i = 0; i < numberOfChannels; i++) {
    channels.push(audioBuffer.getChannelData(i));
  }

  let offset = 0;
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = channels[channel];
      const sample = channelData ? channelData[i] : 0;
      result[offset++] = sample ?? 0;
    }
  }

  return result;
};

/**
 * Write string to DataView
 */
const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

/**
 * Main export function
 */
export const exportRecording = async (
  blob: Blob,
  options: ExportOptions
): Promise<void> => {
  const { format, filename } = options;

  if (format === 'webm') {
    exportAsWebM(blob, filename || 'recording.webm');
  } else if (format === 'wav') {
    await exportAsWAV(blob, filename || 'recording.wav');
  } else {
    throw new Error(`Unsupported export format: ${format}`);
  }
};
