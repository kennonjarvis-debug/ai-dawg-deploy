# AI Agent Terminal Dashboard - Demo

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit VITE_WS_URL to point to your WebSocket server
   ```

3. **Start the dashboard**
   ```bash
   npm run dev:ui
   ```

4. **Access the dashboard**
   ```
   http://localhost:5173/agents
   ```

## Demo Screenshots

### Desktop View
![Desktop Dashboard](./demo/desktop.png)
*Full dashboard with 4 terminal sessions, AI Chat panel, and command bar*

### Mobile View
![Mobile Dashboard](./demo/mobile.png)
*Mobile-optimized layout with touch hotkeys*

### Terminal Session
![Terminal Session](./demo/terminal.png)
*Individual terminal with xterm.js, showing status and controls*

### AI Analysis
![AI Chat Panel](./demo/ai-chat.png)
*AI suggestions displayed after analyzing terminal output*

## Demo Video

[![Demo Video](./demo/thumbnail.png)](./demo/demo.mp4)
*Click to watch a 2-minute demo of all features*

## Features Demonstrated

### 1. Terminal Management
- Create up to 6 terminals
- Switch between sessions
- Expand/minimize terminals
- Close individual sessions

### 2. Command Interaction
- Type commands in CommandBar
- Navigate history with ↑/↓
- Copy/paste commands
- Real-time terminal output

### 3. AI Integration
- Click "Analyze" on any terminal
- View AI suggestions in ChatPanel
- Copy suggestions to clipboard or terminal
- Take notes in Notepad

### 4. Mobile Experience
- Responsive grid layout
- Touch-friendly hotkeys
- Long-press paste helper
- Safe area support (notch/home indicator)

### 5. Connection Management
- Real-time latency badge
- Offline banner with retry
- Session status indicators
- Automatic reconnection

## Demo Server Setup

For testing, you can use this simple WebSocket server:

```javascript
// demo-server.js
const { Server } = require('socket.io');
const io = new Server(4000, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('session:create', ({ sessionId, rows, cols }) => {
    console.log('Session created:', sessionId, rows, cols);
    socket.emit('terminal:status', { sessionId, status: 'connected' });
  });

  socket.on('terminal:input', ({ sessionId, data }) => {
    console.log('Input:', sessionId, data);
    // Echo back
    socket.emit('terminal:data', { sessionId, data });
  });

  socket.on('ping', (timestamp) => {
    socket.emit('pong', timestamp);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

console.log('Demo server running on ws://localhost:4000');
```

Run with: `node demo-server.js`

## Next Steps

1. Connect to your real terminal backend
2. Implement AI analysis endpoint
3. Customize theme and colors
4. Add additional features (see README)

---

For full documentation, see [README.md](./README.md)
