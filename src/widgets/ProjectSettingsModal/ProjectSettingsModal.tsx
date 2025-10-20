/**
 * ProjectSettingsModal Widget
 * Modal for editing project metadata (name, BPM, key, genre, description)
 * Saves changes to database via API
 */

'use client';

import { useState, useEffect } from 'react';
import styles from './ProjectSettingsModal.module.css';

import { logger } from '$lib/utils/logger';
interface Project {
  id: string;
  name: string;
  description?: string;
  bpm: number;
  genre?: string;
  key?: string;
  timeSignature?: string;
}

interface ProjectSettingsModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
}

export function ProjectSettingsModal({
  projectId,
  isOpen,
  onClose,
  onSave,
}: ProjectSettingsModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [bpm, setBpm] = useState(120);
  const [genre, setGenre] = useState('');
  const [key, setKey] = useState('');
  const [timeSignature, setTimeSignature] = useState('4/4');

  // Load project data
  useEffect(() => {
    if (!isOpen || !projectId) return;

    const loadProject = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/projects/load?projectId=${projectId}`);
        const data = await response.json();

        if (data.success && data.project) {
          setName(data.project.name || '');
          setDescription(data.project.description || '');
          setBpm(data.project.bpm || 120);
          setGenre(data.project.genre || '');
          setKey(data.project.key || '');
          setTimeSignature(data.project.settings?.timeSignature || '4/4');
        } else {
          setError(data.error || 'Failed to load project');
        }
      } catch (err) {
        logger.error('Failed to load project:', err);
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId, isOpen]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    if (bpm < 40 || bpm > 300) {
      setError('BPM must be between 40 and 300');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/projects/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          project: {
            name: name.trim(),
            description: description.trim() || undefined,
            bpm,
            genre: genre.trim() || undefined,
            key: key.trim() || undefined,
          },
          settings: {
            timeSignature,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSave({
          id: projectId,
          name: name.trim(),
          description: description.trim() || undefined,
          bpm,
          genre: genre.trim() || undefined,
          key: key.trim() || undefined,
          timeSignature,
        });
        onClose();
      } else {
        setError(data.error || 'Failed to save project');
      }
    } catch (err) {
      logger.error('Failed to save project:', err);
      setError('Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && e.metaKey) {
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Project Settings</h2>
          <button onClick={onClose} className={styles.closeButton} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading project settings...</div>
        ) : (
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
                autoFocus
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description or notes about this project"
                rows={3}
                className={styles.textarea}
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
                  <option value="4/4">4/4</option>
                  <option value="3/4">3/4</option>
                  <option value="6/8">6/8</option>
                  <option value="5/4">5/4</option>
                  <option value="7/8">7/8</option>
                </select>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="key">Key</label>
                <select
                  id="key"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className={styles.select}
                >
                  <option value="">Not set</option>
                  <option value="C">C Major</option>
                  <option value="C#">C# Major</option>
                  <option value="D">D Major</option>
                  <option value="Eb">Eb Major</option>
                  <option value="E">E Major</option>
                  <option value="F">F Major</option>
                  <option value="F#">F# Major</option>
                  <option value="G">G Major</option>
                  <option value="Ab">Ab Major</option>
                  <option value="A">A Major</option>
                  <option value="Bb">Bb Major</option>
                  <option value="B">B Major</option>
                  <option value="Am">A Minor</option>
                  <option value="Bbm">Bb Minor</option>
                  <option value="Bm">B Minor</option>
                  <option value="Cm">C Minor</option>
                  <option value="C#m">C# Minor</option>
                  <option value="Dm">D Minor</option>
                  <option value="Ebm">Eb Minor</option>
                  <option value="Em">E Minor</option>
                  <option value="Fm">F Minor</option>
                  <option value="F#m">F# Minor</option>
                  <option value="Gm">G Minor</option>
                  <option value="G#m">G# Minor</option>
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="genre">Genre</label>
                <select
                  id="genre"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className={styles.select}
                >
                  <option value="">Not set</option>
                  <option value="country">Country</option>
                  <option value="pop">Pop</option>
                  <option value="rock">Rock</option>
                  <option value="folk">Folk</option>
                  <option value="blues">Blues</option>
                  <option value="jazz">Jazz</option>
                  <option value="electronic">Electronic</option>
                  <option value="hip-hop">Hip Hop</option>
                  <option value="r&b">R&B</option>
                  <option value="indie">Indie</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className={styles.footer}>
          <button onClick={onClose} className={styles.cancelButton} disabled={saving}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={styles.saveButton}
            disabled={saving || loading}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className={styles.hint}>
          Press <kbd>Esc</kbd> to cancel, <kbd>⌘ Enter</kbd> to save
        </div>
      </div>
    </div>
  );
}
