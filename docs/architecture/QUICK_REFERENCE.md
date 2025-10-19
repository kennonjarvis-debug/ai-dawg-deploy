# Chat-to-Create Implementation - Quick Reference

## Critical File Paths (Absolute Paths)

### Backend Files to Extend
- `/Users/benkennon/ai-dawg-deploy/src/gateway/server.ts` - Main server
- `/Users/benkennon/ai-dawg-deploy/src/gateway/ai-service.ts` - AI integration template
- `/Users/benkennon/ai-dawg-deploy/src/gateway/rest-api.ts` - API routes
- `/Users/benkennon/ai-dawg-deploy/src/gateway/config.ts` - Configuration

### Frontend Files to Use
- `/Users/benkennon/ai-dawg-deploy/src/ui/chatbot/ChatbotWidget.tsx` - UI component (1,263 lines)
- `/Users/benkennon/ai-dawg-deploy/src/ui/chatbot/chat_assistant.ts` - Chat logic
- `/Users/benkennon/ai-dawg-deploy/src/api/client.ts` - API client pattern
- `/Users/benkennon/ai-dawg-deploy/src/hooks/useWebSocket.ts` - WebSocket usage

### WebSocket Infrastructure
- `/Users/benkennon/ai-dawg-deploy/src/api/websocket/server.ts` - Socket.io setup (445 lines)
- `/Users/benkennon/ai-dawg-deploy/src/gateway/websocket-server.ts` - WS server (281 lines)

## Existing AI Integrations

### OpenAI (Currently Active)
```typescript
// Location: /src/gateway/ai-service.ts
class AIService {
  private openai: OpenAI;
  async analyzeSession(request: AIAnalysisRequest): Promise<AIAnalysisResponse>
}
```
- Model: GPT-4o-mini
- Use: Terminal session analysis (manual trigger)
- Endpoint: POST /api/ai/analyze

### Audio Analysis (Client-Side)
```typescript
// Location: /src/plugins/ai/AIMixerEngine.ts
class AIMixerEngine {
  analyzeAudio(audioBuffer): AudioFeatures
  recommendPlugins(features, genre): AIPluginRecommendation[]
  autoAdjustParameters(instanceId, pluginId, features): AIPluginControl
}
```
- No external API calls
- Features: RMS, peak, spectral centroid, LUFS, etc.

### Frontend Stubs (Not Implemented)
```typescript
// Location: /src/ai/integration.ts
class VocalCoachClient { async analyze() {} }
class ProducerAIClient { async suggest() {} }
```

## Existing Chat System

### ChatAssistant Class
```typescript
// Location: /src/ui/chatbot/chat_assistant.ts (450 lines)
export class ChatAssistant {
  setGenerationHandler(handler: (type, params) => Promise<any>)
  processMessage(userInput: string): Promise<ChatMessage>
  getHistory(): ChatMessage[]
}
```

### Intent Types Supported
- FEATURE_INQUIRY, HOW_TO, GENERAL_HELP
- GENERATE_LYRICS, GENERATE_MELODY, GENERATE_TOPLINE, GENERATE_FULL_SONG
- CLONE_VOICE, PLAY_SAMPLE, SHOW_EXAMPLE
- GREETING, THANKS, UNKNOWN

### Subscription Tiers (UI Enforced)
```
Free:  25 messages/day
Pro:   500 messages/day  
Studio: 2000 messages/day
```

## Current WebSocket Events (Socket.io)

Already Implemented:
- `join:project`, `leave:project`
- `project:update`, `project:updated`
- `track:create`, `track:update`, `track:delete`, `track:reorder`
- `clip:create`, `clip:update`, `clip:delete`
- `ai:start`, `ai:progress`, `ai:complete`, `ai:error`
- `recording:start`, `recording:stop`
- `selection:change`
- `playback:sync`
- `cursor:move`

