/**
 * SongStructureBuilder Widget
 * Drag-and-drop timeline for arranging song structure
 * Visualizes verse/chorus/bridge arrangement
 */

'use client';

import { useState } from 'react';
import { Plus, Trash2, Play, Clock, Grid } from 'lucide-react';
import styles from './SongStructureBuilder.module.css';

interface Section {
  id: string;
  type: 'intro' | 'verse' | 'chorus' | 'pre-chorus' | 'bridge' | 'outro' | 'instrumental';
  label: string;
  duration: number; // in seconds
  order: number;
}

interface SongStructureBuilderProps {
  initialStructure?: Section[];
  bpm?: number;
  onExportToRecording?: (structure: Section[]) => void;
  onSave?: (structure: Section[]) => void;
}

const sectionColors = {
  intro: '#6366f1',
  verse: '#00e5ff',
  chorus: '#10b981',
  'pre-chorus': '#a855f7',
  bridge: '#f59e0b',
  instrumental: '#3b82f6',
  outro: '#ef4444',
};

const sectionTemplates = [
  { label: 'Classic Pop', structure: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro'] },
  { label: 'Country Ballad', structure: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'chorus'] },
  { label: 'Simple Song', structure: ['verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus'] },
  { label: 'Alt Structure', structure: ['verse', 'verse', 'chorus', 'verse', 'bridge', 'chorus', 'outro'] },
];

