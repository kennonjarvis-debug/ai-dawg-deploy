/**
 * PianoRollDemo - Demo page for Piano Roll Editor
 */

import React, { useState, useCallback } from 'react';
import { PianoRollEditor } from './PianoRollEditor';
import { MIDIParser } from '../../../backend/services/midi-parser';
import { MIDIProject } from '../../../types/midi';
import { FileMusic, Download, Upload, Info } from 'lucide-react';

export const PianoRollDemo: React.FC = () => {
  const [project, setProject] = useState<MIDIProject>(MIDIParser.createDemoProject());
  const [showInfo, setShowInfo] = useState(true);

  const handleSave = useCallback((updatedProject: MIDIProject) => {
    setProject(updatedProject);
    console.log('Project saved:', updatedProject);
    // In production, save to backend/database
  }, []);

  const handleExport = useCallback(async (project: MIDIProject) => {
    try {
      const midiData = MIDIParser.exportMIDIFile(project);
      const blob = new Blob([midiData], { type: 'audio/midi' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name}.mid`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('MIDI exported successfully');
    } catch (error) {
      console.error('Failed to export MIDI:', error);
      alert('Failed to export MIDI file');
    }
  }, []);

  const handleImport = useCallback(async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const importedProject = await MIDIParser.parseMIDIFile(buffer);
      setProject(importedProject);
      console.log('MIDI imported successfully:', importedProject);
    } catch (error) {
      console.error('Failed to import MIDI:', error);
      alert('Failed to import MIDI file. Please ensure it is a valid MIDI file.');
    }
  }, []);

  const handleLoadDemo = () => {
    setProject(MIDIParser.createDemoProject());
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileMusic className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">DAWG AI Piano Roll Editor</h1>
              <p className="text-blue-100 text-sm">Visual MIDI Note Editor with Playback</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-2 hover:bg-white/20 rounded transition-colors"
              title="Toggle Info"
            >
              <Info className="w-5 h-5" />
            </button>

            <button
              onClick={handleLoadDemo}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors font-medium"
            >
              Load Demo
            </button>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      {showInfo && (
        <div className="bg-blue-900/30 border-b border-blue-700 px-6 py-3">
          <div className="text-white text-sm space-y-2">
            <h3 className="font-semibold text-blue-300 flex items-center gap-2">
              <Info className="w-4 h-4" />
              How to Use:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-blue-100">
              <div>
                <strong>Mouse:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Click + drag to select notes</li>
                  <li>Alt + drag to draw new notes</li>
                  <li>Right-click to delete notes</li>
                  <li>Drag notes to move/resize</li>
                  <li>Scroll wheel to pan</li>
                  <li>Cmd/Ctrl + Wheel to zoom</li>
                </ul>
              </div>
              <div>
                <strong>Keyboard:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Space - Play/Pause</li>
                  <li>Cmd+Z - Undo</li>
                  <li>Cmd+Shift+Z - Redo</li>
                  <li>Cmd+C/V - Copy/Paste</li>
                  <li>Cmd+A - Select All</li>
                  <li>Delete - Remove selected</li>
                </ul>
              </div>
              <div>
                <strong>Features:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Quantization (snap to grid)</li>
                  <li>Velocity-based coloring</li>
                  <li>Multiple tracks</li>
                  <li>Loop playback</li>
                  <li>Metronome</li>
                  <li>MIDI import/export</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Piano Roll Editor */}
      <div className="flex-1 overflow-hidden">
        <PianoRollEditor
          project={project}
          onSave={handleSave}
          onExport={handleExport}
          onImport={handleImport}
          className="h-full"
        />
      </div>

      {/* Footer */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-2 text-gray-400 text-xs">
        <div className="flex items-center justify-between">
          <span>DAWG AI - Professional Music Production Platform</span>
          <span>Piano Roll Editor v1.0</span>
        </div>
      </div>
    </div>
  );
};

export default PianoRollDemo;
