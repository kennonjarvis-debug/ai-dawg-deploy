/**
 * LyricWorkspace Widget
 * Collaborative lyric editor with AI suggestions
 * Supports verse/chorus/bridge structure with rhyme highlighting
 */

'use client';

import { useState } from 'react';
import { Plus, Trash2, Sparkles, Copy, Download } from 'lucide-react';
import styles from './LyricWorkspace.module.css';

import { logger } from '$lib/utils/logger';
interface LyricSection {
  id: string;
  type: 'verse' | 'chorus' | 'bridge' | 'pre-chorus' | 'outro';
  content: string;
  order: number;
}

interface LyricWorkspaceProps {
  initialSections?: LyricSection[];
  onSuggestTheme?: () => Promise<string>;
  onSuggestLine?: (currentSection: string) => Promise<string>;
  onSave?: (sections: LyricSection[]) => void;
  onExport?: (sections: LyricSection[]) => void;
}

const sectionColors = {
  verse: '#00e5ff',
  chorus: '#10b981',
  bridge: '#f59e0b',
  'pre-chorus': '#a855f7',
  outro: '#ef4444',
};

const sectionLabels = {
  verse: 'Verse',
  chorus: 'Chorus',
  bridge: 'Bridge',
  'pre-chorus': 'Pre-Chorus',
  outro: 'Outro',
};

export function LyricWorkspace({
  initialSections = [],
  onSuggestTheme,
  onSuggestLine,
  onSave,
  onExport,
}: LyricWorkspaceProps) {
  const [sections, setSections] = useState<LyricSection[]>(
    initialSections.length > 0
      ? initialSections
      : [
          {
            id: 'section-1',
            type: 'verse',
            content: '',
            order: 0,
          },
        ]
  );

  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  const addSection = (type: LyricSection['type']) => {
    const newSection: LyricSection = {
      id: `section-${Date.now()}`,
      type,
      content: '',
      order: sections.length,
    };
    setSections([...sections, newSection]);
  };

  const updateSection = (id: string, content: string) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, content } : s)));
  };

  const deleteSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id));
  };

  const duplicateSection = (id: string) => {
    const section = sections.find((s) => s.id === id);
    if (!section) return;

    const newSection: LyricSection = {
      ...section,
      id: `section-${Date.now()}`,
      order: sections.length,
    };
    setSections([...sections, newSection]);
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const index = sections.findIndex((s) => s.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sections.length - 1) return;

    const newSections = [...sections];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newSections[index], newSections[swapIndex]] = [newSections[swapIndex], newSections[index]];
    setSections(newSections.map((s, i) => ({ ...s, order: i })));
  };

  const handleAiSuggestion = async (sectionId: string) => {
    setLoadingSuggestion(true);
    setSelectedSectionId(sectionId);

    try {
      const section = sections.find((s) => s.id === sectionId);
      if (section && onSuggestLine) {
        const suggestion = await onSuggestLine(section.content);
        setAiSuggestion(suggestion);
      } else {
        // Mock suggestion
        const mockSuggestions = [
          "Lost love on a dusty backroad\nMemories fade like an old radio\nWhiskey and tears on a Saturday night\nTrying to forget what felt so right",
          "Hometown heartbreak, nothing new\nSmall town lights remind me of you\nEvery corner holds a memory\nOf what we used to be",
          "Thunder rolls across the plains\nLike the echoes of your name\nI'm holding on to yesterday\nWhile you're miles away",
        ];
        const random = mockSuggestions[Math.floor(Math.random() * mockSuggestions.length)];
        setAiSuggestion(random);
      }
    } catch (error) {
      logger.error('Failed to get AI suggestion:', error);
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const applySuggestion = () => {
    if (selectedSectionId && aiSuggestion) {
      updateSection(selectedSectionId, aiSuggestion);
      setAiSuggestion('');
      setSelectedSectionId(null);
    }
  };

  const handleExport = () => {
    if (onExport) {
      onExport(sections);
    } else {
      // Default export as text
      const text = sections
        .map((s) => `[${sectionLabels[s.type]}]\n${s.content}\n`)
        .join('\n');
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'lyrics.txt';
      a.click();
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Lyric Workspace</h2>
        <div className={styles.headerActions}>
          {onSave && (
            <button className={styles.saveButton} onClick={() => onSave(sections)}>
              Save
            </button>
          )}
          <button className={styles.exportButton} onClick={handleExport}>
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* AI Suggestion Panel */}
      {aiSuggestion && (
        <div className={styles.suggestionPanel}>
          <div className={styles.suggestionHeader}>
            <Sparkles size={16} />
            <span>AI Suggestion</span>
          </div>
          <pre className={styles.suggestionText}>{aiSuggestion}</pre>
          <div className={styles.suggestionActions}>
            <button className={styles.applyButton} onClick={applySuggestion}>
              Apply Suggestion
            </button>
            <button className={styles.dismissButton} onClick={() => setAiSuggestion('')}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Sections */}
      <div className={styles.sections}>
        {sections.map((section, index) => (
          <div
            key={section.id}
            className={styles.section}
            style={{ borderLeftColor: sectionColors[section.type] }}
          >
            <div className={styles.sectionHeader}>
              <select
                className={styles.sectionType}
                value={section.type}
                onChange={(e) =>
                  setSections(
                    sections.map((s) =>
                      s.id === section.id
                        ? { ...s, type: e.target.value as LyricSection['type'] }
                        : s
                    )
                  )
                }
                style={{ color: sectionColors[section.type] }}
              >
                <option value="verse">Verse {sections.filter(s => s.type === 'verse').indexOf(section) + 1}</option>
                <option value="chorus">Chorus</option>
                <option value="pre-chorus">Pre-Chorus</option>
                <option value="bridge">Bridge</option>
                <option value="outro">Outro</option>
              </select>

              <div className={styles.sectionActions}>
                <button
                  className={styles.iconButton}
                  onClick={() => moveSection(section.id, 'up')}
                  disabled={index === 0}
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => moveSection(section.id, 'down')}
                  disabled={index === sections.length - 1}
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => duplicateSection(section.id)}
                  title="Duplicate"
                >
                  <Copy size={14} />
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => handleAiSuggestion(section.id)}
                  disabled={loadingSuggestion}
                  title="Get AI suggestion"
                >
                  <Sparkles size={14} />
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => deleteSection(section.id)}
                  disabled={sections.length === 1}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <textarea
              className={styles.textarea}
              value={section.content}
              onChange={(e) => updateSection(section.id, e.target.value)}
              placeholder={`Write your ${sectionLabels[section.type].toLowerCase()} here...\n\nExample:\nLost love on a dusty backroad\nMemories fade like an old radio`}
              rows={6}
            />

            <div className={styles.sectionFooter}>
              <span className={styles.lineCount}>
                {section.content.split('\n').filter((l) => l.trim()).length} lines
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Section Menu */}
      <div className={styles.addSectionMenu}>
        <button className={styles.addButton} onClick={() => addSection('verse')}>
          <Plus size={16} />
          Verse
        </button>
        <button className={styles.addButton} onClick={() => addSection('chorus')}>
          <Plus size={16} />
          Chorus
        </button>
        <button className={styles.addButton} onClick={() => addSection('pre-chorus')}>
          <Plus size={16} />
          Pre-Chorus
        </button>
        <button className={styles.addButton} onClick={() => addSection('bridge')}>
          <Plus size={16} />
          Bridge
        </button>
        <button className={styles.addButton} onClick={() => addSection('outro')}>
          <Plus size={16} />
          Outro
        </button>
      </div>
    </div>
  );
}
