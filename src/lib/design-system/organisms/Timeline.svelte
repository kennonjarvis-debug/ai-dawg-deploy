<script lang="ts">
/**
 * Timeline - Main timeline component with playback controls and waveform display
 */
import { Button, Icon, Label } from '../atoms';
import { onMount } from 'svelte';

interface TimelineProps {
  duration?: number;
  currentTime?: number;
  playing?: boolean;
  zoom?: number;
  onSeek?: (time: number) => void;
  onZoomChange?: (zoom: number) => void;
}

let {
  duration = 120,
  currentTime = $bindable(0),
  playing = false,
  zoom = $bindable(1),
  onSeek,
  onZoomChange
}: TimelineProps = $props();

let timelineElement: HTMLDivElement | undefined;
let canvasElement: HTMLCanvasElement | undefined;

const playheadPosition = $derived((currentTime / duration) * 100);

function handleClick(e: MouseEvent) {
  if (!timelineElement) return;

  const rect = timelineElement.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const percentage = x / rect.width;
  const newTime = percentage * duration;

  currentTime = Math.max(0, Math.min(duration, newTime));

  if (onSeek) {
    onSeek(currentTime);
  }
}

function handleZoomIn() {
  zoom = Math.min(zoom * 1.5, 10);
  if (onZoomChange) {
    onZoomChange(zoom);
  }
}

function handleZoomOut() {
  zoom = Math.max(zoom / 1.5, 0.1);
  if (onZoomChange) {
    onZoomChange(zoom);
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

// Draw time grid on canvas
onMount(() => {
  if (canvasElement) {
    const ctx = canvasElement.getContext('2d');
    if (ctx) {
      drawTimeGrid(ctx);
    }
  }
});

function drawTimeGrid(ctx: CanvasRenderingContext2D) {
  const width = canvasElement?.width || 1000;
  const height = canvasElement?.height || 100;

  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;

  // Draw vertical grid lines every 10 seconds
  for (let i = 0; i <= duration; i += 10) {
    const x = (i / duration) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
}
</script>

<div class="timeline glass-strong rounded-panel">
  <div class="timeline-header glass rounded-control p-4 mb-2 flex items-center justify-between">
    <div class="timeline-info flex items-baseline gap-3">
      <Label size="lg" weight="bold" class="time-display">
        {formatTime(currentTime)}
      </Label>
      <Label size="sm" color="var(--color-text-secondary)">
        / {formatTime(duration)}
      </Label>
    </div>

    <div class="timeline-controls flex items-center gap-2">
      <Button variant="ghost" size="sm" onclick={handleZoomOut}>
        <Icon name="remove" size="sm" />
      </Button>
      <Label size="sm" color="var(--color-text-secondary)" class="zoom-level min-w-12 text-center">
        {(zoom * 100).toFixed(0)}%
      </Label>
      <Button variant="ghost" size="sm" onclick={handleZoomIn}>
        <Icon name="add" size="sm" />
      </Button>
    </div>
  </div>

  <div
    class="timeline-canvas glass rounded-control"
    bind:this={timelineElement}
    onclick={handleClick}
    role="slider"
    aria-label="Timeline"
    aria-valuemin={0}
    aria-valuemax={duration}
    aria-valuenow={currentTime}
  >
    <!-- Time grid canvas -->
    <canvas
      bind:this={canvasElement}
      class="waveform-canvas"
      width="1000"
      height="100"
    ></canvas>

    <!-- Playhead -->
    <div
      class="playhead"
      style="left: {playheadPosition}%"
    >
      <div class="playhead-line"></div>
      <div class="playhead-handle"></div>
    </div>

    <!-- Time markers -->
    <div class="time-markers">
      {#each Array(Math.ceil(duration / 10)) as _, i}
        <div class="time-marker" style="left: {(i * 10 / duration) * 100}%">
          <Label size="xs" color="var(--color-text-tertiary)" class="marker-label">
            {formatTime(i * 10)}
          </Label>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .timeline {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    min-height: 200px;
  }

  .timeline-canvas {
    position: relative;
    height: 120px;
    cursor: pointer;
    overflow: hidden;
  }

  .waveform-canvas {
    width: 100%;
    height: 100%;
    opacity: 0.3;
  }

  .playhead {
    position: absolute;
    top: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 10;
  }

  .playhead-line {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--color-accent-primary);
    box-shadow: 0 0 4px var(--color-accent-primary);
  }

  .playhead-handle {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 12px;
    height: 12px;
    background: var(--color-accent-primary);
    border-radius: 50%;
    box-shadow: 0 0 4px var(--color-accent-primary);
  }

  .time-markers {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
  }

  .time-marker {
    position: absolute;
    top: 0;
    bottom: 0;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
  }

  .marker-label {
    position: absolute;
    top: 4px;
    left: 4px;
    font-family: var(--font-mono);
  }

  .time-display {
    font-family: var(--font-mono);
  }

  .zoom-level {
    font-family: var(--font-mono);
  }
</style>
