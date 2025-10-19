# Real-time Collaboration - Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies (1 min)

```bash
npm install yjs socket.io socket.io-client ioredis
```

### 2. Run Migrations (1 min)

```bash
npx prisma migrate dev --name add_collaboration_tables
npx prisma generate
```

### 3. Update Server (2 min)

```typescript
// src/backend/server.ts
import { setupCollaborationHandlers } from './sockets/collaboration-socket';

io.on('connection', (socket) => {
  setupCollaborationHandlers(socket);
});
```

### 4. Add UI Component (1 min)

```typescript
// src/ui/pages/ProjectEditor.tsx
import { useCollaboration } from '@/ui/hooks/useCollaboration';
import { UserPresenceList } from '@/ui/components/Collaboration/UserPresence';
import { ProjectChat } from '@/ui/components/Collaboration/ProjectChat';

function ProjectEditor({ projectId }) {
  const collab = useCollaboration(projectId);

  return (
    <div>
      {/* Presence sidebar */}
      <UserPresenceList
        users={collab.activeUsers}
        currentUserId={collab.currentUserId}
      />

      {/* Your DAW UI here */}

      {/* Chat panel */}
      <ProjectChat
        messages={collab.chatMessages}
        currentUserId={collab.currentUserId}
        onSendMessage={(text) => collab.sendMessage({ text })}
      />
    </div>
  );
}
```

### 5. Start & Test

```bash
# Terminal 1: Start server
npm run dev:server

# Terminal 2: Start UI
npm run dev:ui

# Open two browser windows at localhost:5173
# Login as different users
# Navigate to same project
# See each other in presence list!
```

## Common Operations

### Update Cursor Position

```typescript
const handleSeek = (time: number) => {
  collab.updateCursor(time);
};
```

### Lock a Track Before Editing

```typescript
const handleEdit = async (trackId: string) => {
  const locked = await collab.requestLock(trackId);
  if (locked) {
    // Edit track
  } else {
    alert('Track locked by another user');
  }
};
```

### Send Chat Message

```typescript
collab.sendMessage({ text: 'Hello team!' });
```

### Add Comment

```typescript
collab.createComment({
  trackId: 'track-123',
  timestamp: 45.5,
  text: 'Great vocal take!'
});
```

### Create Version Snapshot

```typescript
collab.createVersion('Before major changes');
```

## Environment Variables

```bash
# Optional: Redis for distributed presence
REDIS_URL=redis://localhost:6379

# Enable for multiple server instances
WEBSOCKET_REDIS_ADAPTER=false

# Required for auth
JWT_SECRET=your-secret-key
```

## Testing

```bash
# E2E tests
npm run test:e2e -- collaboration.spec.ts

# Unit tests
npm test -- collaboration
```

## Troubleshooting

**Users not seeing each other?**
- Check WebSocket connection in browser console
- Verify both users authenticated
- Check firewall/proxy settings

**Edits not syncing?**
- Check network tab for WebSocket errors
- Verify Y.js version compatibility
- Check server logs

**Performance issues?**
- Limit to 10-25 concurrent users per project
- Enable Redis for better scalability
- Check database indexes

## Next Steps

1. Read full documentation: `/docs/REALTIME_COLLABORATION.md`
2. Review implementation report: `/docs/COLLABORATION_IMPLEMENTATION_REPORT.md`
3. Customize UI components for your design
4. Add permission checks to your routes
5. Setup monitoring and logging

## Key Files

- **Backend Services**: `/src/backend/services/collaboration-service.ts`
- **Socket Handlers**: `/src/backend/sockets/collaboration-socket.ts`
- **React Hook**: `/src/ui/hooks/useCollaboration.ts`
- **UI Components**: `/src/ui/components/Collaboration/`
- **Types**: `/src/types/collaboration.ts`

## Support

For issues or questions:
1. Check the documentation
2. Review E2E tests for examples
3. Check server logs
4. Enable debug mode: `DEBUG=collab:* npm run dev:server`

Happy collaborating!
