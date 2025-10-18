import React, { useRef, useEffect, useState } from 'react';
import { useTimelineStore, useTransportStore } from '@/stores';
import { TimeRuler } from './TimeRuler';
import { Track } from './Track';
import { SectionMarkers } from './SectionMarkers';

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

  const { currentTime, isPlaying, isRecording, setCurrentTime } = useTransportStore();

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

  // Auto-scroll to follow playhead during playback and recording
  useEffect(() => {
    if (!isPlaying && !isRecording) return;

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
  }, [currentTime, isPlaying, isRecording, zoom, scrollPosition, viewportWidth, setScrollPosition]);

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

      {/* Timeline container */}
      <div className="flex-1 flex flex-col" style={{ overflow: 'hidden' }} ref={containerRef}>
        {/* Time Ruler - Always visible */}
        <div className="flex-shrink-0">
          <div className="flex">
            {/* Track name header spacer */}
            <div className="w-56 bg-bg-surface border-b border-border-base" />
            {/* Time ruler */}
            <div className="flex-1">
              <TimeRuler
                width={viewportWidth || 800}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
              />
            </div>
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

            {/* Empty state with timeline grid */}
            {tracks.length === 0 && (
              <div className="relative flex-1 flex items-center justify-center min-h-[200px]">
                {/* Timeline grid background */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="flex h-full">
                    {/* Track name area */}
                    <div className="w-56 bg-bg-surface border-r border-border-base" />
                    {/* Grid area */}
                    <div className="flex-1 relative" style={{ width: `${timelineWidth}px` }}>
                      {/* Vertical grid lines */}
                      {Array.from({ length: Math.ceil(30) }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute top-0 bottom-0 w-px bg-border-base/30"
                          style={{ left: `${i * zoom}px` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Empty state message */}
                <div className="relative z-10 text-center p-8 rounded-2xl bg-bg-surface/80 backdrop-blur-sm ring-1 ring-border-base">
                  <div className="text-text-muted text-sm font-medium">No tracks yet</div>
                  <div className="text-text-dim text-xs mt-1">Click "Add Track" to get started</div>
                </div>
              </div>
            )}
          </div>

          {/* Playhead - Professional cursor */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-20"
            style={{
              left: `${224 + (currentTime - scrollPosition) * zoom}px`,
              display:
                currentTime * zoom >= scrollPosition * zoom &&
                currentTime * zoom <= (scrollPosition + viewportWidth / zoom) * zoom
                  ? 'block'
                  : 'none',
            }}
          >
            {/* Playhead handle - Pro Tools style triangle */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0"
              style={{
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '8px solid #60a5fa',
                filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4))'
              }}
            />
            {/* Playhead line - Subtle and thin */}
            <div
              className="absolute top-10 w-px bg-blue-400/80"
              style={{
                left: '50%',
                transform: 'translateX(-50%)',
                height: 'calc(100% - 40px)',
                boxShadow: '0 0 4px rgba(96, 165, 250, 0.4)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