Broadcast Functions Already Exist:
```typescript
emitToUser(userId: string, event: string, data: any)
emitToProject(projectId: string, event: string, data: any)
emitRenderProgress(userId: string, jobId: string, progress: number)
emitAICompleted(userId: string, taskId: string, result: any)
```

## What's Already Built in Frontend

### ChatbotWidget Features (1,263 lines)
- Collapsible chat interface
- Message history with suggestions
- Sample prompt library
- Live coaching mode with speech recognition
- Real-time transcript display
- Performance statistics
- Subscription tier display

### Chat Message Structure
```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: ChatIntent;
    entities?: Record<string, any>;
    suggestions?: string[];
    generatedContent?: any;
    audioPreview?: string;
  };
}
```

## API Routes Already Defined

### Chat-Related Methods in APIClient
```typescript
// Existing AI endpoints
async analyzeVocals(data: AnalyzeVocalsRequest): Promise<any>
async masterTrack(data: MasterTrackRequest): Promise<any>
async generateContent(data: GenerateContentRequest): Promise<any>

// AI DAWG features
async autoComp(audioFileIds: string[]): Promise<any>
async timeAlign(audioFileId: string): Promise<any>
async pitchCorrect(audioFileId: string): Promise<any>
async autoMix(trackIds: string[]): Promise<any>
async aiDawg(audioFileIds: string[]): Promise<any>
```

## What NEEDS to be Built

### Backend (Priority Order)
1. Multi-AI Provider abstraction
   - OpenAIProvider class
   - AnthropicProvider class
   - Provider factory/selector
2. GenerationService (like AIService but for music generation)
3. ChatService (conversation management, persistence)
4. API routes for chat endpoints
5. Database entities for conversations
6. Backend rate limiting enforcement
7. Streaming response support

### Frontend (Priority Order)
1. Connect ChatAssistant's generation callbacks to APIClient
2. Add chat API methods to APIClient
3. Create useChatWebSocket hook for streaming
4. Create useGeneration hook for generation tracking
5. Implement actual generation in integration.ts
6. Add conversation persistence

## Database Entities Needed
- ChatConversation (id, userId, projectId, title, createdAt, updatedAt)
- ChatMessage (id, conversationId, role, content, metadata, createdAt)
- GenerationJob (extends existing Job or new table)
- UserQuota (userId, usageThisMonth, tierLimit)

## Environment Variables Needed
```bash
ANTHROPIC_API_KEY=sk-ant-...
AI_PROVIDER=openai|anthropic
GENERATION_TIMEOUT=120
GENERATION_MAX_TOKENS=4096
CHAT_HISTORY_LIMIT=50
```

## Key Design Patterns to Follow

### From AIService
```typescript
if (!config.enableAI || !process.env.OPENAI_API_KEY) {
  throw new Error('AI service not available');
}
```

### From WebSocket
```typescript
io.use(async (socket, next) => {
  // authentication middleware
});

socket.on('event', (data) => {
  socket.to(`room:${roomId}`).emit('event:response', result);
});
```

### From APIClient
```typescript
private async request<T>(
  method: string,
  path: string,
  data?: any
): Promise<T> {
  const headers = { 'Authorization': `Bearer ${this.token}` };
  // CSRF token handling
  // Token refresh on 401
}
```

## Files Already Handling Similar Features

For reference on how things work:
- Rate limiting: `/src/gateway/middleware/rate-limit.ts`
- Authentication: `/src/gateway/middleware/auth.ts`
- Telemetry: `/src/gateway/telemetry.ts`
- Logging: `/src/gateway/logger.ts`

## Testing Integration Points

Once implemented, test these flows:
1. User sends chat message -> ChatService processes -> Response streamed via WebSocket
2. Chat requests generation -> GenerationService queues job -> Progress emitted
3. Generation completes -> Result returned to ChatbotWidget
4. Conversation saved to database -> User can retrieve history
5. Subscription limits enforced server-side
6. Multiple AI providers work interchangeably

