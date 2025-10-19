/**
 * UserPresence Component
 * Shows active users in the project with their status and avatars
 */

import React from 'react';
import type { UserPresence } from '../../../types/collaboration';

interface UserPresenceProps {
  users: UserPresence[];
  currentUserId: string | null;
}

export const UserPresenceList: React.FC<UserPresenceProps> = ({ users, currentUserId }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'editing':
        return 'bg-blue-500';
      case 'playing':
        return 'bg-purple-500';
      case 'recording':
        return 'bg-red-500';
      case 'idle':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="flex flex-col space-y-2 p-4 bg-gray-800 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-200">
          Online ({users.length})
        </h3>
      </div>

      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.userId}
            className="flex items-center space-x-3 p-2 rounded hover:bg-gray-700 transition"
          >
            {/* Avatar */}
            <div className="relative">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium"
                style={{ backgroundColor: user.color }}
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}
              </div>

              {/* Status indicator */}
              <div
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-800 ${getStatusColor(
                  user.status
                )}`}
                title={getStatusLabel(user.status)}
              />
            </div>

            {/* User info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">
                {user.username}
                {user.userId === currentUserId && (
                  <span className="ml-2 text-xs text-gray-400">(You)</span>
                )}
              </p>
              <p className="text-xs text-gray-400">
                {getStatusLabel(user.status)}
              </p>
            </div>
          </div>
        ))}

        {users.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">
            No other users online
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * User Cursor Component
 * Shows other users' cursors on the timeline
 */
interface UserCursorProps {
  user: UserPresence;
  timelineWidth: number;
  projectDuration: number;
}

export const UserCursor: React.FC<UserCursorProps> = ({
  user,
  timelineWidth,
  projectDuration,
}) => {
  if (!user.cursor) return null;

  const position = (user.cursor.time / projectDuration) * timelineWidth;

  return (
    <div
      className="absolute top-0 bottom-0 pointer-events-none"
      style={{ left: `${position}px` }}
    >
      {/* Cursor line */}
      <div
        className="w-0.5 h-full opacity-50"
        style={{ backgroundColor: user.color }}
      />

      {/* User label */}
      <div
        className="absolute top-0 left-1 px-2 py-1 rounded text-xs text-white font-medium whitespace-nowrap shadow-lg"
        style={{ backgroundColor: user.color }}
      >
        {user.username}
      </div>
    </div>
  );
};
