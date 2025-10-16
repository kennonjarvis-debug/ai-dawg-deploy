/**
 * Freestyle Recording Page
 *
 * Full-screen freestyle recording interface with:
 * - Voice-controlled recording
 * - Live waveform visualization
 * - Real-time lyrics transcription
 * - Beat playback
 * - AI lyrics organization
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Music, Info } from 'lucide-react';
import { FreestyleSession } from '../ui/components';
import { apiClient } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export const FreestylePage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [project, setProject] = useState<any>(null);
  const [beatUrl, setBeatUrl] = useState<string | undefined>();
  const [beatFileId, setBeatFileId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  /**
   * Load project and beat data
   */
  useEffect(() => {
    const loadProjectData = async () => {
      if (!projectId) {
        toast.error('No project selected');
        navigate('/app');
        return;
      }

      try {
        setLoading(true);

        // Load project
        const projectData = await apiClient.getProject(projectId);
        setProject(projectData);

        // Check if beat URL was passed via navigation state
        const state = location.state as any;
        if (state?.beatUrl) {
          setBeatUrl(state.beatUrl);
          setBeatFileId(state.beatFileId);
        } else {
          // Try to find a beat from project audio files
          // TODO: Implement audio file listing API
          // const audioFiles = await apiClient.getProjectAudioFiles(projectId);
          // const beatFile = audioFiles.find(f => f.tags?.includes('beat') || f.tags?.includes('instrumental'));
          // if (beatFile) {
          //   setBeatFileId(beatFile.id);
          //   const { url } = await apiClient.getAudioDownloadUrl(beatFile.id);
          //   setBeatUrl(url);
          // }
        }
      } catch (error) {
        console.error('Failed to load project:', error);
        toast.error('Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    loadProjectData();
  }, [projectId, location.state, navigate]);

  /**
   * Handle session complete
   */
  const handleSessionComplete = async (lyrics: any[], audioBlob: Blob) => {
    toast.success('Freestyle session complete! 🎤');

    // Navigate back to DAW after a delay
    setTimeout(() => {
      navigate(`/daw/${projectId}`, {
        state: {
          freestyle: {
            lyrics,
            message: 'Freestyle session completed successfully!',
          },
        },
      });
    }, 2000);
  };

  /**
   * Handle back to DAW
   */
  const handleBackToDaw = () => {
    navigate(`/daw/${projectId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-white text-lg">Loading freestyle session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex flex-col">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToDaw}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to DAW
            </button>

            <div className="flex items-center gap-3">
              <Music className="w-6 h-6 text-purple-400" />
              <div>
                <h1 className="text-xl font-bold text-white">Freestyle Mode</h1>
                <p className="text-sm text-gray-400">
                  {project?.name || 'Untitled Project'}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors"
          >
            <Info className="w-4 h-4" />
            {showHelp ? 'Hide Help' : 'Show Help'}
          </button>
        </div>
      </header>

      {/* Help Panel */}
      {showHelp && (
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-b border-white/10 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-lg font-bold text-white mb-3">Voice Commands</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="bg-black/30 rounded-lg p-3">
                <span className="text-purple-300 font-semibold">"Start recording"</span>
                <p className="text-gray-400 mt-1">Begin recording vocals only</p>
              </div>
              <div className="bg-black/30 rounded-lg p-3">
                <span className="text-purple-300 font-semibold">"Start recording and play beat"</span>
                <p className="text-gray-400 mt-1">Start recording with beat playback</p>
              </div>
              <div className="bg-black/30 rounded-lg p-3">
                <span className="text-purple-300 font-semibold">"Stop recording"</span>
                <p className="text-gray-400 mt-1">Stop recording and process lyrics</p>
              </div>
              <div className="bg-black/30 rounded-lg p-3">
                <span className="text-purple-300 font-semibold">"Pause"</span>
                <p className="text-gray-400 mt-1">Pause the current recording</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-200 text-sm">
                <strong>Tip:</strong> Make sure to allow microphone access when prompted.
                Speak clearly and at a comfortable pace for best transcription results.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Freestyle Session */}
      <main className="flex-1 overflow-hidden">
        {projectId && (
          <FreestyleSession
            projectId={projectId}
            beatFileId={beatFileId}
            beatUrl={beatUrl}
            trackColor="#8b5cf6"
            onSessionComplete={handleSessionComplete}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-black/50 backdrop-blur-sm border-t border-white/10 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-4">
            <span>User: {user?.username || 'Anonymous'}</span>
            <span>•</span>
            <span>Project: {project?.name || 'Untitled'}</span>
          </div>
          <div className="flex items-center gap-2">
            {beatUrl ? (
              <span className="text-green-400">✓ Beat loaded</span>
            ) : (
              <span className="text-yellow-400">⚠ No beat loaded</span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FreestylePage;
