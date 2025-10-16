import React, { useState, useEffect, useCallback } from 'react';
import { Users, Circle } from 'lucide-react';
import { useWebSocketEvent } from '../../hooks/useWebSocket';

interface Collaborator {
  userId: string;
  userName: string;
  color: string;
  cursor?: { x: number; y: number; time: number };
}

interface CollaboratorListProps {
  projectId: string;
}

export const CollaboratorList: React.FC<CollaboratorListProps> = ({ projectId }) => {
  const [collaborators, setCollaborators] = useState<Map<string, Collaborator>>(new Map());

  // Handle collaborator joined
  const handleCollaboratorJoined = useCallback((data: { userId: string; userName: string }) => {
    setCollaborators((prev) => {
      const next = new Map(prev);
      next.set(data.userId, {
        userId: data.userId,
        userName: data.userName,
        color: getRandomColor(),
      });
      return next;
    });
  }, []);

  // Handle collaborator left
  const handleCollaboratorLeft = useCallback((data: { userId: string }) => {
    setCollaborators((prev) => {
      const next = new Map(prev);
      next.delete(data.userId);
      return next;
    });
  }, []);

  // Handle cursor moved
  const handleCursorMoved = useCallback((data: { userId: string; position: { x: number; y: number; time: number } }) => {
    setCollaborators((prev) => {
      const collaborator = prev.get(data.userId);
      if (!collaborator) return prev;

      const next = new Map(prev);
      next.set(data.userId, {
        ...collaborator,
        cursor: data.position,
      });
      return next;
    });
  }, []);

  // Subscribe to WebSocket events
  useWebSocketEvent('collaborator:joined', handleCollaboratorJoined);
  useWebSocketEvent('collaborator:left', handleCollaboratorLeft);
  useWebSocketEvent('cursor:moved', handleCursorMoved);

  const collaboratorList = Array.from(collaborators.values());

  if (collaboratorList.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-black/40 border border-white/10 rounded-lg">
      <Users className="w-4 h-4 text-gray-400" />
      <div className="flex items-center gap-1">
        {collaboratorList.map((collaborator) => (
          <div
            key={collaborator.userId}
            className="group relative"
            title={collaborator.userName}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-white/20"
              style={{ backgroundColor: collaborator.color }}
            >
              {collaborator.userName.charAt(0).toUpperCase()}
            </div>
            <Circle
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-green-400 fill-current"
            />
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {collaborator.userName}
            </div>
          </div>
        ))}
      </div>
      <span className="text-sm text-gray-400">
        {collaboratorList.length} {collaboratorList.length === 1 ? 'collaborator' : 'collaborators'}
      </span>
    </div>
  );
};

// Helper function to generate random colors for collaborators
function getRandomColor(): string {
  const colors = [
    '#3B82F6', // blue
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#06B6D4', // cyan
    '#6366F1', // indigo
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
