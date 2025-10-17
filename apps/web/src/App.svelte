<script lang="ts">
  import { onMount } from 'svelte';

  // Import design system components
  import { TransportControls } from '@dawg-ai/design-system';
  import { Mixer } from '@dawg-ai/design-system';

  // Import track manager
  import { TrackList, AddTrackButton } from '@dawg-ai/track-manager';

  let tracks = $state([
    { id: '1', name: 'Lead Vocals', type: 'audio', color: '#ff6b6b', volume: 0, pan: 0, muted: false, solo: false },
    { id: '2', name: 'Backing Track', type: 'audio', color: '#4ecdc4', volume: -6, pan: 0, muted: false, solo: false },
    { id: '3', name: 'MIDI Melody', type: 'midi', color: '#95e1d3', volume: -3, pan: 0, muted: false, solo: false }
  ]);

  let isPlaying = $state(false);
  let bpm = $state(120);

  function handlePlay() {
    isPlaying = !isPlaying;
    console.log('Transport:', isPlaying ? 'Playing' : 'Paused');
  }

  function handleStop() {
    isPlaying = false;
    console.log('Transport: Stopped');
  }

  function handleRecord() {
    console.log('Recording...');
  }

  function handleBPMChange(event: CustomEvent) {
    bpm = event.detail;
    console.log('BPM changed to:', bpm);
  }

  function handleAddTrack() {
    const newTrack = {
      id: String(tracks.length + 1),
      name: `Track ${tracks.length + 1}`,
      type: 'audio',
      color: '#' + Math.floor(Math.random()*16777215).toString(16),
      volume: 0,
      pan: 0,
      muted: false,
      solo: false
    };
    tracks = [...tracks, newTrack];
  }

  function handleVolumeChange(trackId: string, volume: number) {
    tracks = tracks.map(t =>
      t.id === trackId ? { ...t, volume } : t
    );
    console.log(`Track ${trackId} volume:`, volume);
  }

  function handleMute(trackId: string) {
    tracks = tracks.map(t =>
      t.id === trackId ? { ...t, muted: !t.muted } : t
    );
  }

  function handleSolo(trackId: string) {
    tracks = tracks.map(t =>
      t.id === trackId ? { ...t, solo: !t.solo } : t
    );
  }

  onMount(() => {
    console.log('🎵 DAWG AI loaded!');
    console.log('✅ Design System: 20 components');
    console.log('✅ Audio Engine: 8 classes');
    console.log('✅ Backend API: 9 endpoints');
    console.log('✅ Track Manager: Track state management');
  });
</script>

