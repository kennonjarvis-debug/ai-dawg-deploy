# Real-time Collaboration System

## Overview

DAWG AI's real-time collaboration system enables multiple users to work on the same project simultaneously with conflict-free synchronization, live presence tracking, and integrated communication tools.

## Architecture

### Technology Stack

- **CRDT Library**: Y.js (Yjs) - Production-proven CRDT library used by Figma, Notion, and other collaboration platforms
- **WebSocket**: Socket.IO for reliable real-time communication
- **Presence Tracking**: Redis (optional) or in-memory storage
- **Conflict Resolution**: CRDT-based (automatic, conflict-free)
- **Database**: SQLite with Prisma ORM
- **UI Framework**: React with TypeScript

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ UI Components│  │useCollaboration│ │WebSocket Client│   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│         └─────────────────┴──────────────────┘               │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │ Socket.IO
┌───────────────────────────┼──────────────────────────────────┐
│                    Server (Node.js)                          │
│  ┌──────────────┐  ┌──────┴────────┐  ┌──────────────┐      │
│  │ Collaboration│  │Socket Handlers│  │ Permissions  │      │
│  │   Service    │  │               │  │  Middleware  │      │
│  └──────┬───────┘  └──────┬────────┘  └──────────────┘      │
│         │                 │                                  │
│  ┌──────┴────┬────────────┴──────┬──────────────┐           │
│  │CRDT Service│Presence Service  │Chat Service  │           │
│  │  (Y.js)    │                  │              │           │
│  └────────────┘                  └──────────────┘           │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │   Database   │  │    Redis     │                         │
│  │  (Prisma)    │  │  (Optional)  │                         │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Features

### 1. User Presence

**Tracks and displays**:
- Who's online in the project
- User activity status (active, idle, editing, playing, recording)
- User cursor positions on timeline
- User colors for visual distinction

**Implementation**:
- `src/backend/services/presence-service.ts` - Core presence tracking
- `src/ui/components/Collaboration/UserPresence.tsx` - UI component
- Redis or in-memory storage for distributed systems
- Automatic cleanup of stale presences

### 2. Real-time Editing with CRDT

**Conflict-Free Synchronization**:
- Uses Y.js (Yjs) CRDT library
- No conflicts - all edits automatically merge
- Vector clocks for ordering operations
- Efficient binary encoding

**Synchronized Operations**:
- Track add/update/delete
- Clip add/update/delete/move
- Effect add/update/delete
- Automation points add/update/delete
- Project metadata updates

**Implementation**:
- `src/backend/services/crdt-service.ts` - CRDT core
- Update batching for performance (100ms buffer)
- State vectors for efficient sync
- Snapshot import/export

### 3. Track Locking

**Exclusive Editing**:
- Users can lock tracks to prevent conflicts
- Lock duration: 5 minutes default (configurable)
- Auto-release on disconnect
- Force unlock for project owners

**Implementation**:
- `src/backend/services/collaboration-service.ts` - Lock management
- Database-backed with TTL
- Automatic cleanup of expired locks

### 4. Communication

**In-App Chat**:
- Real-time text messaging
- @mentions with notifications
- Message editing and deletion
- Threaded replies (optional)
- File attachments support

**Comments**:
- Track-specific comments
- Timeline-positioned comments
- Threaded discussions
- Resolve/unresolve workflow
- @mentions support

**Implementation**:
- `src/backend/services/project-chat-service.ts`
- `src/ui/components/Collaboration/ProjectChat.tsx`
- Database-persisted with real-time sync

### 5. Permissions System

**Three Roles**:

| Role   | Edit | Delete | Invite | Manage | Export | Comment | Chat | Lock |
|--------|------|--------|--------|--------|--------|---------|------|------|
| OWNER  | ✓    | ✓      | ✓      | ✓      | ✓      | ✓       | ✓    | ✓    |
| EDITOR | ✓    | ✗      | ✗      | ✗      | ✓      | ✓       | ✓    | ✓    |
| VIEWER | ✗    | ✗      | ✗      | ✗      | ✗      | ✓       | ✓    | ✗    |

**Implementation**:
- `src/backend/middleware/project-permissions.ts`
- Role-based access control (RBAC)
- Middleware for HTTP endpoints
- Socket.IO event validation

### 6. Version History

