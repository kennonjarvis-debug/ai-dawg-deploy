'use client';

import { FC } from 'react';
import { Plus } from 'lucide-react';
import { TrackItem } from '../TrackItem/TrackItem';
import { useTrackStore } from '@/src/core/store';
import styles from './TrackList.module.css';

interface TrackListProps {
  className?: string;
}

/**
 * TrackList Component
 * Container for displaying and managing all tracks
 */
export const TrackList: FC<TrackListProps> = ({ className }) => {
  const { tracks, activeTrackId, setActiveTrack, addTrack } = useTrackStore();

  const handleAddTrack = () => {
    addTrack('audio');
  };

  return (
    <div className={`${styles.trackList} ${className || ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>Tracks</h3>
        <button
          className="btn btn-icon btn-icon-sm"
          onClick={handleAddTrack}
          title="Add Track"
        >
          <Plus style={{ width: '16px', height: '16px' }} />
        </button>
      </div>

      {/* Track Items */}
      <div className={styles.trackItems}>
        {tracks.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🎵</div>
            <div className={styles.emptyText}>No tracks yet</div>
            <button className="btn btn-text" onClick={handleAddTrack}>
              <Plus style={{ width: '16px', height: '16px' }} />
              <span>Add your first track</span>
            </button>
          </div>
        ) : (
          tracks.map((track) => (
            <TrackItem
              key={track.id}
              track={track}
              isActive={track.id === activeTrackId}
              onSelect={() => setActiveTrack(track.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};
