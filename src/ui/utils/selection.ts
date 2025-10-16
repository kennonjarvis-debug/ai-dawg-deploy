import type { Track } from '../../stores/timelineStore';

export function getSelectedAudioFileIds(tracks: Track[], selectedClipIds: string[]): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const t of tracks) {
    for (const c of t.clips) {
      if (selectedClipIds.includes(c.id)) {
        const id = c.audioFileId || '';
        if (id && !seen.has(id)) {
          seen.add(id);
          ids.push(id);
        }
      }
    }
  }
  return ids;
}

export function getSelectedTrackIds(tracks: Track[], selectedClipIds: string[]): string[] {
  const seen = new Set<string>();
  for (const t of tracks) {
    for (const c of t.clips) {
      if (selectedClipIds.includes(c.id)) {
        seen.add(t.id);
        break;
      }
    }
  }
  return Array.from(seen);
}

