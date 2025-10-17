/**
 * Recording Storage Utilities
 * Helper functions for uploading/downloading recordings to/from S3
 */

import type { Recording } from '@/src/core/types';

export interface UploadRecordingOptions {
  blob: Blob;
  projectId: string;
  recordingId: string;
  fileName?: string;
}

export interface UploadRecordingResult {
  s3Key: string;
  s3Url: string;
  size: number;
  contentType: string;
}

/**
 * Upload a recording blob to S3
 * Returns S3 key and URL for storage in Recording object
 */
export async function uploadRecordingToS3(
  options: UploadRecordingOptions
): Promise<UploadRecordingResult> {
  const { blob, projectId, recordingId, fileName } = options;

  const formData = new FormData();
  formData.append('file', blob, fileName || `recording-${recordingId}.webm`);
  formData.append('projectId', projectId);
  formData.append('recordingId', recordingId);

  const response = await fetch('/api/audio/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || `Upload failed: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    s3Key: data.key,
    s3Url: data.url,
    size: data.size,
    contentType: data.contentType,
  };
}

/**
 * Get a signed URL for playing back a recording
 * @param s3Key - S3 key of the recording
 * @param recordingId - Optional recording ID for ownership verification
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 */
export async function getRecordingPlaybackUrl(
  s3Key: string,
  recordingId?: string,
  expiresIn: number = 3600
): Promise<string> {
  const params = new URLSearchParams({
    key: s3Key,
    expiresIn: expiresIn.toString(),
  });

  if (recordingId) {
    params.append('recordingId', recordingId);
  }

  const response = await fetch(`/api/audio/url?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to get URL' }));
    throw new Error(error.error || `Failed to get playback URL: ${response.statusText}`);
  }

  const data = await response.json();
  return data.url;
}

/**
 * Delete a recording from S3
 * @param s3Key - S3 key of the recording
 * @param recordingId - Optional recording ID for ownership verification
 */
export async function deleteRecordingFromS3(
  s3Key: string,
  recordingId?: string
): Promise<void> {
  const response = await fetch('/api/audio/delete', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: s3Key,
      recordingId,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Delete failed' }));
    throw new Error(error.error || `Failed to delete recording: ${response.statusText}`);
  }
}

/**
 * Load recording audio data for playback
 * Works with both S3 and local blob recordings
 */
export async function loadRecordingAudio(
  recording: Recording,
  audioContext: AudioContext
): Promise<AudioBuffer> {
  let arrayBuffer: ArrayBuffer;

  // Try S3 first (preferred)
  if (recording.s3Key) {
    const url = await getRecordingPlaybackUrl(recording.s3Key, recording.id);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch recording: ${response.statusText}`);
    }

    arrayBuffer = await response.arrayBuffer();
  }
  // Fallback to local blob
  else if (recording.blob) {
    arrayBuffer = await recording.blob.arrayBuffer();
  }
  // No audio data available
  else {
    throw new Error('No audio data available for recording');
  }

  // Decode to AudioBuffer
  try {
    return await audioContext.decodeAudioData(arrayBuffer);
  } catch (error) {
    throw new Error(`Failed to decode audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if a recording has audio data (either S3 or blob)
 */
export function hasRecordingAudio(recording: Recording): boolean {
  return !!(recording.s3Key || recording.blob);
}

/**
 * Check if a recording is stored in S3 (vs local blob)
 */
export function isRecordingInS3(recording: Recording): boolean {
  return !!recording.s3Key;
}

/**
 * Get the storage type of a recording
 */
export function getRecordingStorageType(recording: Recording): 's3' | 'local' | 'none' {
  if (recording.s3Key) return 's3';
  if (recording.blob) return 'local';
  return 'none';
}
