import React, { useRef, useEffect, useState } from 'react';
import { useTimelineStore, useTransportStore } from '@/stores';
import { TimeRuler } from './TimeRuler';
import { Track } from './Track';
import { SectionMarkers } from './SectionMarkers';
import { ZoomIn, ZoomOut } from 'lucide-react';

export const Timeline: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(0);

  const {
    tracks,
    zoom,
    scrollPosition,
    selectedTrackIds,
    sectionMarkers,
    setZoom,
    setScrollPosition,
    setSelectedTracks,
    addSectionMarker,
    deleteSectionMarker,
    updateSectionMarker,
  } = useTimelineStore();

  const { currentTime, isPlaying, setCurrentTime } = useTransportStore();

  // Update viewport width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setViewportWidth(containerRef.current.clientWidth - 224); // Subtract track header width
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Auto-scroll to follow playhead
  useEffect(() => {
    if (!isPlaying) return;

    const playheadX = currentTime * zoom;
    const viewportEnd = scrollPosition + viewportWidth;

    // If playhead is approaching the right edge, scroll forward
    if (playheadX > viewportEnd - 100) {
      setScrollPosition(currentTime - viewportWidth / zoom + 2);
    }
    // If playhead is before the viewport, jump to it
    else if (playheadX < scrollPosition * zoom) {
      setScrollPosition(Math.max(0, currentTime - 2));
    }
  }, [currentTime, isPlaying, zoom, scrollPosition, viewportWidth, setScrollPosition]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    setScrollPosition(scrollLeft / zoom);
  };

  const handleZoomIn = () => {
    setZoom(zoom * 1.2);
  };

  const handleZoomOut = () => {
    setZoom(zoom / 1.2);
  };

  const handleTrackClick = (trackId: string) => {
    setSelectedTracks([trackId]);
  };

  // Calculate total timeline width (show at least 30 seconds or to the last clip)
  const maxClipEnd = tracks.reduce((max, track) => {
    const trackEnd = track.clips.reduce(
      (tMax, clip) => Math.max(tMax, clip.startTime + clip.duration),
      0
    );
    return Math.max(max, trackEnd);
  }, 0);
  const timelineWidth = Math.max(30, maxClipEnd + 10) * zoom;

  return (
    <div className="flex flex-col h-full bg-bg-base">
      {/* Section Markers */}
      <SectionMarkers
        markers={sectionMarkers}
        zoom={zoom}
        scrollPosition={scrollPosition}
        currentTime={currentTime}
        onAddMarker={addSectionMarker}
        onDeleteMarker={deleteSectionMarker}
        onUpdateMarker={updateSectionMarker}
        onSeekToMarker={(time) => setCurrentTime(time)}
      />

      {/* Toolbar */}
      <div className="h-12 bg-bg-surface border-b border-border-base flex items-center px-4 gap-4 shadow-lg">
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-bg-surface-hover rounded-lg transition-all ring-1 ring-border-base hover:ring-border-strong"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 text-text-muted" />
          </button>
          <div className="px-3 py-1.5 rounded-lg bg-bg-base ring-1 ring-border-base text-xs text-text-muted font-semibold min-w-[60px] text-center">
            {Math.round(zoom)}px/s
          </div>
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-bg-surface-hover rounded-lg transition-all ring-1 ring-border-base hover:ring-border-strong"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-bg-base ring-1 ring-border-base text-xs text-text-dim">
          {tracks.length} track{tracks.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Timeline container */}
      <div className="flex-1 flex flex-col" style={{ overflow: 'hidden' }} ref={containerRef}>
        {/* Time ruler */}
        <div className="flex">
          <div className="w-56 flex-shrink-0 bg-bg-surface border-r border-border-base" />
          <div className="flex-1 overflow-hidden">
            <TimeRuler width={viewportWidth} />
          </div>
        </div>

        {/* Tracks */}
        <div
          className="flex-1 flex overflow-auto scrollbar-thin scrollbar-thumb-bg-surface-hover scrollbar-track-transparent"
          onScroll={handleScroll}
          ref={contentRef}
        >
          <div className="flex flex-col" style={{ width: `${224 + timelineWidth}px` }}>
            {tracks.map((track) => (
              <Track
                key={track.id}
                track={track}
                isSelected={selectedTrackIds.includes(track.id)}
                onSelectTrack={() => handleTrackClick(track.id)}
              />
            ))}

            {/* Empty state */}
            {tracks.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center p-8 rounded-2xl bg-bg-surface ring-1 ring-border-base">
                  <div className="text-text-muted text-sm font-medium">No tracks yet</div>
                  <div className="text-text-dim text-xs mt-1">Click "Add Track" to get started</div>
                </div>
              </div>
            )}
          </div>

          {/* Playhead - Glowing red line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-20"
            style={{
              left: `${224 + (currentTime - scrollPosition) * zoom}px`,
              display:
                currentTime * zoom >= scrollPosition * zoom &&
                currentTime * zoom <= (scrollPosition + viewportWidth / zoom) * zoom
                  ? 'block'
                  : 'none',
              boxShadow: '0 0 10px rgba(239, 68, 68, 0.7), 0 0 20px rgba(239, 68, 68, 0.5)',
            }}
          >
            {/* Playhead handle */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500 rounded-sm shadow-lg ring-2 ring-white/50" />
          </div>
        </div>
      </div>
    </div>
  );
};
