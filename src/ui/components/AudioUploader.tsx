/**
 * AudioUploader - Now uses client-side processing with auto BPM/Key detection
 * Falls back to backend upload if needed
 */

import React from 'react';
import { AudioUploaderClientSide } from './AudioUploaderClientSide';
import type { AudioFile } from '../../api/types';

interface AudioUploaderProps {
  projectId?: string;
  trackId?: string;
  onUploadComplete?: (file: AudioFile | any) => void;
  accept?: string;
  maxSizeMB?: number;
}

/**
 * AudioUploader - Wrapper component that uses client-side processing by default
 * This ensures uploads work without a backend server and includes auto BPM/Key detection
 */
export const AudioUploader: React.FC<AudioUploaderProps> = (props) => {
  // Use client-side uploader for better performance and offline capability
  return <AudioUploaderClientSide {...props} />;
};
