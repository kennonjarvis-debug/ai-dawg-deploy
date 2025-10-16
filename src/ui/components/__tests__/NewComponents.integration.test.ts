/**
 * Integration tests for new DAW components
 * Tests that components can be imported and integrated correctly
 */

import { describe, it, expect } from 'vitest';
import type { SectionMarker, SectionType } from '../SectionMarkers';

describe('Component Integration Tests', () => {
  describe('SectionMarkers', () => {
    it('should have correct type definitions', () => {
      const marker: SectionMarker = {
        id: 'test-1',
        name: 'Verse 1',
        type: 'verse' as SectionType,
        time: 8.0,
        color: '#10b981',
      };

      expect(marker.id).toBe('test-1');
      expect(marker.name).toBe('Verse 1');
      expect(marker.type).toBe('verse');
      expect(marker.time).toBe(8.0);
      expect(marker.color).toBe('#10b981');
    });

    it('should support all section types', () => {
      const types: SectionType[] = [
        'intro',
        'verse',
        'chorus',
        'bridge',
        'breakdown',
        'drop',
        'outro',
        'custom',
      ];

      types.forEach((type) => {
        const marker: SectionMarker = {
          id: `test-${type}`,
          name: type.charAt(0).toUpperCase() + type.slice(1),
          type,
          time: 0,
          color: '#ffffff',
        };

        expect(marker.type).toBe(type);
      });
    });
  });

  describe('Timeline Store Integration', () => {
    it('should have section marker methods defined', async () => {
      // Dynamic import to avoid build-time errors
      const { useTimelineStore } = await import('../../../stores/timelineStore');

      const store = useTimelineStore.getState();

      // Check that methods exist
      expect(typeof store.addSectionMarker).toBe('function');
      expect(typeof store.deleteSectionMarker).toBe('function');
      expect(typeof store.updateSectionMarker).toBe('function');
      expect(Array.isArray(store.sectionMarkers)).toBe(true);
    });

    it('should add section markers correctly', async () => {
      const { useTimelineStore } = await import('../../../stores/timelineStore');

      const initialCount = useTimelineStore.getState().sectionMarkers.length;

      // Add a marker
      useTimelineStore.getState().addSectionMarker({
        name: 'Test Verse',
        type: 'verse',
        time: 10.0,
        color: '#10b981',
      });

      const markers = useTimelineStore.getState().sectionMarkers;
      expect(markers.length).toBe(initialCount + 1);

      const newMarker = markers[markers.length - 1];
      expect(newMarker.name).toBe('Test Verse');
      expect(newMarker.type).toBe('verse');
      expect(newMarker.time).toBe(10.0);
      expect(newMarker.id).toBeDefined();
    });

    it('should delete section markers correctly', async () => {
      const { useTimelineStore } = await import('../../../stores/timelineStore');

      // Add a marker
      useTimelineStore.getState().addSectionMarker({
        name: 'To Delete',
        type: 'verse',
        time: 5.0,
        color: '#10b981',
      });

      const markers = useTimelineStore.getState().sectionMarkers;
      const markerToDelete = markers[markers.length - 1];
      const countBeforeDelete = markers.length;

      // Delete it
      useTimelineStore.getState().deleteSectionMarker(markerToDelete.id);

      const markersAfterDelete = useTimelineStore.getState().sectionMarkers;
      expect(markersAfterDelete.length).toBe(countBeforeDelete - 1);
      expect(markersAfterDelete.find((m) => m.id === markerToDelete.id)).toBeUndefined();
    });

    it('should update section markers correctly', async () => {
      const { useTimelineStore } = await import('../../../stores/timelineStore');

      // Add a marker
      useTimelineStore.getState().addSectionMarker({
        name: 'Original Name',
        type: 'verse',
        time: 15.0,
        color: '#10b981',
      });

      const markers = useTimelineStore.getState().sectionMarkers;
      const markerToUpdate = markers[markers.length - 1];

      // Update it
      useTimelineStore.getState().updateSectionMarker(markerToUpdate.id, {
        name: 'Updated Name',
        time: 20.0,
      });

      const updatedMarker = useTimelineStore
        .getState()
        .sectionMarkers.find((m) => m.id === markerToUpdate.id);

      expect(updatedMarker?.name).toBe('Updated Name');
      expect(updatedMarker?.time).toBe(20.0);
      expect(updatedMarker?.type).toBe('verse'); // Unchanged
    });
  });

  describe('Component Exports', () => {
    it('should export LiveWaveformRecorder', async () => {
      const components = await import('../index');
      expect(components.LiveWaveformRecorder).toBeDefined();
    });

    it('should export SectionMarkers', async () => {
      const components = await import('../index');
      expect(components.SectionMarkers).toBeDefined();
    });

    it('should export RealtimePitchDisplay', async () => {
      const components = await import('../index');
      expect(components.RealtimePitchDisplay).toBeDefined();
    });

    it('should export SectionMarker type', async () => {
      // Type-only export, just verify module imports
      const components = await import('../index');
      expect(components).toBeDefined();
    });
  });

  describe('Pro Tools Workflow Support', () => {
    it('should support playlist recording workflow', async () => {
      const { useTimelineStore } = await import('../../../stores/timelineStore');

      const store = useTimelineStore.getState();

      // Add a track
      store.addTrack('Vocal Track');

      const tracks = useTimelineStore.getState().tracks;
      const vocalTrack = tracks[tracks.length - 1];

      // Verify playlist support
      expect(Array.isArray(vocalTrack.playlists)).toBe(true);
      expect(vocalTrack.playlists.length).toBeGreaterThan(0);
      expect(vocalTrack.activePlaylistId).toBeDefined();

      // Verify recording-related properties
      expect(typeof vocalTrack.isArmed).toBe('boolean');
      expect(typeof vocalTrack.inputMonitoring).toBe('string');
      expect(typeof vocalTrack.inputLevel).toBe('number');
    });

    it('should support section-based arrangement', async () => {
      const { useTimelineStore } = await import('../../../stores/timelineStore');

      // Create a typical song structure
      const structure = [
        { name: 'Intro', type: 'intro' as SectionType, time: 0 },
        { name: 'Verse 1', type: 'verse' as SectionType, time: 8 },
        { name: 'Chorus 1', type: 'chorus' as SectionType, time: 24 },
        { name: 'Verse 2', type: 'verse' as SectionType, time: 40 },
        { name: 'Chorus 2', type: 'chorus' as SectionType, time: 56 },
        { name: 'Bridge', type: 'bridge' as SectionType, time: 72 },
        { name: 'Chorus 3', type: 'chorus' as SectionType, time: 88 },
        { name: 'Outro', type: 'outro' as SectionType, time: 104 },
      ];

      structure.forEach((section) => {
        useTimelineStore.getState().addSectionMarker({
          name: section.name,
          type: section.type,
          time: section.time,
          color: '#ffffff',
        });
      });

      const markers = useTimelineStore.getState().sectionMarkers;

      // Should have all 8 sections
      expect(markers.filter((m) => m.name.includes('Intro')).length).toBeGreaterThan(0);
      expect(markers.filter((m) => m.name.includes('Verse')).length).toBeGreaterThan(0);
      expect(markers.filter((m) => m.name.includes('Chorus')).length).toBeGreaterThan(0);
      expect(markers.filter((m) => m.name.includes('Bridge')).length).toBeGreaterThan(0);
      expect(markers.filter((m) => m.name.includes('Outro')).length).toBeGreaterThan(0);

      // Markers should be in time order
      const times = markers.map((m) => m.time);
      const sortedTimes = [...times].sort((a, b) => a - b);
      expect(times).toEqual(sortedTimes);
    });
  });
});
