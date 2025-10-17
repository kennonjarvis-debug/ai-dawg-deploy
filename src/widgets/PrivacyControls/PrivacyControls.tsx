/**
 * PrivacyControls Widget
 * GDPR-compliant user data controls
 * Export, delete, and manage privacy settings
 * KAREN'S PRIVACY ENFORCEMENT UI 🔒
 */

'use client';

import { useState } from 'react';
import { useProfile } from '@/src/hooks/useProfile';
import { useSession, signOut } from 'next-auth/react';
import styles from './PrivacyControls.module.css';

interface PrivacyControlsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyControls({ isOpen, onClose }: PrivacyControlsProps) {
  const { data: session } = useSession();
  const { profile, exportData, deleteProfile, updateProfile } = useProfile();
  const [activeTab, setActiveTab] = useState<'consent' | 'data' | 'delete'>('consent');
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportData();
      alert('Profile data exported successfully!');
    } catch (err) {
      alert('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== 'DELETE_MY_DATA') {
      alert('Please type DELETE_MY_DATA exactly to confirm');
      return;
    }

    const finalConfirm = window.confirm(
      '⚠️ FINAL WARNING: This will permanently delete all your data. This cannot be undone. Are you absolutely sure?'
    );

    if (!finalConfirm) return;

    setDeleting(true);
    try {
      const success = await deleteProfile();
      if (success) {
        alert('Your data has been permanently deleted. You will now be signed out.');
        await signOut({ callbackUrl: '/' });
      }
    } catch (err) {
      alert('Failed to delete profile');
    } finally {
      setDeleting(false);
    }
  };

  const handleConsentChange = async (key: string, value: boolean) => {
    if (!profile) return;

    await updateProfile({
      privacyConsent: {
        ...profile.privacyConsent,
        [key]: value,
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Privacy & Data Controls</h2>
          <button onClick={onClose} className={styles.closeButton} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className={styles.tabs}>
          <button
            onClick={() => setActiveTab('consent')}
            className={activeTab === 'consent' ? styles.tabActive : styles.tab}
          >
            Privacy Settings
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={activeTab === 'data' ? styles.tabActive : styles.tab}
          >
            Your Data
          </button>
          <button
            onClick={() => setActiveTab('delete')}
            className={activeTab === 'delete' ? styles.tabActive : styles.tab}
          >
            Delete Account
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'consent' && (
            <div className={styles.section}>
              <div className={styles.infoBox}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <path d="M12 16v-4M12 8h.01" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <p>
                  Control how DAWG AI uses your data. You can change these settings at any time.
                </p>
              </div>

              <div className={styles.consentList}>
                <div className={styles.consentItem}>
                  <div className={styles.consentContent}>
                    <h4 className={styles.consentTitle}>Analytics & Performance Tracking</h4>
                    <p className={styles.consentDescription}>
                      Allow us to track your vocal performance metrics to provide personalized
                      coaching and show skill progression over time.
                    </p>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={profile?.privacyConsent.analytics ?? true}
                      onChange={(e) => handleConsentChange('analytics', e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.consentItem}>
                  <div className={styles.consentContent}>
                    <h4 className={styles.consentTitle}>AI Coaching Features</h4>
                    <p className={styles.consentDescription}>
                      Enable AI-powered vocal coaching, personalized recommendations, and real-time
                      feedback during recording sessions.
                    </p>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={profile?.privacyConsent.aiCoaching ?? true}
                      onChange={(e) => handleConsentChange('aiCoaching', e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.consentItem}>
                  <div className={styles.consentContent}>
                    <h4 className={styles.consentTitle}>Data Retention</h4>
                    <p className={styles.consentDescription}>
                      Keep your practice history, recordings, and progress data stored for future
                      sessions. Disable to auto-delete after 90 days.
                    </p>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={profile?.privacyConsent.dataRetention ?? true}
                      onChange={(e) => handleConsentChange('dataRetention', e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>

              <div className={styles.policyLink}>
                <a href="/docs/policies/privacy.md" target="_blank" rel="noopener noreferrer">
                  Read full Privacy Policy →
                </a>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className={styles.section}>
              <div className={styles.infoBox}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <polyline points="7 10 12 15 17 10" strokeWidth="2" strokeLinecap="round" />
                  <line x1="12" y1="15" x2="12" y2="3" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <p>Export all your data in JSON format. This includes your complete profile.</p>
              </div>

              <div className={styles.dataStats}>
                <div className={styles.dataStat}>
                  <span className={styles.dataLabel}>Practice Hours</span>
                  <span className={styles.dataValue}>{profile?.practiceHours || 0}</span>
                </div>
                <div className={styles.dataStat}>
                  <span className={styles.dataLabel}>Sessions Completed</span>
                  <span className={styles.dataValue}>{profile?.sessionsCompleted || 0}</span>
                </div>
                <div className={styles.dataStat}>
                  <span className={styles.dataLabel}>Recordings</span>
                  <span className={styles.dataValue}>{profile?.totalRecordings || 0}</span>
                </div>
              </div>

              <button onClick={handleExport} disabled={exporting} className={styles.exportButton}>
                {exporting ? (
                  <>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      className={styles.spinner}
                    >
                      <circle cx="12" cy="12" r="10" strokeWidth="3" opacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <polyline points="7 10 12 15 17 10" strokeWidth="2" strokeLinecap="round" />
                      <line x1="12" y1="15" x2="12" y2="3" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Download My Data
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'delete' && (
            <div className={styles.section}>
              <div className={styles.warningBox}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line x1="12" y1="9" x2="12" y2="13" strokeWidth="2" strokeLinecap="round" />
                  <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <div>
                  <h3>Danger Zone</h3>
                  <p>Permanently delete your account and all associated data. This cannot be undone.</p>
                </div>
              </div>

              <div className={styles.deleteInfo}>
                <h4>What will be deleted:</h4>
                <ul>
                  <li>Your complete profile and settings</li>
                  <li>All practice session history</li>
                  <li>All audio recordings</li>
                  <li>All skill progression data</li>
                  <li>Your user account</li>
                </ul>
              </div>

              <div className={styles.deleteForm}>
                <label className={styles.deleteLabel}>
                  Type <strong>DELETE_MY_DATA</strong> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE_MY_DATA"
                  className={styles.deleteInput}
                />
              </div>

              <button
                onClick={handleDelete}
                disabled={deleting || deleteConfirmText !== 'DELETE_MY_DATA'}
                className={styles.deleteButton}
              >
                {deleting ? 'Deleting...' : 'Permanently Delete My Account'}
              </button>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <span className={styles.footerText}>
            Last updated: {profile?.updatedAt ? new Date(profile.updatedAt).toLocaleString() : 'Never'}
          </span>
        </div>
      </div>
    </div>
  );
}
