import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => ({
	plugins: [
		sveltekit(),

		// PWA Support for offline functionality
		VitePWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'DAWG AI',
				short_name: 'DAWG AI',
				description: 'AI-powered Digital Audio Workstation',
				theme_color: '#1a1a1a',
				background_color: '#ffffff',
				display: 'standalone',
				icons: [
					{
						src: '/favicon.png',
						sizes: '192x192',
						type: 'image/png'
					}
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,woff2,png,svg}'],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/api\.openai\.com\/.*/i,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'openai-api-cache',
							expiration: {
								maxEntries: 50,
								maxAgeSeconds: 60 * 60 // 1 hour
							},
							networkTimeoutSeconds: 10
						}
					}
				]
			}
		}),

		// Bundle analysis (only in production build with ANALYZE=true)
		mode === 'production' && process.env.ANALYZE === 'true' && visualizer({
			open: true,
			gzipSize: true,
			brotliSize: true,
			filename: 'bundle-analysis.html'
		})
	].filter(Boolean),

	define: {
		// Make MODE available at runtime
		'import.meta.env.MODE': JSON.stringify(mode)
	},

	// Build optimizations
	build: mode === 'test' ? {
		sourcemap: true,
		minify: false // Easier debugging in tests
	} : {
		// Production build optimizations
		minify: 'terser',
		terserOptions: {
			compress: {
				drop_console: true, // Remove console.log in production
				drop_debugger: true,
				pure_funcs: ['console.log', 'console.debug']
			}
		},
		rollupOptions: {
			output: {
				// Manual chunk splitting for better caching
				manualChunks: (id) => {
					// Voice control features in separate chunk
					if (id.includes('WhisperGPTService') ||
					    id.includes('VoiceController') ||
					    id.includes('VoiceMemo')) {
						return 'voice-control';
					}

					// Audio engine in separate chunk
					if (id.includes('tone') || id.includes('/audio/')) {
						return 'audio-engine';
					}

					// Vendor libraries
					if (id.includes('node_modules')) {
						if (id.includes('@anthropic-ai')) {
							return 'anthropic-sdk';
						}
						if (id.includes('@supabase')) {
							return 'supabase-sdk';
						}
						if (id.includes('svelte')) {
							return 'svelte-vendor';
						}
						return 'vendor';
					}
				}
			}
		},
		// Chunk size warning threshold
		chunkSizeWarningLimit: 1000
	}
}));
