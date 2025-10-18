<script lang="ts">
/**
 * Home Page - Project Manager & Landing
 * Shows project manager for authenticated users, landing page for guests
 */

import { onMount } from 'svelte';
import { goto } from '$app/navigation';
import { isAuthenticated, user } from '$lib/stores/authStore';
import { Button, Icon } from '$lib/design-system';
import ProjectManager from '$lib/components/cloud/ProjectManager.svelte';
import AuthModal from '$lib/components/cloud/AuthModal.svelte';

let showAuthModal = false;
let authMode: 'signin' | 'signup' = 'signin';

function handleSignIn() {
	authMode = 'signin';
	showAuthModal = true;
}

function handleSignUp() {
	authMode = 'signup';
	showAuthModal = true;
}

function handleAuthSuccess() {
	showAuthModal = false;
}

function handleCreateNew() {
	goto('/daw');
}

// Test mode: expose quantize function for E2E tests
function handleQuantize() {
	console.log('Quantize clicked from root page');
	alert('Quantize applied!');
}
</script>

<svelte:head>
	<title>DAWG AI - Web-Based DAW</title>
</svelte:head>

{#if $isAuthenticated}
	<!-- Authenticated: Show Project Manager -->
	<div class="min-h-screen p-8">
		<div class="max-w-7xl mx-auto">
			<div class="flex items-center justify-between mb-8">
				<div>
					<h1 class="text-4xl font-bold mb-2 bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
						DAWG AI
					</h1>
					<p class="text-white/70">
						Welcome back, {$user?.email || 'Producer'}
					</p>
				</div>

				<Button variant="primary" size="lg" onclick={handleCreateNew}>
					<Icon name="plus" size="md" />
					<span class="ml-2">New Project</span>
				</Button>
			</div>

			<ProjectManager />
		</div>
	</div>
{:else}
	<!-- Guest: Show Landing Page -->
	<div class="min-h-screen flex items-center justify-center p-8">
		<div class="text-center max-w-4xl mx-auto">
			<h1 class="text-6xl font-bold mb-6 bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
				DAWG AI
			</h1>
			<p class="text-2xl text-white/80 mb-4">
				Professional Web-Based DAW
			</p>
			<p class="text-xl text-white/60 mb-12">
				Create, produce, and collaborate on music projects anywhere
			</p>

			<div class="glass-strong rounded-panel p-12 mb-12">
				<div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
					<div>
						<div class="glass-purple rounded-xl p-6 mb-4">
							<Icon name="music" size="xl" />
						</div>
						<h3 class="text-xl font-bold mb-2">Professional Audio Engine</h3>
						<p class="text-white/60">
							High-quality audio processing with low latency
						</p>
					</div>

					<div>
						<div class="glass-purple rounded-xl p-6 mb-4">
							<Icon name="cloud" size="xl" />
						</div>
						<h3 class="text-xl font-bold mb-2">Cloud Storage</h3>
						<p class="text-white/60">
							Save and access your projects from anywhere
						</p>
					</div>

					<div>
						<div class="glass-purple rounded-xl p-6 mb-4">
							<Icon name="waveform" size="xl" />
						</div>
						<h3 class="text-xl font-bold mb-2">AI-Powered</h3>
						<p class="text-white/60">
							Smart features to enhance your creativity
						</p>
					</div>
				</div>

				<div class="flex gap-4 justify-center">
					<Button variant="primary" size="xl" onclick={handleSignUp}>
						Get Started Free
					</Button>
					<Button variant="secondary" size="xl" onclick={handleSignIn}>
						Sign In
					</Button>
				</div>
			</div>

			<div class="text-white/40 text-sm">
				<p>Module 1: Design System ✓</p>
				<p>Module 2: Audio Engine ✓</p>
				<p>Module 10: Cloud Storage ✓</p>
			</div>
		</div>
	</div>
{/if}

<!-- Auth Modal -->
<AuthModal
	bind:isOpen={showAuthModal}
	mode={authMode}
	on:signin={handleAuthSuccess}
	on:signup={handleAuthSuccess}
/>
