import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { X, Maximize2, Minimize2, MoreVertical } from 'lucide-react';
import { StatusPill } from './StatusPill';
import { TerminalSession } from '../types';
import { useTerminalStore } from '../stores/terminalStore';
import 'xterm/css/xterm.css';

interface TerminalCardProps {
  session: TerminalSession;
  onClose: () => void;
  onAnalyze?: () => void;
}

export function TerminalCard({ session, onClose, onAnalyze }: TerminalCardProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const { updateSessionDimensions, updateSessionActivity, updateSessionStatus } = useTerminalStore();

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#0a0a0a',
        foreground: '#f0f0f0',
        cursor: '#f0f0f0',
        selection: 'rgba(255, 255, 255, 0.3)',
        black: '#000000',
        red: '#e06c75',
        green: '#98c379',
        yellow: '#d19a66',
        blue: '#61afef',
        magenta: '#c678dd',
        cyan: '#56b6c2',
        white: '#abb2bf',
        brightBlack: '#5c6370',
        brightRed: '#e06c75',
        brightGreen: '#98c379',
        brightYellow: '#d19a66',
        brightBlue: '#61afef',
        brightMagenta: '#c678dd',
        brightCyan: '#56b6c2',
        brightWhite: '#ffffff',
      },
      scrollback: 10000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);

    // Fit terminal to container
    setTimeout(() => {
      fitAddon.fit();
      updateSessionDimensions(session.id, term.rows, term.cols);
    }, 0);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Handle terminal input
    term.onData((data) => {
      updateSessionActivity(session.id);
      updateSessionStatus(session.id, 'busy');
      // TODO: Send data via WebSocket
      console.log('Terminal data:', data);
    });

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
        updateSessionDimensions(session.id, term.rows, term.cols);
      }
    });

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      term.dispose();
    };
  }, [session.id]);

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    setTimeout(() => {
      fitAddonRef.current?.fit();
    }, 100);
  };

  return (
    <div
      className={`
        flex flex-col bg-gray-900 border border-gray-700 rounded-lg overflow-hidden
        ${isExpanded ? 'col-span-full row-span-2' : ''}
        transition-all duration-200
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <StatusPill status={session.status} showLabel={false} />
          <span className="text-sm font-medium text-gray-200 truncate">
            {session.title}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              aria-label="Terminal menu"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg z-10 min-w-[160px]">
                {onAnalyze && (
                  <button
                    onClick={() => {
                      onAnalyze();
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                  >
                    Analyze with AI
                  </button>
                )}
                <button
                  onClick={() => {
                    xtermRef.current?.clear();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Expand/Collapse */}
          <button
            onClick={handleExpand}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            aria-label={isExpanded ? 'Minimize' : 'Maximize'}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4 text-gray-400" />
            ) : (
              <Maximize2 className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-600 rounded transition-colors"
            aria-label="Close terminal"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Terminal */}
      <div
        ref={terminalRef}
        className={`flex-1 p-2 ${isExpanded ? 'h-96' : 'h-48'}`}
        style={{ minHeight: isExpanded ? '384px' : '192px' }}
      />
    </div>
  );
}
