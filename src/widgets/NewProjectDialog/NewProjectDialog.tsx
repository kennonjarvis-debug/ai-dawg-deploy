/**
 * NewProjectDialog Widget
 * Modal wizard for creating new projects
 * Collects name, BPM, genre, key, time signature
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import styles from './NewProjectDialog.module.css';

import { logger } from '$lib/utils/logger';
interface NewProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (project: NewProjectData) => void;
}

interface NewProjectData {
  name: string;
  bpm: number;
  genre: string;
  key: string;
  timeSignature: string;
}

const GENRES = [
  'Country',
  'Rock',
  'Pop',
  'Hip Hop',
  'R&B',
  'Blues',
  'Folk',
  'Indie',
  'Electronic',
  'Jazz',
  'Other',
];

const KEYS = [
  'C Major', 'C Minor', 'C# Major', 'C# Minor',
  'D Major', 'D Minor', 'D# Major', 'D# Minor',
  'E Major', 'E Minor', 'F Major', 'F Minor',
  'F# Major', 'F# Minor', 'G Major', 'G Minor',
  'G# Major', 'G# Minor', 'A Major', 'A Minor',
  'A# Major', 'A# Minor', 'B Major', 'B Minor',
];

const TIME_SIGNATURES = ['4/4', '3/4', '6/8', '2/4', '5/4'];

export function NewProjectDialog({ isOpen, onClose, onCreate }: NewProjectDialogProps) {
  const { data: session } = useSession();
  const [name, setName] = useState('');
  const [bpm, setBpm] = useState(120);
  const [genre, setGenre] = useState('Country');
  const [key, setKey] = useState('C Major');
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    if (bpm < 40 || bpm > 300) {
      setError('BPM must be between 40 and 300');
      return;
    }

    if (!session) {
      setError('You must be signed in to create a project');
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const response = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          bpm,
          genre,
          key,
          timeSignature,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      if (data.success) {
        onCreate({
          name: name.trim(),
          bpm,
          genre,
          key,
          timeSignature,
        });
        handleClose();
      }
    } catch (err: any) {
      logger.error('Failed to create project:', err);
      setError(err.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setName('');
    setBpm(120);
    setGenre('Country');
    setKey('C Major');
    setTimeSignature('4/4');
    setError(null);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    } else if (e.key === 'Enter' && e.metaKey) {
      handleCreate();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className={styles.header}>
          <h2 className={styles.title}>Create New Project</h2>
          <button onClick={handleClose} className={styles.closeButton} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label htmlFor="projectName">Project Name *</label>
            <input
              id="projectName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Song"
              className={styles.input}
              autoFocus
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="bpm">BPM *</label>
              <input
                id="bpm"
                type="number"
                value={bpm}
                onChange={(e) => setBpm(parseInt(e.target.value) || 120)}
                min={40}
                max={300}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="timeSignature">Time Signature</label>
              <select
                id="timeSignature"
                value={timeSignature}
                onChange={(e) => setTimeSignature(e.target.value)}
                className={styles.select}
              >
                {TIME_SIGNATURES.map((ts) => (
                  <option key={ts} value={ts}>
                    {ts}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="genre">Genre</label>
              <select
                id="genre"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className={styles.select}
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="key">Key</label>
              <select
                id="key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className={styles.select}
              >
                {KEYS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.hint}>
            All settings can be changed later in Project Settings
          </div>
        </div>

        <div className={styles.footer}>
          <button onClick={handleClose} className={styles.cancelButton} disabled={creating}>
            Cancel
          </button>
          <button onClick={handleCreate} className={styles.createButton} disabled={creating}>
            {creating ? 'Creating...' : 'Create Project'}
          </button>
        </div>

        <div className={styles.keyboardHints}>
          Press <kbd>Esc</kbd> to cancel, <kbd>⌘ Enter</kbd> to create
        </div>
      </div>
    </div>
  );
}
