import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Music2, Sparkles, LogOut, ChevronDown, Plus, FolderOpen, Save, Settings, Scissors, AlignCenter, Music, Volume2, Sliders, Zap, TrendingUp, Wand2, CreditCard } from 'lucide-react';
import { TransportBar, Timeline, LoginForm, RegisterForm, CollaboratorList, AIDawgMenu, AIProcessingModal, AIChatWidget, MixerPanel, UpsellModal, GenreSelector, ProjectSettingsModal, AIFeatureHub } from './components';
import { apiClient } from '../api/client';
import { wsClient } from '../api/websocket';
import { parseStepProgressFromStatus } from './utils/aiProgress';
import { getSelectedAudioFileIds, getSelectedTrackIds } from './utils/selection';
import { VocalCoachPanel, ProducerPanel } from './panels';
import { useTransportStore } from '../stores/transportStore';
import { useTimelineStore } from '../stores/timelineStore';
import { useProjectRoom, useWebSocketEvent } from '../hooks/useWebSocket';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { usePlaylistRecording } from '../hooks/usePlaylistRecording';
import { useAuth } from '../contexts/AuthContext';
import type { Project, User } from '../api/types';
import type { AIProcessingJob } from './components/AIProcessingModal';
import { toast } from 'sonner';

export const DAWDashboard: React.FC = () => {
  const location = useLocation();
  const params = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user, logout: authLogout } = useAuth();
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  // Use user directly from AuthContext instead of redundant local state
  const currentUser = user;
  const [activePanel, setActivePanel] = useState<'vocal-coach' | 'producer' | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [aiJobs, setAiJobs] = useState<AIProcessingJob[]>([]);
  const [showAiModal, setShowAiModal] = useState(false);
  const [upsell, setUpsell] = useState<{ open: boolean; feature?: string; plan?: string; upgrade_url?: string | null }>({ open: false });
  const [planBadge, setPlanBadge] = useState<string>('');
  const [genre, setGenre] = useState<string>('pop');
  const [showAIChat, setShowAIChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAIHub, setShowAIHub] = useState(false);
  const { isPlaying, currentTime, setCurrentTime } = useTransportStore();
  const { addTrack, selectedClipIds, tracks } = useTimelineStore();
  const selectedTrackIds = React.useMemo(() => getSelectedTrackIds(tracks, selectedClipIds), [tracks, selectedClipIds]);
  const selectedAudioFileIds = React.useMemo(() => getSelectedAudioFileIds(tracks, selectedClipIds), [tracks, selectedClipIds]);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const editMenuRef = useRef<HTMLDivElement>(null);
  const trackMenuRef = useRef<HTMLDivElement>(null);
  const aiDawgMenuRef = useRef<HTMLDivElement>(null);

  // Initialize audio engine for recording
  const { isInitialized: audioEngineReady, hasPermission: hasMicPermission } = useAudioEngine();

  // Enable Pro Tools-style playlist recording
  const { currentLoopPass, isPlaylistRecordingActive } = usePlaylistRecording();

  // Connect WebSocket when user is authenticated
  useEffect(() => {
    if (user) {
      const token = apiClient.getToken();
      if (token && !wsClient.isConnected()) {
        wsClient.connect(token);
      }
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
      } catch {}
    })();
  }, [currentUser]);

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

    try {
      setIsSaving(true);
      await apiClient.updateProject(currentProject.id, {
        name: currentProject.name,
        bpm: currentProject.bpm,
        key: currentProject.key,
        timeSignature: currentProject.timeSignature,
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
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

  // Manual save with Cmd+S / Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveProject();
        toast.success('Project saved!');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveProject]);

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
    addTrack('Audio Track');
    setOpenMenu(null);
    toast.success('New track added');
  };

  const handleSaveProject = async () => {
    await saveProject();
    setOpenMenu(null);
    toast.success('Project saved!');
  };

  const handleSaveSettings = async (settings: { bpm?: number; key?: string; timeSignature?: string }) => {
    if (!currentProject?.id) return;

    try {
      await apiClient.updateProject(currentProject.id, settings);
      setCurrentProject({ ...currentProject, ...settings });
      toast.success('Project settings updated!');
    } catch (error) {
      console.error('Failed to update project settings:', error);
      toast.error('Failed to update settings');
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
  const addAiJob = (type: AIProcessingJob['type'], message: string): string => {
    const id = `${type}-${Date.now()}`;
    const newJob: AIProcessingJob = {
      id,
      type,
      status: 'pending',
      progress: 0,
      message,
    };
    setAiJobs(prev => [...prev, newJob]);
    setShowAiModal(true);
    return id;
  };

  const updateAiJob = (id: string, updates: Partial<AIProcessingJob>) => {
    setAiJobs(prev => prev.map(job => job.id === id ? { ...job, ...updates } : job));
  };

  // AI DAWG Handlers
  const handleAutoComp = async () => {
    if (selectedClipIds.length < 2) {
      toast.error('Select at least 2 clips for auto-comp');
      return;
    }

    const jobId = addAiJob('vocal-analysis', 'Analyzing vocal takes for best segments...');

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

    const jobId = addAiJob('vocal-analysis', 'Aligning audio to grid...');

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

    const jobId = addAiJob('vocal-analysis', 'Analyzing and correcting pitch...');

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

    const jobId = addAiJob('vocal-analysis', 'AI mixing tracks...');

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

    const jobId = addAiJob('mastering', 'AI mastering track...');

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

  const handleAutoMusic = async () => {
    const jobId = addAiJob('chord-generation', 'Generating chords and melody...');

    try {
      updateAiJob(jobId, { status: 'processing', progress: 30 });

      // Generate chords
      const chordsResult = await apiClient.generateContent({
        type: 'chords',
        params: {
          mood: 'happy',
          genre: 'pop',
          key: currentProject?.key || 'C',
          progressionLength: 4,
        },
      });

      updateAiJob(jobId, { progress: 60, message: 'Chords generated, creating melody...' });

      // Generate melody
      const melodyResult = await apiClient.generateContent({
        type: 'melody',
        params: {
          chords: chordsResult.data?.chords || [],
          key: currentProject?.key || 'C',
          scale: 'major',
        },
      });

      updateAiJob(jobId, {
        status: 'completed',
        progress: 100,
        message: 'Music generation completed!',
        result: { chords: chordsResult, melody: melodyResult }
      });

      toast.success('Music generation completed!');
    } catch (error: any) {
      updateAiJob(jobId, {
        status: 'error',
        error: error.message || 'Music generation failed',
        message: 'Music generation failed'
      });
      toast.error('Music generation failed');
    }
  };

  const handleAIDawg = async () => {
    if (selectedClipIds.length === 0) {
      toast.error('Select clips for AI DAWG full production');
      return;
    }

    const jobId = addAiJob('vocal-analysis', 'Starting AI DAWG full production pipeline...');

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
        message: 'AI DAWG production completed!',
        result
      });

      toast.success('AI DAWG production completed!');
    } catch (error: any) {
      updateAiJob(jobId, {
        status: 'error',
        error: error.message || 'AI DAWG failed',
        message: 'AI DAWG production failed'
      });
      toast.error('AI DAWG failed');
    }
  };

  const handleCloseAiModal = () => {
    setShowAiModal(false);
    setAiJobs([]);
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
      {/* Top Menu Bar */}
      <div className="flex-shrink-0 bg-bg-surface border-b border-border-base relative z-50">
        <div className="flex items-center h-10 px-4">
          <div className="relative" ref={aiDawgMenuRef}>
            <button
              onClick={() => setOpenMenu(openMenu === 'ai-dawg' ? null : 'ai-dawg')}
              className="flex items-center gap-2 text-text-base hover:bg-bg-surface-hover rounded transition-colors p-2 -ml-2"
            >
              <Music2 className="w-5 h-5 text-primary" />
              <span className="font-bold">AI Dawg</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {openMenu === 'ai-dawg' && (
              <div className="absolute top-full left-0 mt-1 w-72 bg-bg-surface-2 backdrop-blur-xl border border-border-strong rounded-lg shadow-2xl overflow-hidden max-h-[80vh] overflow-y-auto">
                {/* AI DAWG AUTO FEATURES */}
                <div className="border-b border-border-base">
                  <div className="px-4 py-2 bg-bg-surface">
                    <span className="text-xs font-semibold text-text-dim uppercase tracking-wider">
                      ⚡ AI Features
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
                        🚀 AI DAWG (Full Auto)
                      </span>
                      <span className="text-xs text-text-dim">
                        {selectedClipIds.length > 0 ? `${selectedClipIds.length} clip${selectedClipIds.length > 1 ? 's' : ''}` : 'Select clips'}
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
                        Auto Comp
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
                        Auto Time Align
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
                        Auto Pitch Correct
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
                        Auto Mix
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
                        Auto Master
                      </span>
                      <span className="text-xs text-text-dim">
                        {selectedClipIds.length > 0 ? `${selectedClipIds.length} clip${selectedClipIds.length > 1 ? 's' : ''}` : 'Select clips'}
                      </span>
                    </button>
                    <button
                      onClick={() => { handleAutoMusic(); setOpenMenu(null); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-hover/20 hover:text-text-base transition-all"
                    >
                      <Sparkles className="w-5 h-5 text-primary" />
                      <span className="flex-1 text-left text-sm text-text-base">
                        Auto Music Generation
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

                {/* Footer */}
                <div className="px-4 py-3 bg-gradient-to-r from-primary/10 to-secondary/10 border-t border-border-base">
                  <p className="text-xs text-text-muted text-center">
                    ✨ Powered by AI • {selectedClipIds.length > 0 ? 'Ready to process' : 'Select clips to begin'}
                  </p>
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
                  <button onClick={handleSaveProject} className="w-full px-4 py-2 text-left text-sm text-text-muted hover:bg-primary-hover/20 hover:text-text-base flex items-center gap-3">
                    <Save className="w-4 h-4" />
                    Save Project
                  </button>
                  <button onClick={handleExportProject} className="w-full px-4 py-2 text-left text-sm text-text-muted hover:bg-primary-hover/20 hover:text-text-base flex items-center gap-3">
                    <FolderOpen className="w-4 h-4" />
                    Export Project
                  </button>
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
                  <button onClick={() => { addTrack('MIDI Track'); setOpenMenu(null); toast.success('New MIDI track added'); }} className="w-full px-4 py-2 text-left text-sm text-text-muted hover:bg-primary-hover/20 hover:text-text-base flex items-center gap-3">
                    <Plus className="w-4 h-4" />
                    New MIDI Track
                  </button>
                  <button onClick={() => { addTrack('Aux Track'); setOpenMenu(null); toast.success('New aux track added'); }} className="w-full px-4 py-2 text-left text-sm text-text-muted hover:bg-primary-hover/20 hover:text-text-base flex items-center gap-3">
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
        {/* Transport Bar - Floating Widget */}
        <div className="flex justify-center p-4 border-b border-border-base">
          <div className="bg-bg-surface backdrop-blur-xl border border-border-strong rounded-2xl shadow-2xl">
            <TransportBar />
          </div>
        </div>

        {/* Main Content - Responsive Layout */}
        <div className="flex-1 flex flex-col lg:flex-row gap-2 p-2 overflow-hidden">
          {/* Left Column - Timeline + Mixer */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            {/* Timeline Widget */}
            <div className="flex-1 bg-bg-surface backdrop-blur-xl border border-border-strong rounded-2xl shadow-2xl overflow-hidden min-h-[300px]">
              <Timeline />
            </div>

            {/* Mixer Panel */}
            <div className="h-48 lg:h-60 bg-bg-surface backdrop-blur-xl border border-border-strong rounded-2xl shadow-2xl overflow-hidden">
              <MixerPanel />
            </div>
          </div>

          {/* Right Column - AI Chat + Lyrics */}
          <div className="w-full lg:w-96 flex flex-col gap-2 min-h-0">
            {/* AI DAWG Widget */}
            <div className="flex-1 bg-bg-surface backdrop-blur-xl border border-border-strong rounded-2xl shadow-2xl flex flex-col overflow-hidden min-h-[250px]">
                <div className="p-3 border-b border-border-base">
                  <h3 className="text-sm font-semibold text-text-base flex items-center gap-2">
                    <Music2 className="w-4 h-4 text-primary" />
                    AI DAWG
                  </h3>
                  {/* AI progress indicator */}
                  {aiJobs.some(j => j.status === 'processing') && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-primary">
                      <span>Processing</span>
                      <div className="flex-1 h-2 bg-bg-surface-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-secondary"
                          style={{ width: `${Math.round(aiJobs.filter(j=>j.status==='processing').reduce((a,b)=>a+(b.progress||0),0)/Math.max(1,aiJobs.filter(j=>j.status==='processing').length))}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="bg-gradient-to-br from-primary/20 to-transparent border border-primary/30 rounded-lg p-4 mb-4">
                    <p className="text-sm text-text-muted mb-3">
                      Hey! I'm AI Dawg, your AI music production and vocal coaching assistant.
                    </p>
                    <p className="text-xs text-text-dim mb-2">
                      🎤 **Vocal Coaching**: Ask me about pitch, breathing, tone, timing, or warm-up exercises
                    </p>
                    <p className="text-xs text-text-dim mb-2">
                      🎹 **Production**: Control the DAW, get mixing advice, and arrangement tips
                    </p>
                    <p className="text-sm text-text-muted mt-3">
                      The pitch monitor above shows your real-time pitch accuracy. What are we working on today?
                    </p>
                    <p className="text-xs text-text-dim mt-2">{new Date().toLocaleTimeString()}</p>
                  </div>
                </div>
                <div className="p-4 border-t border-border-base">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAIChat(true)}
                      className="p-2 bg-bg-surface-2 hover:bg-bg-surface-hover border border-border-base rounded"
                      title="Open full AI Chat"
                    >
                      +
                    </button>
                    <input
                      type="text"
                      placeholder="Ask anything"
                      onClick={() => setShowAIChat(true)}
                      className="flex-1 px-4 py-2 bg-bg-surface-2 border border-border-base rounded text-text-base placeholder-text-muted text-sm cursor-pointer"
                      readOnly
                    />
                    <button
                      onClick={() => setShowAIChat(true)}
                      className="p-2 bg-bg-surface-2 hover:bg-bg-surface-hover border border-border-base rounded"
                      title="Voice chat"
                    >
                      🎤
                    </button>
                    <button
                      onClick={() => setShowAIChat(true)}
                      className="p-2 bg-primary hover:bg-primary-hover rounded"
                    >
                      →
                    </button>
                  </div>
                </div>
            </div>

            {/* Lyrics & Notes Widget */}
            <div className="flex-1 bg-bg-surface backdrop-blur-xl border border-border-strong rounded-2xl shadow-2xl flex flex-col overflow-hidden min-h-[150px]">
              <div className="p-3 border-b border-border-base flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-base">📝 Lyrics & Notes</h3>
              </div>
              <div className="flex-1 p-4">
                <textarea
                  placeholder="Write your lyrics and composition notes here..."
                  className="w-full h-full bg-transparent border-none text-sm text-text-muted placeholder-text-dim resize-none focus:outline-none"
                />
              </div>
            </div>
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
      />

      {/* AI Chat Widget */}
      <AIChatWidget
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
        projectContext={{
          tempo: currentProject?.bpm,
          key: currentProject?.key,
          time_signature: "4/4",
          selected_clips: selectedClipIds.length,
          track_count: currentProject?.tracks?.length || 0,
          project_name: currentProject?.name
        }}
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
    </div>
  );
};
