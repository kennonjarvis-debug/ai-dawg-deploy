/**
 * Widget Integration Helpers
 * Utility functions to help Instance 1 integrate all widgets into dashboard
 */

import { useEffect, useState } from 'react';

/**
 * Hook to manage project state for widgets
 * Centralizes project data that multiple widgets need
 */
export function useProjectState(projectId?: string) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const loadProject = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/load?projectId=${projectId}`);
        const data = await response.json();

        if (data.success) {
          setProject(data.project);
        } else {
          setError(data.error || 'Failed to load project');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  return { project, loading, error, setProject };
}

/**
 * Hook to aggregate track data for ProjectStats widget
 */
export function useProjectStats(tracks: any[]) {
  const [stats, setStats] = useState({
    trackCount: 0,
    totalDuration: 0,
    hasRecordings: false,
  });

  useEffect(() => {
    const trackCount = tracks.length;
    const totalDuration = tracks.reduce((max, track) => {
      const trackDuration = track.recordings?.reduce(
        (sum: number, rec: any) => sum + (rec.duration || 0),
        0
      ) || 0;
      return Math.max(max, trackDuration);
    }, 0);
    const hasRecordings = tracks.some((track) => track.recordings?.length > 0);

    setStats({ trackCount, totalDuration, hasRecordings });
  }, [tracks]);

  return stats;
}

/**
 * Hook to manage audio device preferences
 * Syncs with AudioDeviceSettings widget
 */
export function useAudioDevicePreferences() {
  const [preferences, setPreferences] = useState({
    defaultInputDeviceId: '',
    defaultOutputDeviceId: '',
    sampleRate: 48000,
    bufferSize: 512,
  });

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('audioDevicePreferences');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }

    // Listen for changes from AudioDeviceSettings widget
    const handleChange = (event: CustomEvent) => {
      setPreferences(event.detail);
    };

    window.addEventListener('audioDevicePreferencesChanged', handleChange as EventListener);
    return () => {
      window.removeEventListener('audioDevicePreferencesChanged', handleChange as EventListener);
    };
  }, []);

  return preferences;
}

/**
 * Hook to manage user preferences
 * Syncs with UserSettingsModal widget
 */
export function useUserPreferences() {
  const [preferences, setPreferences] = useState({
    autoSaveEnabled: true,
    autoSaveInterval: 30,
    theme: 'dark' as 'dark' | 'light',
    defaultInput: '',
    defaultOutput: '',
  });

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('userPreferences');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }

    // Listen for changes from UserSettingsModal widget
    const handleChange = (event: CustomEvent) => {
      setPreferences(event.detail);
    };

    window.addEventListener('userPreferencesChanged', handleChange as EventListener);
    return () => {
      window.removeEventListener('userPreferencesChanged', handleChange as EventListener);
    };
  }, []);

  return preferences;
}

/**
 * Hook to manage modal states
 * Centralized modal open/close state management
 */
export function useModalManager() {
  const [openModals, setOpenModals] = useState<Set<string>>(new Set());

  const openModal = (modalId: string) => {
    setOpenModals((prev) => new Set(prev).add(modalId));
  };

  const closeModal = (modalId: string) => {
    setOpenModals((prev) => {
      const next = new Set(prev);
      next.delete(modalId);
      return next;
    });
  };

  const isOpen = (modalId: string) => openModals.has(modalId);

  const closeAll = () => {
    setOpenModals(new Set());
  };

  return { openModal, closeModal, isOpen, closeAll };
}

/**
 * Hook to manage save status for SaveStatusBadge widget
 */
export function useSaveStatus() {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'unsaved'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  const markSaving = () => {
    setStatus('saving');
    setError(undefined);
  };

  const markSaved = () => {
    setStatus('saved');
    setLastSaved(new Date());
    setError(undefined);
  };

  const markError = (errorMessage: string) => {
    setStatus('error');
    setError(errorMessage);
  };

  const markUnsaved = () => {
    setStatus('unsaved');
  };

  const markIdle = () => {
    setStatus('idle');
  };

  return {
    status,
    lastSaved,
    error,
    markSaving,
    markSaved,
    markError,
    markUnsaved,
    markIdle,
  };
}

/**
 * Helper to export project to WAV
 * Used by QuickActions widget
 */
export async function exportProjectToWAV(tracks: any[], audioContext: AudioContext) {
  try {
    // Import export utility
    const { exportToWAV } = await import('./exportAudio');

    // Get all recordings
    const recordings = tracks.flatMap((track) => track.recordings || []);
    if (recordings.length === 0) {
      throw new Error('No recordings to export');
    }

    // For now, export first recording (Instance 1 can enhance to mix all tracks)
    const firstRecording = recordings[0];
    if (!firstRecording.blob) {
      throw new Error('Recording has no audio data');
    }

    // Decode and export
    const arrayBuffer = await firstRecording.blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const wavBlob = exportToWAV(audioBuffer);

    // Download
    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-export-${Date.now()}.wav`;
    a.click();
    URL.revokeObjectURL(url);

    return true;
  } catch (err: any) {
    console.error('Export failed:', err);
    throw err;
  }
}

/**
 * Helper to share project (placeholder for future implementation)
 */
export async function shareProject(projectId: string) {
  // TODO: Implement sharing functionality
  // Could use Web Share API or generate shareable link
  console.log('Share functionality coming soon for project:', projectId);
  alert('Share functionality coming soon!');
}

/**
 * Helper to apply audio device preferences to new tracks
 */
export function applyDevicePreferencesToTrack(
  track: any,
  preferences: ReturnType<typeof useAudioDevicePreferences>
) {
  return {
    ...track,
    inputDeviceId: track.inputDeviceId || preferences.defaultInputDeviceId,
    outputDeviceId: track.outputDeviceId || preferences.defaultOutputDeviceId,
  };
}
