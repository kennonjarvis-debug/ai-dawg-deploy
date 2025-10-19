/**
 * PianoRollEditor - Main piano roll editor component
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { PianoKeyboard } from './PianoKeyboard';
import { NoteGrid } from './NoteGrid';
import { TransportControls } from './TransportControls';
import { usePianoRoll } from '../../hooks/usePianoRoll';
import {
  MIDIProject,
  MIDINote,
  PIANO_ROLL_MIN_NOTE,
  PIANO_ROLL_MAX_NOTE,
} from '../../../types/midi';
import {
  ZoomIn,
  ZoomOut,
  Grid3x3,
  Music,
  Save,
  Upload,
  Download,
  Copy,
  Scissors,
  Undo2,
  Redo2,
  Sparkles,
} from 'lucide-react';

interface PianoRollEditorProps {
  project?: MIDIProject;
  onSave?: (project: MIDIProject) => void;
  onExport?: (project: MIDIProject) => void;
  onImport?: (file: File) => void;
  className?: string;
}

export const PianoRollEditor: React.FC<PianoRollEditorProps> = ({
  project,
  onSave,
  onExport,
  onImport,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    project: currentProject,
    currentTrackId,
    viewport,
    selection,
    tool,
    quantize,
    transport,
    history,
    getCurrentTrack,
    getCurrentNotes,
    setProject,
    setCurrentTrackId,
    setViewport,
    setSelection,
    setTool,
    setQuantize,
    setTransport,
    addNote,
    deleteNotes,
    updateNotes,
    copyNotes,
    pasteNotes,
    undo,
    redo,
    quantizeNotes,
    humanizeNotes,
    play,
    pause,
    stop,
    zoomIn,
    zoomOut,
  } = usePianoRoll({
    initialProject: project,
    autoSave: true,
    onSave,
  });

  const [highlightedNotes, setHighlightedNotes] = useState<Set<number>>(new Set());

  // Initialize project if not provided
  useEffect(() => {
    if (!currentProject && !project) {
      const defaultProject: MIDIProject = {
        id: 'default',
        name: 'Untitled MIDI Project',
        tempo: 120,
        timeSignature: { numerator: 4, denominator: 4 },
        tracks: [
          {
            id: 'track-1',
            name: 'Piano',
            notes: [],
            channel: 0,
            instrument: 'piano',
            volume: 0.8,
            pan: 0,
            mute: false,
            solo: false,
            color: '#3b82f6',
          },
        ],
        duration: 32,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setProject(defaultProject);
      setCurrentTrackId('track-1');
    }
  }, [currentProject, project, setProject, setCurrentTrackId]);

  // Update viewport size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setViewport((prev) => ({
          ...prev,
          width: rect.width - 60, // subtract piano keyboard width
          height: rect.height - 120, // subtract transport controls height
        }));
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [setViewport]);

  // Highlight notes being played
  useEffect(() => {
    if (!transport.isPlaying) {
      setHighlightedNotes(new Set());
      return;
    }

    const notes = getCurrentNotes();
    const currentNotes = notes.filter(
      (note) =>
        note.startTime <= transport.currentBeat &&
        note.startTime + note.duration >= transport.currentBeat
    );

    setHighlightedNotes(new Set(currentNotes.map((n) => n.pitch)));
  }, [transport.isPlaying, transport.currentBeat, getCurrentNotes]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo/Redo
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if (e.key === 'z' && e.shiftKey) {
          e.preventDefault();
          redo();
        } else if (e.key === 'y') {
          e.preventDefault();
          redo();
        }

        // Copy/Paste
        if (e.key === 'c') {
          e.preventDefault();
          copyNotes();
        } else if (e.key === 'v') {
          e.preventDefault();
          pasteNotes();
        }

        // Select all
        if (e.key === 'a') {
          e.preventDefault();
          const notes = getCurrentNotes();
          setSelection({
            ...selection,
            noteIds: notes.map((n) => n.id),
          });
        }
      }

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selection.noteIds.length > 0) {
          e.preventDefault();
          deleteNotes(selection.noteIds);
          setSelection({ ...selection, noteIds: [] });
        }
      }

      // Spacebar - play/pause
      if (e.key === ' ') {
        e.preventDefault();
        if (transport.isPlaying) {
          pause();
        } else {
          play();
        }
      }

      // Zoom
      if (e.metaKey || e.ctrlKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          zoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          zoomOut();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    undo,
    redo,
    copyNotes,
    pasteNotes,
    deleteNotes,
    selection,
    setSelection,
    getCurrentNotes,
    transport.isPlaying,
    play,
    pause,
    zoomIn,
    zoomOut,
  ]);

  // Scroll handling
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();

      if (e.metaKey || e.ctrlKey) {
        // Zoom
        if (e.deltaY < 0) {
          zoomIn(e.shiftKey ? 'x' : 'y');
        } else {
          zoomOut(e.shiftKey ? 'x' : 'y');
        }
      } else {
        // Scroll
        setViewport((prev) => ({
          ...prev,
          scrollX: Math.max(0, prev.scrollX + (e.shiftKey ? e.deltaY : e.deltaX)),
          scrollY: Math.max(0, prev.scrollY + (e.shiftKey ? e.deltaX : e.deltaY)),
        }));
      }
    },
    [zoomIn, zoomOut, setViewport]
  );

  const currentTrack = getCurrentTrack();
  const currentNotes = getCurrentNotes();

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImport) {
      onImport(file);
    }
  };

  return (
    <div className={`flex flex-col bg-gray-900 text-white ${className}`} ref={containerRef}>
      {/* Top Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center gap-2">
        {/* File Operations */}
        <button
          onClick={() => onSave?.(currentProject!)}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
          title="Save"
          disabled={!currentProject}
        >
          <Save className="w-4 h-4" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".mid,.midi"
          onChange={handleFileImport}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
          title="Import MIDI"
        >
          <Upload className="w-4 h-4" />
        </button>

        <button
          onClick={() => onExport?.(currentProject!)}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
          title="Export MIDI"
          disabled={!currentProject}
        >
          <Download className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-700 mx-2" />

        {/* Edit Operations */}
        <button
          onClick={undo}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
          title="Undo (Cmd+Z)"
          disabled={history.past.length === 0}
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          onClick={redo}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
          title="Redo (Cmd+Shift+Z)"
          disabled={history.future.length === 0}
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <button
          onClick={copyNotes}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
          title="Copy (Cmd+C)"
          disabled={selection.noteIds.length === 0}
        >
          <Copy className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            deleteNotes(selection.noteIds);
            setSelection({ ...selection, noteIds: [] });
          }}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
          title="Cut (Cmd+X)"
          disabled={selection.noteIds.length === 0}
        >
          <Scissors className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-700 mx-2" />

        {/* Quantize Controls */}
        <button
          onClick={() => setQuantize({ ...quantize, enabled: !quantize.enabled })}
          className={`p-2 rounded transition-colors ${
            quantize.enabled ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-700'
          }`}
          title="Toggle Snap to Grid"
        >
          <Grid3x3 className="w-4 h-4" />
        </button>

        <select
          value={quantize.division}
          onChange={(e) => setQuantize({ ...quantize, division: Number(e.target.value) })}
          className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
        >
          <option value={1}>1/1</option>
          <option value={2}>1/2</option>
          <option value={4}>1/4</option>
          <option value={8}>1/8</option>
          <option value={16}>1/16</option>
          <option value={32}>1/32</option>
        </select>

        <button
          onClick={quantizeNotes}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
          disabled={selection.noteIds.length === 0}
        >
          Quantize
        </button>

        <button
          onClick={() => humanizeNotes(0.15)}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
          title="Humanize"
          disabled={selection.noteIds.length === 0}
        >
          <Sparkles className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-700 mx-2" />

        {/* Zoom Controls */}
        <button
          onClick={() => zoomIn()}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
          title="Zoom In (Cmd++)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={() => zoomOut()}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
          title="Zoom Out (Cmd+-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Track Selector */}
        {currentProject && currentProject.tracks.length > 1 && (
          <select
            value={currentTrackId || ''}
            onChange={(e) => setCurrentTrackId(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm"
          >
            {currentProject.tracks.map((track) => (
              <option key={track.id} value={track.id}>
                {track.name}
              </option>
            ))}
          </select>
        )}

        {/* Current Track Info */}
        {currentTrack && (
          <div className="flex items-center gap-2 text-sm">
            <Music className="w-4 h-4" />
            <span>{currentTrack.name}</span>
            <span className="text-gray-400">
              ({currentNotes.length} {currentNotes.length === 1 ? 'note' : 'notes'})
            </span>
          </div>
        )}
      </div>

      {/* Transport Controls */}
      {currentProject && (
        <TransportControls
          isPlaying={transport.isPlaying}
          isRecording={transport.isRecording}
          tempo={currentProject.tempo}
          currentBeat={transport.currentBeat}
          loopEnabled={transport.loopEnabled}
          loopStart={transport.loopStart}
          loopEnd={transport.loopEnd}
          metronomeEnabled={transport.metronomeEnabled}
          onPlay={play}
          onPause={pause}
          onStop={stop}
          onRecord={() => setTransport({ ...transport, isRecording: !transport.isRecording })}
          onTempoChange={(tempo) =>
            setProject({ ...currentProject, tempo, updatedAt: new Date() })
          }
          onLoopToggle={() => setTransport({ ...transport, loopEnabled: !transport.loopEnabled })}
          onMetronomeToggle={() =>
            setTransport({ ...transport, metronomeEnabled: !transport.metronomeEnabled })
          }
          onLoopRangeChange={(start, end) =>
            setTransport({ ...transport, loopStart: start, loopEnd: end })
          }
        />
      )}

      {/* Piano Roll Grid */}
      <div className="flex flex-1 overflow-hidden" onWheel={handleWheel}>
        {/* Piano Keyboard */}
        <PianoKeyboard
          height={viewport.height}
          noteHeight={viewport.zoomY}
          scrollY={viewport.scrollY}
          highlightedNotes={highlightedNotes}
        />

        {/* Note Grid */}
        {currentProject && (
          <NoteGrid
            notes={currentNotes}
            viewport={viewport}
            quantize={quantize}
            selectedNoteIds={new Set(selection.noteIds)}
            currentBeat={transport.currentBeat}
            isPlaying={transport.isPlaying}
            timeSignature={currentProject.timeSignature}
            onNotesChange={updateNotes}
            onSelectionChange={(noteIds) => setSelection({ ...selection, noteIds })}
            onNoteAdd={addNote}
            onNoteDelete={deleteNotes}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center gap-4 text-xs text-gray-400">
        <span>
          Zoom: {Math.round(viewport.zoomX)}px/beat, {Math.round(viewport.zoomY)}px/note
        </span>
        <span>|</span>
        <span>Selected: {selection.noteIds.length}</span>
        {quantize.enabled && (
          <>
            <span>|</span>
            <span>Snap: 1/{quantize.division}</span>
          </>
        )}
      </div>
    </div>
  );
};
