/**
 * Audio Device Utilities
 * Functions for managing audio input/output devices
 */

export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
  groupId: string;
}

/**
 * Get all available audio input devices
 */
export const getAudioInputDevices = async (): Promise<AudioDevice[]> => {
  try {
    // Request permission first
    await navigator.mediaDevices.getUserMedia({ audio: true });

    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices
      .filter((device) => device.kind === 'audioinput')
      .map((device) => ({
        deviceId: device.deviceId,
        label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
        kind: 'audioinput' as const,
        groupId: device.groupId,
      }));

    return audioInputs;
  } catch (error) {
    console.error('Failed to get audio input devices:', error);
    return [];
  }
};

/**
 * Get all available audio output devices
 */
export const getAudioOutputDevices = async (): Promise<AudioDevice[]> => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioOutputs = devices
      .filter((device) => device.kind === 'audiooutput')
      .map((device) => ({
        deviceId: device.deviceId,
        label: device.label || `Speaker ${device.deviceId.slice(0, 8)}`,
        kind: 'audiooutput' as const,
        groupId: device.groupId,
      }));

    return audioOutputs;
  } catch (error) {
    console.error('Failed to get audio output devices:', error);
    return [];
  }
};

/**
 * Get both input and output devices
 */
export const getAllAudioDevices = async (): Promise<{
  inputs: AudioDevice[];
  outputs: AudioDevice[];
}> => {
  const [inputs, outputs] = await Promise.all([
    getAudioInputDevices(),
    getAudioOutputDevices(),
  ]);

  return { inputs, outputs };
};

/**
 * Listen for device changes
 */
export const onDeviceChange = (callback: () => void): (() => void) => {
  navigator.mediaDevices.addEventListener('devicechange', callback);
  return () => {
    navigator.mediaDevices.removeEventListener('devicechange', callback);
  };
};
