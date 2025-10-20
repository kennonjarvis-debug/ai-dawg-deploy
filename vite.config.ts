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
		target: 'es2020', // Modern browsers only = smaller bundle
		cssCodeSplit: true, // Split CSS for better caching
		terserOptions: {
			compress: {
				drop_console: true, // Remove console.log in production
				drop_debugger: true,
				pure_funcs: ['console.log', 'console.debug'],
				passes: 2, // Multiple passes for better compression
				unsafe_comps: true,
				unsafe_math: true
			},
			mangle: {
				safari10: false // Don't support Safari 10, smaller output
			},
			format: {
				comments: false // Remove all comments
			}
		},
		rollupOptions: {
			treeshake: {
				preset: 'recommended',
				moduleSideEffects: 'no-external' // Assume no side effects from node_modules
			},
			output: {
				// Manual chunk splitting for better caching
				manualChunks: (id) => {
					// Voice control features in separate chunk (lazy load)
					if (id.includes('WhisperGPTService') ||
					    id.includes('VoiceController') ||
					    id.includes('VoiceMemo')) {
						return 'voice-control';
					}

					// Audio engine in separate chunk (lazy load)
					if (id.includes('tone') || id.includes('/audio/')) {
						return 'audio-engine';
					}

					// Vendor libraries - split by package for better caching
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
						// Group other vendors
						return 'vendor';
					}
				},
				// Optimize chunk naming for better caching
				chunkFileNames: '_app/immutable/chunks/[name]-[hash].js',
				assetFileNames: '_app/immutable/assets/[name]-[hash][extname]'
			}
		},
		// Chunk size warning threshold
		chunkSizeWarningLimit: 1000
	}
}));
