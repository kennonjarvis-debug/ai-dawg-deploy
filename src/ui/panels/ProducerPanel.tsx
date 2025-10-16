import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Music, Sliders, AlertCircle, Info, Wand2, Download, Play } from 'lucide-react';
import { ProducerAIClient, prepareChordVisualization } from '../../ai/integration';
import type { ChordProgressionResult } from '../../ai/integration/ProducerAIClient';
import { apiClient } from '../../api';
import type { Track } from '../../api/types';

interface ProducerPanelProps {
  projectId: string;
}

export const ProducerPanel: React.FC<ProducerPanelProps> = ({ projectId }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationType, setGenerationType] = useState<'chords' | 'melody'>('chords');
  const [genre, setGenre] = useState('pop');
  const [mood, setMood] = useState('happy');
  const [keySignature, setKeySignature] = useState('C');
  const [scale, setScale] = useState('major');
  const [chordProgression, setChordProgression] = useState<ChordProgressionResult | null>(null);

  const producerClient = useRef(new ProducerAIClient('http://localhost:8001'));

  // Load tracks for the project
  useEffect(() => {
    loadTracks();
  }, [projectId]);

  const loadTracks = async () => {
    try {
      const response = await apiClient.listTracks(projectId, { limit: 50 });
      setTracks(response.tracks);

      // Auto-select first track if available
      if (response.tracks.length > 0 && !selectedTrackId) {
        setSelectedTrackId(response.tracks[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load tracks:', err);
      setError(err.message || 'Failed to load tracks');
    }
  };

  const handleGenerateChords = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await producerClient.current.generateChords({
        mood,
        genre,
        key: keySignature,
        scale,
        length: 4,
        complexity: 0.5
      });

      setChordProgression(result);
    } catch (err: any) {
      setError(err.message || 'Failed to generate chords');
      console.error('Chord generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadMIDI = () => {
    if (chordProgression?.midi_data) {
      producerClient.current.downloadMIDI(
        chordProgression.midi_data,
        `${keySignature}_${scale}_${genre}_chords.mid`
      );
    }
  };

  const handleMasterTrack = async () => {
    if (!selectedTrackId) {
      setError('Please select a track to master');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // This would call the mastering endpoint
      // For MVP, show it's under development
      setError('AI Mastering is under development - Coming soon!');
    } catch (err: any) {
      setError(err.message || 'Failed to master track');
      console.error('Mastering error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Prepare visualization data
  const vizData = chordProgression ? prepareChordVisualization(chordProgression) : null;

  return (
    <div className="h-full flex flex-col bg-daw-surface/40 backdrop-blur-xl border-l border-white/10">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Sparkles className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI Producer</h2>
            <p className="text-sm text-gray-400">Generate chords, melodies, and master tracks</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Chord Generation Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Generate Chord Progression
          </h3>

          <div className="p-5 bg-black/40 border border-white/10 rounded-xl space-y-4">
            {/* Musical Parameters */}
            <div className="grid grid-cols-2 gap-4">
              {/* Key */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Key
                </label>
                <select
                  value={keySignature}
                  onChange={(e) => setKeySignature(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 disabled:opacity-50"
                >
                  <option value="C">C</option>
                  <option value="C#">C#</option>
                  <option value="D">D</option>
                  <option value="D#">D#</option>
                  <option value="E">E</option>
                  <option value="F">F</option>
                  <option value="F#">F#</option>
                  <option value="G">G</option>
                  <option value="G#">G#</option>
                  <option value="A">A</option>
                  <option value="A#">A#</option>
                  <option value="B">B</option>
                </select>
              </div>

              {/* Scale */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Scale
                </label>
                <select
                  value={scale}
                  onChange={(e) => setScale(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 disabled:opacity-50"
                >
                  <option value="major">Major</option>
                  <option value="minor">Minor</option>
                  <option value="harmonic-minor">Harmonic Minor</option>
                  <option value="melodic-minor">Melodic Minor</option>
                </select>
              </div>
            </div>

            {/* Genre Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Genre
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 disabled:opacity-50"
              >
                <option value="pop">Pop</option>
                <option value="rock">Rock</option>
                <option value="jazz">Jazz</option>
                <option value="edm">EDM</option>
                <option value="lofi">Lo-Fi</option>
                <option value="classical">Classical</option>
              </select>
            </div>

            {/* Mood Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mood
              </label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 disabled:opacity-50"
              >
                <option value="happy">Happy</option>
                <option value="sad">Sad</option>
                <option value="energetic">Energetic</option>
                <option value="calm">Calm</option>
                <option value="dark">Dark</option>
                <option value="romantic">Romantic</option>
              </select>
            </div>

            <button
              onClick={handleGenerateChords}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Generate Chord Progression
                </span>
              )}
            </button>
          </div>

          {/* Generated Chords Display */}
          {chordProgression && vizData && (
            <div className="p-5 bg-black/40 border border-blue-500/30 rounded-xl space-y-4 animate-in fade-in">
              {/* Key Signature Display */}
              <div className="text-center pb-4 border-b border-white/10">
                <div className="text-sm text-gray-400 mb-1">Key Signature</div>
                <div className="text-3xl font-bold text-blue-400">
                  {vizData.keySignature.display}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {vizData.context.genre} • {vizData.context.mood}
                </div>
              </div>

              {/* Chord Chart */}
              <div className="grid grid-cols-4 gap-3">
                {vizData.chords.map((chord, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border transition-all hover:scale-105"
                    style={{
                      backgroundColor: `${chord.color}15`,
                      borderColor: `${chord.color}50`
                    }}
                  >
                    <div className="text-center">
                      <div className="text-xs text-gray-400 mb-1">{chord.romanNumeral}</div>
                      <div className="text-lg font-bold text-white mb-2">
                        {chord.symbol}
                      </div>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        {chord.notes.map((note, i) => (
                          <div key={i}>{note}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Piano Roll Visualization */}
              <div className="p-4 bg-black/60 rounded-lg">
                <div className="text-xs text-gray-400 mb-3">Piano Roll Preview</div>
                <div className="space-y-1">
                  {vizData.pianoRoll.slice(0, 12).map((note, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div
                        className="h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded transition-all"
                        style={{
                          width: `${(note.duration / 4) * 100}%`,
                          marginLeft: `${(note.start / 4) * 100}%`,
                          opacity: note.velocity / 127
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleDownloadMIDI}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download MIDI
                </button>
                <button
                  className="flex-1 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-blue-400 text-sm font-medium transition-all flex items-center justify-center gap-2"
                  disabled
                >
                  <Play className="w-4 h-4" />
                  Preview (Coming Soon)
                </button>
              </div>

              <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-400">
                  Download the MIDI file to import into your DAW, or use it as inspiration for your composition.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Production Tips */}
        <div className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl">
          <h4 className="text-sm font-semibold text-white mb-3">Production Tips</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Use AI-generated chords as a starting point and customize to taste</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Try different moods and genres to find unique progressions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Layer multiple chord progressions for richer harmonies</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
