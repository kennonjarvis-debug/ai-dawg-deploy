import React, { useState, useRef, useEffect } from 'react';
import { Move } from 'lucide-react';

export interface WidgetProps {
  title: string;
  children: React.ReactNode;
  defaultSize?: { width: string | number; height: number };
  minHeight?: number;
}

export const Widget: React.FC<WidgetProps> = ({
  title,
  children,
  defaultSize = { width: '100%', height: 300 },
  minHeight = 150,
}) => {
  const [height, setHeight] = useState(defaultSize.height);
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setStartY(e.clientY);
    setStartHeight(height);
  };

  // Mouse move handler for resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const delta = e.clientY - startY;
        const newHeight = Math.max(minHeight, startHeight + delta);
        setHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, startY, startHeight, minHeight]);

  return (
    <div
      ref={widgetRef}
      className={`relative bg-bg-surface backdrop-blur-xl border-2 ${
        isResizing ? 'border-blue-500' : 'border-border-strong'
      } rounded-2xl shadow-xl overflow-hidden flex flex-col w-full`}
      style={{
        height: `${height}px`,
        minHeight: `${minHeight}px`,
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border-base flex items-center gap-2 bg-bg-surface/80 flex-shrink-0">
        <h3 className="text-xs font-medium tracking-wide text-text-dim uppercase flex-1">
          {title}
        </h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">{children}</div>

      {/* Resize Handle - Bottom Edge Only */}
      <div
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-blue-500/20 transition-colors"
        onMouseDown={handleResizeStart}
      />
    </div>
  );
};