export function SongStructureBuilder({
  initialStructure = [],
  bpm = 120,
  onExportToRecording,
  onSave,
}: SongStructureBuilderProps) {
  const [structure, setStructure] = useState<Section[]>(
    initialStructure.length > 0
      ? initialStructure
      : [
          { id: 'section-1', type: 'verse', label: 'Verse 1', duration: 16, order: 0 },
          { id: 'section-2', type: 'chorus', label: 'Chorus', duration: 12, order: 1 },
        ]
  );

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  const getTotalDuration = () => {
    return structure.reduce((total, section) => total + section.duration, 0);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const addSection = (type: Section['type']) => {
    const sameSections = structure.filter((s) => s.type === type);
    const label = type === 'chorus' || type === 'bridge' || type === 'intro' || type === 'outro'
      ? type.charAt(0).toUpperCase() + type.slice(1)
      : `${type.charAt(0).toUpperCase() + type.slice(1)} ${sameSections.length + 1}`;

    const defaultDurations = {
      intro: 8,
      verse: 16,
      chorus: 12,
      'pre-chorus': 8,
      bridge: 16,
      instrumental: 16,
      outro: 12,
    };

    const newSection: Section = {
      id: `section-${Date.now()}`,
      type,
      label,
      duration: defaultDurations[type],
      order: structure.length,
    };

    setStructure([...structure, newSection]);
  };

  const deleteSection = (id: string) => {
    setStructure(structure.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i })));
  };

  const updateSection = (id: string, updates: Partial<Section>) => {
    setStructure(structure.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newStructure = [...structure];
    const [draggedItem] = newStructure.splice(draggedIndex, 1);
    newStructure.splice(index, 0, draggedItem);

    setStructure(newStructure.map((s, i) => ({ ...s, order: i })));
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const loadTemplate = (templateStructure: string[]) => {
    const newStructure: Section[] = templateStructure.map((type, index) => {
      const sameSections = templateStructure.slice(0, index + 1).filter((t) => t === type);
      const label = type === 'chorus' || type === 'bridge' || type === 'intro' || type === 'outro'
        ? type.charAt(0).toUpperCase() + type.slice(1)
        : `${type.charAt(0).toUpperCase() + type.slice(1)} ${sameSections.length}`;

      const defaultDurations: Record<string, number> = {
        intro: 8,
        verse: 16,
        chorus: 12,
        'pre-chorus': 8,
        bridge: 16,
        instrumental: 16,
        outro: 12,
      };

      return {
        id: `section-${Date.now()}-${index}`,
        type: type as Section['type'],
        label,
        duration: defaultDurations[type] || 16,
        order: index,
      };
    });

    setStructure(newStructure);
  };

  const selectedSection = structure.find((s) => s.id === selectedSectionId);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>Song Structure</h2>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <Clock size={14} />
              <span>{formatTime(getTotalDuration())}</span>
            </div>
            <div className={styles.stat}>
              <Grid size={14} />
              <span>{structure.length} sections</span>
            </div>
          </div>
        </div>
        <div className={styles.headerActions}>
          {onSave && (
            <button className={styles.saveButton} onClick={() => onSave(structure)}>
              Save
            </button>
          )}
          {onExportToRecording && (
            <button className={styles.exportButton} onClick={() => onExportToRecording(structure)}>
              <Play size={16} />
              Export to Recording
            </button>
          )}
        </div>
      </div>

      {/* Templates */}
      <div className={styles.templates}>
        <span className={styles.templatesLabel}>Templates:</span>
        {sectionTemplates.map((template) => (
          <button
            key={template.label}
            className={styles.templateButton}
            onClick={() => loadTemplate(template.structure)}
          >
            {template.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className={styles.timeline}>
        <div className={styles.timelineHeader}>
          <span className={styles.timelineTitle}>Arrangement</span>
          <span className={styles.timelineSubtitle}>Drag to reorder</span>
        </div>
        <div className={styles.sections}>
          {structure.map((section, index) => (
            <div
              key={section.id}
              className={`${styles.section} ${selectedSectionId === section.id ? styles.sectionSelected : ''}`}
              style={{ background: sectionColors[section.type] }}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => setSelectedSectionId(section.id)}
            >
              <div className={styles.sectionContent}>
                <span className={styles.sectionLabel}>{section.label}</span>
                <span className={styles.sectionDuration}>{formatTime(section.duration)}</span>
              </div>
              <button
                className={styles.deleteButton}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSection(section.id);
                }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Section Editor */}
      {selectedSection && (
        <div className={styles.editor}>
          <div className={styles.editorHeader}>
            <span className={styles.editorTitle}>Edit Section</span>
            <button
              className={styles.closeButton}
              onClick={() => setSelectedSectionId(null)}
            >
              ×
            </button>
          </div>
          <div className={styles.editorContent}>
            <div className={styles.field}>
              <label className={styles.label}>Label</label>
              <input
                type="text"
                className={styles.input}
                value={selectedSection.label}
                onChange={(e) => updateSection(selectedSection.id, { label: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Type</label>
              <select
                className={styles.select}
                value={selectedSection.type}
                onChange={(e) =>
                  updateSection(selectedSection.id, { type: e.target.value as Section['type'] })
                }
              >
                <option value="intro">Intro</option>
                <option value="verse">Verse</option>
                <option value="pre-chorus">Pre-Chorus</option>
                <option value="chorus">Chorus</option>
                <option value="bridge">Bridge</option>
                <option value="instrumental">Instrumental</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Duration (seconds)</label>
              <input
                type="number"
                className={styles.input}
                value={selectedSection.duration}
                onChange={(e) =>
                  updateSection(selectedSection.id, { duration: parseInt(e.target.value) || 0 })
                }
                min="1"
                max="120"
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Section Menu */}
      <div className={styles.addMenu}>
        <span className={styles.addMenuLabel}>Add Section:</span>
        <button className={styles.addButton} onClick={() => addSection('intro')}>
          <Plus size={14} />
          Intro
        </button>
        <button className={styles.addButton} onClick={() => addSection('verse')}>
          <Plus size={14} />
          Verse
        </button>
        <button className={styles.addButton} onClick={() => addSection('pre-chorus')}>
          <Plus size={14} />
          Pre-Chorus
        </button>
        <button className={styles.addButton} onClick={() => addSection('chorus')}>
          <Plus size={14} />
          Chorus
        </button>
        <button className={styles.addButton} onClick={() => addSection('bridge')}>
          <Plus size={14} />
          Bridge
        </button>
        <button className={styles.addButton} onClick={() => addSection('instrumental')}>
          <Plus size={14} />
          Instrumental
        </button>
        <button className={styles.addButton} onClick={() => addSection('outro')}>
          <Plus size={14} />
          Outro
        </button>
      </div>
    </div>
  );
}
