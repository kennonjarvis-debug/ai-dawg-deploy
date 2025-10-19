import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Music2, Sparkles, LogOut, ChevronDown, Plus, FolderOpen, Save, Settings, Scissors, AlignCenter, Music, Volume2, Sliders, Zap, TrendingUp, Wand2, CreditCard, Mic, Drum, Upload } from 'lucide-react';
import { TransportBar, Timeline, LoginForm, RegisterForm, CollaboratorList, AIDawgMenu, AIProcessingModal, AIChatWidget, MixerPanel, UpsellModal, GenreSelector, ProjectSettingsModal, AIFeatureHub, Widget, AuxTrackDialog, MusicGenerationProgressBar } from './components';
import type { MusicGenerationProgress } from './components';
import { apiClient } from '../api/client';
import { wsClient } from '../api/websocket';
import { parseStepProgressFromStatus } from './utils/aiProgress';
import { getSelectedAudioFileIds, getSelectedTrackIds } from './utils/selection';
import { VocalCoachPanel, ProducerPanel } from './panels';
import { useTransportStore } from '../stores/transportStore';
import { useTimelineStore } from '../stores/timelineStore';
import { useDawUiStore } from '../stores/dawUiStore';
import { useProjectRoom, useWebSocketEvent } from '../hooks/useWebSocket';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { usePlaylistRecording } from '../hooks/usePlaylistRecording';
import { useMultiTrackRecording } from '../hooks/useMultiTrackRecording';
import { useAuth } from '../contexts/AuthContext';
import type { Project, User } from '../api/types';
import type { AIProcessingJob } from './components/AIProcessingModal';
import { toast } from 'sonner';
import { beatAnalyzer } from '../audio/ai/BeatAnalyzer';
import { timeStretcher } from '../audio/ai/TimeStretcher';
import { pitchShifter } from '../audio/ai/PitchShifter';
import { getAudioEngine } from '../audio/AudioEngine';
import { getPlaybackEngine } from '../audio/PlaybackEngine';
import { getMetronomeEngine } from '../audio/MetronomeEngine';

