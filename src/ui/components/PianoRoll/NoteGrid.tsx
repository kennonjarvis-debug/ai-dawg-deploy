/**
 * NoteGrid - Interactive grid for placing and editing MIDI notes
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  MIDINote,
  PianoRollViewport,
  QuantizeSettings,
  getVelocityColor,
  quantizeTime,
  PIANO_ROLL_MIN_NOTE,
  PIANO_ROLL_MAX_NOTE,
  isBlackKey,
} from '../../../types/midi';

interface NoteGridProps {
  notes: MIDINote[];
  viewport: PianoRollViewport;
  quantize: QuantizeSettings;
  selectedNoteIds: Set<string>;
  currentBeat: number;
  isPlaying: boolean;
  timeSignature: { numerator: number; denominator: number };
  onNotesChange: (notes: MIDINote[]) => void;
  onSelectionChange: (noteIds: string[]) => void;
  onNoteAdd?: (note: Omit<MIDINote, 'id'>) => void;
  onNoteDelete?: (noteIds: string[]) => void;
}

type DragMode = 'none' | 'select' | 'move' | 'resize-start' | 'resize-end' | 'draw';

interface DragState {
  mode: DragMode;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  originalNotes?: Map<string, MIDINote>;
}

export const NoteGrid: React.FC<NoteGridProps> = ({
  notes,
  viewport,
  quantize,
  selectedNoteIds,
  currentBeat,
  isPlaying,
  timeSignature,
  onNotesChange,
  onSelectionChange,
  onNoteAdd,
  onNoteDelete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    mode: 'none',
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });
  const [hoveredNote, setHoveredNote] = useState<string | null>(null);

  const { scrollX, scrollY, zoomX, zoomY, width, height } = viewport;
  const noteHeight = zoomY;

  // Convert screen coordinates to grid coordinates
  const screenToGrid = useCallback(
    (x: number, y: number): { beat: number; pitch: number } => {
      const beat = (x + scrollX) / zoomX;
      const noteIndex = Math.floor((y + scrollY) / noteHeight);
      const pitch = PIANO_ROLL_MAX_NOTE - noteIndex;
      return { beat, pitch };
    },
    [scrollX, scrollY, zoomX, noteHeight]
  );

  // Convert grid coordinates to screen coordinates
  const gridToScreen = useCallback(
    (beat: number, pitch: number): { x: number; y: number } => {
      const x = beat * zoomX - scrollX;
      const noteIndex = PIANO_ROLL_MAX_NOTE - pitch;
      const y = noteIndex * noteHeight - scrollY;
      return { x, y };
    },
    [scrollX, scrollY, zoomX, noteHeight]
  );

  // Quantize beat if enabled
  const maybeQuantize = useCallback(
    (beat: number): number => {
      if (quantize.enabled) {
        return quantizeTime(beat, quantize.division, quantize.strength);
      }
      return beat;
    },
    [quantize]
  );

  // Draw the grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid lines
    const beatsPerMeasure = timeSignature.numerator;
    const startBeat = Math.floor(scrollX / zoomX);
    const endBeat = Math.ceil((scrollX + width) / zoomX);

    // Vertical grid lines (time)
    for (let beat = startBeat; beat <= endBeat; beat++) {
      const x = beat * zoomX - scrollX;

      if (beat % beatsPerMeasure === 0) {
        // Measure line
        ctx.strokeStyle = '#6b7280';
        ctx.lineWidth = 1.5;
      } else {
        // Beat line
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 0.5;
      }

      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal grid lines (pitch)
    const totalNotes = PIANO_ROLL_MAX_NOTE - PIANO_ROLL_MIN_NOTE + 1;
    const startNote = Math.floor(scrollY / noteHeight);
    const endNote = Math.min(totalNotes, Math.ceil((scrollY + height) / noteHeight) + 1);

    for (let i = startNote; i < endNote; i++) {
      const noteNumber = PIANO_ROLL_MAX_NOTE - i;
      const y = i * noteHeight - scrollY;

      // Alternate row colors
      if (isBlackKey(noteNumber)) {
        ctx.fillStyle = '#f9fafb';
      } else {
        ctx.fillStyle = '#fff';
      }
      ctx.fillRect(0, y, width, noteHeight);

      // Row line
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw notes
    notes.forEach((note) => {
      const { x, y } = gridToScreen(note.startTime, note.pitch);
      const noteWidth = note.duration * zoomX;

      if (x + noteWidth < 0 || x > width || y + noteHeight < 0 || y > height) {
        return; // Skip notes outside viewport
      }

      const isSelected = selectedNoteIds.has(note.id);
      const isHovered = hoveredNote === note.id;

      // Note rectangle
      ctx.fillStyle = getVelocityColor(note.velocity);
      if (isSelected) {
        ctx.globalAlpha = 0.8;
      } else {
        ctx.globalAlpha = 0.6;
      }
      ctx.fillRect(x, y + 1, noteWidth, noteHeight - 2);
      ctx.globalAlpha = 1.0;

      // Note border
      ctx.strokeStyle = isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#374151';
      ctx.lineWidth = isSelected || isHovered ? 2 : 1;
      ctx.strokeRect(x, y + 1, noteWidth, noteHeight - 2);
    });

    // Draw playhead
    if (isPlaying) {
      const playheadX = currentBeat * zoomX - scrollX;
      if (playheadX >= 0 && playheadX <= width) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playheadX, 0);
        ctx.lineTo(playheadX, height);
        ctx.stroke();
      }
    }

    // Draw selection box
    if (dragState.mode === 'select') {
      const x1 = Math.min(dragState.startX, dragState.currentX);
      const y1 = Math.min(dragState.startY, dragState.currentY);
      const x2 = Math.max(dragState.startX, dragState.currentX);
      const y2 = Math.max(dragState.startY, dragState.currentY);

      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    }
  }, [
    notes,
    viewport,
    selectedNoteIds,
    hoveredNote,
    currentBeat,
    isPlaying,
    timeSignature,
    dragState,
    gridToScreen,
    noteHeight,
  ]);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on a note
    const clickedNote = notes.find((note) => {
      const noteScreen = gridToScreen(note.startTime, note.pitch);
      const noteWidth = note.duration * zoomX;
      return (
        x >= noteScreen.x &&
        x <= noteScreen.x + noteWidth &&
        y >= noteScreen.y &&
        y <= noteScreen.y + noteHeight
      );
    });

    if (clickedNote) {
      // Check if clicking on resize handles
      const noteScreen = gridToScreen(clickedNote.startTime, clickedNote.pitch);
      const noteWidth = clickedNote.duration * zoomX;
      const resizeHandleWidth = 8;

      if (x <= noteScreen.x + resizeHandleWidth) {
        // Resize start
        setDragState({
          mode: 'resize-start',
          startX: x,
          startY: y,
          currentX: x,
          currentY: y,
          originalNotes: new Map([[clickedNote.id, { ...clickedNote }]]),
        });
      } else if (x >= noteScreen.x + noteWidth - resizeHandleWidth) {
        // Resize end
        setDragState({
          mode: 'resize-end',
          startX: x,
          startY: y,
          currentX: x,
          currentY: y,
          originalNotes: new Map([[clickedNote.id, { ...clickedNote }]]),
        });
      } else {
        // Move note
        if (!selectedNoteIds.has(clickedNote.id) && !e.shiftKey) {
          onSelectionChange([clickedNote.id]);
        }

        const originalNotes = new Map<string, MIDINote>();
        if (selectedNoteIds.has(clickedNote.id)) {
          notes.forEach((note) => {
            if (selectedNoteIds.has(note.id)) {
              originalNotes.set(note.id, { ...note });
            }
          });
        } else {
          originalNotes.set(clickedNote.id, { ...clickedNote });
        }

        setDragState({
          mode: 'move',
          startX: x,
          startY: y,
          currentX: x,
          currentY: y,
          originalNotes,
        });
      }
    } else {
      // Start selection box or draw new note
      if (e.altKey || e.metaKey) {
        // Draw mode
        const { beat, pitch } = screenToGrid(x, y);
        const quantizedBeat = maybeQuantize(beat);

        setDragState({
          mode: 'draw',
          startX: x,
          startY: y,
          currentX: x,
          currentY: y,
        });
      } else {
        // Selection box
        setDragState({
          mode: 'select',
          startX: x,
          startY: y,
          currentX: x,
          currentY: y,
        });

        if (!e.shiftKey) {
          onSelectionChange([]);
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update hovered note
    if (dragState.mode === 'none') {
      const hovered = notes.find((note) => {
        const noteScreen = gridToScreen(note.startTime, note.pitch);
        const noteWidth = note.duration * zoomX;
        return (
          x >= noteScreen.x &&
          x <= noteScreen.x + noteWidth &&
          y >= noteScreen.y &&
          y <= noteScreen.y + noteHeight
        );
      });
      setHoveredNote(hovered ? hovered.id : null);
    }

    // Handle dragging
    if (dragState.mode !== 'none') {
      setDragState((prev) => ({ ...prev, currentX: x, currentY: y }));

      if (dragState.mode === 'move' && dragState.originalNotes) {
        const deltaX = (x - dragState.startX) / zoomX;
        const deltaY = Math.round((dragState.startY - y) / noteHeight);

        const updatedNotes = notes.map((note) => {
          const original = dragState.originalNotes!.get(note.id);
          if (!original) return note;

          const newStartTime = maybeQuantize(original.startTime + deltaX);
          const newPitch = Math.max(
            PIANO_ROLL_MIN_NOTE,
            Math.min(PIANO_ROLL_MAX_NOTE, original.pitch + deltaY)
          );

          return {
            ...note,
            startTime: Math.max(0, newStartTime),
            pitch: newPitch,
          };
        });

        onNotesChange(updatedNotes);
      } else if (dragState.mode === 'resize-end' && dragState.originalNotes) {
        const deltaX = (x - dragState.startX) / zoomX;

        const updatedNotes = notes.map((note) => {
          const original = dragState.originalNotes!.get(note.id);
          if (!original) return note;

          const newDuration = Math.max(0.25, original.duration + deltaX);
          return {
            ...note,
            duration: maybeQuantize(newDuration),
          };
        });

        onNotesChange(updatedNotes);
      } else if (dragState.mode === 'resize-start' && dragState.originalNotes) {
        const deltaX = (x - dragState.startX) / zoomX;

        const updatedNotes = notes.map((note) => {
          const original = dragState.originalNotes!.get(note.id);
          if (!original) return note;

          const newStartTime = original.startTime + deltaX;
          const newDuration = original.duration - deltaX;

          if (newDuration < 0.25) return note;

          return {
            ...note,
            startTime: maybeQuantize(Math.max(0, newStartTime)),
            duration: maybeQuantize(newDuration),
          };
        });

        onNotesChange(updatedNotes);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragState.mode === 'select') {
      const x1 = Math.min(dragState.startX, dragState.currentX);
      const y1 = Math.min(dragState.startY, dragState.currentY);
      const x2 = Math.max(dragState.startX, dragState.currentX);
      const y2 = Math.max(dragState.startY, dragState.currentY);

      const selectedIds = notes
        .filter((note) => {
          const noteScreen = gridToScreen(note.startTime, note.pitch);
          const noteWidth = note.duration * zoomX;
          const noteX1 = noteScreen.x;
          const noteX2 = noteScreen.x + noteWidth;
          const noteY1 = noteScreen.y;
          const noteY2 = noteScreen.y + noteHeight;

          return (
            noteX2 >= x1 &&
            noteX1 <= x2 &&
            noteY2 >= y1 &&
            noteY1 <= y2
          );
        })
        .map((note) => note.id);

      if (e.shiftKey) {
        onSelectionChange([...selectedNoteIds, ...selectedIds]);
      } else {
        onSelectionChange(selectedIds);
      }
    } else if (dragState.mode === 'draw' && onNoteAdd) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const { beat, pitch } = screenToGrid(dragState.startX, dragState.startY);
      const { beat: endBeat } = screenToGrid(x, y);

      const startBeat = maybeQuantize(Math.min(beat, endBeat));
      const duration = maybeQuantize(Math.max(0.25, Math.abs(endBeat - beat)));

      onNoteAdd({
        pitch: Math.max(PIANO_ROLL_MIN_NOTE, Math.min(PIANO_ROLL_MAX_NOTE, pitch)),
        velocity: 100,
        startTime: startBeat,
        duration,
        channel: 0,
      });
    }

    setDragState({
      mode: 'none',
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
    });
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    if (hoveredNote && onNoteDelete) {
      if (selectedNoteIds.has(hoveredNote)) {
        onNoteDelete(Array.from(selectedNoteIds));
      } else {
        onNoteDelete([hoveredNote]);
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className="cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
    />
  );
};
