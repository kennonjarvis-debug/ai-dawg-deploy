/**
 * PianoKeyboard - Visual piano keyboard component for the piano roll
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  isBlackKey,
  getMIDINoteName,
  PIANO_ROLL_MIN_NOTE,
  PIANO_ROLL_MAX_NOTE,
} from '../../../types/midi';

interface PianoKeyboardProps {
  height: number;
  noteHeight: number;
  scrollY: number;
  highlightedNotes?: Set<number>;
  onNoteClick?: (noteNumber: number) => void;
  onNoteMouseDown?: (noteNumber: number) => void;
  onNoteMouseUp?: (noteNumber: number) => void;
}

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  height,
  noteHeight,
  scrollY,
  highlightedNotes = new Set(),
  onNoteClick,
  onNoteMouseDown,
  onNoteMouseUp,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNote, setHoveredNote] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 60 * dpr;
    canvas.height = height * dpr;
    canvas.style.width = '60px';
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, 60, height);

    // Draw piano keys
    const totalNotes = PIANO_ROLL_MAX_NOTE - PIANO_ROLL_MIN_NOTE + 1;
    const startNote = Math.floor(scrollY / noteHeight);
    const endNote = Math.min(totalNotes, Math.ceil((scrollY + height) / noteHeight) + 1);

    for (let i = startNote; i < endNote; i++) {
      const noteNumber = PIANO_ROLL_MAX_NOTE - i;
      const y = i * noteHeight - scrollY;

      if (y + noteHeight < 0 || y > height) continue;

      const isBlack = isBlackKey(noteNumber);
      const isHighlighted = highlightedNotes.has(noteNumber);
      const isHovered = hoveredNote === noteNumber;
      const isCKey = noteNumber % 12 === 0;

      // Draw key
      if (isBlack) {
        // Black key
        ctx.fillStyle = isHighlighted
          ? '#60a5fa'
          : isHovered
          ? '#374151'
          : '#1f2937';
        ctx.fillRect(0, y, 38, noteHeight);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(0, y, 38, noteHeight);

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = '9px sans-serif';
        ctx.fillText(getMIDINoteName(noteNumber), 4, y + noteHeight / 2 + 3);
      } else {
        // White key
        ctx.fillStyle = isHighlighted
          ? '#93c5fd'
          : isHovered
          ? '#f3f4f6'
          : '#fff';
        ctx.fillRect(0, y, 60, noteHeight);

        // Border
        ctx.strokeStyle = '#d1d5db';
        ctx.strokeRect(0, y, 60, noteHeight);

        // Highlight C keys
        if (isCKey) {
          ctx.strokeStyle = '#9ca3af';
          ctx.lineWidth = 2;
          ctx.strokeRect(0, y, 60, noteHeight);
          ctx.lineWidth = 1;
        }

        // Label
        ctx.fillStyle = '#374151';
        ctx.font = '10px sans-serif';
        ctx.fillText(getMIDINoteName(noteNumber), 42, y + noteHeight / 2 + 3);
      }
    }
  }, [height, noteHeight, scrollY, highlightedNotes, hoveredNote]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top + scrollY;
    const noteIndex = Math.floor(y / noteHeight);
    const noteNumber = PIANO_ROLL_MAX_NOTE - noteIndex;

    if (noteNumber >= PIANO_ROLL_MIN_NOTE && noteNumber <= PIANO_ROLL_MAX_NOTE) {
      setHoveredNote(noteNumber);
    } else {
      setHoveredNote(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredNote(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onNoteClick || hoveredNote === null) return;
    onNoteClick(hoveredNote);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onNoteMouseDown || hoveredNote === null) return;
    onNoteMouseDown(hoveredNote);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onNoteMouseUp || hoveredNote === null) return;
    onNoteMouseUp(hoveredNote);
  };

  return (
    <canvas
      ref={canvasRef}
      className="cursor-pointer border-r border-gray-300"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    />
  );
};
