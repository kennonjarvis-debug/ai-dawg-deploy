import React from 'react';
import { useTimelineStore } from '../../stores/timelineStore';
import { useTransportStore } from '../../stores/transportStore';

interface TimeRulerProps {
  width: number;
}

export const TimeRuler: React.FC<TimeRulerProps> = ({ width }) => {
  const { zoom, scrollPosition } = useTimelineStore();
  const { bpm, timeSignature } = useTransportStore();

  // Calculate time markers
  const getTimeMarkers = () => {
    const markers: { time: number; label: string; isMajor: boolean }[] = [];
    const secondsPerBeat = 60 / bpm;
    const secondsPerBar = secondsPerBeat * timeSignature.numerator;

    const startTime = scrollPosition;
    const endTime = startTime + width / zoom;

    // Determine marker interval based on zoom level
    let interval: number;
    let isMajorInterval: (time: number) => boolean;

    if (zoom > 100) {
      // Very zoomed in - show beat markers
      interval = secondsPerBeat;
      isMajorInterval = (time) => Math.abs((time / secondsPerBar) % 1) < 0.01;
    } else if (zoom > 40) {
      // Medium zoom - show bar markers
      interval = secondsPerBar;
      isMajorInterval = () => true;
    } else {
      // Zoomed out - show every 4 bars
      interval = secondsPerBar * 4;
      isMajorInterval = () => true;
    }

    let currentTime = Math.floor(startTime / interval) * interval;
    while (currentTime <= endTime) {
      if (currentTime >= 0) {
        const barNumber = Math.floor(currentTime / secondsPerBar) + 1;
        const beatInBar = Math.floor((currentTime % secondsPerBar) / secondsPerBeat) + 1;

        let label: string;
        if (zoom > 100) {
          // Show bar.beat format
          label = beatInBar === 1 ? `${barNumber}` : `${barNumber}.${beatInBar}`;
        } else {
          // Show just bar number
          label = `${barNumber}`;
        }

        markers.push({
          time: currentTime,
          label,
          isMajor: isMajorInterval(currentTime),
        });
      }
      currentTime += interval;
    }

    return markers;
  };

  const markers = getTimeMarkers();

  return (
    <div className="relative h-10 bg-black/40 backdrop-blur-md border-b border-white/10 select-none">
      {/* Time markers */}
      {markers.map((marker, index) => {
        const x = (marker.time - scrollPosition) * zoom;
        if (x < 0 || x > width) return null;

        return (
          <div
            key={index}
            className="absolute top-0 flex flex-col items-center"
            style={{ left: `${x}px` }}
          >
            {/* Tick mark */}
            <div
              className={`w-px ${
                marker.isMajor ? 'h-4 bg-blue-400/70' : 'h-2 bg-blue-400/30'
              }`}
            />
            {/* Label */}
            {marker.isMajor && (
              <div className="text-[10px] text-blue-300/80 mt-1 whitespace-nowrap font-medium">
                {marker.label}
              </div>
            )}
          </div>
        );
      })}

      {/* Minor gridlines for sub-beats */}
      {zoom > 100 && (
        <>
          {Array.from({ length: Math.ceil(width / zoom) * 4 }).map((_, i) => {
            const time = scrollPosition + (i * 60) / (bpm * 4);
            const x = (time - scrollPosition) * zoom;
            if (x < 0 || x > width) return null;

            return (
              <div
                key={`sub-${i}`}
                className="absolute top-0 w-px h-1.5 bg-white/10"
                style={{ left: `${x}px` }}
              />
            );
          })}
        </>
      )}
    </div>
  );
};