<div class="dawg-ai">
  <header class="app-header">
    <h1>🎵 DAWG AI</h1>
    <p>Phase 1 Complete - 27% Overall Progress</p>
  </header>

  <main class="app-main">
    <div class="sidebar">
      <div class="module-info">
        <h3>✅ What's Built</h3>
        <ul>
          <li>Design System: 20 components</li>
          <li>Audio Engine: 8 classes</li>
          <li>Backend API: 9 endpoints</li>
          <li>Track Manager: State system</li>
        </ul>

        <h3 style="margin-top: 2rem;">⏳ Coming Next</h3>
        <ul>
          <li>MIDI Editor</li>
          <li>Timeline System</li>
          <li>Recording UI</li>
          <li>Voice Interface</li>
          <li>AI Features</li>
        </ul>
      </div>

      <button onclick={handleAddTrack} class="add-track-btn">
        + Add Track
      </button>
    </div>

    <div class="workspace">
      <div class="transport-section">
        <TransportControls
          {isPlaying}
          {bpm}
          on:play={handlePlay}
          on:stop={handleStop}
          on:record={handleRecord}
          on:bpmchange={handleBPMChange}
        />
      </div>

      <div class="tracks-section">
        <h2>Tracks ({tracks.length})</h2>
        <div class="tracks-list">
          {#each tracks as track}
            <div class="track-item" style="border-left: 4px solid {track.color}">
              <div class="track-header">
                <span class="track-name">{track.name}</span>
                <span class="track-type">{track.type}</span>
              </div>
              <div class="track-controls">
                <button
                  class="track-btn"
                  class:active={track.muted}
                  onclick={() => handleMute(track.id)}
                >
                  M
                </button>
                <button
                  class="track-btn"
                  class:active={track.solo}
                  onclick={() => handleSolo(track.id)}
                >
                  S
                </button>
                <input
                  type="range"
                  min="-60"
                  max="12"
                  value={track.volume}
                  oninput={(e) => handleVolumeChange(track.id, Number(e.currentTarget.value))}
                  class="volume-slider"
                />
                <span class="volume-value">{track.volume}dB</span>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <div class="mixer-section">
        <h2>Mixer</h2>
        <Mixer {tracks} />
      </div>
    </div>
  </main>

  <footer class="app-footer">
    <p>Backend API: http://localhost:3002 | Frontend: http://localhost:5173</p>
    <p>Check dashboard: <code>open dashboard/index.html</code></p>
  </footer>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0a0a0a;
    color: #e0e0e0;
  }

  .dawg-ai {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .app-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 1.5rem 2rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }

  .app-header h1 {
    margin: 0;
    font-size: 2rem;
  }

  .app-header p {
    margin: 0.5rem 0 0 0;
    opacity: 0.9;
  }

  .app-main {
    flex: 1;
    display: flex;
    gap: 1rem;
    padding: 1rem;
  }

  .sidebar {
    width: 250px;
    background: #1a1a1a;
    border-radius: 8px;
    padding: 1.5rem;
    border: 1px solid #333;
  }

  .module-info h3 {
    font-size: 1rem;
    margin-bottom: 0.5rem;
    color: #667eea;
  }

  .module-info ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .module-info li {
    padding: 0.5rem;
    background: #0a0a0a;
    margin-bottom: 0.25rem;
    border-radius: 4px;
    font-size: 0.85rem;
  }

  .add-track-btn {
    width: 100%;
    padding: 0.75rem;
    margin-top: 1rem;
    background: #5a67d8;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s;
  }

  .add-track-btn:hover {
    background: #4c51bf;
  }

  .workspace {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .transport-section {
    background: #1a1a1a;
    border-radius: 8px;
    padding: 1rem;
    border: 1px solid #333;
  }

  .tracks-section {
    flex: 1;
    background: #1a1a1a;
    border-radius: 8px;
    padding: 1.5rem;
    border: 1px solid #333;
  }

  .tracks-section h2 {
    margin: 0 0 1rem 0;
    font-size: 1.2rem;
  }

  .tracks-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .track-item {
    background: #0a0a0a;
    padding: 1rem;
    border-radius: 6px;
  }

  .track-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .track-name {
    font-weight: 600;
    font-size: 1rem;
  }

  .track-type {
    font-size: 0.75rem;
    text-transform: uppercase;
    background: #333;
    color: #aaa;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .track-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .track-btn {
    width: 32px;
    height: 32px;
    border: 1px solid #333;
    background: transparent;
    color: #888;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.2s;
  }

  .track-btn:hover {
    border-color: #667eea;
    color: #667eea;
  }

  .track-btn.active {
    background: #667eea;
    color: white;
    border-color: #667eea;
  }

  .volume-slider {
    flex: 1;
    height: 4px;
    -webkit-appearance: none;
    appearance: none;
    background: #333;
    border-radius: 2px;
    outline: none;
  }

  .volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #667eea;
    cursor: pointer;
  }

  .volume-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #667eea;
    cursor: pointer;
    border: none;
  }

  .volume-value {
    font-size: 0.85rem;
    min-width: 45px;
    text-align: right;
  }

  .mixer-section {
    background: #1a1a1a;
    border-radius: 8px;
    padding: 1.5rem;
    border: 1px solid #333;
  }

  .mixer-section h2 {
    margin: 0 0 1rem 0;
    font-size: 1.2rem;
  }

  .app-footer {
    background: #1a1a1a;
    padding: 1rem 2rem;
    border-top: 1px solid #333;
    text-align: center;
    font-size: 0.85rem;
    opacity: 0.7;
  }

  .app-footer p {
    margin: 0.25rem 0;
  }

  .app-footer code {
    background: #0a0a0a;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-family: 'Monaco', 'Courier New', monospace;
  }
</style>
