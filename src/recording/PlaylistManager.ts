/**
 * PlaylistManager - Pro Tools-style playlist management
 *
 * Features:
 * - Auto-increment take naming (Take 1, Take 2, Take 3...)
 * - Active playlist tracking per track
 * - Playlist navigation (next/previous)
 * - Rename playlists
 * - Delete playlists with auto-activate first remaining
 *
 * Use Cases:
 * - Loop recording: Create new playlist per loop pass
 * - Take management: Switch between alternate takes
 * - Comping: Audition multiple takes to select best segments
 */

export interface Playlist {
  id: string;
  trackId: string;
  name: string;
  audioBufferId?: string;
  createdAt: Date;
  isActive: boolean;
}

export class PlaylistManager {
  private playlists: Map<string, Playlist[]> = new Map(); // trackId -> Playlist[]
  private activePlaylists: Map<string, string> = new Map(); // trackId -> playlistId
  private takeCounters: Map<string, number> = new Map(); // trackId -> counter

  /**
   * Create a new playlist for a track
   * @param trackId - Track identifier
   * @param customName - Optional custom name (defaults to auto-increment "Take N")
   * @returns Created playlist
   */
  createPlaylist(trackId: string, customName?: string): Playlist {
    const existingPlaylists = this.playlists.get(trackId) || [];

    // Auto-increment take counter
    const currentCount = this.takeCounters.get(trackId) || 0;
    this.takeCounters.set(trackId, currentCount + 1);

    const playlist: Playlist = {
      id: `playlist-${trackId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      trackId,
      name: customName || `Take ${currentCount + 1}`,
      createdAt: new Date(),
      isActive: existingPlaylists.length === 0, // First playlist is active by default
    };

    existingPlaylists.push(playlist);
    this.playlists.set(trackId, existingPlaylists);

    if (playlist.isActive) {
      this.activePlaylists.set(trackId, playlist.id);
    }

    console.log('[PlaylistManager] Created playlist:', playlist.name, 'for track:', trackId);
    return playlist;
  }

  /**
   * Get all playlists for a track
   */
  getPlaylists(trackId: string): Playlist[] {
    return this.playlists.get(trackId) || [];
  }

  /**
   * Get the active playlist for a track
   */
  getActivePlaylist(trackId: string): Playlist | null {
    const playlistId = this.activePlaylists.get(trackId);
    if (!playlistId) return null;

    const playlists = this.getPlaylists(trackId);
    return playlists.find(p => p.id === playlistId) || null;
  }

  /**
   * Set a playlist as active for a track
   * Deactivates all other playlists for the track
   */
  setActivePlaylist(trackId: string, playlistId: string): void {
    const playlists = this.getPlaylists(trackId);
    const playlist = playlists.find(p => p.id === playlistId);

    if (!playlist) {
      throw new Error(`Playlist ${playlistId} not found for track ${trackId}`);
    }

    // Deactivate all playlists for this track
    playlists.forEach(p => (p.isActive = false));

    // Activate selected playlist
    playlist.isActive = true;
    this.activePlaylists.set(trackId, playlistId);

    console.log('[PlaylistManager] Activated playlist:', playlist.name);
  }

  /**
   * Delete a playlist
   * If the deleted playlist was active, activates the first remaining playlist
   */
  deletePlaylist(trackId: string, playlistId: string): void {
    const playlists = this.getPlaylists(trackId);
    const index = playlists.findIndex(p => p.id === playlistId);

    if (index === -1) {
      throw new Error(`Playlist ${playlistId} not found`);
    }

    const wasActive = playlists[index].isActive;
    const deletedName = playlists[index].name;
    playlists.splice(index, 1);

    // If deleted playlist was active, activate the first remaining playlist
    if (wasActive && playlists.length > 0) {
      this.setActivePlaylist(trackId, playlists[0].id);
    } else if (playlists.length === 0) {
      this.activePlaylists.delete(trackId);
    }

    this.playlists.set(trackId, playlists);
    console.log('[PlaylistManager] Deleted playlist:', deletedName);
  }

  /**
   * Navigate to next playlist (circular)
   * Pro Tools shortcut: Ctrl+Down (Mac) / Ctrl+Down (Windows)
   */
  nextPlaylist(trackId: string): Playlist | null {
    const playlists = this.getPlaylists(trackId);
    if (playlists.length === 0) return null;

    const currentActive = this.getActivePlaylist(trackId);
    if (!currentActive) return null;

    const currentIndex = playlists.findIndex(p => p.id === currentActive.id);
    const nextIndex = (currentIndex + 1) % playlists.length;

    this.setActivePlaylist(trackId, playlists[nextIndex].id);
    return playlists[nextIndex];
  }

  /**
   * Navigate to previous playlist (circular)
   * Pro Tools shortcut: Ctrl+Up (Mac) / Ctrl+Up (Windows)
   */
  previousPlaylist(trackId: string): Playlist | null {
    const playlists = this.getPlaylists(trackId);
    if (playlists.length === 0) return null;

    const currentActive = this.getActivePlaylist(trackId);
    if (!currentActive) return null;

    const currentIndex = playlists.findIndex(p => p.id === currentActive.id);
    const prevIndex = (currentIndex - 1 + playlists.length) % playlists.length;

    this.setActivePlaylist(trackId, playlists[prevIndex].id);
    return playlists[prevIndex];
  }

  /**
   * Rename a playlist
   */
  renamePlaylist(trackId: string, playlistId: string, newName: string): void {
    const playlists = this.getPlaylists(trackId);
    const playlist = playlists.find(p => p.id === playlistId);

    if (!playlist) {
      throw new Error(`Playlist ${playlistId} not found`);
    }

    const oldName = playlist.name;
    playlist.name = newName;
    console.log('[PlaylistManager] Renamed playlist from', oldName, 'to', newName);
  }

  /**
   * Clear all playlists for a track
   */
  clearAllPlaylists(trackId: string): void {
    const count = this.getPlaylists(trackId).length;
    this.playlists.delete(trackId);
    this.activePlaylists.delete(trackId);
    this.takeCounters.delete(trackId);
    console.log('[PlaylistManager] Cleared', count, 'playlists for track:', trackId);
  }

  /**
   * Get the current take count for a track
   * This persists across deletions (Pro Tools behavior)
   */
  getTakeCount(trackId: string): number {
    return this.takeCounters.get(trackId) || 0;
  }

  /**
   * Associate an audio buffer with a playlist
   */
  setPlaylistAudioBuffer(trackId: string, playlistId: string, audioBufferId: string): void {
    const playlists = this.getPlaylists(trackId);
    const playlist = playlists.find(p => p.id === playlistId);

    if (!playlist) {
      throw new Error(`Playlist ${playlistId} not found`);
    }

    playlist.audioBufferId = audioBufferId;
    console.log('[PlaylistManager] Associated audio buffer', audioBufferId, 'with playlist', playlist.name);
  }

  /**
   * Get playlist by ID
   */
  getPlaylistById(trackId: string, playlistId: string): Playlist | null {
    const playlists = this.getPlaylists(trackId);
    return playlists.find(p => p.id === playlistId) || null;
  }

  /**
   * Get total number of playlists across all tracks
   */
  getTotalPlaylistCount(): number {
    let total = 0;
    this.playlists.forEach(playlists => {
      total += playlists.length;
    });
    return total;
  }

  /**
   * Get all track IDs that have playlists
   */
  getTracksWithPlaylists(): string[] {
    return Array.from(this.playlists.keys()).filter(trackId => {
      const playlists = this.playlists.get(trackId);
      return playlists && playlists.length > 0;
    });
  }

  /**
   * Export playlist metadata (for session save/load)
   */
  exportPlaylistData(trackId: string): Playlist[] {
    return this.getPlaylists(trackId).map(p => ({ ...p }));
  }

  /**
   * Import playlist metadata (for session save/load)
   */
  importPlaylistData(trackId: string, playlists: Playlist[]): void {
    this.playlists.set(trackId, playlists);

    // Set active playlist
    const activePlaylist = playlists.find(p => p.isActive);
    if (activePlaylist) {
      this.activePlaylists.set(trackId, activePlaylist.id);
    }

    // Update take counter
    const maxTakeNumber = Math.max(
      ...playlists
        .filter(p => p.name.startsWith('Take '))
        .map(p => parseInt(p.name.replace('Take ', ''), 10) || 0)
    );
    if (maxTakeNumber > 0) {
      this.takeCounters.set(trackId, maxTakeNumber);
    }

    console.log('[PlaylistManager] Imported', playlists.length, 'playlists for track:', trackId);
  }
}

// Singleton instance for global use
let globalPlaylistManager: PlaylistManager | null = null;

export function getGlobalPlaylistManager(): PlaylistManager {
  if (!globalPlaylistManager) {
    globalPlaylistManager = new PlaylistManager();
  }
  return globalPlaylistManager;
}

export function resetGlobalPlaylistManager(): void {
  globalPlaylistManager = new PlaylistManager();
}
