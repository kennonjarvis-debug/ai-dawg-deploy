import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DraggableResizableWrapper } from './DraggableResizableWrapper';

export interface WidgetProps {
  title: string;
  children: React.ReactNode;
  defaultSize?: { width: string | number; height: number };
  minHeight?: number;
  minWidth?: number;
  maxHeight?: number;
  maxWidth?: number;
  isDraggable?: boolean;
  isResizable?: boolean;
}

// Widget-specific constraints by title (optional enhancement)
const WIDGET_CONSTRAINTS: Record<string, { minWidth: number; minHeight: number; maxWidth?: number; maxHeight?: number }> = {
  'TIMELINE': { minWidth: 400, minHeight: 300, maxHeight: 600 },
  'MIXER': { minWidth: 300, minHeight: 200, maxWidth: 1200, maxHeight: 500 },
  'LYRICS': { minWidth: 250, minHeight: 200, maxWidth: 600, maxHeight: 500 },
  'TRANSPORT': { minWidth: 300, minHeight: 80, maxHeight: 120 },
  'AI CHAT': { minWidth: 250, minHeight: 250, maxWidth: 600, maxHeight: 800 },
};

type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export const Widget: React.FC<WidgetProps> = ({
  title,
  children,
  defaultSize = { width: '100%', height: 300 },
  minHeight = 150,
  minWidth = 300,
  maxHeight,
  maxWidth,
  isDraggable = false, // Default: not draggable (in-grid layout)
  isResizable = true,  // Default: resizable
}) => {
  // Get widget-specific constraints if available
  const constraints = WIDGET_CONSTRAINTS[title.toUpperCase()] || {};

  // Merge constraints with props (props take precedence)
  const finalMinHeight = minHeight || constraints.minHeight || 150;
  const finalMinWidth = minWidth || constraints.minWidth || 300;
  const finalMaxHeight = maxHeight || constraints.maxHeight || window.innerHeight - 100;
  const finalMaxWidth = maxWidth || constraints.maxWidth || window.innerWidth - 100;

  // Convert width to number if it's a percentage or string
  const getInitialWidth = (): number => {
    if (typeof defaultSize.width === 'number') {
      return defaultSize.width;
    }
    if (typeof defaultSize.width === 'string' && defaultSize.width.includes('%')) {
      // Calculate percentage of viewport width
      const percent = parseFloat(defaultSize.width) / 100;
      return window.innerWidth * percent;
    }
    return finalMinWidth;
  };

  const [size, setSize] = useState({
    width: getInitialWidth(),
    height: defaultSize.height,
  });

  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle | null>(null);
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Generate unique ID for localStorage based on title
  const widgetId = `widget-${title.toLowerCase().replace(/\s+/g, '-')}`;

  const handleSizeChange = useCallback((newSize: { width: number; height: number }) => {
    setSize(newSize);
  }, []);

  // Resize logic for non-draggable widgets
  const handleResizeStart = useCallback((e: React.MouseEvent, handle: ResizeHandle) => {
    e.preventDefault();
    e.stopPropagation();

    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    };

    setActiveHandle(handle);
    setIsResizing(true);
  }, [size]);

  // Handle mouse move during resize
  useEffect(() => {
    if (!isResizing || !activeHandle) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStartRef.current.x;
      const deltaY = e.clientY - resizeStartRef.current.y;

      let newWidth = resizeStartRef.current.width;
      let newHeight = resizeStartRef.current.height;

      // Calculate new dimensions based on active handle
      if (activeHandle.includes('e')) {
        newWidth = Math.max(finalMinWidth, Math.min(finalMaxWidth, resizeStartRef.current.width + deltaX));
      }
      if (activeHandle.includes('w')) {
        newWidth = Math.max(finalMinWidth, Math.min(finalMaxWidth, resizeStartRef.current.width - deltaX));
      }
      if (activeHandle.includes('s')) {
        newHeight = Math.max(finalMinHeight, Math.min(finalMaxHeight, resizeStartRef.current.height + deltaY));
      }
      if (activeHandle.includes('n')) {
        newHeight = Math.max(finalMinHeight, Math.min(finalMaxHeight, resizeStartRef.current.height - deltaY));
      }

      setSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setActiveHandle(null);

      // Persist to localStorage
      try {
        localStorage.setItem(`widget-${widgetId}-size`, JSON.stringify({ width: size.width, height: size.height }));
      } catch (error) {
        console.error('Failed to save widget size to localStorage:', error);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, activeHandle, finalMinWidth, finalMinHeight, finalMaxWidth, finalMaxHeight, widgetId, size]);

  // Load size from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`widget-${widgetId}-size`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSize({ width: parsed.width || size.width, height: parsed.height || size.height });
      }
    } catch (error) {
      console.error('Failed to load widget size from localStorage:', error);
    }
  }, [widgetId]);

  // For non-draggable widgets (in grid), use static positioning with resize
  if (!isDraggable) {
    return (
      <div
        className="relative bg-bg-surface backdrop-blur-xl border-2 border-border-strong rounded-2xl shadow-xl overflow-hidden flex flex-col w-full"
        style={{
          height: `${size.height}px`,
          minHeight: `${finalMinHeight}px`,
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

        {/* Resize Handles - All 8 directions */}
        {isResizable && (
          <>
            {/* Edge handles */}
            <div
              className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-blue-500/20 transition-colors"
              onMouseDown={(e) => handleResizeStart(e, 's')}
            />
            <div
              className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-blue-500/20 transition-colors"
              onMouseDown={(e) => handleResizeStart(e, 'n')}
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-blue-500/20 transition-colors"
              onMouseDown={(e) => handleResizeStart(e, 'e')}
            />
            <div
              className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-blue-500/20 transition-colors"
              onMouseDown={(e) => handleResizeStart(e, 'w')}
            />

            {/* Corner handles */}
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize hover:bg-blue-500/30 transition-colors"
              onMouseDown={(e) => handleResizeStart(e, 'se')}
            />
            <div
              className="absolute bottom-0 left-0 w-4 h-4 cursor-nesw-resize hover:bg-blue-500/30 transition-colors"
              onMouseDown={(e) => handleResizeStart(e, 'sw')}
            />
            <div
              className="absolute top-0 right-0 w-4 h-4 cursor-nesw-resize hover:bg-blue-500/30 transition-colors"
              onMouseDown={(e) => handleResizeStart(e, 'ne')}
            />
            <div
              className="absolute top-0 left-0 w-4 h-4 cursor-nwse-resize hover:bg-blue-500/30 transition-colors"
              onMouseDown={(e) => handleResizeStart(e, 'nw')}
            />
          </>
        )}
      </div>
    );
  }

  // For draggable widgets, use DraggableResizableWrapper
  return (
    <DraggableResizableWrapper
      id={widgetId}
      initialSize={size}
      minWidth={finalMinWidth}
      minHeight={finalMinHeight}
      maxWidth={finalMaxWidth}
      maxHeight={finalMaxHeight}
      isDraggable={isDraggable}
      isResizable={isResizable}
      onSizeChange={handleSizeChange}
      className="bg-bg-surface backdrop-blur-xl border-2 border-border-strong rounded-2xl shadow-xl overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border-base flex items-center gap-2 bg-bg-surface/80 flex-shrink-0">
        <h3 className="text-xs font-medium tracking-wide text-text-dim uppercase flex-1">
          {title}
        </h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </DraggableResizableWrapper>
  );
};
