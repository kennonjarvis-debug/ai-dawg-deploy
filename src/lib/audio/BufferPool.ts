/**
 * BufferPool - DAWG AI Audio Engine
 * Memory-efficient audio buffer management with pooling
 * @module audio/BufferPool
 */

import * as Tone from 'tone';
import { AudioEngineError, ErrorCode } from './errors';

import { logger } from '$lib/utils/logger';
/**
 * Buffer pool configuration
 */
export interface BufferPoolConfig {
	maxSize?: number;
	enableLogging?: boolean;
}

/**
 * Buffer metadata for tracking
 */
interface BufferMetadata {
	buffer: AudioBuffer;
	lastUsed: number;
	useCount: number;
}

/**
 * BufferPool - Manages audio buffer allocation and reuse
 * Reduces GC pressure by reusing buffers
 */
export class BufferPool {
	private pool: Map<string, BufferMetadata>;
	private maxSize: number;
	private enableLogging: boolean;

	// Statistics
	private stats = {
		allocations: 0,
		reuses: 0,
		releases: 0,
		evictions: 0
	};

	constructor(config: BufferPoolConfig = {}) {
		this.maxSize = config.maxSize ?? 100;
		this.enableLogging = config.enableLogging ?? false;
		this.pool = new Map();
	}

	/**
	 * Acquire an audio buffer from the pool or create new one
	 * @param length - Buffer length in samples
	 * @param channels - Number of channels (default: 2)
	 * @param sampleRate - Sample rate (uses Tone.js context if not specified)
	 * @returns Audio buffer
	 */
	acquire(length: number, channels: number = 2, sampleRate?: number): AudioBuffer {
		if (length <= 0) {
			throw new AudioEngineError('Buffer length must be positive', ErrorCode.INVALID_PARAMETER);
		}

		if (channels < 1 || channels > 32) {
			throw new AudioEngineError(
				'Number of channels must be between 1 and 32',
				ErrorCode.INVALID_PARAMETER
			);
		}

		const key = this.createKey(length, channels);

		// Try to find suitable buffer in pool
		const metadata = this.pool.get(key);
		if (metadata) {
			this.pool.delete(key);
			metadata.lastUsed = Date.now();
			metadata.useCount++;
			this.stats.reuses++;

			if (this.enableLogging) {
				logger.info(
					`BufferPool: Reused buffer (${length} samples, ${channels} ch) - Use count: ${metadata.useCount}`
				);
			}

			return metadata.buffer;
		}

		// Create new buffer
		const rate = sampleRate ?? Tone.getContext().sampleRate;
		const buffer = new AudioBuffer({
			length,
			numberOfChannels: channels,
			sampleRate: rate
		});

		this.stats.allocations++;

		if (this.enableLogging) {
			logger.info(`BufferPool: Allocated new buffer (${length} samples, ${channels} ch)`);
		}

		return buffer;
	}

	/**
	 * Release a buffer back to the pool
	 * @param buffer - Buffer to release
	 */
	release(buffer: AudioBuffer): void {
		if (!buffer) {
			return;
		}

		// Check if pool is full
		if (this.pool.size >= this.maxSize) {
			this.evictOldest();
		}

		const key = this.createKey(buffer.length, buffer.numberOfChannels);

		// Clear buffer data to prevent memory leaks
		this.clearBuffer(buffer);

		// Add to pool
		const metadata: BufferMetadata = {
			buffer,
			lastUsed: Date.now(),
			useCount: 0
		};

		this.pool.set(key, metadata);
		this.stats.releases++;

		if (this.enableLogging) {
			logger.info(
				`BufferPool: Released buffer (${buffer.length} samples, ${buffer.numberOfChannels} ch) - Pool size: ${this.pool.size}`
			);
		}
	}

	/**
	 * Clear a buffer's data
	 * @param buffer - Buffer to clear
	 */
	private clearBuffer(buffer: AudioBuffer): void {
		for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
			const data = buffer.getChannelData(channel);
			data.fill(0);
		}
	}

	/**
	 * Evict oldest buffer from pool
	 */
	private evictOldest(): void {
		let oldestKey: string | null = null;
		let oldestTime = Infinity;

		for (const [key, metadata] of this.pool.entries()) {
			if (metadata.lastUsed < oldestTime) {
				oldestTime = metadata.lastUsed;
				oldestKey = key;
			}
		}

		if (oldestKey) {
			this.pool.delete(oldestKey);
			this.stats.evictions++;

			if (this.enableLogging) {
				logger.info(`BufferPool: Evicted oldest buffer - Pool size: ${this.pool.size}`);
			}
		}
	}

	/**
	 * Create a key for buffer lookup
	 * @param length - Buffer length
	 * @param channels - Number of channels
	 * @returns Key string
	 */
	private createKey(length: number, channels: number): string {
		return `${length}_${channels}`;
	}

	/**
	 * Get pool statistics
	 */
	getStats() {
		return {
			...this.stats,
			poolSize: this.pool.size,
			maxSize: this.maxSize,
			utilizationPercent: (this.pool.size / this.maxSize) * 100
		};
	}

	/**
	 * Clear the entire pool
	 */
	clear(): void {
		this.pool.clear();

		if (this.enableLogging) {
			logger.info('BufferPool: Cleared all buffers');
		}
	}

	/**
	 * Get current pool size
	 */
	get size(): number {
		return this.pool.size;
	}

	/**
	 * Check if pool is empty
	 */
	get isEmpty(): boolean {
		return this.pool.size === 0;
	}

	/**
	 * Check if pool is full
	 */
	get isFull(): boolean {
		return this.pool.size >= this.maxSize;
	}

	/**
	 * Print debug information
	 */
	debug(): void {
		console.group('BufferPool Debug Info');
		logger.info('Statistics:', this.getStats());
		logger.info('\nPooled Buffers:');

		for (const [key, metadata] of this.pool.entries()) {
			const [length, channels] = key.split('_');
			logger.info(
				`  ${length} samples, ${channels} ch - Use count: ${metadata.useCount}, Last used: ${new Date(metadata.lastUsed).toISOString()}`
			);
		}

		console.groupEnd();
	}
}

/**
 * Global buffer pool instance (singleton)
 */
let globalBufferPool: BufferPool | null = null;

/**
 * Get the global buffer pool instance
 */
export function getGlobalBufferPool(): BufferPool {
	if (!globalBufferPool) {
		globalBufferPool = new BufferPool({
			maxSize: 100,
			enableLogging: false
		});
	}
	return globalBufferPool;
}

/**
 * Set the global buffer pool instance
 */
export function setGlobalBufferPool(pool: BufferPool): void {
	globalBufferPool = pool;
}
