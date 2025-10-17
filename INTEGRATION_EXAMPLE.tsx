/**
 * INTEGRATION EXAMPLE - Copy this into your /app/page.tsx
 *
 * This example shows how to integrate:
 * 1. Auto-save with visual feedback
 * 2. S3 recording upload
 * 3. Project loading on mount
 * 4. Authentication
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { TransportControls } from '@/src/widgets/TransportControls/TransportControls';
import { TrackList } from '@/src/widgets/TrackList/TrackList';
import { WaveformDisplay } from '@/src/widgets/WaveformDisplay/WaveformDisplay';
import { FileUpload } from '@/src/widgets/FileUpload/FileUpload';
import { ChatPanel } from '@/src/widgets/ChatPanel/ChatPanel';
import { SaveStatusIndicator } from '@/src/components/SaveStatusIndicator';
import { initializeTransport, getTransport } from '@/src/core/transport';
import { useTrackStore } from '@/src/core/store';
import { useRecording } from '@/src/core/useRecording';
import { usePlayback } from '@/src/core/usePlayback';
import { useAutoSave } from '@/src/hooks/useAutoSave';
import { importAudioFiles } from '@/src/utils/audioImport';
import { uploadRecordingToS3 } from '@/src/utils/recordingStorage';
import { createSavePayload, deserializeTracks } from '@/src/utils/projectSerializer';
import type { Project } from '@/src/core/types';

export default function Home() {
  const { data: session, status: sessionStatus } = useSession();
  const { tracks, addTrack, addRecording, setActiveTrack, setTracks, setOnTrackChange } = useTrackStore();
  const [showUpload, setShowUpload] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Project state
  const [project, setProject] = useState<Project>({
    name: 'Untitled Project',
    bpm: 120,
    timeSignature: '4/4',
  });
  const [isProjectLoaded, setIsProjectLoaded] = useState(false);

  // Initialize recording and playback hooks
  useRecording();
  usePlayback();

  // Initialize transport
  useEffect(() => {
    initializeTransport(120);
  }, []);

  // Auto-save hook
  const { status: saveStatus, lastSaved, error: saveError, saveNow, markDirty } = useAutoSave({
    enabled: sessionStatus === 'authenticated' && isProjectLoaded,
    interval: 30000, // Save every 30 seconds
    debounceDelay: 2000, // Wait 2s after last change
    onSave: async () => {
      if (!session?.user?.id) {
        throw new Error('Not authenticated');
      }

      // Upload any unsaved recordings to S3 first
      for (const track of tracks) {
        for (const recording of track.recordings) {
          if (recording.blob && !recording.s3Key) {
            console.log('Uploading recording to S3:', recording.id);

            const result = await uploadRecordingToS3({
              blob: recording.blob,
              projectId: project.id || 'temp',
              recordingId: recording.id,
            });

            // Update recording with S3 reference
            useTrackStore.getState().updateRecording(track.id, recording.id, {
              s3Key: result.s3Key,
              s3Url: result.s3Url,
            });
          }
        }
      }

      // Get current BPM from transport
      const transport = getTransport();
      const currentProject = {
        ...project,
        bpm: transport?.bpm || 120,
      };

      // Create save payload
      const payload = createSavePayload(currentProject, tracks);

      // Save to database
      const response = await fetch('/api/projects/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save project');
      }

      const data = await response.json();

      // Update project ID if new project
      if (!project.id && data.project?.id) {
        setProject((prev) => ({ ...prev, id: data.project.id }));
        localStorage.setItem('currentProjectId', data.project.id);
      }

      console.log('Project saved successfully:', data.project?.name);
    },
    onError: (error) => {
      console.error('Auto-save failed:', error);
      // TODO: Show toast notification to user
    },
  });

  // Mark dirty when tracks change
  useEffect(() => {
    setOnTrackChange(() => {
      markDirty();
    });
    return () => setOnTrackChange(null);
  }, [markDirty, setOnTrackChange]);

  // Load project on mount
  useEffect(() => {
    const loadProject = async () => {
      if (sessionStatus !== 'authenticated' || !session?.user?.id) {
        setIsProjectLoaded(true); // Skip loading, use empty project
        return;
      }

      try {
        // Get project ID from URL or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('projectId') || localStorage.getItem('currentProjectId');

        if (!projectId) {
          console.log('No project ID found, starting new project');
          setIsProjectLoaded(true);
          return;
        }

        console.log('Loading project:', projectId);

        const response = await fetch(`/api/projects/load?projectId=${projectId}`);

        if (!response.ok) {
          console.warn('Failed to load project, starting new project');
          setIsProjectLoaded(true);
          return;
        }

        const { project: loadedProject, tracks: loadedTracks } = await response.json();

        // Update project state
        setProject(loadedProject);

        // Update transport with project BPM
        const transport = getTransport();
        if (transport) {
          transport.bpm = loadedProject.bpm;
        }

        // Deserialize and load tracks
        const deserializedTracks = deserializeTracks(loadedTracks);
        setTracks(deserializedTracks);

        console.log('Project loaded:', loadedProject.name, deserializedTracks.length, 'tracks');
        setIsProjectLoaded(true);
      } catch (error) {
        console.error('Failed to load project:', error);
        setIsProjectLoaded(true); // Continue with empty project
      }
    };

    loadProject();
  }, [session, sessionStatus, setTracks]);

  // Save before leaving page
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (saveStatus === 'idle' && tracks.length > 0) {
        e.preventDefault();
        e.returnValue = '';
        await saveNow();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus, tracks.length, saveNow]);

  const handleAddTrack = () => {
    addTrack('audio');
  };

  const handleUpload = () => {
    setShowUpload(true);
  };

  const handleFilesSelected = async (files: File[]) => {
    setIsImporting(true);

    try {
      const importedAudios = await importAudioFiles(files);

      for (let i = 0; i < importedAudios.length; i++) {
        const imported = importedAudios[i];
        const fileName = files[i].name.replace(/\.[^/.]+$/, '');

        addTrack('audio');

        const tracks = useTrackStore.getState().tracks;
        const newTrack = tracks[tracks.length - 1];

        if (newTrack) {
          useTrackStore.getState().updateTrack(newTrack.id, { name: fileName });

          const recording = {
            id: `recording-${Date.now()}-${i}`,
            blob: imported.blob,
            duration: imported.duration,
            createdAt: new Date(),
            waveformData: imported.waveformData,
          };

          addRecording(newTrack.id, recording);
          setActiveTrack(newTrack.id);
        }

        await new Promise(resolve => setTimeout(resolve, 50));
      }

      setShowUpload(false);
    } catch (error) {
      console.error('Failed to import files:', error);
      alert('Failed to import some files. Check console for details.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Transport Bar at top */}
      <div style={{
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '0 16px'
      }}>
        <TransportControls
          onAddTrack={handleAddTrack}
          onUpload={handleUpload}
        />

        {/* Save Status Indicator */}
        <div style={{ marginLeft: 'auto' }}>
          <SaveStatusIndicator
            status={saveStatus}
            lastSaved={lastSaved}
            error={saveError}
          />
        </div>

        {/* Manual Save Button */}
        <button
          onClick={saveNow}
          disabled={saveStatus === 'saving'}
          style={{
            padding: '8px 16px',
            background: saveStatus === 'saving' ? 'var(--bg-secondary)' : 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
            fontSize: '14px',
          }}
        >
          {saveStatus === 'saving' ? 'Saving...' : 'Save Now'}
        </button>

        {/* Auth Status */}
        {sessionStatus === 'loading' && (
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Loading...
          </span>
        )}
        {sessionStatus === 'unauthenticated' && (
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Not logged in (auto-save disabled)
          </span>
        )}
        {sessionStatus === 'authenticated' && session?.user?.name && (
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {session.user.name}
          </span>
        )}
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Left Sidebar: Track List */}
        <div style={{
          width: '320px',
          borderRight: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-primary)'
        }}>
          <TrackList />
        </div>

        {/* Center: Waveform Display */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <WaveformDisplay />
        </div>

        {/* Right Sidebar: AI Chat Panel */}
        <ChatPanel />
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)',
            maxWidth: '600px',
            width: '90%',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-4)',
            }}>
              <h2 style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--text-primary)',
              }}>
                Upload Audio Files
              </h2>
              <button
                onClick={() => setShowUpload(false)}
                disabled={isImporting}
                className="btn btn-icon"
              >
                ✕
              </button>
            </div>

            <FileUpload
              onFilesSelected={handleFilesSelected}
            />

            {isImporting && (
              <div style={{
                marginTop: 'var(--space-4)',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-sm)',
              }}>
                Importing files...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