**Features**:
- Automatic snapshots every 5 minutes
- Manual version creation
- Version comparison (diff)
- Restore to any version
- Backup before restore (optional)

**Implementation**:
- Snapshots stored as JSON in database
- Incremental version numbers
- Size tracking for storage management
- Cleanup old versions (retention policy)

### 7. Project Forking

**Create Copies**:
- Fork projects with one click
- Copy project state via CRDT
- Optionally include collaborators
- Maintains version history link

## WebSocket Events

### Connection Events

```typescript
// Join project
socket.emit('collab:join', { projectId: string })

// Leave project
socket.emit('collab:leave', { projectId: string })

// Heartbeat (every 10s)
socket.emit('collab:heartbeat', { projectId: string })
```

### Sync Events

```typescript
// Send CRDT update
socket.emit('collab:sync', {
  projectId: string,
  type: 'update',
  update: Uint8Array
})

// Request sync (after disconnect)
socket.emit('collab:sync', {
  projectId: string,
  type: 'sync',
  stateVector: Uint8Array
})

// Receive sync update
socket.on('collab:sync', (data) => {
  // Apply update to Y.js document
})
```

### Presence Events

```typescript
// Update presence
socket.emit('collab:presence', {
  projectId: string,
  status: 'active' | 'idle' | 'editing' | 'playing' | 'recording',
  cursor: { time: number, trackId?: string }
})

// Move cursor
socket.emit('collab:cursor', {
  projectId: string,
  cursor: { time: number, trackId?: string }
})

// Receive presence updates
socket.on('collab:presence-update', (data) => {
  // Update user in UI
})

socket.on('collab:cursor-moved', (data) => {
  // Draw user cursor
})
```

### Lock Events

```typescript
// Request lock
socket.emit('collab:lock-request', {
  projectId: string,
  trackId: string,
  duration?: number // seconds
})

// Release lock
socket.emit('collab:lock-release', {
  projectId: string,
  trackId: string
})

// Lock acquired
socket.on('collab:lock-response', (data: {
  success: boolean,
  lock?: TrackLock,
  currentHolder?: { userId: string, username: string }
}) => {})

// Track locked by another user
socket.on('collab:track-locked', (data) => {
  // Show lock indicator
})

// Track unlocked
socket.on('collab:track-unlocked', (data) => {
  // Remove lock indicator
})
```

### Chat Events

```typescript
// Send message
socket.emit('collab:chat-send', {
  projectId: string,
  text: string,
  mentions?: string[],
  replyToId?: string
})

// Receive message
socket.on('collab:chat-message', (data) => {
  // Add message to chat
})
```

### Comment Events

```typescript
// Create comment
socket.emit('collab:comment-create', {
  projectId: string,
  trackId?: string,
  timestamp?: number,
  text: string,
  mentions?: string[]
})

// Resolve comment
socket.emit('collab:comment-resolve', {
  projectId: string,
  commentId: string
})

// Receive comment
socket.on('collab:comment-added', (data) => {
  // Add comment to UI
})
```

## Database Schema

### ProjectCollaborator
```sql
CREATE TABLE ProjectCollaborator (
  id          TEXT PRIMARY KEY,
  projectId   TEXT NOT NULL,
  userId      TEXT NOT NULL,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL, -- OWNER, EDITOR, VIEWER
  inviteStatus TEXT DEFAULT 'PENDING',
  invitedBy   TEXT NOT NULL,
  invitedAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
  acceptedAt  DATETIME,
  UNIQUE(projectId, email)
)
```

### ProjectVersion
```sql
CREATE TABLE ProjectVersion (
  id          TEXT PRIMARY KEY,
  projectId   TEXT NOT NULL,
  version     INTEGER NOT NULL,
  snapshot    TEXT NOT NULL, -- JSON
  changeDescription TEXT,
  createdBy   TEXT NOT NULL,
  size        INTEGER NOT NULL,
  createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(projectId, version)
)
```

### TrackLock
```sql
CREATE TABLE TrackLock (
  id          TEXT PRIMARY KEY,
  projectId   TEXT NOT NULL,
  trackId     TEXT NOT NULL,
  userId      TEXT NOT NULL,
  username    TEXT NOT NULL,
  lockedAt    DATETIME DEFAULT CURRENT_TIMESTAMP,
  expiresAt   DATETIME NOT NULL,
  autoRelease BOOLEAN DEFAULT true,
  UNIQUE(projectId, trackId)
)
```

