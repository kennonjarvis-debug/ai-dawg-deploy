import { useEffect, useRef } from 'react';
import { useTransportStore } from '../stores/transportStore';
import { useTimelineStore } from '../stores/timelineStore';

/**
 * Hook to manage Pro Tools-style playlist recording.
 *
 * Features:
 * - Automatically creates new playlists during loop recording
 * - Each recording pass creates a new take/playlist
 * - Auto-increments take numbers (Take 1, Take 2, etc.)
 *
 * Usage: Call this hook in your main DAW component
 */
export const usePlaylistRecording = () => {
  const { isRecording, isLooping, currentTime, bpm, timeSignature } = useTransportStore();
  const { tracks, createPlaylist, activatePlaylist, addClipToPlaylist } = useTimelineStore();

  // Track previous recording state
  const prevRecordingRef = useRef(isRecording);
  const prevLoopPassRef = useRef(0);
  const recordingStartTimeRef = useRef<number | null>(null);
  const currentLoopPassRef = useRef(0);
  const takeCounterRef = useRef<Map<string, number>>(new Map());

  // Calculate current loop pass based on time
  useEffect(() => {
    if (isRecording && isLooping) {
      // Calculate loop duration based on project settings
      // For now, using a default 8-bar loop as an example
      const beatsPerBar = timeSignature.numerator;
      const secondsPerBeat = 60 / bpm;
      const loopDuration = 8 * beatsPerBar * secondsPerBeat; // 8 bars

      if (recordingStartTimeRef.current === null) {
        recordingStartTimeRef.current = currentTime;
        currentLoopPassRef.current = 0;
      } else {
        const elapsedTime = currentTime - recordingStartTimeRef.current;
        const newLoopPass = Math.floor(elapsedTime / loopDuration);

        // New loop pass detected
        if (newLoopPass > currentLoopPassRef.current && newLoopPass > 0) {
          currentLoopPassRef.current = newLoopPass;
          handleNewLoopPass();
        }
      }
    }
  }, [currentTime, isRecording, isLooping, bpm, timeSignature]);

  // Reset when recording stops
  useEffect(() => {
    if (!isRecording && prevRecordingRef.current) {
      recordingStartTimeRef.current = null;
      currentLoopPassRef.current = 0;
      prevLoopPassRef.current = 0;
    }
    prevRecordingRef.current = isRecording;
  }, [isRecording]);

  /**
   * Handle creation of new playlist for each loop pass
   */
  const handleNewLoopPass = () => {
    // Get all armed tracks
    const armedTracks = tracks.filter((track) => track.isArmed);

    armedTracks.forEach((track) => {
      // Get or initialize take counter for this track
      const currentTakeCount = takeCounterRef.current.get(track.id) || 0;
      const newTakeCount = currentTakeCount + 1;
      takeCounterRef.current.set(track.id, newTakeCount);

      // Create new playlist with incremented take number
      const playlistName = `Take ${newTakeCount}`;

      // Create the playlist
      createPlaylist(track.id, playlistName);

      // Get the newly created playlist (it will be the last one)
      const updatedTrack = tracks.find((t) => t.id === track.id);
      if (updatedTrack && updatedTrack.playlists.length > 0) {
        const newPlaylist = updatedTrack.playlists[updatedTrack.playlists.length - 1];

        // Activate the new playlist so recording goes to it
        activatePlaylist(track.id, newPlaylist.id);

        console.log(
          `[Playlist Recording] Created and activated "${playlistName}" for track "${track.name}"`
        );
      }
    });
  };

  /**
   * Initialize take counters for all tracks when recording starts
   */
  useEffect(() => {
    if (isRecording && isLooping && !prevRecordingRef.current) {
      // Recording just started with loop enabled
      const armedTracks = tracks.filter((track) => track.isArmed);

      armedTracks.forEach((track) => {
        // Initialize take counter if not exists
        if (!takeCounterRef.current.has(track.id)) {
          // Count existing playlists that start with "Take"
          const existingTakes = track.playlists.filter((p) =>
            p.name.startsWith('Take ')
          );
          takeCounterRef.current.set(track.id, existingTakes.length);
        }
      });

      console.log(
        '[Playlist Recording] Loop recording started on',
        armedTracks.length,
        'track(s)'
      );
    }
  }, [isRecording, isLooping, tracks]);

  return {
    currentLoopPass: currentLoopPassRef.current,
    isPlaylistRecordingActive: isRecording && isLooping,
  };
};
