import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: parseInt(process.env.VITE_PORT || '5173'),
    open: false, // Don't auto-open browser during tests
    host: true, // Listen on all addresses (0.0.0.0)
    allowedHosts: [
      'localhost',
      '.ngrok-free.dev',
      '.ngrok.io',
      '.ngrok.app',
    ],
    proxy: {
      // Proxy API requests to backend server
      '/api': {
        target: 'http://localhost:3100',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Intelligent code splitting for optimal bundle sizes
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Split React and related libraries (largest dependency)
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'react-vendor';
            }

            // Split UI libraries (lucide-react, radix-ui, etc.)
            if (id.includes('lucide-react') || id.includes('@radix-ui') || id.includes('sonner')) {
              return 'ui-vendor';
            }

            // Don't split audio libraries - let Vite handle them automatically
            // Tone.js has circular dependencies that break when manually chunked

            // Split WebSocket/Socket.io
            if (id.includes('socket.io-client') || id.includes('engine.io-client')) {
              return 'socket-vendor';
            }

            // Split state management (zustand)
            if (id.includes('zustand')) {
              return 'state-vendor';
            }

            // Everything else goes into general vendor
            return 'vendor';
          }

          // Split large components for lazy loading
          if (id.includes('/components/AIChatWidget')) {
            return 'ai-chat-chunk';
          }

          if (id.includes('/components/ChannelStripPanel')) {
            return 'channel-strip-chunk';
          }

          if (id.includes('/components/FreestyleSession')) {
            return 'freestyle-chunk';
          }

          if (id.includes('/components/VocalRecorder')) {
            return 'vocal-recorder-chunk';
          }
        },
        assetFileNames: (assetInfo) => {
          let extType = assetInfo.name.split('.').at(-1);
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = 'images';
          } else if (/woff|woff2|ttf|otf/i.test(extType)) {
            extType = 'fonts';
          }
          return `assets/${extType}/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    minify: 'esbuild',
    target: 'esnext',
    modulePreload: {
      polyfill: false,
    },
  },
});
