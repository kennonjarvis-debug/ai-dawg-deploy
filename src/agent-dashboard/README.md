# AI Agent Terminal Dashboard

A mobile-first web UI for managing up to 6 concurrent terminal sessions with AI-powered analysis, built with React, xterm.js, and WebSocket.

## Features

### P1 - Core UI ✅
- **TerminalGrid**: Manage up to 6 terminal sessions simultaneously
- **TerminalCard**: Individual xterm.js-powered terminal with resize/scrollback
- **StatusPill**: Real-time session status (Connected/Idle/Busy/Offline)
- **CommandBar**: Command input with history (↑/↓), copy/paste support
- **MobileHotkeys**: Touch-friendly quick keys (Ctrl/Esc/Tab/Arrows)
- Dark theme with accessibility basics
- Responsive design (mobile-first)

### P2 - Sessions & AI ✅
- **Session Management**: Open/close/switch between terminals
- **Reconnect/Resume**: Persistent sessions with dimension and scrollback recovery
- **RingBuffer**: Efficient 10k-line scrollback storage
- **AI Analysis**: Per-terminal "Analyze" button (no auto-calls)
- **ChatPanel**: Display AI suggestions and commands
- **Notepad**: Persistent note-taking area

### P3 - Mobile & Testing ✅
- **iPhone Optimization**: Touch targets, font scaling, long-press paste
- **Error Handling**: Toast notifications, latency badge, offline banner
- **E2E Tests**: Playwright test suite for all core features
- **Responsive**: Tested on iPhone 15, tablet, and desktop

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Terminal**: xterm.js + fit addon
- **State**: Zustand
- **WebSocket**: socket.io-client
- **Styling**: Tailwind CSS
- **Build**: Vite
- **Testing**: Playwright

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- WebSocket server for terminal connections (see Backend Setup)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your WebSocket URL
# VITE_WS_URL=ws://localhost:4000
```

### Development

```bash
# Start Vite dev server
npm run dev:ui

# Access dashboard
# http://localhost:5173/agents
```

### Build

```bash
# Production build
npm run build:ui

# Preview production build
npm run preview:ui
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_WS_URL` | WebSocket server URL | `ws://localhost:4000` |
| `VITE_API_URL` | API endpoint for AI analysis | `http://localhost:3000` |
| `VITE_MAX_TERMINALS` | Maximum concurrent terminals | `6` |
| `VITE_TERMINAL_SCROLLBACK` | Scrollback buffer size | `10000` |

## Usage

### Creating a Terminal

1. Navigate to `/agents`
2. Click "Create Terminal" or the "+" button
3. Terminal opens with xterm.js instance
4. Type commands in the CommandBar or directly in the terminal

### Session Management

- **Switch**: Click on any terminal card to make it active
- **Close**: Click the X button on a terminal card
- **Expand**: Click maximize icon to expand a terminal to full width
- **Minimize**: Click minimize to restore normal size

### Command History

- **↑ Arrow**: Navigate to previous command
- **↓ Arrow**: Navigate to next command
- Press Enter to submit command

### AI Analysis

1. Click the ⋮ menu on a terminal card
2. Select "Analyze with AI"
3. View suggestions in the ChatPanel (right sidebar)
4. Copy suggestions to clipboard or terminal

### Mobile Usage

- **Hotkeys**: Tap the floating button (⌘) to show quick keys
- **Long-press**: Hold input field to show paste helper
- **Touch targets**: All buttons are minimum 44x44px for easy tapping

## WebSocket API

The dashboard expects a WebSocket server implementing these events:

### Client → Server

```typescript
// Create session
socket.emit('session:create', { sessionId: string, rows: number, cols: number });

// Send terminal input
socket.emit('terminal:input', { sessionId: string, data: string });

// Resize terminal
socket.emit('session:resize', { sessionId: string, rows: number, cols: number });

// Close session
socket.emit('session:close', { sessionId: string });

// Heartbeat
socket.emit('ping', timestamp: number);
```

### Server → Client

```typescript
// Terminal output
socket.on('terminal:data', { sessionId: string, data: string });

// Session status update
socket.on('terminal:status', { sessionId: string, status: 'connected' | 'idle' | 'busy' | 'offline' });

// Heartbeat response
socket.on('pong', timestamp: number);
```

