import { useRef, useCallback, useEffect } from 'react';
import { useTrackStore } from './store';
import { useTransport } from './transport';

export const useRecording = () => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const currentDeviceIdRef = useRef<string | undefined>(undefined);

  const { addRecording, activeTrackId, tracks } = useTrackStore();
  const { state: transportState } = useTransport();

  const activeTrack = tracks.find((t) => t.id === activeTrackId);
  const isRecordArmed = activeTrack?.recordArm || false;
  const inputDeviceId = activeTrack?.inputDeviceId;

  // Initialize audio stream
  const initializeStream = useCallback(async (deviceId?: string) => {
    try {
      // Stop existing stream if device changed
      if (streamRef.current && currentDeviceIdRef.current !== deviceId) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Don't reinitialize if already using the same device
      if (streamRef.current && currentDeviceIdRef.current === deviceId) {
        return streamRef.current;
      }

      const constraints: MediaStreamConstraints = {
        audio: deviceId
          ? { deviceId: { exact: deviceId } }
          : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      currentDeviceIdRef.current = deviceId;
      return stream;
    } catch (error) {
      console.error('Failed to initialize audio stream:', error);
      throw error;
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!activeTrackId) {
      console.warn('No active track selected');
      return;
    }

    if (!isRecordArmed) {
      console.warn('Track is not record armed');
      return;
    }

    try {
      const stream = streamRef.current || (await initializeStream(inputDeviceId));

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      audioChunksRef.current = [];
      startTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const duration = (Date.now() - startTimeRef.current) / 1000;

        if (activeTrackId) {
          const recording = {
            id: `recording-${Date.now()}`,
            blob,
            duration,
            createdAt: new Date(),
          };
          addRecording(activeTrackId, recording);
        }

        audioChunksRef.current = [];
      };

      mediaRecorder.start(100); // Collect data every 100ms
      mediaRecorderRef.current = mediaRecorder;

      console.log('Recording started on track:', activeTrackId);
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }, [activeTrackId, isRecordArmed, inputDeviceId, initializeStream, addRecording]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      console.log('Recording stopped');
    }
  }, []);

  // Initialize/cleanup stream when track is record armed or device changes
  useEffect(() => {
    if (isRecordArmed) {
      initializeStream(inputDeviceId).catch((error) => {
        console.error('Failed to initialize recording stream:', error);
      });
    } else {
      // Stop and release stream when record arm is disabled
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        currentDeviceIdRef.current = undefined;
        console.log('Recording stream stopped and released');
      }
    }
  }, [isRecordArmed, inputDeviceId, initializeStream]);

  // Auto-start/stop based on transport state and record arm
  useEffect(() => {
    if (transportState === 'recording' && isRecordArmed) {
      startRecording();
    } else if (transportState !== 'recording' && mediaRecorderRef.current?.state === 'recording') {
      stopRecording();
    }
  }, [transportState, isRecordArmed, startRecording, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    isRecording: mediaRecorderRef.current?.state === 'recording',
    mediaStream: streamRef.current,
    startRecording,
    stopRecording,
    initializeStream,
  };
};
