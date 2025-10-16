import React from 'react';
import { StickyNote, Save } from 'lucide-react';
import { useTerminalStore } from '../stores/terminalStore';
import { toast } from 'sonner';

export function Notepad() {
  const { notepadContent, setNotepadContent } = useTerminalStore();

  const handleSave = () => {
    // In a real app, this would save to localStorage or backend
    localStorage.setItem('agent-notepad', notepadContent);
    toast.success('Notes saved');
  };

  // Load from localStorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('agent-notepad');
    if (saved) {
      setNotepadContent(saved);
    }
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold text-gray-200">Notes</h3>
        </div>
        <button
          onClick={handleSave}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
      </div>

      {/* Notepad */}
      <textarea
        value={notepadContent}
        onChange={(e) => setNotepadContent(e.target.value)}
        placeholder="Take notes about your terminal sessions, commands, or AI suggestions..."
        className="
          flex-1 p-4 bg-gray-900 text-gray-200 resize-none outline-none
          font-mono text-sm leading-relaxed
          placeholder:text-gray-600
        "
        spellCheck={false}
      />

      {/* Footer */}
      <div className="p-2 border-t border-gray-700 text-xs text-gray-500 text-center">
        {notepadContent.length} characters
      </div>
    </div>
  );
}