## REST API

### AI Analysis

```http
POST /api/ai/analyze?sessionId=<sessionId>
```

**Response:**
```json
{
  "suggestions": [
    "Try using 'ls -la' to show hidden files",
    "Consider using 'grep' to filter output"
  ]
}
```

## Architecture

```
src/agent-dashboard/
├── AgentDashboard.tsx        # Main dashboard component
├── components/
│   ├── TerminalGrid.tsx      # Grid layout for terminals
│   ├── TerminalCard.tsx      # Individual terminal with xterm.js
│   ├── StatusPill.tsx        # Connection status indicator
│   ├── CommandBar.tsx        # Command input with history
│   ├── ChatPanel.tsx         # AI suggestions panel
│   ├── Notepad.tsx          # Note-taking area
│   ├── MobileHotkeys.tsx    # Touch keyboard helpers
│   ├── LatencyBadge.tsx     # Connection latency display
│   └── OfflineBanner.tsx    # Disconnection banner
├── stores/
│   └── terminalStore.ts     # Zustand state management
├── hooks/
│   └── useTerminalWebSocket.ts  # WebSocket connection hook
├── utils/
│   └── RingBuffer.ts        # Efficient scrollback storage
├── types.ts                 # TypeScript interfaces
└── styles/
    └── mobile.css          # iPhone optimizations
```

## Testing

### E2E Tests

```bash
# Run all tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run in headed mode
npm run test:e2e:headed
```

### Test Coverage

- ✅ Dashboard loading
- ✅ Create terminal sessions
- ✅ 6-session limit enforcement
- ✅ Close terminal sessions
- ✅ Command input and history
- ✅ Copy/paste functionality
- ✅ Sidebar panel toggling
- ✅ Notepad persistence
- ✅ Terminal resize/expand
- ✅ Mobile hotkeys (viewport < 768px)
- ✅ Responsive design (mobile/tablet/desktop)

## Mobile Optimization

### iPhone 15 Specific

- **Font Scaling**: 16px minimum to prevent zoom
- **Touch Targets**: 44x44px minimum (Apple HIG)
- **Safe Areas**: Notch and home indicator spacing
- **Tap Highlighting**: Reduced tap delay
- **Viewport**: Locked to prevent pinch-zoom on controls

### CSS Features

```css
/* Prevent iOS zoom */
input { font-size: 16px; }

/* Safe area insets */
padding-bottom: env(safe-area-inset-bottom);

/* Smooth scrolling */
-webkit-overflow-scrolling: touch;
```

## Accessibility

- **Keyboard Navigation**: Full support with visible focus indicators
- **ARIA Labels**: All interactive elements labeled
- **Reduced Motion**: Respects `prefers-reduced-motion`
- **Screen Readers**: Semantic HTML and ARIA attributes
- **Color Contrast**: WCAG AA compliant dark theme

## Performance

- **Code Splitting**: Lazy-loaded components
- **RingBuffer**: O(1) scrollback operations
- **WebSocket**: Binary data support for efficiency
- **Debounced Resize**: Terminal fit on resize throttled

## Troubleshooting

### WebSocket Connection Failed

1. Check `VITE_WS_URL` in `.env`
2. Ensure WebSocket server is running
3. Check browser console for CORS errors
4. Try clicking "Retry" in offline banner

### Terminal Not Rendering

1. Check xterm.js CSS is loaded
2. Verify container has height
3. Check browser console for errors
4. Try refreshing the page

### Commands Not Sending

1. Ensure a terminal is active (click on card)
2. Check WebSocket connection status
3. Verify server is receiving events
4. Check browser network tab

## Future Enhancements

- [ ] Session persistence across page reloads
- [ ] Multi-user collaboration
- [ ] Terminal sharing via URLs
- [ ] Command autocomplete
- [ ] Custom color schemes
- [ ] SSH key management
- [ ] File upload/download
- [ ] Split terminal panes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT

## Support

For issues or questions:
- GitHub Issues: [your-repo]/issues
- Documentation: [your-docs-url]
- Email: support@example.com

---

**Built with ❤️ by Claude Instance 1**
