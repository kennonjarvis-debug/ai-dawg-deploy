import { logger } from '$lib/utils/logger';

/**
 * AudioVisualizer Base Class
 *
 * Foundation for all audio visualization components
 * - 60fps canvas rendering with requestAnimationFrame
 * - Web Audio API AnalyserNode integration
 * - Automatic cleanup and lifecycle management
 * - Optimized for performance (<10ms render time)
 */

export interface AudioVisualizerConfig {
  /** Canvas element to render to */
  canvas: HTMLCanvasElement | OffscreenCanvas;
  /** Web Audio API context */
  audioContext: AudioContext | null;
  /** Optional analyser node (will create if not provided) */
  analyserNode?: AnalyserNode;
  /** Target FPS (default: 60) */
  targetFPS?: number;
  /** Enable performance monitoring */
  debug?: boolean;
}

export abstract class AudioVisualizer {
  protected canvas: HTMLCanvasElement | OffscreenCanvas;
  protected ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  protected audioContext: AudioContext | null;
  protected analyserNode: AnalyserNode | null = null;
  protected animationFrameId: number | null = null;
  protected isRunning: boolean = false;
  protected targetFPS: number;
  protected frameInterval: number;
  protected lastFrameTime: number = 0;
  protected debug: boolean;

  // Performance monitoring
  protected renderTimes: number[] = [];
  protected maxRenderTimeHistory = 60; // Keep last 60 frames

  constructor(config: AudioVisualizerConfig) {
    this.canvas = config.canvas;
    this.audioContext = config.audioContext;
    this.targetFPS = config.targetFPS || 60;
    this.frameInterval = 1000 / this.targetFPS;
    this.debug = config.debug || false;

    // Get canvas context
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }
    this.ctx = ctx;

    // Set up analyser node if audio context provided
    if (this.audioContext && !config.analyserNode) {
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 2048;
      this.analyserNode.smoothingTimeConstant = 0.8;
    } else if (config.analyserNode) {
      this.analyserNode = config.analyserNode;
    }
  }

  /**
   * Start rendering loop
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.renderLoop();
  }

  /**
   * Stop rendering loop
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stop();
    this.analyserNode?.disconnect();
    this.analyserNode = null;
  }

  /**
   * Connect audio source to visualizer
   */
  connectSource(source: MediaStreamAudioSourceNode | AudioBufferSourceNode | GainNode): void {
    if (!this.analyserNode) {
      throw new Error('No analyser node available');
    }
    source.connect(this.analyserNode);
  }

  /**
   * Disconnect audio source
   */
  disconnectSource(): void {
    this.analyserNode?.disconnect();
  }

  /**
   * Resize canvas (call when container size changes)
   */
  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  /**
   * Get average render time (ms)
   */
  getAverageRenderTime(): number {
    if (this.renderTimes.length === 0) return 0;
    const sum = this.renderTimes.reduce((a, b) => a + b, 0);
    return sum / this.renderTimes.length;
  }

  /**
   * Main render loop with FPS throttling
   */
  private renderLoop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const elapsed = currentTime - this.lastFrameTime;

    // Throttle to target FPS
    if (elapsed >= this.frameInterval) {
      const renderStart = performance.now();

      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Call subclass render method
      this.render();

      // Track render time
      const renderTime = performance.now() - renderStart;
      this.renderTimes.push(renderTime);
      if (this.renderTimes.length > this.maxRenderTimeHistory) {
        this.renderTimes.shift();
      }

      // Debug output
      if (this.debug && renderTime > 16.67) {
        logger.warn(`[AudioVisualizer] Slow render: ${renderTime.toFixed(2)}ms`);
      }

      this.lastFrameTime = currentTime - (elapsed % this.frameInterval);
    }

    this.animationFrameId = requestAnimationFrame(this.renderLoop);
  };

  /**
   * Abstract render method - subclasses implement this
   */
  protected abstract render(): void;

  /**
   * Helper: Get time-domain data from analyser
   */
  protected getTimeDomainData(): Float32Array {
    if (!this.analyserNode) return new Float32Array(0);
    const bufferLength = this.analyserNode.fftSize;
    const dataArray = new Float32Array(bufferLength);
    this.analyserNode.getFloatTimeDomainData(dataArray);
    return dataArray;
  }

  /**
   * Helper: Get frequency data from analyser
   */
  protected getFrequencyData(): Uint8Array {
    if (!this.analyserNode) return new Uint8Array(0);
    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyserNode.getByteFrequencyData(dataArray);
    return dataArray;
  }

  /**
   * Helper: Draw rounded rectangle
   */
  protected drawRoundedRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }
}