### ProjectChatMessage
```sql
CREATE TABLE ProjectChatMessage (
  id          TEXT PRIMARY KEY,
  projectId   TEXT NOT NULL,
  userId      TEXT NOT NULL,
  username    TEXT NOT NULL,
  text        TEXT NOT NULL,
  mentions    TEXT, -- JSON array
  replyToId   TEXT,
  isEdited    BOOLEAN DEFAULT false,
  createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt   DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### ProjectComment
```sql
CREATE TABLE ProjectComment (
  id          TEXT PRIMARY KEY,
  projectId   TEXT NOT NULL,
  userId      TEXT NOT NULL,
  username    TEXT NOT NULL,
  trackId     TEXT,
  regionId    TEXT,
  timestamp   FLOAT, -- Timeline position
  text        TEXT NOT NULL,
  mentions    TEXT, -- JSON array
  parentId    TEXT, -- For threaded replies
  isResolved  BOOLEAN DEFAULT false,
  createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt   DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

## Usage Example

### Frontend (React)

```typescript
import { useCollaboration } from '@/ui/hooks/useCollaboration';
import { UserPresenceList } from '@/ui/components/Collaboration/UserPresence';
import { ProjectChat } from '@/ui/components/Collaboration/ProjectChat';

function ProjectEditor({ projectId }: { projectId: string }) {
  const collab = useCollaboration(projectId);

  // Update cursor when user moves playhead
  const handleSeek = (time: number) => {
    collab.updateCursor(time);
  };

  // Request lock before editing
  const handleEditTrack = async (trackId: string) => {
    const locked = await collab.requestLock(trackId);
    if (locked) {
      // Proceed with edit
    } else {
      alert('Track is locked by another user');
    }
  };

  // Send chat message
  const handleSendMessage = (text: string) => {
    collab.sendMessage({ text });
  };

  return (
    <div>
      {/* Presence sidebar */}
      <UserPresenceList
        users={collab.activeUsers}
        currentUserId={collab.currentUserId}
      />

      {/* Main editor */}
      <div>
        {/* Timeline with user cursors */}
        {collab.activeUsers.map(user => (
          <UserCursor key={user.userId} user={user} />
        ))}

        {/* Tracks with lock indicators */}
        {tracks.map(track => {
          const lock = collab.lockedTracks.get(track.id);
          return (
            <Track
              key={track.id}
              track={track}
              isLocked={!!lock}
              lockedBy={lock?.username}
              onEdit={() => handleEditTrack(track.id)}
            />
          );
        })}
      </div>

      {/* Chat panel */}
      <ProjectChat
        messages={collab.chatMessages}
        currentUserId={collab.currentUserId}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
```

### Backend (API)

```typescript
import express from 'express';
import { collaborationService } from '@/backend/services/collaboration-service';
import { requireProjectAccess, requireOwnerPermission } from '@/backend/middleware/project-permissions';

const router = express.Router();

// Invite collaborator
router.post('/projects/:projectId/collaborators',
  requireOwnerPermission,
  async (req, res) => {
    const { projectId } = req.params;
    const { email, role } = req.body;
    const invitedBy = req.userId;

    const collaborator = await collaborationService.inviteCollaborator(
      projectId,
      invitedBy,
      { email, role }
    );

    res.json(collaborator);
  }
);

// Get version history
router.get('/projects/:projectId/versions',
  requireProjectAccess,
  async (req, res) => {
    const { projectId } = req.params;
    const versions = await collaborationService.getVersionHistory(projectId);
    res.json(versions);
  }
);
```

## Performance Considerations

### Scalability

**100s of Users in One Project**:

❌ **Not Recommended** - System is optimized for 2-10 concurrent users per project

✅ **Recommended Limits**:
- 2-10 concurrent users: Optimal performance
- 10-25 users: Good performance with proper infrastructure
- 25-50 users: Requires Redis and load balancing
- 50+ users: Not recommended, consider read-only viewers

**Why?**:
- CRDT operations scale linearly with users
- WebSocket connections consume server resources
- Presence updates multiply with user count
- Database write conflicts increase

### Optimizations

**CRDT Service**:
- Update batching (100ms window)
- Binary encoding for efficiency
- Automatic document cleanup (30min inactivity)
- Compressed state vectors

**Presence Service**:
- Redis for distributed systems
- TTL-based cleanup
- Heartbeat deduplication
- Throttled cursor updates

**Database**:
- Indexed queries
- Connection pooling
- Batch inserts for notifications
- Automatic lock cleanup

**Network**:
- WebSocket compression
- Binary protocol for CRDT
- Debounced cursor updates
- Message deduplication

## Security Considerations

### Authentication
- JWT-based authentication required
- Session validation on connect
- Automatic session refresh

### Authorization
- Permission checks on all operations
- Socket.IO room isolation per project
- Middleware validation

### Input Validation
- Sanitize all user inputs
- Validate data types and ranges
- Rate limiting on events

### Data Protection
- Encrypted WebSocket connections (WSS)
- Encrypted database storage
- Audit logs for sensitive operations

### Attack Prevention
- CSRF protection on WebSocket origin
- DoS protection via rate limiting
- Input size limits
- Automatic disconnect on abuse

## Setup Instructions

### 1. Install Dependencies

```bash
npm install yjs socket.io socket.io-client ioredis
npm install -D @types/yjs
```

### 2. Update Environment Variables

```bash
# Optional: Redis for distributed presence
REDIS_URL=redis://localhost:6379

# Enable Redis adapter for Socket.IO clustering
WEBSOCKET_REDIS_ADAPTER=true
```

### 3. Run Database Migrations

```bash
npx prisma migrate dev --name add_collaboration_tables
npx prisma generate
```

### 4. Integrate Socket Handlers

```typescript
// src/backend/server.ts
import { Server as SocketIOServer } from 'socket.io';
import { setupCollaborationHandlers } from './sockets/collaboration-socket';

const io = new SocketIOServer(server, {
  cors: { origin: process.env.CORS_ORIGIN },
});

io.on('connection', (socket) => {
  setupCollaborationHandlers(socket);
});
```

### 5. Add UI Components

```typescript
// src/ui/pages/ProjectEditor.tsx
import { useCollaboration } from '@/ui/hooks/useCollaboration';
import { UserPresenceList } from '@/ui/components/Collaboration/UserPresence';
import { ProjectChat } from '@/ui/components/Collaboration/ProjectChat';

// Use in your project editor
```

## Testing

### Unit Tests
```bash
npm run test -- collaboration-service.test.ts
npm run test -- crdt-service.test.ts
npm run test -- presence-service.test.ts
```

### E2E Tests
```bash
npm run test:e2e -- collaboration.spec.ts
```

### Manual Testing
1. Open two browser windows
2. Login as different users
3. Navigate to same project
4. Verify presence, editing, chat, locks

## Monitoring & Debugging

### Metrics
- Active collaboration sessions
- CRDT operations per second
- WebSocket connection count
- Message queue depth
- Lock acquisition rate

### Logs
```typescript
// Check presence stats
GET /api/collaboration/stats

// Check CRDT document status
GET /api/collaboration/projects/:id/sync-status

// View active locks
GET /api/collaboration/projects/:id/locks
```

### Debug Mode
```bash
DEBUG=collab:* npm run dev:server
```

## Troubleshooting

### Users Not Seeing Each Other
- Check WebSocket connection
- Verify Redis connection (if using)
- Check firewall/proxy settings
- Verify JWT authentication

### Sync Conflicts
- Should not happen with CRDT
- Check Y.js version compatibility
- Verify binary encoding/decoding
- Check network reliability

### Locks Not Working
- Check database connection
- Verify lock cleanup job
- Check user permissions
- Verify timestamp sync

### Performance Issues
- Reduce update batch interval
- Enable Redis caching
- Optimize presence heartbeat
- Limit active users per project

## Future Enhancements

1. **Voice Chat** - WebRTC integration
2. **Video Cursors** - See what collaborators see
3. **Offline Mode** - Local-first with sync
4. **Conflict Markers** - Visual merge indicators
5. **Change Attribution** - Who changed what
6. **Live Playback Sync** - Everyone hears same thing
7. **Collaborative Plugins** - Shared plugin state
8. **AI Suggestions** - Collaborative AI assistance

## Conclusion

The DAWG AI real-time collaboration system provides a robust, scalable, and secure platform for multi-user project editing. Built on proven CRDT technology and optimized for music production workflows, it enables seamless collaboration for teams of all sizes.

For questions or issues, see the main DAWG AI documentation or contact the development team.
