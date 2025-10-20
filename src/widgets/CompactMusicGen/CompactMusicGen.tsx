'use client';

import { useState } from 'react';
import { Wand2 } from 'lucide-react';
import styles from './CompactMusicGen.module.css';

import { logger } from '$lib/utils/logger';
interface CompactMusicGenProps {
  onGenerate?: (params: { genre: string; mood: string; duration: number }) => void;
}

export function CompactMusicGen({ onGenerate }: CompactMusicGenProps) {
  const [genre, setGenre] = useState('country');
  const [mood, setMood] = useState('upbeat');
  const [duration, setDuration] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'text',
          description: `${mood} ${genre} instrumental`,
          duration,
          model: 'medium',
        }),
      });

      const data = await response.json();

      if (onGenerate) {
        onGenerate({ genre, mood, duration });
      }

      if (data.audioUrl) {
        // Auto-import to track (would need useTrackStore integration)
        logger.info('Generated:', data.audioUrl);
      }
    } catch (error) {
      logger.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Wand2 size={14} />
        <span>AI Music</span>
      </div>

      <div className={styles.controls}>
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className={styles.select}
          disabled={isGenerating}
        >
          <option value="country">Country</option>
          <option value="rock">Rock</option>
          <option value="pop">Pop</option>
          <option value="jazz">Jazz</option>
        </select>

        <select
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          className={styles.select}
          disabled={isGenerating}
        >
          <option value="upbeat">Upbeat</option>
          <option value="melancholic">Sad</option>
          <option value="energetic">Energy</option>
          <option value="relaxed">Chill</option>
        </select>

        <input
          type="range"
          min="10"
          max="60"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className={styles.slider}
          disabled={isGenerating}
        />
        <span className={styles.duration}>{duration}s</span>
      </div>

      <button
        className={styles.generateBtn}
        onClick={handleGenerate}
        disabled={isGenerating}
      >
        {isGenerating ? 'Generating...' : 'Generate'}
      </button>
    </div>
  );
}
