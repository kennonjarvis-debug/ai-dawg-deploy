import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Copy, ClipboardPaste } from 'lucide-react';
import { useTerminalStore } from '../stores/terminalStore';
import { toast } from 'sonner';

interface CommandBarProps {
  onCommand?: (command: string) => void;
}

export function CommandBar({ onCommand }: CommandBarProps) {
  const [command, setCommand] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { addCommandToHistory, navigateHistory } = useTerminalStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    addCommandToHistory(command);
    onCommand?.(command);
    setCommand('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevCommand = navigateHistory('up');
      if (prevCommand !== null) {
        setCommand(prevCommand);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextCommand = navigateHistory('down');
      if (nextCommand !== null) {
        setCommand(nextCommand);
      }
    }
  };

  const handleCopy = async () => {
    if (!command) return;
    try {
      await navigator.clipboard.writeText(command);
      toast.success('Copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setCommand(text);
      toast.success('Pasted from clipboard');
    } catch (err) {
      toast.error('Failed to paste');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 p-3 bg-gray-800 border-t border-gray-700"
    >
      <div className="flex-1 flex items-center gap-2 bg-gray-900 border border-gray-700 rounded px-3 py-2">
        <span className="text-green-500 font-mono">$</span>
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter command..."
          className="flex-1 bg-transparent text-gray-200 outline-none font-mono text-sm"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleCopy}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
          title="Copy"
          aria-label="Copy command"
        >
          <Copy className="w-4 h-4 text-gray-400" />
        </button>

        <button
          type="button"
          onClick={handlePaste}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
          title="Paste"
          aria-label="Paste from clipboard"
        >
          <ClipboardPaste className="w-4 h-4 text-gray-400" />
        </button>

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-sm font-medium"
        >
          <ArrowUp className="w-4 h-4 inline mr-1" />
          Send
        </button>
      </div>
    </form>
  );
}
