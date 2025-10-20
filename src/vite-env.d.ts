/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_DEMO_MODE: string
  readonly VITE_WEBSOCKET_URL: string
  readonly VITE_AI_BRAIN_URL: string
  readonly VITE_REALTIME_VOICE_URL: string
  readonly VITE_GATEWAY_URL: string
  readonly VITE_MONITOR_API: string
  // Add other env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