export const DAWDashboard: React.FC = () => {
  const location = useLocation();
  const params = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user, logout: authLogout } = useAuth();
  // Local state (project loading - transient)
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(true);

  // Use user directly from AuthContext instead of redundant local state
  const currentUser = user;

  // Zustand store for DAW UI state (replaces 17 useState calls)
  const {
    activePanel,
    setActivePanel,
    lastSaved,
    setLastSaved,
    isSaving,
    setIsSaving,
    openMenu,
    setOpenMenu,
    aiJobs,
    setAiJobs,
    addAiJob,
    removeAiJob,
    updateAiJob,
    showAiModal,
    setShowAiModal,
    upsell,
    setUpsell,
    planBadge,
    setPlanBadge,
    genre,
    setGenre,
    showSettings,
    setShowSettings,
    showAIHub,
    setShowAIHub,
    showAuxTrackDialog,
    setShowAuxTrackDialog,
    lyrics,
    setLyrics,
    expandedWidget,
    setExpandedWidget,
    uploadProgress,
    setUploadProgress,
    flashFeature,
    setFlashFeature,
    musicGenProgress,
    setMusicGenProgress,
  } = useDawUiStore();
  const { isPlaying, currentTime, setCurrentTime, bpm: projectBPM, key: projectKey } = useTransportStore();
  const { addTrack, updateTrack, selectedClipIds, tracks, updateClip, addClip } = useTimelineStore();
  const selectedTrackIds = React.useMemo(() => getSelectedTrackIds(tracks, selectedClipIds), [tracks, selectedClipIds]);
  const selectedAudioFileIds = React.useMemo(() => getSelectedAudioFileIds(tracks, selectedClipIds), [tracks, selectedClipIds]);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const editMenuRef = useRef<HTMLDivElement>(null);
  const trackMenuRef = useRef<HTMLDivElement>(null);
  const aiDawgMenuRef = useRef<HTMLDivElement>(null);
  const importAudioInputRef = useRef<HTMLInputElement>(null);

  // Initialize audio engine for recording
  const { isInitialized: audioEngineReady, hasPermission: hasMicPermission } = useAudioEngine();

  // Enable Pro Tools-style playlist recording
  const { currentLoopPass, isPlaylistRecordingActive } = usePlaylistRecording();

  // Enable multi-track recording with live waveform visualization
  const { isRecordingActive, recordingTrackCount } = useMultiTrackRecording();

  // Connect WebSocket when user is authenticated OR in demo mode
  useEffect(() => {
    // Always connect WebSocket (even in demo mode)
    const token = apiClient.getToken() || 'demo-token';
    if (!wsClient.isConnected()) {
      console.log('[DAWDashboard] Connecting WebSocket with token:', token ? '✓' : '✗');
      wsClient.connect(token);
    }

    // Cleanup WebSocket on unmount
    return () => {
      wsClient.disconnect();
    };
  }, [user]);

  useEffect(() => {
    const handler = (e: any) => {
      setUpsell({ open: true, feature: e.detail?.feature, plan: e.detail?.plan, upgrade_url: e.detail?.upgrade_url });
      try {
        const feat = e.detail?.feature || 'feature';
        const plan = e.detail?.plan || planBadge || 'FREE';
        toast.info(`Upgrade required for ${feat} (current plan: ${plan})`);
      } catch {}
    };
    window.addEventListener('ai-upsell', handler as any);
    return () => window.removeEventListener('ai-upsell', handler as any);
  }, [planBadge]);

  // Auto-create clips from uploaded/selected audio files
  useEffect(() => {
    const createClipFromFile = async (file: any) => {
      if (!currentProject || tracks.length === 0 || !file?.id) return;
      const targetTrackId = tracks[0].id;
      const name = file?.originalName || file?.filename || 'Audio';
      const duration = file?.duration || 5;
      let audioUrl: string | undefined;
      try {
        const { url } = await apiClient.getAudioDownloadUrl(file.id);
        audioUrl = url;
      } catch {}
      useTimelineStore.getState().addClip(targetTrackId, {
        name,
        startTime: 0,
        duration,
        color: tracks[0].color,
      });
      const clips = useTimelineStore.getState().tracks.find(t => t.id === targetTrackId)?.clips || [];
      const newClip = clips[clips.length - 1];
      if (newClip) {
        useTimelineStore.getState().updateClip(newClip.id, { audioFileId: file.id, audioUrl } as any);
      }
      toast.success('Added audio file to timeline');
    };

    const onUploaded = (e: any) => createClipFromFile(e.detail?.file);
    const onSelected = (e: any) => createClipFromFile(e.detail?.file);
    window.addEventListener('audio-uploaded', onUploaded as any);
    window.addEventListener('audio-file-selected', onSelected as any);
    return () => {
      window.removeEventListener('audio-uploaded', onUploaded as any);
      window.removeEventListener('audio-file-selected', onSelected as any);
    };
  }, [currentProject, tracks]);

  useEffect(() => {
    (async () => {
      try {
        if (!currentUser) return;
        const ent = await apiClient.getEntitlements();
        setPlanBadge(ent?.plan || 'FREE');
      } catch {
        setPlanBadge('FREE');
      }
    })();
  }, [currentUser]);

  // Auto-adjust clips when project BPM or key changes
  useEffect(() => {
    const processedClips = new Set<string>();

    const processClips = async () => {
      for (const track of tracks) {
        for (const clip of track.clips) {
          // Skip clips without detected values or original buffer
          if (!clip.detectedBPM || !clip.detectedKey || !clip.originalBuffer) continue;

          // Skip if already processed in this cycle
          if (processedClips.has(clip.id)) continue;

          const needsTimeStretch = Math.abs(clip.detectedBPM - projectBPM) > 0.5;
          const needsPitchShift = clip.detectedKey !== projectKey;

          // Skip if no processing needed
          if (!needsTimeStretch && !needsPitchShift) {
            // Reset flags if clip now matches project settings
            if ((clip.isTimeStretched || clip.isPitchShifted) && clip.audioBuffer !== clip.originalBuffer) {
              updateClip(clip.id, {
                audioBuffer: clip.originalBuffer,
                duration: clip.originalBuffer.duration,
                isTimeStretched: false,
                isPitchShifted: false,
              });
            }
            continue;
          }

          // Skip if already processed to these exact settings
          const alreadyProcessed =
            (needsTimeStretch === clip.isTimeStretched) &&
            (needsPitchShift === clip.isPitchShifted) &&
            clip.audioBuffer !== clip.originalBuffer;

          if (alreadyProcessed) continue;

          let processedBuffer = clip.originalBuffer;
          processedClips.add(clip.id);

          try {
            // Time-stretch if needed
            if (needsTimeStretch) {
              console.log(`[AI] Time-stretching clip ${clip.name} from ${clip.detectedBPM} to ${projectBPM} BPM`);
              const result = await timeStretcher.stretchToMatchBPM(
                processedBuffer,
                clip.detectedBPM,
                projectBPM,
                'standard'
              );
              processedBuffer = result.stretchedBuffer;
            }

            // Pitch-shift if needed
            if (needsPitchShift) {
              console.log(`[AI] Pitch-shifting clip ${clip.name} from ${clip.detectedKey} to ${projectKey}`);
              const result = await pitchShifter.shiftToMatchKey(
                processedBuffer,
                clip.detectedKey,
                projectKey,
                'standard'
              );
              processedBuffer = result.shiftedBuffer;
            }

            // Update clip with processed audio
            updateClip(clip.id, {
              audioBuffer: processedBuffer,
              duration: processedBuffer.duration,
              isTimeStretched: needsTimeStretch,
              isPitchShifted: needsPitchShift,
            });

            toast.success(`Adjusted ${clip.name} to match project settings`, {
              duration: 3000,
            });
          } catch (error) {
            console.error(`Failed to process clip ${clip.name}:`, error);
            toast.error(`Failed to adjust ${clip.name}`);
          }
        }
      }
    };

    processClips();
  }, [projectBPM, projectKey]);

  // Simulate time progression when playing
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime(currentTime + 0.1);
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, currentTime, setCurrentTime]);

  // Load project from route params or location state
  useEffect(() => {
    const loadProject = async () => {
      try {
        setIsLoadingProject(true);

        // Check if project was passed via location state (from ProjectListPage)
        const stateProject = (location.state as any)?.project;
        if (stateProject) {
          setCurrentProject(stateProject);

          // Join project room for real-time updates
          if (wsClient.isConnected()) {
            wsClient.joinProject(stateProject.id);
          }

          setIsLoadingProject(false);
          return;
        }

        // Otherwise, load project from API using projectId param
        if (params.projectId) {
          const project = await apiClient.getProject(params.projectId);
          setCurrentProject(project);

          // Join project room
          if (wsClient.isConnected()) {
            wsClient.joinProject(project.id);
          }
        } else {
          // No project ID - redirect to project list
          navigate('/app');
        }
      } catch (error) {
        console.error('Failed to load project:', error);
        toast.error('Failed to load project');
        navigate('/app');
      } finally {
        setIsLoadingProject(false);
      }
    };

    loadProject();
  }, [params.projectId, location.state, navigate]);

  const handleCloseProject = () => {
    // Leave project room
    if (currentProject && wsClient.isConnected()) {
      wsClient.leaveProject(currentProject.id);
    }

    // Navigate back to project list
    navigate('/app');
  };

  const handleLogout = async () => {
    try {
      if (currentProject && wsClient.isConnected()) {
        wsClient.leaveProject(currentProject.id);
      }
      setCurrentProject(null);
      await authLogout();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed');
    }
  };

  // Auto-save functionality
  const saveProject = useCallback(async () => {
    // SECURITY FIX: Check for valid project ID before saving
    if (!currentProject?.id || isSaving) return;

    // Skip auto-save for demo projects
    if (currentProject.id.startsWith('demo-')) {
      console.log('[Demo Mode] Skipping auto-save for demo project');
      return;
    }

    try {
      setIsSaving(true);
      await apiClient.updateProject(currentProject.id, {
        name: currentProject.name,
        bpm: currentProject.bpm,
        key: currentProject.key,
        timeSignature: currentProject.timeSignature,
      });
      setLastSaved(new Date());
    } catch (error: any) {
      // Only log errors for non-demo projects
      if (!error?.response?.status || error.response.status !== 404) {
        console.error('Auto-save failed:', error);
      }
    } finally {
      setIsSaving(false);
    }
  }, [currentProject, isSaving]);

  // DISABLED: Auto-save every 30 seconds - causing errors with undefined project IDs
  // Users can manually save with Cmd+S or through the File menu
  // useEffect(() => {
  //   if (!currentProject?.id) return;
  //
  //   const interval = setInterval(() => {
  //     saveProject();
  //   }, 30000); // 30 seconds
  //
  //   return () => clearInterval(interval);
  // }, [currentProject, saveProject]);

  // Save on project close
  useEffect(() => {
    return () => {
      if (currentProject?.id) {
        saveProject();
      }
    };
  }, [currentProject, saveProject]);

  // Close AI panels with Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activePanel) {
        setActivePanel(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [activePanel]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        fileMenuRef.current && !fileMenuRef.current.contains(event.target as Node) &&
        editMenuRef.current && !editMenuRef.current.contains(event.target as Node) &&
        trackMenuRef.current && !trackMenuRef.current.contains(event.target as Node) &&
        aiDawgMenuRef.current && !aiDawgMenuRef.current.contains(event.target as Node)
      ) {
        setOpenMenu(null);
      }
    };

    if (openMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenu]);

  // Menu handlers
  const handleNewTrack = () => {
    addTrack('Audio Track', { trackType: 'audio', channels: 'stereo' });
    setOpenMenu(null);
    toast.success('New track added');
  };

  const handleCreateAuxTrack = (config: { name: string; channels: 'mono' | 'stereo' }) => {
    addTrack(config.name, { trackType: 'aux', channels: config.channels });
    setOpenMenu(null);
    toast.success(`${config.channels === 'mono' ? 'Mono' : 'Stereo'} aux track created`);
  };

  const handleSaveProject = async () => {
    await saveProject();
    setOpenMenu(null);
    toast.success('Project saved!');
  };

  const handleImportAudio = () => {
    importAudioInputRef.current?.click();
    setOpenMenu(null);
  };

  // Wrapper for AIChatWidget file upload (accepts File directly)
  const handleUploadAudioFile = async (file: File) => {
    // Reuse the same upload logic from handleAudioFileSelect
    const startTime = Date.now();

    try {
      setUploadProgress({ fileName: file.name, progress: 5, step: 'Starting upload...' });

      // Try backend upload first with SHORT timeout (5 seconds)
      if (currentProject?.id) {
        try {
          setUploadProgress({ fileName: file.name, progress: 10, step: 'Uploading to server...' });

          const uploadPromise = apiClient.uploadAudio(currentProject.id, file);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Backend timeout')), 5000)
          );

          const result = await Promise.race([uploadPromise, timeoutPromise]) as any;

          // Dispatch event to trigger clip creation
          window.dispatchEvent(new CustomEvent('audio-uploaded', {
            detail: { file: result.audioFile }
          }));

          setUploadProgress(null);
          return; // Success
        } catch (uploadError) {
          console.warn('Backend upload failed/timeout, falling back to local import:', uploadError);
          setUploadProgress({ fileName: file.name, progress: 15, step: 'Backend unavailable, processing locally...' });
        }
      }

      // Fallback: Import file directly using Web Audio API
      console.log(`[Upload] Starting decode for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      setUploadProgress({ fileName: file.name, progress: 20, step: 'Reading audio file...' });

      const engine = getAudioEngine();
      const audioContext = await engine.getOrCreateAudioContext();

      const playbackEngine = getPlaybackEngine();
      const metronomeEngine = getMetronomeEngine();
      playbackEngine.initialize(audioContext);
      metronomeEngine.initialize(audioContext);

      const arrayBuffer = await file.arrayBuffer();
      setUploadProgress({ fileName: file.name, progress: 35, step: 'Decoding audio...' });

      const decodePromise = audioContext.decodeAudioData(arrayBuffer);
      const timeoutPromise = new Promise<AudioBuffer>((_, reject) =>
        setTimeout(() => reject(new Error('Audio decode timeout')), 30000)
      );

      const audioBuffer = await Promise.race([decodePromise, timeoutPromise])
        .catch(err => {
          setUploadProgress(null);
          throw new Error(`Failed to decode audio: ${err.message}`);
        });

      setUploadProgress({ fileName: file.name, progress: 55, step: 'Analyzing audio properties...' });

      let detectedBPM: number | undefined = 120;
      let detectedKey: string | undefined = 'C';
      let detectedScale: string | undefined = 'major';

      // Quick BPM/key detection
      try {
        const maxSampleDuration = 5;
        const sampleDuration = Math.min(audioBuffer.duration, maxSampleDuration);
        const sampleSize = Math.floor(audioBuffer.sampleRate * sampleDuration);

        const sampleBuffer = audioContext.createBuffer(
          audioBuffer.numberOfChannels,
          sampleSize,
          audioBuffer.sampleRate
        );

        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
          const sourceData = audioBuffer.getChannelData(channel);
          const sampleData = sampleBuffer.getChannelData(channel);
          for (let i = 0; i < sampleSize; i++) {
            sampleData[i] = sourceData[i];
          }
        }

        const bpmPromise = engine.detectBPM(sampleBuffer);
        const bpmTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('BPM timeout')), 3000)
        );

        const bpmResult = await Promise.race([bpmPromise, bpmTimeout]) as any;
        if (bpmResult?.bpm) {
          detectedBPM = Math.round(bpmResult.bpm);
        }
      } catch (analysisError) {
        console.log('[Upload] Quick analysis timeout/failed, using defaults');
      }

      setUploadProgress({ fileName: file.name, progress: 75, step: 'Generating waveform...' });
      const waveformData = engine.getWaveformData(audioBuffer, 1000);

      setUploadProgress({ fileName: file.name, progress: 85, step: 'Preparing audio data...' });
      const blob = engine.exportAsWAV(audioBuffer);
      const audioUrl = URL.createObjectURL(blob);

      setUploadProgress({ fileName: file.name, progress: 90, step: 'Adding to timeline...' });
      const trackName = file.name.replace(/\.[^/.]+$/, '');
      const createdTrack = addTrack(trackName);

      const { addClip } = useTimelineStore.getState();
      addClip(createdTrack.id, {
        name: file.name,
        startTime: 0,
        duration: audioBuffer.duration,
        audioBuffer,
        waveformData,
        audioUrl,
        color: createdTrack.color,
        detectedBPM,
        detectedKey,
        originalBuffer: audioBuffer,
      });

      setUploadProgress({ fileName: file.name, progress: 100, step: 'Complete!' });
      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);

      setTimeout(() => setUploadProgress(null), 1500);

    } catch (error) {
      console.error('[Upload] Error:', error);
      setUploadProgress(null);
      throw error;
    }
  };

  const handleAudioFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      const startTime = Date.now();

      try {
        setUploadProgress({ fileName: file.name, progress: 5, step: 'Starting upload...' });

        // Try backend upload first with SHORT timeout (5 seconds)
        if (currentProject?.id) {
          try {
            setUploadProgress({ fileName: file.name, progress: 10, step: 'Uploading to server...' });

            const uploadPromise = apiClient.uploadAudio(currentProject.id, file);
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Backend timeout')), 5000)
            );

            const result = await Promise.race([uploadPromise, timeoutPromise]) as any;

            // Dispatch event to trigger clip creation
            window.dispatchEvent(new CustomEvent('audio-uploaded', {
              detail: { file: result.audioFile }
            }));

            setUploadProgress(null);
            toast.success(`Imported ${file.name}`);
            continue; // Success, move to next file
          } catch (uploadError) {
            console.warn('Backend upload failed/timeout, falling back to local import:', uploadError);
            setUploadProgress({ fileName: file.name, progress: 15, step: 'Backend unavailable, processing locally...' });
          }
        }

        // Fallback: Import file directly using Web Audio API (no backend needed)
        console.log(`[Upload] Starting decode for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        setUploadProgress({ fileName: file.name, progress: 20, step: 'Reading audio file...' });

        // Use shared AudioContext from AudioEngine (required for playback compatibility!)
        const engine = getAudioEngine();
        const audioContext = await engine.getOrCreateAudioContext();
        console.log(`[Upload] Using shared AudioContext (sample rate: ${audioContext.sampleRate}Hz)`);

        // Initialize playback/metronome engines with AudioContext for playback to work
        const playbackEngine = getPlaybackEngine();
        const metronomeEngine = getMetronomeEngine();
        playbackEngine.initialize(audioContext);
        metronomeEngine.initialize(audioContext);
        console.log(`[Upload] Playback engines initialized with AudioContext`);

        console.log(`[Upload] Reading file as ArrayBuffer...`);
        setUploadProgress({ fileName: file.name, progress: 25, step: 'Reading audio file...' });
        const arrayBuffer = await file.arrayBuffer();
        setUploadProgress({ fileName: file.name, progress: 35, step: 'Decoding audio...' });
        console.log(`[Upload] ArrayBuffer loaded, decoding audio...`);

        // Add timeout to decode operation (30 seconds max)
        const decodePromise = audioContext.decodeAudioData(arrayBuffer);
        const timeoutPromise = new Promise<AudioBuffer>((_, reject) =>
          setTimeout(() => reject(new Error('Audio decode timeout')), 30000)
        );

        const audioBuffer = await Promise.race([decodePromise, timeoutPromise])
          .catch(err => {
            console.error('[Upload] Decode failed:', err);
            setUploadProgress(null);
            throw new Error(`Failed to decode audio: ${err.message}`);
          });

        console.log(`[Upload] Audio decoded successfully - Duration: ${audioBuffer.duration}s`);
        setUploadProgress({ fileName: file.name, progress: 55, step: 'Analyzing audio properties...' });

        // SKIP BPM/Key detection for now - it's blocking the main thread
        // TODO: Move to Web Worker in the future
        console.log(`[Upload] Skipping BPM/Key detection (blocks main thread)`);
        setUploadProgress({ fileName: file.name, progress: 60, step: 'Detecting BPM and key...' });
        let detectedBPM: number | undefined = 120; // Default BPM
        let detectedKey: string | undefined = 'C'; // Default key
        let detectedScale: string | undefined = 'major';

        // Optional: Try quick detection with tiny sample and timeout
        try {
          // Only use 5 seconds and 3 second timeout
          const maxSampleDuration = 5; // VERY SHORT
          const sampleDuration = Math.min(audioBuffer.duration, maxSampleDuration);
          const sampleSize = Math.floor(audioBuffer.sampleRate * sampleDuration);

          console.log(`[Upload] Attempting quick analysis (${sampleDuration}s sample)...`);

          // Create tiny sample
          const sampleBuffer = audioContext.createBuffer(
            audioBuffer.numberOfChannels,
            sampleSize,
            audioBuffer.sampleRate
          );

          for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            const sourceData = audioBuffer.getChannelData(channel);
            const sampleData = sampleBuffer.getChannelData(channel);
            for (let i = 0; i < sampleSize; i++) {
              sampleData[i] = sourceData[i];
            }
          }

          // Try BPM with 3 second timeout
          const bpmPromise = engine.detectBPM(sampleBuffer);
          const bpmTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('BPM timeout')), 3000)
          );

          const bpmResult = await Promise.race([bpmPromise, bpmTimeout]) as any;
          if (bpmResult?.bpm) {
            detectedBPM = Math.round(bpmResult.bpm);
            console.log(`[Upload] BPM detected: ${detectedBPM}`);
          }
        } catch (analysisError) {
          console.log('[Upload] Quick analysis timeout/failed, using defaults');
        }

        setUploadProgress({ fileName: file.name, progress: 70, step: 'Analysis complete...' });

        // Generate waveform data using AudioEngine
        setUploadProgress({ fileName: file.name, progress: 75, step: 'Generating waveform...' });
        console.log(`[Upload] Generating waveform...`);
        // Use same engine instance from above
        const waveformData = engine.getWaveformData(audioBuffer, 1000);
        console.log(`[Upload] Waveform generated (${waveformData.length} points)`);
        setUploadProgress({ fileName: file.name, progress: 80, step: 'Creating audio data...' });

        // Create audio URL from WAV export
        setUploadProgress({ fileName: file.name, progress: 85, step: 'Preparing audio data...' });
        console.log(`[Upload] Exporting as WAV...`);
        const blob = engine.exportAsWAV(audioBuffer);
        const audioUrl = URL.createObjectURL(blob);
        console.log(`[Upload] Audio URL created: ${audioUrl}`);

        // Create new track for the imported audio
        setUploadProgress({ fileName: file.name, progress: 90, step: 'Adding to timeline...' });
        console.log(`[Upload] Adding to timeline...`);
        const trackName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
        const createdTrack = addTrack(trackName);
        console.log(`[Upload] Track created: ${createdTrack.id}`);

        // Create clip immediately (no need to wait, addTrack is synchronous)
        setUploadProgress({ fileName: file.name, progress: 95, step: 'Creating clip...' });

        const { addClip } = useTimelineStore.getState();
        addClip(createdTrack.id, {
          name: file.name,
          startTime: 0,
          duration: audioBuffer.duration,
          audioBuffer,
          waveformData,
          audioUrl,
          color: createdTrack.color,
          detectedBPM,
          detectedKey,
          originalBuffer: audioBuffer, // Store original for re-processing
        });

        // Verify clip was added correctly
        const verifyClip = useTimelineStore.getState().tracks
          .find(t => t.id === createdTrack.id)?.clips[0];

        console.log(`[Upload] Clip created successfully:`, {
          hasAudioBuffer: !!audioBuffer,
          hasWaveform: !!waveformData,
          hasAudioUrl: !!audioUrl,
          duration: audioBuffer.duration,
          clipInStore: !!verifyClip,
          clipHasBuffer: !!verifyClip?.audioBuffer,
        });

        setUploadProgress({ fileName: file.name, progress: 100, step: 'Complete!' });
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
        const displayInfo = detectedBPM && detectedKey
          ? `🎵 ${detectedBPM.toFixed(0)} BPM, ${detectedKey} ${detectedScale} • ${elapsedTime}s`
          : `• ${elapsedTime}s`;
        toast.success(`Added ${file.name}! ${displayInfo}`, { duration: 3000 });

        // Clear progress after a short delay
        setTimeout(() => setUploadProgress(null), 1500);
        console.log(`[Upload] Complete! Total time: ${elapsedTime}s`);

      } catch (error) {
        console.error('Import failed:', error);
        setUploadProgress(null);
        toast.error(`Failed to import ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Reset input
    e.target.value = '';
  };

  const handleSaveSettings = async (settings: { bpm?: number; key?: string; timeSignature?: string }) => {
    if (!currentProject?.id) return;

    try {
      await apiClient.updateProject(currentProject.id, settings);
      setCurrentProject({ ...currentProject, ...settings });
      toast.success('Project settings updated!');
    } catch (error: any) {
      // Silently update local state for demo projects (which don't exist in backend)
      if (error?.response?.status === 404 || currentProject.id.startsWith('demo-')) {
        console.log('[Demo Mode] Updating project settings locally:', settings);
        setCurrentProject({ ...currentProject, ...settings });
        // Update transport store directly for demo mode
        if (settings.bpm) {
          useTransportStore.setState({ bpm: settings.bpm });
        }
        if (settings.key) {
          useTransportStore.setState({ key: settings.key });
        }
      } else {
        console.error('Failed to update project settings:', error);
        toast.error('Failed to update settings');
      }
    }
  };

  const handleExportProject = async () => {
    if (!currentProject) return;
    try {
      const blob = await apiClient.exportProject(currentProject.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentProject.name}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Project exported!');
    } catch (error) {
      toast.error('Export failed');
    }
    setOpenMenu(null);
  };

  // AI Processing Helpers
  const createAiJob = (type: AIProcessingJob['type'], message: string): string => {
    const id = `${type}-${Date.now()}`;
    const newJob: AIProcessingJob = {
      id,
      type,
      status: 'pending',
      progress: 0,
      message,
    };
    addAiJob(newJob); // Use store method
    setShowAiModal(true);
    return id;
  };

  // Note: updateAiJob is now from the Zustand store (line 55)

  // DAWG AI Handlers
  const handleAutoComp = async () => {
    if (selectedClipIds.length < 2) {
      toast.error('Select at least 2 clips for auto-comp');
      return;
    }

    const jobId = createAiJob('vocal-analysis', 'Analyzing vocal takes for best segments...');

    try {
      updateAiJob(jobId, { status: 'processing', progress: 30 });

      const audioFileIds = selectedAudioFileIds.length ? selectedAudioFileIds : selectedClipIds;
      const result = await apiClient.autoComp(audioFileIds);

      updateAiJob(jobId, {
        status: 'completed',
        progress: 100,
        message: 'Auto-comp completed!',
        result
      });

      toast.success('Auto-comp completed!');
    } catch (error: any) {
      updateAiJob(jobId, {
        status: 'error',
        error: error.message || 'Auto-comp failed',
        message: 'Auto-comp failed'
      });
      toast.error('Auto-comp failed');
    }
  };

  const handleAutoTimeAlign = async () => {
    if (selectedClipIds.length === 0) {
      toast.error('Select a clip for time alignment');
      return;
    }

    const jobId = createAiJob('vocal-analysis', 'Aligning audio to grid...');

    try {
      updateAiJob(jobId, { status: 'processing', progress: 50 });

      const audioFileId = selectedAudioFileIds[0] || selectedClipIds[0];
      const result = await apiClient.timeAlign(audioFileId, {
        tempo: currentProject?.bpm || 120,
        gridDivision: '1/16',
        strength: 0.8,
      });

      updateAiJob(jobId, {
        status: 'completed',
        progress: 100,
        message: 'Time alignment completed!',
        result
      });

      toast.success('Time alignment completed!');
    } catch (error: any) {
      updateAiJob(jobId, {
        status: 'error',
        error: error.message || 'Time alignment failed',
        message: 'Time alignment failed'
      });
      toast.error('Time alignment failed');
    }
  };

  const handleAutoPitch = async () => {
    if (selectedClipIds.length === 0) {
      toast.error('Select a clip for pitch correction');
      return;
    }

    const jobId = createAiJob('vocal-analysis', 'Analyzing and correcting pitch...');

    try {
      updateAiJob(jobId, { status: 'processing', progress: 60 });

      const audioFileId = selectedAudioFileIds[0] || selectedClipIds[0];
      const result = await apiClient.pitchCorrect(audioFileId, {
        targetKey: currentProject?.key || 'C',
        targetScale: 'major',
        strength: 0.8,
      });

      updateAiJob(jobId, {
        status: 'completed',
        progress: 100,
        message: 'Pitch correction completed!',
        result
      });

      toast.success('Pitch correction completed!');
    } catch (error: any) {
      updateAiJob(jobId, {
        status: 'error',
        error: error.message || 'Pitch correction failed',
        message: 'Pitch correction failed'
      });
      toast.error('Pitch correction failed');
    }
  };

  const handleAutoMix = async () => {
    if (selectedClipIds.length === 0) {
      toast.error('Select clips for auto-mix');
      return;
    }

    const jobId = createAiJob('vocal-analysis', 'AI mixing tracks...');

    try {
      updateAiJob(jobId, { status: 'processing', progress: 50 });

      const result = await apiClient.autoMix(selectedTrackIds.length ? selectedTrackIds : selectedClipIds, {
        genre,
        targetLoudness: -14.0,
      });

      updateAiJob(jobId, {
        status: 'completed',
        progress: 100,
        message: 'Auto-mix completed!',
        result
      });

      toast.success('Auto-mix completed!');
    } catch (error: any) {
      updateAiJob(jobId, {
        status: 'error',
        error: error.message || 'Auto-mix failed',
        message: 'Auto-mix failed'
      });
      toast.error('Auto-mix failed');
    }
  };

  const handleAutoMaster = async () => {
    if (selectedClipIds.length === 0) {
      toast.error('Select a clip for mastering');
      return;
    }

    const jobId = createAiJob('mastering', 'AI mastering track...');

    try {
      updateAiJob(jobId, { status: 'processing', progress: 70 });

      const result = await apiClient.masterTrack({
        audioFileId: selectedClipIds[0],
        options: {
          targetLoudness: -14.0,
          genre: 'pop',
        },
      });

      updateAiJob(jobId, {
        status: 'completed',
        progress: 100,
        message: 'Mastering completed!',
        result
      });

      toast.success('Mastering completed!');
    } catch (error: any) {
      updateAiJob(jobId, {
        status: 'error',
        error: error.message || 'Mastering failed',
        message: 'Mastering failed'
      });
      toast.error('Mastering failed');
    }
  };

  const handleAutoMusic = async (prompt: string, genre?: string, tempo?: number, duration?: number) => {
    console.log('🎵 handleAutoMusic called with:', { prompt, genre, tempo, duration });

    // Supported genres from backend
    const supportedGenres = ['trap', 'lo-fi', 'boom bap', 'house', 'drill', 'drum and bass', 'techno', 'hip hop', 'r&b', 'pop', 'edm', 'dubstep', 'jazz', 'rock'];

    // Map unsupported genres to supported ones
    const genreMap: Record<string, string> = {
      'country': 'rock',
      'folk': 'rock',
      'blues': 'jazz',
      'reggae': 'hip hop',
      'metal': 'rock',
      'punk': 'rock',
      'indie': 'pop',
      'alternative': 'rock',
      'classical': 'jazz',
      'soul': 'r&b',
      'funk': 'r&b',
      'disco': 'house',
      'ambient': 'lo-fi',
      'trance': 'edm',
      'hardstyle': 'edm',
    };

    // Smart genre normalization with compound genre support
    let normalizedGenre = genre?.toLowerCase() || 'pop';

    // Check if it's already a supported genre
    if (supportedGenres.includes(normalizedGenre)) {
      console.log(`🎵 Genre "${genre}" is already supported`);
    }
    // Check if it's in our mapping
    else if (genreMap[normalizedGenre]) {
      console.log(`🎵 Mapping genre "${genre}" -> "${genreMap[normalizedGenre]}"`);
      normalizedGenre = genreMap[normalizedGenre];
    }
    // Handle compound genres (e.g., "country-pop" -> "pop")
    else if (normalizedGenre.includes('-') || normalizedGenre.includes(' ')) {
      const parts = normalizedGenre.split(/[-\s]+/);
      console.log(`🎵 Compound genre detected: "${genre}", parts:`, parts);

      // Try to find a supported genre in the parts
      const supportedPart = parts.find(part => supportedGenres.includes(part));
      if (supportedPart) {
        console.log(`🎵 Using supported part: "${supportedPart}"`);
        normalizedGenre = supportedPart;
      } else {
        // Try to find a mapped genre in the parts
        const mappedPart = parts.find(part => genreMap[part]);
        if (mappedPart) {
          console.log(`🎵 Mapping compound part "${mappedPart}" -> "${genreMap[mappedPart]}"`);
          normalizedGenre = genreMap[mappedPart];
        } else {
          console.log(`🎵 No supported parts found in "${genre}", defaulting to "pop"`);
          normalizedGenre = 'pop';
        }
      }
    }
    // Unknown genre, default to pop
    else {
      console.log(`🎵 Unknown genre "${genre}", defaulting to "pop"`);
      normalizedGenre = 'pop';
    }

    const jobId = createAiJob('music-generation', `Generating music: "${prompt}"...`);

    // Initialize top progress bar
    setMusicGenProgress({
      isGenerating: true,
      prompt: prompt,
      progress: 0,
      status: 'pending',
      message: 'Starting music generation...',
    });

    try {
      // Update to processing state
      setMusicGenProgress({
        isGenerating: true,
        prompt: prompt,
        progress: 20,
        status: 'processing',
        message: 'Generating music with AI...',
      });
      updateAiJob(jobId, { status: 'processing', progress: 20 });

      console.log('🎵 Making API call to /api/generate/beat...');
      // Call beat generation API
      const response = await fetch('/api/generate/beat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          prompt,
          genre: normalizedGenre,
          tempo: tempo || 120,
          duration: duration || 30,
          projectId: currentProject?.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate music');
      }

      const data = await response.json();

      // Update progress - almost done
      // Job queued successfully - track/clip will be added via WebSocket event
      console.log('🎵 Beat generation job queued:', { jobId, generationId: data.generationId });

      setMusicGenProgress({
        isGenerating: true,
        prompt: prompt,
        progress: 80,
        status: 'processing',
        message: 'Generating beat... Track will be added automatically when complete.',
      });
      updateAiJob(jobId, {
        status: 'completed',
        progress: 100,
        message: 'Music generation completed!',
        result: data
      });

      // Dismiss any loading toasts from AIChatWidget
      toast.dismiss('music-gen-progress');

      // Show success notification
      toast.success(`🎵 Beat Generated: ${prompt}`, {
        duration: 5000,
        description: 'Your AI-generated music has been added to the timeline!',
      });

      // Auto-dismiss progress bar after 5 seconds
      setTimeout(() => {
        setMusicGenProgress(null);
      }, 5000);

    } catch (error: any) {
      console.error('🎵 Music generation error:', error);
      // Dismiss any loading toasts from AIChatWidget
      toast.dismiss('music-gen-progress');

      // Mark as error
      setMusicGenProgress({
        isGenerating: true,
        prompt: prompt,
        progress: 0,
        status: 'error',
        error: error.message || 'Music generation failed',
      });
      updateAiJob(jobId, {
        status: 'error',
        error: error.message || 'Music generation failed',
        message: 'Music generation failed'
      });
      toast.error('Music generation failed: ' + error.message);

      // Auto-dismiss error after 8 seconds
      setTimeout(() => {
        setMusicGenProgress(null);
      }, 8000);
    }
  };

  const handleAIDawg = async () => {
    if (selectedClipIds.length === 0) {
      toast.error('Select clips for DAWG AI full production');
      return;
    }

    const jobId = createAiJob('vocal-analysis', 'Starting DAWG AI full production pipeline...');

    try {
      updateAiJob(jobId, { status: 'processing', progress: 20 });

      const result = await apiClient.aiDawg(selectedAudioFileIds.length ? selectedAudioFileIds : selectedClipIds, {
        genre,
        tempo: currentProject?.bpm || 120,
        key: currentProject?.key || 'C',
      });

      updateAiJob(jobId, {
        status: 'completed',
        progress: 100,
        message: 'DAWG AI production completed!',
        result
      });

      toast.success('DAWG AI production completed!');
    } catch (error: any) {
      updateAiJob(jobId, {
        status: 'error',
        error: error.message || 'DAWG AI failed',
        message: 'DAWG AI production failed'
      });
      toast.error('DAWG AI failed');
    }
  };

  const handleCloseAiModal = () => {
    setShowAiModal(false);
    setAiJobs([]);
  };

  // ===== LOGIC PRO X-STYLE ROUTING HANDLERS =====

  const handleGetTracks = () => {
    return tracks.map(track => ({
      id: track.id,
      name: track.name,
      trackType: track.trackType,
      channels: track.channels,
      sends: track.sends || [],
      outputDestination: track.outputDestination,
      volume: track.volume,
      pan: track.pan,
      isMuted: track.isMuted,
      isSolo: track.isSolo,
    }));
  };

  const handleAICreateAuxTrack = (name: string, channels: 'mono' | 'stereo') => {
    const newTrack = addTrack(name, { trackType: 'aux', channels });
    return newTrack.id;
  };

  const handleAICreateAudioTrack = (name: string, channels: 'mono' | 'stereo') => {
    const newTrack = addTrack(name, { trackType: 'audio', channels });
    return newTrack.id;
  };

  const handleCreateSend = (sourceTrackId: string, destinationTrackId: string, preFader: boolean, level?: number) => {
    const sourceTrack = tracks.find(t => t.id === sourceTrackId);
    const destTrack = tracks.find(t => t.id === destinationTrackId);

    if (!sourceTrack || !destTrack) {
      toast.error('Invalid track IDs for send creation');
      return;
    }

    const newSend = {
      id: `send-${Date.now()}`,
      destination: destinationTrackId,
      level: level !== undefined ? level : 0.8,
      pan: 0,
      preFader,
      enabled: true,
    };

    const updatedSends = [...(sourceTrack.sends || []), newSend];
    updateTrack(sourceTrackId, { sends: updatedSends });

    toast.success(`Send created: ${sourceTrack.name} → ${destTrack.name} (${preFader ? 'pre' : 'post'}-fader)`);
  };

  const handleRemoveSend = (sourceTrackId: string, sendId: string) => {
    const sourceTrack = tracks.find(t => t.id === sourceTrackId);
    if (!sourceTrack) return;

    const updatedSends = (sourceTrack.sends || []).filter(s => s.id !== sendId);
    updateTrack(sourceTrackId, { sends: updatedSends });
    toast.info('Send removed');
  };

  const handleSetSendLevel = (sourceTrackId: string, sendId: string, level: number) => {
    const sourceTrack = tracks.find(t => t.id === sourceTrackId);
    if (!sourceTrack) return;

    const updatedSends = (sourceTrack.sends || []).map(s =>
      s.id === sendId ? { ...s, level } : s
    );
    updateTrack(sourceTrackId, { sends: updatedSends });
  };

  const handleSetTrackOutput = (trackId: string, outputDestination: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    updateTrack(trackId, { outputDestination });

    const destName = outputDestination === 'master' ? 'Master' :
      tracks.find(t => t.id === outputDestination)?.name || 'Unknown';
    toast.info(`${track.name} output → ${destName}`);
  };

  const handleSetTrackVolume = (trackId: string, volume: number) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    updateTrack(trackId, { volume });
  };

  const handleSetTrackPan = (trackId: string, pan: number) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    updateTrack(trackId, { pan });
  };

  const handleMuteTrack = (trackId: string, mute: boolean) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    updateTrack(trackId, { isMuted: mute });
    toast.info(`${track.name} ${mute ? 'muted' : 'unmuted'}`);
  };

  const handleSoloTrack = (trackId: string, solo: boolean) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    updateTrack(trackId, { isSolo: solo });
    toast.info(`${track.name} ${solo ? 'solo on' : 'solo off'}`);
  };

  // WebSocket-driven AI job progress (server emits ai:processing/completed/failed with taskId)
  useEffect(() => {
    const onProcessing = (data: { taskId: string; status: string }) => {
      const { taskId, status } = data;
      setShowAiModal(true);
      setAiJobs((prev) => {
        const existing = prev.find((j) => j.id === taskId);
        const newProgress = parseStepProgressFromStatus(status, existing?.progress || 0);
        if (existing) {
          return prev.map((j) => (j.id === taskId ? { ...j, status: 'processing', message: status, progress: newProgress } : j));
        }
        return [
          ...prev,
          {
            id: taskId,
            type: 'vocal-analysis',
            status: 'processing',
            progress: newProgress,
            message: status,
          },
        ];
      });
    };
    const onCompleted = (data: { taskId: string; result: any }) => {
      setShowAiModal(true);
      setAiJobs((prev) => prev.map((j) => (j.id === data.taskId ? { ...j, status: 'completed', progress: 100, result: data.result, message: 'Completed' } : j)));
    };
    const onFailed = (data: { taskId: string; error: string }) => {
      setShowAiModal(true);
      setAiJobs((prev) => prev.map((j) => (j.id === data.taskId ? { ...j, status: 'error', error: data.error, message: data.error } : j)));
    };
    const u1 = wsClient.on('ai:processing', onProcessing);
    const u2 = wsClient.on('ai:completed', onCompleted);
    const u3 = wsClient.on('ai:failed', onFailed);
    return () => { u1(); u2(); u3(); };
  }, []);

  // Debug WebSocket connection status
  useEffect(() => {
    console.log('🔌 WebSocket connection status:', {
      isConnected: wsClient.isConnected(),
      reconnectAttempts: wsClient.getReconnectAttempts(),
    });

    // Log connection state changes
    const onConnected = () => {
      console.log('✅ WebSocket connected to backend');
    };
    const onDisconnected = (data: any) => {
      console.warn('⚠️ WebSocket disconnected:', data);
    };

    const u1 = wsClient.on('connected', onConnected);
    const u2 = wsClient.on('disconnected', onDisconnected);

    return () => {
      u1();
      u2();
    };
  }, []);

  // WebSocket listener for beat generation completion - adds track/clip to timeline
  useEffect(() => {
    console.log('🎵 Registering daw:audio:loaded event handler');

    const onAudioLoaded = (data: {
      generationId: string;
      trackId: string;
      trackName: string;
      clipId: string;
      clip: {
        id: string;
        name: string;
        startTime: number;
        duration: number;
        trackId: string;
        audioUrl: string;
        audioFileId: string;
        metadata?: any;
      };
      autoPlay: boolean;
    }) => {
      console.log('🎵 daw:audio:loaded event received:', data);

      // Create track
      const newTrack = addTrack(data.trackName);

      // Add clip to the newly created track
      setTimeout(() => {
        const allTracks = useTimelineStore.getState().tracks;
        const latestTrack = allTracks[allTracks.length - 1];

        if (latestTrack) {
          addClip(latestTrack.id, {
            name: data.clip.name,
            startTime: data.clip.startTime,
            duration: data.clip.duration,
            color: latestTrack.color,
            audioUrl: data.clip.audioUrl,
          });

          console.log(`🎵 Track "${data.trackName}" added to timeline with clip`);
          toast.success(`Beat added to timeline: ${data.trackName}`);

          // Update progress to complete
          setMusicGenProgress({
            isGenerating: false,
            prompt: '',
            progress: 100,
            status: 'completed',
            message: 'Beat added to timeline!',
          });
        } else {
          console.error('🎵 Failed to find newly created track');
          toast.error('Failed to add beat to timeline');
        }
      }, 100);
    };

    const unsubscribe = wsClient.on('daw:audio:loaded', onAudioLoaded);
    return () => { unsubscribe(); };
  }, [addTrack, addClip]);

  // Auto-create demo project on first login
  useEffect(() => {
    const createDemoProject = async () => {
      if (!currentUser) return;

      // Check if coming from demo login
      const shouldCreateDemo = (location.state as any)?.createDemoProject;
      if (!shouldCreateDemo) return;

      try {
        // Check if user already has projects
        const projects = await apiClient.listProjects({ limit: 1 });
        if (projects.projects.length > 0) {
          // User has projects, open the first one
          handleOpenProject(projects.projects[0]);
          return;
        }

        // Create demo project
        toast.info('Creating demo project...');
        const demoProject = await apiClient.createProject({
          name: 'My First Track',
          bpm: 120,
          key: 'C',
          timeSignature: '4/4',
          description: 'Demo project - start creating music!',
        });

        toast.success('Demo project created!');
        handleOpenProject(demoProject);
      } catch (error) {
        console.error('Failed to create demo project:', error);
      }
    };

    createDemoProject();
  }, [currentUser, location.state]);

  // WebSocket: Join/leave project room
  useProjectRoom(currentProject?.id || null);

  // WebSocket: Handle project updates
  const handleProjectUpdated = useCallback((data: { project: Project }) => {
    if (currentProject && data.project.id === currentProject.id) {
      setCurrentProject(data.project);
      toast.info('Project updated by collaborator');
    }
  }, [currentProject]);

  // WebSocket: Handle track created
  const handleTrackCreated = useCallback((data: { projectId: string; track: any }) => {
    if (currentProject && data.projectId === currentProject.id) {
      toast.success('New track added');
    }
  }, [currentProject]);

  // WebSocket: Handle track updated
  const handleTrackUpdated = useCallback((data: { projectId: string; track: any }) => {
    if (currentProject && data.projectId === currentProject.id) {
      toast.info('Track updated');
    }
  }, [currentProject]);

  // WebSocket: Handle AI processing
  const handleAIProcessing = useCallback((data: { type: string; status: string }) => {
    toast.info(`AI ${data.type}: ${data.status}`);
  }, []);

  const handleAICompleted = useCallback((data: { type: string; result: any }) => {
    toast.success(`AI ${data.type} completed!`);
  }, []);

  const handleAIFailed = useCallback((data: { type: string; error: string }) => {
    toast.error(`AI ${data.type} failed: ${data.error}`);
  }, []);

  // Subscribe to WebSocket events
  useWebSocketEvent('project:updated', handleProjectUpdated);
  useWebSocketEvent('track:created', handleTrackCreated);
  useWebSocketEvent('track:updated', handleTrackUpdated);
  useWebSocketEvent('ai:processing', handleAIProcessing);
  useWebSocketEvent('ai:completed', handleAICompleted);
  useWebSocketEvent('ai:failed', handleAIFailed);

  // Pro Tools keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { isPlaying, isRecording, togglePlay, stop } = useTransportStore.getState();

      // Ignore shortcuts if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow Cmd+S and Cmd+Z even in inputs
        if (!((e.metaKey || e.ctrlKey) && (e.key === 's' || e.key === 'z'))) {
          return;
        }
      }

      // Cmd/Ctrl+S: Save Project
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveProject();
        toast.success('Project saved!');
        return;
      }

      // Cmd/Ctrl+N: New Track
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        handleNewTrack();
        return;
      }

      // Cmd/Ctrl+E: Export Project
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        handleExportProject();
        return;
      }

      // Cmd/Ctrl+I: Import Audio
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault();
        handleImportAudio();
        return;
      }

      // Space: Play/Pause (Pro Tools standard)
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
        toast.info(isPlaying ? 'Paused' : 'Playing');
        return;
      }

      // Enter (Numeric Keypad) or Cmd+.: Stop
      if (e.code === 'NumpadEnter' || ((e.metaKey || e.ctrlKey) && e.key === '.')) {
        e.preventDefault();
        stop();
        toast.info('Stopped');
        return;
      }

      // 3 (Numeric Keypad): Toggle Record
      if (e.code === 'Numpad3') {
        e.preventDefault();
        const { toggleRecord } = useTransportStore.getState();
        toggleRecord();
        toast.info(isRecording ? 'Recording stopped' : 'Recording started');
        return;
      }

      // R: Toggle Record (alternative)
      if (e.code === 'KeyR' && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        const { toggleRecord } = useTransportStore.getState();
        toggleRecord();
        return;
      }

      // L: Toggle Loop
      if (e.code === 'KeyL' && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        const { toggleLoop, isLooping } = useTransportStore.getState();
        toggleLoop();
        toast.info(isLooping ? 'Loop off' : 'Loop on');
        return;
      }

      // Cmd/Ctrl+D: Duplicate selected clips
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        if (selectedClipIds.length > 0) {
          toast.info('Duplicate clips - feature coming soon');
        }
        return;
      }

      // Cmd/Ctrl+Delete or Backspace: Delete selected clips
      if ((e.metaKey || e.ctrlKey) && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        if (selectedClipIds.length > 0) {
          toast.info('Delete clips - feature coming soon');
        }
        return;
      }

      // Up/Down Arrow: Navigate tracks
      if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          toast.info('Track navigation - feature coming soon');
        }
        return;
      }

      // Left/Right Arrow: Move playhead
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          const { currentTime, setCurrentTime } = useTransportStore.getState();
          const delta = e.shiftKey ? 5 : 1; // Shift for larger jumps
          const newTime = e.code === 'ArrowLeft'
            ? Math.max(0, currentTime - delta)
            : currentTime + delta;
          setCurrentTime(newTime);
          return;
        }
      }

      // 0 or Enter: Return to zero (Pro Tools style)
      if ((e.code === 'Digit0' || e.code === 'Enter' || e.code === 'NumpadEnter') && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        const { setCurrentTime, stop } = useTransportStore.getState();
        // Stop playback and return to beginning
        if (isPlaying || isRecording) {
          stop();
        }
        setCurrentTime(0);
        toast.info('Returned to start');
        return;
      }

      // Delete or Backspace: Delete selected clips (Pro Tools style)
      if ((e.code === 'Delete' || e.code === 'Backspace') && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        const { removeClip } = useTimelineStore.getState();

        if (selectedClipIds.length > 0) {
          selectedClipIds.forEach(clipId => {
            removeClip(clipId);
          });
          toast.success(`Deleted ${selectedClipIds.length} clip${selectedClipIds.length > 1 ? 's' : ''}`);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveProject, handleNewTrack, handleExportProject, handleImportAudio, selectedClipIds]);

  // Show loading state while project loads
  if (isLoadingProject || !currentProject) {
    return (
      <div className="h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-text-muted">Loading project...</p>
        </div>
      </div>
    );
  }

  // Project Editor View
  return (
    <div className="h-screen bg-bg-base flex flex-col overflow-hidden">
      {/* Music Generation Progress Bar - Top of Screen */}
      <MusicGenerationProgressBar
        progress={musicGenProgress}
        onDismiss={() => setMusicGenProgress(null)}
      />

      {/* Top Menu Bar */}
      <div className="flex-shrink-0 bg-bg-surface border-b border-border-base relative z-50">
        <div className="flex items-center h-10 px-4">
          <div className="relative" ref={aiDawgMenuRef}>
            <button
              onClick={() => setOpenMenu(openMenu === 'ai-dawg' ? null : 'ai-dawg')}
              className="flex items-center gap-2 text-text-base hover:bg-bg-surface-hover rounded transition-colors p-2 -ml-2"
            >
              <Music2 className="w-5 h-5 text-primary" />
              <span className="font-bold">DAWG AI</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {openMenu === 'ai-dawg' && (
              <div className="absolute top-full left-0 mt-1 w-72 bg-bg-surface-2 backdrop-blur-xl border border-border-strong rounded-lg shadow-2xl overflow-hidden max-h-[80vh] overflow-y-auto">
                {/* DAWG AI AUTO FEATURES */}
                <div className="border-b border-border-base">
                  <div className="px-4 py-2 bg-bg-surface">
                    <span className="text-xs font-semibold text-text-dim uppercase tracking-wider">
                      ⚡ DAWG AI AUTO FEATURES
                    </span>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { handleAIDawg(); setOpenMenu(null); }}
                      disabled={selectedClipIds.length === 0}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${
                        selectedClipIds.length === 0
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-primary-hover/20 hover:text-text-base'
                      }`}
                    >
                      <Zap className={`w-5 h-5 ${selectedClipIds.length === 0 ? 'text-text-dim' : 'text-primary'}`} />
                      <span className={`flex-1 text-left text-sm ${selectedClipIds.length === 0 ? 'text-text-dim' : 'text-text-base'}`}>
                        🎸 Dawg AI (Full Auto)
                      </span>
                      <span className="text-xs text-text-dim">
                        {selectedClipIds.length > 0 ? `${selectedClipIds.length} clip${selectedClipIds.length > 1 ? 's' : ''}` : 'Select clips'}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setFlashFeature('voice-memo');
                        setOpenMenu(null);
                        // Reset flash after component handles it
                        setTimeout(() => setFlashFeature(null), 3100);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-hover/20 hover:text-text-base transition-all"
                    >
                      <Mic className="w-5 h-5 text-primary" />
                      <span className="flex-1 text-left text-sm text-text-base">
                        AI Voice Memo
                      </span>
                    </button>
                    <button
                      onClick={() => { handleAutoComp(); setOpenMenu(null); }}
                      disabled={selectedClipIds.length < 2}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${
                        selectedClipIds.length < 2
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-primary-hover/20 hover:text-text-base'
                      }`}
                    >
                      <Scissors className={`w-5 h-5 ${selectedClipIds.length < 2 ? 'text-text-dim' : 'text-primary'}`} />
                      <span className={`flex-1 text-left text-sm ${selectedClipIds.length < 2 ? 'text-text-dim' : 'text-text-base'}`}>
                        AI Comp
                      </span>
                      <span className="text-xs text-text-dim">
                        {selectedClipIds.length >= 2 ? `${selectedClipIds.length} clips` : 'Select 2+ clips'}
                      </span>
                    </button>
                    <button
                      onClick={() => { handleAutoTimeAlign(); setOpenMenu(null); }}
                      disabled={selectedClipIds.length === 0}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${
                        selectedClipIds.length === 0
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-primary-hover/20 hover:text-text-base'
                      }`}
                    >
                      <AlignCenter className={`w-5 h-5 ${selectedClipIds.length === 0 ? 'text-text-dim' : 'text-primary'}`} />
                      <span className={`flex-1 text-left text-sm ${selectedClipIds.length === 0 ? 'text-text-dim' : 'text-text-base'}`}>
                        AI Tune
                      </span>
                      <span className="text-xs text-text-dim">
                        {selectedClipIds.length > 0 ? `${selectedClipIds.length} clip${selectedClipIds.length > 1 ? 's' : ''}` : 'Select clips'}
                      </span>
                    </button>
                    <button
                      onClick={() => { handleAutoPitch(); setOpenMenu(null); }}
                      disabled={selectedClipIds.length === 0}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${
                        selectedClipIds.length === 0
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-primary-hover/20 hover:text-text-base'
                      }`}
                    >
                      <Music className={`w-5 h-5 ${selectedClipIds.length === 0 ? 'text-text-dim' : 'text-primary'}`} />
                      <span className={`flex-1 text-left text-sm ${selectedClipIds.length === 0 ? 'text-text-dim' : 'text-text-base'}`}>
                        AI Pitch
                      </span>
                      <span className="text-xs text-text-dim">
                        {selectedClipIds.length > 0 ? `${selectedClipIds.length} clip${selectedClipIds.length > 1 ? 's' : ''}` : 'Select clips'}
                      </span>
                    </button>
                    <button
                      onClick={() => { handleAutoMix(); setOpenMenu(null); }}
                      disabled={selectedClipIds.length === 0}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${
                        selectedClipIds.length === 0
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-primary-hover/20 hover:text-text-base'
                      }`}
                    >
                      <Sliders className={`w-5 h-5 ${selectedClipIds.length === 0 ? 'text-text-dim' : 'text-primary'}`} />
                      <span className={`flex-1 text-left text-sm ${selectedClipIds.length === 0 ? 'text-text-dim' : 'text-text-base'}`}>
                        AI Mix
                      </span>
                      <span className="text-xs text-text-dim">
                        {selectedClipIds.length > 0 ? `${selectedClipIds.length} clip${selectedClipIds.length > 1 ? 's' : ''}` : 'Select clips'}
                      </span>
                    </button>
                    <button
                      onClick={() => { handleAutoMaster(); setOpenMenu(null); }}
                      disabled={selectedClipIds.length === 0}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${
                        selectedClipIds.length === 0
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-primary-hover/20 hover:text-text-base'
                      }`}
                    >
                      <Volume2 className={`w-5 h-5 ${selectedClipIds.length === 0 ? 'text-text-dim' : 'text-primary'}`} />
                      <span className={`flex-1 text-left text-sm ${selectedClipIds.length === 0 ? 'text-text-dim' : 'text-text-base'}`}>
                        AI Master
                      </span>
                      <span className="text-xs text-text-dim">
                        {selectedClipIds.length > 0 ? `${selectedClipIds.length} clip${selectedClipIds.length > 1 ? 's' : ''}` : 'Select clips'}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setFlashFeature('music-gen');
                        setOpenMenu(null);
                        // Reset flash after component handles it
                        setTimeout(() => setFlashFeature(null), 3100);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-hover/20 hover:text-text-base transition-all"
                    >
                      <Sparkles className="w-5 h-5 text-primary" />
                      <span className="flex-1 text-left text-sm text-text-base">
                        AI Music Gen
                      </span>
                    </button>
                  </div>
                </div>

                {/* Settings & Billing */}
                <div className="border-t border-border-base">
                  <button onClick={() => { setShowSettings(true); setOpenMenu(null); }} className="w-full px-4 py-2 text-left text-sm text-text-muted hover:bg-primary-hover/20 hover:text-text-base flex items-center gap-3">
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <a href="/settings/billing" onClick={() => setOpenMenu(null)} className="w-full px-4 py-2 text-left text-sm text-text-muted hover:bg-primary-hover/20 hover:text-text-base flex items-center gap-3">
                    <CreditCard className="w-4 h-4" />
                    Billing
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Menu Items */}
          <div className="hidden lg:flex gap-1 ml-4 text-sm">
            {/* File Menu */}
            <div className="relative" ref={fileMenuRef}>
              <button
                onClick={() => setOpenMenu(openMenu === 'file' ? null : 'file')}
                className="px-3 py-1.5 text-text-muted hover:text-text-base hover:bg-bg-surface-hover rounded transition-colors flex items-center gap-1"
              >
                File
                <ChevronDown className="w-3 h-3" />
              </button>
              {openMenu === 'file' && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-bg-surface-2 backdrop-blur-xl border border-border-strong rounded-lg shadow-2xl overflow-hidden">
                  <button onClick={handleImportAudio} className="w-full px-4 py-2 text-left text-sm text-text-muted hover:bg-primary-hover/20 hover:text-text-base flex items-center gap-3">
                    <Upload className="w-4 h-4" />
                    Import Audio
                  </button>
                  <div className="border-t border-border-base my-1" />
                  <button onClick={handleSaveProject} className="w-full px-4 py-2 text-left text-sm text-text-muted hover:bg-primary-hover/20 hover:text-text-base flex items-center gap-3">
                    <Save className="w-4 h-4" />
                    Save Project
                  </button>
                  <button onClick={handleExportProject} className="w-full px-4 py-2 text-left text-sm text-text-muted hover:bg-primary-hover/20 hover:text-text-base flex items-center gap-3">
                    <FolderOpen className="w-4 h-4" />
                    Export Project
                  </button>
                  <div className="border-t border-border-base my-1" />
                  <button onClick={handleCloseProject} className="w-full px-4 py-2 text-left text-sm text-text-muted hover:bg-primary-hover/20 hover:text-text-base flex items-center gap-3">
                    <ArrowLeft className="w-4 h-4" />
                    Close Project
                  </button>
                </div>
              )}
            </div>

            {/* Edit Menu */}
            <div className="relative" ref={editMenuRef}>
              <button
                onClick={() => setOpenMenu(openMenu === 'edit' ? null : 'edit')}
                className="px-3 py-1.5 text-text-muted hover:text-text-base hover:bg-bg-surface-hover rounded transition-colors flex items-center gap-1"
              >
                Edit
                <ChevronDown className="w-3 h-3" />
              </button>
              {openMenu === 'edit' && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-bg-surface-2 backdrop-blur-xl border border-border-strong rounded-lg shadow-2xl overflow-hidden">
                  <button onClick={() => setOpenMenu(null)} className="w-full px-4 py-2 text-left text-sm text-text-muted hover:bg-primary-hover/20 hover:text-text-base">
                    Undo
                    <span className="float-right text-xs text-text-dim">⌘Z</span>
                  </button>
                  <button onClick={() => setOpenMenu(null)} className="w-full px-4 py-2 text-left text-sm text-text-muted hover:bg-primary-hover/20 hover:text-text-base">
                    Redo
                    <span className="float-right text-xs text-text-dim">⌘⇧Z</span>
                  </button>
                  <div className="border-t border-border-base my-1" />
                  <button onClick={() => setOpenMenu(null)} className="w-full px-4 py-2 text-left text-sm text-text-muted hover:bg-primary-hover/20 hover:text-text-base">
                    Cut
                    <span className="float-right text-xs text-text-dim">⌘X</span>
                  </button>
                  <button onClick={() => setOpenMenu(null)} className="w-full px-4 py-2 text-left text-sm text-text-muted hover:bg-primary-hover/20 hover:text-text-base">
                    Copy
                    <span className="float-right text-xs text-text-dim">⌘C</span>
                  </button>
                  <button onClick={() => setOpenMenu(null)} className="w-full px-4 py-2 text-left text-sm text-text-muted hover:bg-primary-hover/20 hover:text-text-base">
                    Paste
                    <span className="float-right text-xs text-text-dim">⌘V</span>
                  </button>
                </div>
              )}
            </div>

            {/* Track Menu */}
            <div className="relative" ref={trackMenuRef}>
              <button
                onClick={() => setOpenMenu(openMenu === 'track' ? null : 'track')}
                className="px-3 py-1.5 text-text-muted hover:text-text-base hover:bg-bg-surface-hover rounded transition-colors flex items-center gap-1"
              >
                Track
                <ChevronDown className="w-3 h-3" />
              </button>
              {openMenu === 'track' && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-bg-surface-2 backdrop-blur-xl border border-border-strong rounded-lg shadow-2xl overflow-hidden">
                  <button onClick={handleNewTrack} className="w-full px-4 py-2 text-left text-sm text-text-muted hover:bg-primary-hover/20 hover:text-text-base flex items-center gap-3">
                    <Plus className="w-4 h-4" />
                    New Audio Track
                  </button>
                  <button onClick={() => { addTrack('MIDI Track', { trackType: 'midi', channels: 'stereo' }); setOpenMenu(null); toast.success('New MIDI track added'); }} className="w-full px-4 py-2 text-left text-sm text-text-muted hover:bg-primary-hover/20 hover:text-text-base flex items-center gap-3">
                    <Plus className="w-4 h-4" />
                    New MIDI Track
                  </button>
                  <button onClick={() => { setShowAuxTrackDialog(true); setOpenMenu(null); }} className="w-full px-4 py-2 text-left text-sm text-text-muted hover:bg-primary-hover/20 hover:text-text-base flex items-center gap-3">
                    <Plus className="w-4 h-4" />
                    New Aux Track
                  </button>
                  <div className="border-t border-border-base my-1" />
                  <button onClick={() => setOpenMenu(null)} className="w-full px-4 py-2 text-left text-sm text-text-dim cursor-not-allowed">
                    Delete Selected Tracks
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button onClick={() => setOpenMenu(openMenu === 'mobile' ? null : 'mobile')} className="p-2 text-text-muted hover:text-text-base">
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Auto-save indicator */}
          <div className="mr-4 flex items-center gap-2 text-xs text-text-muted">
            {isSaving ? (
              <>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                <span className="hidden sm:inline">Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="hidden sm:inline">Saved {new Date(lastSaved).toLocaleTimeString()}</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                <span className="hidden sm:inline">Not saved</span>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {openMenu === 'mobile' && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-bg-surface-2 border-b border-border-strong shadow-lg">
            <div className="p-4 space-y-4">
              <button onClick={handleSaveProject} className="w-full text-left text-text-muted hover:text-text-base">Save Project</button>
              <button onClick={handleExportProject} className="w-full text-left text-text-muted hover:text-text-base">Export Project</button>
              <button onClick={handleCloseProject} className="w-full text-left text-text-muted hover:text-text-base">Close Project</button>
            </div>
          </div>
        )}
      </div>

      {/* Responsive Layout */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Responsive Grid Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2 p-2 overflow-auto bg-bg-base">
          {/* Transport Widget - Full Width */}
          <div className="lg:col-span-12">
            <Widget
              title="TRANSPORT"
              defaultSize={{ width: '100%', height: 100 }}
              minHeight={80}
            >
              <TransportBar />
            </Widget>
          </div>

          {/* Timeline Widget - Large Left Section */}
          <div className="lg:col-span-8">
            <Widget
              title="TIMELINE"
              defaultSize={{ width: '100%', height: 450 }}
              minHeight={300}
            >
              <Timeline />
            </Widget>
          </div>

          {/* AI Chat Widget - Right Column */}
          <div className="lg:col-span-4">
            <AIChatWidget
                  isOpen={true}
                  onClose={() => {}}
                  projectContext={{
                    tempo: currentProject?.bpm,
                    key: currentProject?.key,
                    time_signature: "4/4",
                    selected_clips: selectedClipIds.length,
                    track_count: currentProject?.tracks?.length || 0,
                    project_name: currentProject?.name,
                    lyrics: lyrics
                  }}
                  aiJobs={aiJobs}
                  isExpanded={expandedWidget === 'ai'}
                  onToggleExpand={() => setExpandedWidget(expandedWidget === 'ai' ? 'balanced' : 'ai')}
                  onUpdateLyrics={(text, append) => {
                    if (append) {
                      setLyrics(prev => prev ? `${prev}\n${text}` : text);
                    } else {
                      setLyrics(text);
                    }
                  }}
                  onAutoComp={handleAutoComp}
                  onQuantize={handleAutoTimeAlign}
                  onAutotune={handleAutoPitch}
                  onSmartMix={handleAutoMix}
                  onMaster={handleAutoMaster}
                  onGenerateMusic={handleAutoMusic}
                  onAIDawg={handleAIDawg}
                  onGetTracks={handleGetTracks}
                  onCreateAuxTrack={handleAICreateAuxTrack}
                  onCreateAudioTrack={handleAICreateAudioTrack}
                  onCreateSend={handleCreateSend}
                  onRemoveSend={handleRemoveSend}
                  onSetSendLevel={handleSetSendLevel}
                  onSetTrackOutput={handleSetTrackOutput}
                  onSetTrackVolume={handleSetTrackVolume}
                  onSetTrackPan={handleSetTrackPan}
                  onMuteTrack={handleMuteTrack}
                  onSoloTrack={handleSoloTrack}
                  onStartRecording={async () => {
                    // Check if any tracks are armed for recording
                    const armedTracks = tracks.filter(t => t.isArmed);

                    if (armedTracks.length === 0) {
                      // No armed tracks - create a new track and arm it
                      const trackName = `Vocal ${tracks.length + 1}`;
                      const newTrack = addTrack(trackName);

                      // Arm the newly created track
                      // We need to wait a bit for the track to be added to the store
                      setTimeout(async () => {
                        const allTracks = useTimelineStore.getState().tracks;
                        const latestTrack = allTracks[allTracks.length - 1];
                        if (latestTrack) {
                          updateTrack(latestTrack.id, { isArmed: true });
                          console.log(`Created and armed track: ${trackName}`);

                          // Wait for microphone to be ready before starting recording
                          toast.info('🎤 Requesting microphone access...');
                          let attempts = 0;
                          const checkMicReady = setInterval(() => {
                            attempts++;
                            if (microphoneActive || attempts > 50) { // Max 5 seconds
                              clearInterval(checkMicReady);
                              if (microphoneActive) {
                                // Microphone is ready, start recording
                                useTransportStore.setState({ isPlaying: true, isRecording: true });
                                toast.success(`🔴 Recording on ${trackName}`);
                              } else {
                                toast.error('Microphone not available');
                              }
                            }
                          }, 100);
                        }
                      }, 100);
                    } else {
                      // Tracks already armed, check if mic is ready
                      if (!microphoneActive) {
                        toast.info('🎤 Waiting for microphone...');
                        let attempts = 0;
                        const checkMicReady = setInterval(() => {
                          attempts++;
                          if (microphoneActive || attempts > 50) {
                            clearInterval(checkMicReady);
                            if (microphoneActive) {
                              useTransportStore.setState({ isPlaying: true, isRecording: true });
                              toast.success(`🔴 Recording on ${armedTracks.length} track(s)`);
                            } else {
                              toast.error('Microphone not available');
                            }
                          }
                        }, 100);
                      } else {
                        // Mic already active, start immediately
                        useTransportStore.setState({ isPlaying: true, isRecording: true });
                        toast.success(`🔴 Recording on ${armedTracks.length} track(s)`);
                      }
                    }
                  }}
                  onStopRecording={() => {
                    // Stop recording
                    useTransportStore.setState({ isRecording: false });
                    toast.info('⏹️ Recording stopped');
                  }}
                  onPlay={() => {
                    // Play project
                    useTransportStore.setState({ isPlaying: true });
                    toast.success('Playing');
                  }}
                  onStop={() => {
                    // Stop playback
                    useTransportStore.setState({ isPlaying: false });
                    toast.info('Stopped');
                  }}
                  onSetTempo={(bpm: number) => {
                    // Set project tempo
                    if (currentProject?.id) {
                      handleSaveSettings({ bpm });
                    }
                  }}
                  onSetKey={(key: string) => {
                    // Set project key
                    if (currentProject?.id) {
                      handleSaveSettings({ key });
                    }
                  }}
                  onNewTrack={() => {
                    handleNewTrack();
                  }}
                  onSaveProject={() => {
                    handleSaveProject();
                  }}
                  onExportProject={() => {
                    handleExportProject();
                  }}
                  onUploadAudio={handleUploadAudioFile}
                  flashFeature={flashFeature}
                />
          </div>

          {/* Mixer Widget - Large Left Section */}
          <div className="lg:col-span-8">
            <Widget
              title="MIXER"
              defaultSize={{ width: '100%', height: 240 }}
              minHeight={200}
            >
              <MixerPanel />
            </Widget>
          </div>

          {/* Lyrics Widget - Right Column */}
          <div className="lg:col-span-4">
            <Widget
              title="LYRICS"
              defaultSize={{ width: '100%', height: 240 }}
              minHeight={200}
            >
              <div className="flex-1 p-4">
                <textarea
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  placeholder="Write your lyrics and composition notes here..."
                  className="w-full h-full bg-transparent border-none text-sm text-text-muted placeholder-text-dim resize-none focus:outline-none"
                />
              </div>
            </Widget>
          </div>
        </div>
      </div>

      {/* AI Processing Modal */}
      <AIProcessingModal
        isOpen={showAiModal}
        jobs={aiJobs}
        onClose={handleCloseAiModal}
      />
      <UpsellModal
        open={upsell.open}
        feature={upsell.feature}
        plan={upsell.plan}
        upgradeUrl={upsell.upgrade_url || null}
        onClose={() => setUpsell({ open: false })}
      />

      {/* Project Settings Modal */}
      <ProjectSettingsModal
        isOpen={showSettings}
        currentProject={currentProject}
        onClose={() => setShowSettings(false)}
        onSave={handleSaveSettings}
        userId={currentUser?.id}
        isRecording={isRecordingActive}
      />

      {/* Aux Track Dialog */}
      <AuxTrackDialog
        isOpen={showAuxTrackDialog}
        onClose={() => setShowAuxTrackDialog(false)}
        onCreate={handleCreateAuxTrack}
      />

      {/* AI Feature Hub */}
      <AIFeatureHub
        isOpen={showAIHub && !!currentProject}
        onClose={() => setShowAIHub(false)}
        projectId={currentProject?.id || ''}
        entitlements={currentUser?.entitlements}
      />

      {/* AI Feature Panels - Slide-out from right */}
      {activePanel && currentProject && (
        <div className="fixed inset-y-0 right-0 w-full md:w-[500px] lg:w-[600px] bg-bg-surface border-l border-border-strong shadow-2xl z-50 flex flex-col animate-slide-in-right">
          {/* Close button */}
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => setActivePanel(null)}
              className="p-2 bg-bg-surface-2 hover:bg-bg-surface-hover rounded-lg transition-colors"
              aria-label="Close panel"
              data-testid="close-panel-button"
            >
              <span className="text-text-muted text-xl">✕</span>
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-hidden">
            {activePanel === 'vocal-coach' && (
              <div data-panel="vocal-coach" className="vocal-coach-panel h-full">
                <VocalCoachPanel projectId={currentProject.id} />
              </div>
            )}
            {activePanel === 'producer' && (
              <div data-panel="producer" className="producer-panel h-full">
                <ProducerPanel projectId={currentProject.id} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden file input for Import Audio */}
      <input
        ref={importAudioInputRef}
        type="file"
        accept="audio/*,.wav,.mp3,.aiff,.flac,.ogg,.m4a"
        multiple
        onChange={handleAudioFileSelect}
        className="hidden"
      />

      {/* Upload Progress Bar */}
      {uploadProgress && (
        <div className="fixed top-20 right-4 w-96 bg-gradient-to-br from-gray-900 to-black border border-white/20 rounded-xl shadow-2xl overflow-hidden z-[100]">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-400 animate-pulse" />
                <span className="text-white font-semibold truncate max-w-[200px]">
                  {uploadProgress.fileName}
                </span>
              </div>
              <span className="text-blue-400 font-bold text-sm">
                {uploadProgress.progress}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="relative h-2 bg-white/10 rounded-full overflow-hidden mb-2">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress.progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>

            {/* Status Text */}
            <div className="text-sm text-gray-400">
              {uploadProgress.step}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
