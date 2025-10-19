/**
 * Music Generator Panel
 *
 * Unified interface for AI music generation.
 * Integrates Producer AI (chords/melody) + DAWG AI (full music generation).
 */

import React, { useState } from 'react';
import { Wand2, Music, Sparkles, Download, Play, Pause, AlertCircle, Info, Loader2, Mic, MicOff, Guitar } from 'lucide-react';
import { toast } from 'sonner';
import { LyricsWidget } from '../recording/LyricsWidget';

interface MusicGeneratorPanelProps {
  projectId: string;
  onTrackGenerated?: (trackData: any) => void;
}

export const MusicGeneratorPanel: React.FC<MusicGeneratorPanelProps> = ({
  projectId,
  onTrackGenerated,
}) => {
  // Generation settings
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState('pop');
  const [mood, setMood] = useState('happy');
  const [tempo, setTempo] = useState(120);
  const [duration, setDuration] = useState(30); // seconds
  const [style, setStyle] = useState('full-production');
  const [includeVocals, setIncludeVocals] = useState(false);
  const [customLyrics, setCustomLyrics] = useState('');
  const [useCustomLyrics, setUseCustomLyrics] = useState(false);
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedTrack, setGeneratedTrack] = useState<any>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Audio player ref
  const audioRef = React.useRef<HTMLAudioElement>(null);

  /**
   * Generate full music track using DAWG AI endpoint
   */
  const handleGenerateMusic = async () => {
    if (!prompt.trim() && style === 'full-production') {
      setError('Please enter a prompt describing the music you want to create');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/ai/dawg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          prompt: prompt || `${mood} ${genre} music`,
          genre,
          mood,
          tempo,
          duration,
          style,
          project_id: projectId,
          include_vocals: includeVocals,
          custom_lyrics: includeVocals && useCustomLyrics ? customLyrics : undefined,
          instruments: selectedInstruments.length > 0 ? selectedInstruments : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle 402 (Payment Required) - Upgrade needed
        if (response.status === 402) {
          setError(errorData.guidance || 'Upgrade required to use Music Generator');
          return;
        }

        throw new Error(errorData.error || 'Failed to generate music');
      }

      const data = await response.json();

      setGeneratedTrack(data);

      // If audio URL is provided, set it
      if (data.audio_url) {
        setAudioUrl(data.audio_url);
      }

      // If track was created, notify parent
      if (data.track_id && onTrackGenerated) {
        onTrackGenerated(data);
      }

      toast.success('Music generated successfully!');
    } catch (err: any) {
      console.error('Music generation failed:', err);
      setError(err.message || 'Failed to generate music');
      toast.error('Music generation failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Play/pause generated audio
   */
  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  /**
   * Download generated track
   */
  const handleDownload = () => {
    if (!audioUrl) return;

    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `ai-dawg-${genre}-${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast.success('Download started');
  };

  /**
   * Toggle instrument selection
   */
  const toggleInstrument = (instrument: string) => {
    setSelectedInstruments(prev =>
      prev.includes(instrument)
        ? prev.filter(i => i !== instrument)
        : [...prev, instrument]
    );
  };

  return (
    <div className="h-full flex flex-col bg-daw-surface/40 backdrop-blur-xl border-l border-white/10">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Wand2 className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Music Generator</h2>
            <p className="text-sm text-gray-400">Create full tracks with AI</p>
          </div>
        </div>

        {/* Beta Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full mt-3">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs font-medium text-blue-300">STUDIO Plan</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-400 text-sm">{error}</p>
              {error.includes('Upgrade') && (
                <a
                  href="/pricing"
                  className="text-sm text-blue-400 hover:text-blue-300 underline mt-2 inline-block"
                >
                  View Plans
                </a>
              )}
            </div>
          </div>
        )}

        {/* Prompt Input */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Describe Your Music
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g., 'Upbeat pop song with catchy melody and driving drums' or 'Chill lo-fi beat with piano and soft pads'"
            disabled={loading}
            rows={3}
            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 disabled:opacity-50 resize-none"
          />
          <p className="text-xs text-gray-500 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>Be specific about genre, mood, instruments, and style for best results</span>
          </p>
        </div>

        {/* Generation Settings */}
        <div className="p-5 bg-black/40 border border-white/10 rounded-xl space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Generation Settings
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Genre */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Genre
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
              >
                <option value="pop">Pop</option>
                <option value="rock">Rock</option>
                <option value="electronic">Electronic</option>
                <option value="hip-hop">Hip Hop</option>
                <option value="jazz">Jazz</option>
                <option value="classical">Classical</option>
                <option value="ambient">Ambient</option>
                <option value="cinematic">Cinematic</option>
                <option value="lo-fi">Lo-Fi</option>
              </select>
            </div>

            {/* Mood */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mood
              </label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
              >
                <option value="happy">Happy</option>
                <option value="sad">Sad</option>
                <option value="energetic">Energetic</option>
                <option value="calm">Calm</option>
                <option value="dark">Dark</option>
                <option value="uplifting">Uplifting</option>
                <option value="mysterious">Mysterious</option>
                <option value="romantic">Romantic</option>
              </select>
            </div>

            {/* Tempo */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tempo: {tempo} BPM
              </label>
              <input
                type="range"
                min="60"
                max="180"
                value={tempo}
                onChange={(e) => setTempo(Number(e.target.value))}
                disabled={loading}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-thumb disabled:opacity-50"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Slow</span>
                <span>Fast</span>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duration: {duration}s
              </label>
              <input
                type="range"
                min="15"
                max="120"
                step="15"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                disabled={loading}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-thumb disabled:opacity-50"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>15s</span>
                <span>2min</span>
              </div>
            </div>
          </div>

          {/* Style & Vocals */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Style
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setStyle('full-production')}
                  disabled={loading}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    style === 'full-production'
                      ? 'bg-purple-500/30 border-2 border-purple-500 text-purple-300'
                      : 'bg-black/40 border border-white/10 text-gray-400 hover:border-white/30'
                  } disabled:opacity-50`}
                >
                  Full Production
                </button>
                <button
                  onClick={() => setStyle('instrumental')}
                  disabled={loading}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    style === 'instrumental'
                      ? 'bg-purple-500/30 border-2 border-purple-500 text-purple-300'
                      : 'bg-black/40 border border-white/10 text-gray-400 hover:border-white/30'
                  } disabled:opacity-50`}
                >
                  Instrumental
                </button>
              </div>
            </div>

            {/* Vocals Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Vocals
              </label>
              <button
                onClick={() => setIncludeVocals(!includeVocals)}
                disabled={loading}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  includeVocals
                    ? 'bg-purple-500/30 border-2 border-purple-500 text-purple-300'
                    : 'bg-black/40 border border-white/10 text-gray-400 hover:border-white/30'
                } disabled:opacity-50`}
              >
                {includeVocals ? (
                  <>
                    <Mic className="w-4 h-4" />
                    Vocals Enabled
                  </>
                ) : (
                  <>
                    <MicOff className="w-4 h-4" />
                    Instrumental Only
                  </>
                )}
              </button>
            </div>

            {/* Custom Lyrics (shown when vocals enabled) */}
            {includeVocals && (
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-300">
                    Lyrics
                  </label>
                  <button
                    onClick={() => setUseCustomLyrics(!useCustomLyrics)}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    {useCustomLyrics ? 'Auto-generate' : 'Add custom lyrics'}
                  </button>
                </div>

                {useCustomLyrics && (
                  <>
                    <textarea
                      value={customLyrics}
                      onChange={(e) => setCustomLyrics(e.target.value)}
                      placeholder="Enter your custom lyrics here... (optional)"
                      disabled={loading}
                      rows={6}
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 disabled:opacity-50 resize-none text-sm"
                    />
                    <p className="text-xs text-gray-500 flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>Leave blank to let Suno AI auto-generate lyrics based on your prompt</span>
                    </p>
                  </>
                )}

                {!useCustomLyrics && (
                  <p className="text-xs text-gray-500 flex items-start gap-1.5 px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-blue-400" />
                    <span className="text-blue-300">Suno AI will auto-generate lyrics based on your prompt and settings</span>
                  </p>
                )}
              </div>
            )}

            {/* Specialized Instruments (Expert Music AI) */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <Guitar className="w-4 h-4 text-orange-400" />
                <label className="block text-sm font-medium text-gray-300">
                  Specialized Instruments
                </label>
                <div className="px-2 py-0.5 bg-orange-500/20 border border-orange-500/30 rounded text-xs text-orange-300">
                  Expert AI
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'telecaster', label: 'Telecaster Guitar', emoji: '🎸' },
                  { id: 'metro_drums', label: 'Metro Drums', emoji: '🥁' },
                  { id: 'martin_acoustic', label: 'Martin Acoustic', emoji: '🎻' },
                  { id: 'piano', label: 'Grand Piano', emoji: '🎹' },
                  { id: '808_bass', label: '808 Bass', emoji: '🔊' },
                  { id: 'morgan_wallen', label: 'Morgan Wallen Style', emoji: '⭐' },
                ].map((instrument) => (
                  <button
                    key={instrument.id}
                    onClick={() => toggleInstrument(instrument.id)}
                    disabled={loading}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      selectedInstruments.includes(instrument.id)
                        ? 'bg-orange-500/30 border-2 border-orange-500 text-orange-300'
                        : 'bg-black/40 border border-white/10 text-gray-400 hover:border-white/30'
                    } disabled:opacity-50`}
                  >
                    <span>{instrument.emoji}</span>
                    <span className="truncate">{instrument.label}</span>
                  </button>
                ))}
              </div>

              {selectedInstruments.length > 0 && (
                <div className="flex items-start gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-orange-400" />
                  <div className="flex-1 text-xs text-orange-300">
                    <p className="font-medium mb-1">Expert Music AI Enabled</p>
                    <p className="text-orange-300/80">
                      Using custom-trained models for {selectedInstruments.join(', ')}.
                      Results will be ~80-90% of Suno quality with full instrument control.
                    </p>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>Select specialized instruments to use Expert Music AI models. Leave unselected to use standard Suno generation.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerateMusic}
          disabled={loading}
          className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Music...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              Generate Music
            </>
          )}
        </button>

        {/* Generated Track Preview */}
        {generatedTrack && audioUrl && (
          <div className="p-5 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">
                  Generated Track
                </h4>
                <p className="text-xs text-gray-400">
                  {genre} • {mood} • {tempo} BPM
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlayback}
                  className="p-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-lg transition-all"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-purple-300" />
                  ) : (
                    <Play className="w-5 h-5 text-purple-300" />
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="p-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg transition-all"
                >
                  <Download className="w-5 h-5 text-blue-300" />
                </button>
              </div>
            </div>

            {/* Hidden audio element */}
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              onPause={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
