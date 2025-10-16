import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Project } from '../../api/types';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  currentProject: Project | null;
  onClose: () => void;
  onSave: (settings: { bpm?: number; key?: string; timeSignature?: string }) => void;
}

const MUSICAL_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'C Minor', 'C# Minor', 'D Minor', 'D# Minor', 'E Minor', 'F Minor', 'F# Minor', 'G Minor', 'G# Minor', 'A Minor', 'A# Minor', 'B Minor'
];

const TIME_SIGNATURES = ['4/4', '3/4', '6/8', '5/4', '7/8', '2/4'];

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  currentProject,
  onClose,
  onSave,
}) => {
  const [bpm, setBpm] = useState(currentProject?.bpm || 120);
  const [key, setKey] = useState(currentProject?.key || 'C');
  const [timeSignature, setTimeSignature] = useState(currentProject?.timeSignature || '4/4');

  useEffect(() => {
    if (currentProject) {
      setBpm(currentProject.bpm || 120);
      setKey(currentProject.key || 'C');
      setTimeSignature(currentProject.timeSignature || '4/4');
    }
  }, [currentProject]);

  if (!isOpen || !currentProject) return null;

  const handleSave = () => {
    onSave({ bpm, key, timeSignature });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-white/20 rounded-2xl shadow-2xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Project Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Form */}
        <div className="space-y-4">
          {/* BPM */}
          <div>
            <label htmlFor="bpm" className="block text-sm font-medium text-gray-300 mb-2">
              BPM (Tempo)
            </label>
            <input
              id="bpm"
              name="bpm"
              type="number"
              min="40"
              max="300"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value) || 120)}
              className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Musical Key */}
          <div>
            <label htmlFor="key" className="block text-sm font-medium text-gray-300 mb-2">
              Musical Key
            </label>
            <select
              id="key"
              name="key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
            >
              {MUSICAL_KEYS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          {/* Time Signature */}
          <div>
            <label htmlFor="timeSignature" className="block text-sm font-medium text-gray-300 mb-2">
              Time Signature
            </label>
            <select
              id="timeSignature"
              name="timeSignature"
              value={timeSignature}
              onChange={(e) => setTimeSignature(e.target.value)}
              className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
            >
              {TIME_SIGNATURES.map((ts) => (
                <option key={ts} value={ts}>
                  {ts}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-semibold transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
