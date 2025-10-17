/**
 * Audio Import Utilities
 * Functions for importing and decoding audio files
 */

export interface ImportedAudio {
  blob: Blob;
  audioBuffer: AudioBuffer;
  duration: number;
  sampleRate: number;
  numberOfChannels: number;
  waveformData: number[];
}

/**
 * Decode audio file to AudioBuffer
 */
export const decodeAudioFile = async (file: File): Promise<AudioBuffer> => {
  const audioContext = new AudioContext();
  const arrayBuffer = await file.arrayBuffer();

  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    await audioContext.close();
    return audioBuffer;
  } catch (error) {
    await audioContext.close();
    console.error('Failed to decode audio file:', error);
    throw new Error(`Failed to decode audio file: ${file.name}`);
  }
};

/**
 * Generate waveform data from AudioBuffer
 * Returns normalized amplitude values for visualization
 */
export const generateWaveformData = (
  audioBuffer: AudioBuffer,
  samples: number = 500
): number[] => {
  const channelData = audioBuffer.getChannelData(0); // Use first channel
  const blockSize = Math.floor(channelData.length / samples);
  const waveformData: number[] = [];

  for (let i = 0; i < samples; i++) {
    const start = i * blockSize;
    const end = start + blockSize;
    let sum = 0;

    // Calculate RMS (root mean square) for this block
    for (let j = start; j < end && j < channelData.length; j++) {
      const sample = channelData[j];
      if (sample !== undefined) {
        sum += sample * sample;
      }
    }

    const rms = Math.sqrt(sum / blockSize);
    waveformData.push(rms);
  }

  // Normalize to 0-1 range
  const max = Math.max(...waveformData);
  return waveformData.map((v) => v / max);
};

/**
 * Import audio file and prepare for use
 */
export const importAudioFile = async (file: File): Promise<ImportedAudio> => {
  try {
    // Decode audio
    const audioBuffer = await decodeAudioFile(file);

    // Generate waveform
    const waveformData = generateWaveformData(audioBuffer);

    // Create blob (use original file as blob)
    const blob = new Blob([await file.arrayBuffer()], { type: file.type });

    return {
      blob,
      audioBuffer,
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      numberOfChannels: audioBuffer.numberOfChannels,
      waveformData,
    };
  } catch (error) {
    console.error('Failed to import audio file:', error);
    throw error;
  }
};

/**
 * Import multiple audio files
 */
export const importAudioFiles = async (
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<ImportedAudio[]> => {
  const imported: ImportedAudio[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file) continue;

    try {
      const importedAudio = await importAudioFile(file);
      imported.push(importedAudio);

      if (onProgress) {
        onProgress(i + 1, files.length);
      }
    } catch (error) {
      console.error(`Failed to import ${file.name}:`, error);
      // Continue with other files
    }
  }

  return imported;
};

/**
 * Check if file is a supported audio format
 */
export const isSupportedAudioFormat = (file: File): boolean => {
  const supportedTypes = [
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/mpeg',
    'audio/mp3',
    'audio/ogg',
    'audio/flac',
    'audio/x-m4a',
    'audio/mp4',
  ];

  return supportedTypes.includes(file.type) ||
    /\.(wav|mp3|ogg|flac|m4a)$/i.test(file.name);
};

/**
 * Get audio file metadata without full decoding
 */
export const getAudioMetadata = async (file: File): Promise<{
  name: string;
  size: number;
  type: string;
  duration?: number;
}> => {
  const metadata = {
    name: file.name,
    size: file.size,
    type: file.type,
  };

  try {
    // Try to get duration
    const audioBuffer = await decodeAudioFile(file);
    return {
      ...metadata,
      duration: audioBuffer.duration,
    };
  } catch (error) {
    // Return without duration if decoding fails
    return metadata;
  }
};
