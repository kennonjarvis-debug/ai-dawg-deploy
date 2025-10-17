/**
 * LayoutManager Widget
 * Instance 4 (Data & Storage) - UI for managing layouts
 * Save, load, switch between different workspace layouts
 */

'use client';

import { useState } from 'react';
import { useLayout } from '@/src/hooks/useLayout';
import { Settings, Save, Upload, Download, Trash2, Plus, Check } from 'lucide-react';
import styles from './LayoutManager.module.css';

interface LayoutManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LayoutManager({ isOpen, onClose }: LayoutManagerProps) {
  const {
    layout,
    layouts,
    loading,
    saving,
    createLayout,
    switchLayout,
    deleteLayout,
    exportLayout,
    importLayout,
    resetToDefault,
  } = useLayout();

  const [showNewLayout, setShowNewLayout] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);

  const handleCreateLayout = async () => {
    if (!newLayoutName.trim()) return;

    await createLayout(newLayoutName.trim());
    setNewLayoutName('');
    setShowNewLayout(false);
  };

  const handleImport = async () => {
    if (!importFile) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const jsonData = e.target?.result as string;
      await importLayout(jsonData);
      setImportFile(null);
    };
    reader.readAsText(importFile);
  };

  const handleDelete = async (layoutId: string) => {
    if (confirm('Delete this layout? This cannot be undone.')) {
      await deleteLayout(layoutId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <Settings size={20} />
            <h2 className={styles.title}>Layout Manager</h2>
          </div>
          <button onClick={onClose} className={styles.closeButton} aria-label="Close">
            ✕
          </button>
        </div>

        {saving && (
          <div className={styles.savingIndicator}>
            <div className={styles.spinner} />
            Saving layout...
          </div>
        )}

        <div className={styles.content}>
          {/* Current Layout Info */}
          <div className={styles.currentLayout}>
            <div className={styles.currentLayoutHeader}>
              <span className={styles.currentLabel}>Current Layout:</span>
              <span className={styles.currentName}>{layout?.name || 'Default'}</span>
            </div>
            <div className={styles.currentStats}>
              <span>Sidebar: {layout?.sidebar.width}px</span>
              <span>Tracks: {layout?.mainContent.tracksHeight}%</span>
              <span>Widgets: {layout?.bottomWidgets.columns} cols</span>
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button onClick={() => setShowNewLayout(true)} className={styles.actionButton}>
              <Plus size={16} />
              Save As New
            </button>
            <button onClick={exportLayout} className={styles.actionButton}>
              <Download size={16} />
              Export
            </button>
            <button onClick={resetToDefault} className={styles.actionButton}>
              <Settings size={16} />
              Reset to Default
            </button>
          </div>

          {/* New Layout Form */}
          {showNewLayout && (
            <div className={styles.newLayoutForm}>
              <input
                type="text"
                value={newLayoutName}
                onChange={(e) => setNewLayoutName(e.target.value)}
                placeholder="Layout name..."
                className={styles.input}
                autoFocus
              />
              <div className={styles.formActions}>
                <button onClick={() => setShowNewLayout(false)} className={styles.cancelButton}>
                  Cancel
                </button>
                <button onClick={handleCreateLayout} className={styles.saveButton}>
                  <Save size={14} />
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Import Section */}
          <div className={styles.importSection}>
            <h3 className={styles.sectionTitle}>Import Layout</h3>
            <div className={styles.importForm}>
              <input
                type="file"
                accept=".json"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className={styles.fileInput}
              />
              {importFile && (
                <button onClick={handleImport} className={styles.importButton}>
                  <Upload size={14} />
                  Import {importFile.name}
                </button>
              )}
            </div>
          </div>

          {/* Saved Layouts List */}
          <div className={styles.layoutsList}>
            <h3 className={styles.sectionTitle}>Saved Layouts ({layouts.length})</h3>
            {loading ? (
              <div className={styles.loading}>Loading layouts...</div>
            ) : layouts.length === 0 ? (
              <div className={styles.empty}>No saved layouts</div>
            ) : (
              <div className={styles.layoutsGrid}>
                {layouts.map((l) => (
                  <div
                    key={l.layoutId}
                    className={`${styles.layoutCard} ${
                      l.layoutId === layout?.layoutId ? styles.layoutCardActive : ''
                    }`}
                  >
                    <div className={styles.layoutCardHeader}>
                      <div className={styles.layoutCardTitle}>
                        {l.name}
                        {l.layoutId === layout?.layoutId && (
                          <Check size={14} className={styles.activeIcon} />
                        )}
                      </div>
                      {!l.isDefault && (
                        <button
                          onClick={() => handleDelete(l.layoutId)}
                          className={styles.deleteButton}
                          aria-label="Delete layout"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className={styles.layoutCardMeta}>
                      <span className={styles.layoutDate}>
                        {new Date(l.updatedAt).toLocaleDateString()}
                      </span>
                      {l.isDefault && <span className={styles.defaultBadge}>Default</span>}
                    </div>
                    {l.layoutId !== layout?.layoutId && (
                      <button
                        onClick={() => switchLayout(l.layoutId)}
                        className={styles.loadButton}
                      >
                        Load Layout
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <span className={styles.footerText}>
            Layout auto-saves when you resize panels or move widgets
          </span>
        </div>
      </div>
    </div>
  );
}
