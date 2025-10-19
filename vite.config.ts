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
        target: process.env.VITE_API_URL || 'http://localhost:3100',
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
        // Simplified code splitting - let Vite handle most dependencies automatically
        // Manual chunking can cause module loading order issues
        manualChunks(id) {
          // Only split React to ensure it loads first
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'react-vendor';
            }
            // Let Vite handle all other node_modules automatically
            // This prevents dependency loading order issues
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
