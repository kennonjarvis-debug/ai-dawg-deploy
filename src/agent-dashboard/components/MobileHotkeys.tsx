import React, { useEffect, useState } from 'react';
import { Command, X as CloseIcon } from 'lucide-react';

interface MobileHotkeysProps {
  onKey: (key: string) => void;
}

const hotkeys = [
  { key: 'Ctrl', label: 'Ctrl', className: 'bg-blue-600' },
  { key: 'Escape', label: 'Esc', className: 'bg-red-600' },
  { key: 'Tab', label: 'Tab', className: 'bg-purple-600' },
  { key: 'ArrowLeft', label: '←', className: 'bg-gray-700' },
  { key: 'ArrowUp', label: '↑', className: 'bg-gray-700' },
  { key: 'ArrowRight', label: '→', className: 'bg-gray-700' },
  { key: 'ArrowDown', label: '↓', className: 'bg-gray-700' },
];

export function MobileHotkeys({ onKey }: MobileHotkeysProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) return null;

  return (
    <>
      {/* Toggle Button */}
      {!isVisible && (
        <button
          onClick={() => setIsVisible(true)}
          className="
            fixed bottom-4 right-4 z-50
            p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full
            shadow-lg transition-colors
          "
          aria-label="Show mobile hotkeys"
        >
          <Command className="w-6 h-6" />
        </button>
      )}

      {/* Hotkey Panel */}
      {isVisible && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 p-4 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-300">Quick Keys</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              aria-label="Hide hotkeys"
            >
              <CloseIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {hotkeys.map((hotkey) => (
              <button
                key={hotkey.key}
                onClick={() => onKey(hotkey.key)}
                className={`
                  ${hotkey.className} hover:opacity-80
                  text-white font-semibold py-3 px-2 rounded
                  transition-opacity active:scale-95
                  text-sm
                `}
              >
                {hotkey.label}
              </button>
            ))}
          </div>

          {/* Helper text */}
          <p className="text-xs text-gray-500 mt-3 text-center">
            Tap keys to send to active terminal
          </p>
        </div>
      )}
    </>
  );
}
