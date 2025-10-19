/**
 * Draggable and Resizable Wrapper Component
 *
 * Features:
 * - Drag widgets anywhere on screen
 * - Resize from all 8 handles (corners + edges)
 * - Persist position and size in localStorage
 * - Smooth animations and transitions
 * - Boundary constraints (stays within viewport)
 * - Touch-friendly on mobile
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface DraggableResizableWrapperProps {
  children: React.ReactNode;
  id: string; // Unique identifier for localStorage
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  className?: string;
  style?: React.CSSProperties;
  onPositionChange?: (position: { x: number; y: number }) => void;
  onSizeChange?: (size: { width: number; height: number }) => void;
  isDraggable?: boolean;
  isResizable?: boolean;
}

type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null;

export const DraggableResizableWrapper: React.FC<DraggableResizableWrapperProps> = ({
  children,
  id,
  initialPosition = { x: 100, y: 100 },
  initialSize = { width: 400, height: 500 },
  minWidth = 300,
  minHeight = 200,
  maxWidth = window.innerWidth - 20,
  maxHeight = window.innerHeight - 20,
  className = '',
  style = {},
  onPositionChange,
  onSizeChange,
  isDraggable = true,
  isResizable = true,
}) => {
  // Load persisted state from localStorage
  const getPersistedState = useCallback(() => {
    try {
      const stored = localStorage.getItem(`draggable-widget-${id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          position: parsed.position || initialPosition,
          size: parsed.size || initialSize,
        };
      }
    } catch (error) {
      console.error(`[DraggableResizableWrapper] Failed to load state for ${id}:`, error);
    }
    return { position: initialPosition, size: initialSize };
  }, [id, initialPosition, initialSize]);

  const persisted = getPersistedState();
  const [position, setPosition] = useState(persisted.position);
  const [size, setSize] = useState(persisted.size);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 });

  // Persist state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`draggable-widget-${id}`, JSON.stringify({
        position,
        size,
      }));
    } catch (error) {
      console.error(`[DraggableResizableWrapper] Failed to save state for ${id}:`, error);
    }
  }, [id, position, size]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDraggable) return;

    // Don't drag if clicking on resize handles or interactive elements
    const target = e.target as HTMLElement;
    if (target.classList.contains('resize-handle') ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'SELECT') {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragStartRef.current = {
      x: clientX,
      y: clientY,
      posX: position.x,
      posY: position.y,
    };

    setIsDragging(true);
  }, [isDraggable, position]);

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent, handle: ResizeHandle) => {
    if (!isResizable) return;

    e.preventDefault();
    e.stopPropagation();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    resizeStartRef.current = {
      x: clientX,
      y: clientY,
      width: size.width,
      height: size.height,
      posX: position.x,
      posY: position.y,
    };

    setActiveHandle(handle);
    setIsResizing(true);
  }, [isResizable, size, position]);

  // Handle mouse/touch move
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      if (isDragging) {
        e.preventDefault();

        const deltaX = clientX - dragStartRef.current.x;
        const deltaY = clientY - dragStartRef.current.y;

        let newX = dragStartRef.current.posX + deltaX;
        let newY = dragStartRef.current.posY + deltaY;

        // Constrain to viewport
        newX = Math.max(0, Math.min(newX, window.innerWidth - size.width));
        newY = Math.max(0, Math.min(newY, window.innerHeight - size.height));

        const newPosition = { x: newX, y: newY };
        setPosition(newPosition);
        onPositionChange?.(newPosition);
      } else if (isResizing && activeHandle) {
        e.preventDefault();

        const deltaX = clientX - resizeStartRef.current.x;
        const deltaY = clientY - resizeStartRef.current.y;

        let newWidth = resizeStartRef.current.width;
        let newHeight = resizeStartRef.current.height;
        let newX = resizeStartRef.current.posX;
        let newY = resizeStartRef.current.posY;

        // Calculate new dimensions based on resize handle
        if (activeHandle.includes('e')) {
          newWidth = Math.max(minWidth, Math.min(maxWidth, resizeStartRef.current.width + deltaX));
        }
        if (activeHandle.includes('w')) {
          const proposedWidth = resizeStartRef.current.width - deltaX;
          if (proposedWidth >= minWidth && proposedWidth <= maxWidth) {
            newWidth = proposedWidth;
            newX = resizeStartRef.current.posX + deltaX;
          }
        }
        if (activeHandle.includes('s')) {
          newHeight = Math.max(minHeight, Math.min(maxHeight, resizeStartRef.current.height + deltaY));
        }
        if (activeHandle.includes('n')) {
          const proposedHeight = resizeStartRef.current.height - deltaY;
          if (proposedHeight >= minHeight && proposedHeight <= maxHeight) {
            newHeight = proposedHeight;
            newY = resizeStartRef.current.posY + deltaY;
          }
        }

        // Ensure widget stays within viewport
        if (newX + newWidth > window.innerWidth) {
          newWidth = window.innerWidth - newX;
        }
        if (newY + newHeight > window.innerHeight) {
          newHeight = window.innerHeight - newY;
        }
        if (newX < 0) {
          newWidth += newX;
          newX = 0;
        }
        if (newY < 0) {
          newHeight += newY;
          newY = 0;
        }

        const newSize = { width: newWidth, height: newHeight };
        const newPosition = { x: newX, y: newY };

        setSize(newSize);
        setPosition(newPosition);
        onSizeChange?.(newSize);
        onPositionChange?.(newPosition);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
      setIsResizing(false);
      setActiveHandle(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleEnd);

      return () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('touchend', handleEnd);
      };
    }
  }, [isDragging, isResizing, activeHandle, size, minWidth, minHeight, maxWidth, maxHeight, onSizeChange, onPositionChange]);

  // Resize handles configuration
  const handles: Array<{ handle: ResizeHandle; cursor: string; position: React.CSSProperties }> = [
    { handle: 'n', cursor: 'ns-resize', position: { top: 0, left: '50%', width: '100%', height: 8, transform: 'translateX(-50%)' } },
    { handle: 's', cursor: 'ns-resize', position: { bottom: 0, left: '50%', width: '100%', height: 8, transform: 'translateX(-50%)' } },
    { handle: 'e', cursor: 'ew-resize', position: { right: 0, top: '50%', width: 8, height: '100%', transform: 'translateY(-50%)' } },
    { handle: 'w', cursor: 'ew-resize', position: { left: 0, top: '50%', width: 8, height: '100%', transform: 'translateY(-50%)' } },
    { handle: 'ne', cursor: 'nesw-resize', position: { top: 0, right: 0, width: 16, height: 16 } },
    { handle: 'nw', cursor: 'nwse-resize', position: { top: 0, left: 0, width: 16, height: 16 } },
    { handle: 'se', cursor: 'nwse-resize', position: { bottom: 0, right: 0, width: 16, height: 16 } },
    { handle: 'sw', cursor: 'nesw-resize', position: { bottom: 0, left: 0, width: 16, height: 16 } },
  ];

  return (
    <div
      ref={wrapperRef}
      className={`draggable-resizable-wrapper ${className}`}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        cursor: isDragging ? 'grabbing' : isDraggable ? 'grab' : 'default',
        userSelect: 'none',
        zIndex: isDragging || isResizing ? 10000 : 1000,
        transition: isDragging || isResizing ? 'none' : 'box-shadow 0.2s ease',
        boxShadow: isDragging || isResizing
          ? '0 20px 60px rgba(0, 0, 0, 0.5)'
          : '0 8px 32px rgba(0, 0, 0, 0.3)',
        ...style,
      }}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
    >
      {children}

      {/* Resize Handles */}
      {isResizable && handles.map(({ handle, cursor, position: handlePos }) => (
        <div
          key={handle}
          className="resize-handle"
          style={{
            position: 'absolute',
            cursor,
            zIndex: 10001,
            ...handlePos,
          }}
          onMouseDown={(e) => handleResizeStart(e, handle)}
          onTouchStart={(e) => handleResizeStart(e, handle)}
        />
      ))}

      {/* Visual indicator when dragging/resizing */}
      {(isDragging || isResizing) && (
        <div
          style={{
            position: 'absolute',
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            border: '2px solid rgba(59, 130, 246, 0.8)',
            borderRadius: 'inherit',
            pointerEvents: 'none',
            animation: 'pulse 1s ease-in-out infinite',
          }}
        />
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default DraggableResizableWrapper;
