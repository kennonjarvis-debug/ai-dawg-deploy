<script lang="ts">
	/**
	 * Skeleton Loader Component
	 *
	 * Provides visual feedback during initial app load and route transitions.
	 * Improves perceived performance by showing content placeholders.
	 */
	export let variant: 'daw' | 'page' | 'card' = 'page';
</script>

{#if variant === 'daw'}
	<!-- DAW Interface Skeleton -->
	<div class="daw-skeleton" role="status" aria-label="Loading DAW interface">
		<div class="skeleton-header">
			<div class="skeleton-logo animate-pulse"></div>
			<div class="skeleton-controls animate-pulse"></div>
		</div>

		<div class="skeleton-main">
			<!-- Transport controls -->
			<div class="skeleton-transport animate-pulse"></div>

			<!-- Track list -->
			<div class="skeleton-tracks">
				{#each Array(4) as _, i}
					<div class="skeleton-track animate-pulse" style="animation-delay: {i * 0.1}s"></div>
				{/each}
			</div>

			<!-- Timeline -->
			<div class="skeleton-timeline animate-pulse"></div>
		</div>
	</div>
{:else if variant === 'card'}
	<!-- Card Skeleton -->
	<div class="card-skeleton animate-pulse" role="status" aria-label="Loading content">
		<div class="skeleton-image"></div>
		<div class="skeleton-text"></div>
		<div class="skeleton-text short"></div>
	</div>
{:else}
	<!-- Page Skeleton -->
	<div class="page-skeleton" role="status" aria-label="Loading page">
		<div class="skeleton-header animate-pulse">
			<div class="skeleton-title"></div>
			<div class="skeleton-subtitle"></div>
		</div>
		<div class="skeleton-content animate-pulse"></div>
	</div>
{/if}

<style>
	/* Base skeleton styles */
	.animate-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	/* DAW Skeleton */
	.daw-skeleton {
		width: 100%;
		height: 100vh;
		background: #1a1a1a;
		display: flex;
		flex-direction: column;
	}

	.skeleton-header {
		height: 60px;
		background: #2a2a2a;
		display: flex;
		align-items: center;
		padding: 0 20px;
		gap: 20px;
		border-bottom: 1px solid #3a3a3a;
	}

	.skeleton-logo {
		width: 120px;
		height: 32px;
		background: #3a3a3a;
		border-radius: 4px;
	}

	.skeleton-controls {
		flex: 1;
		height: 36px;
		background: #3a3a3a;
		border-radius: 4px;
		max-width: 400px;
	}

	.skeleton-main {
		flex: 1;
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 20px;
		overflow: hidden;
	}

	.skeleton-transport {
		height: 80px;
		background: #2a2a2a;
		border-radius: 8px;
	}

	.skeleton-tracks {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 10px;
		overflow: hidden;
	}

	.skeleton-track {
		height: 60px;
		background: #2a2a2a;
		border-radius: 4px;
	}

	.skeleton-timeline {
		height: 200px;
		background: #2a2a2a;
		border-radius: 8px;
	}

	/* Page Skeleton */
	.page-skeleton {
		max-width: 1200px;
		margin: 0 auto;
		padding: 40px 20px;
	}

	.skeleton-header {
		margin-bottom: 32px;
	}

	.skeleton-title {
		height: 40px;
		width: 60%;
		background: #e0e0e0;
		border-radius: 4px;
		margin-bottom: 16px;
	}

	.skeleton-subtitle {
		height: 24px;
		width: 40%;
		background: #e0e0e0;
		border-radius: 4px;
	}

	.skeleton-content {
		height: 400px;
		background: #e0e0e0;
		border-radius: 8px;
	}

	/* Card Skeleton */
	.card-skeleton {
		background: white;
		border-radius: 8px;
		padding: 16px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.skeleton-image {
		height: 200px;
		background: #e0e0e0;
		border-radius: 4px;
		margin-bottom: 16px;
	}

	.skeleton-text {
		height: 16px;
		background: #e0e0e0;
		border-radius: 4px;
		margin-bottom: 8px;
	}

	.skeleton-text.short {
		width: 60%;
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.page-skeleton .skeleton-title,
		.page-skeleton .skeleton-subtitle,
		.page-skeleton .skeleton-content,
		.card-skeleton .skeleton-image,
		.card-skeleton .skeleton-text {
			background: #3a3a3a;
		}

		.card-skeleton {
			background: #2a2a2a;
		}
	}

	/* Responsive */
	@media (max-width: 768px) {
		.skeleton-header {
			padding: 0 10px;
		}

		.skeleton-main {
			padding: 10px;
		}

		.skeleton-tracks {
			gap: 8px;
		}

		.skeleton-track {
			height: 50px;
		}
	}
</style>
