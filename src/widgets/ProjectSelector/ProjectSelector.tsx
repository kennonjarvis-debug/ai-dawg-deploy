/**
 * ProjectSelector Widget
 * Dropdown to switch between user's projects
 * Shows recent projects and new project option
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import styles from './ProjectSelector.module.css';

interface Project {
  id: string;
  name: string;
  updatedAt: string;
  bpm?: number;
  trackCount?: number;
}

interface ProjectSelectorProps {
  currentProjectId?: string;
  currentProjectName?: string;
  onProjectChange: (projectId: string) => void;
  onNewProject: () => void;
}

export function ProjectSelector({
  currentProjectId,
  currentProjectName,
  onProjectChange,
  onNewProject,
}: ProjectSelectorProps) {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  // Fetch user's projects
  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    const fetchProjects = async () => {
      try {
        setError(null);
        const response = await fetch('/api/projects/list');
        const data = await response.json();

        if (data.success) {
          setProjects(data.projects || []);
        } else {
          setError(data.error || 'Failed to load projects');
        }
      } catch (err) {
        console.error('Failed to fetch projects:', err);
        setError('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [session]);

  // Refresh projects when dropdown opens
  const handleToggleDropdown = async () => {
    if (!showDropdown && session) {
      // Refresh project list when opening
      try {
        const response = await fetch('/api/projects/list');
        const data = await response.json();
        if (data.success) {
          setProjects(data.projects || []);
        }
      } catch (err) {
        console.error('Failed to refresh projects:', err);
      }
    }
    setShowDropdown(!showDropdown);
  };

  if (!session) {
    return null; // Don't show if not authenticated
  }

  const displayName = currentProjectName || 'New Project';

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button
        onClick={handleToggleDropdown}
        className={styles.trigger}
        aria-label="Select project"
        aria-expanded={showDropdown}
        disabled={loading}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            d="M9 2H4a2 2 0 0 0-2 2v5m0 0a2 2 0 0 0 2 2h5m-7-2V4m14 0h-5a2 2 0 0 0-2 2v5m0 0a2 2 0 0 0 2 2h5m-7-2V4m0 14v-5m0 0a2 2 0 0 1 2-2h5m-7 7h5a2 2 0 0 0 2-2v-5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className={styles.projectName}>
          {loading ? 'Loading...' : displayName}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className={showDropdown ? styles.chevronUp : styles.chevronDown}
        >
          <path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {showDropdown && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span>Recent Projects</span>
            <span className={styles.count}>{projects.length}</span>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {projects.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No projects yet</p>
              <span>Create your first project below</span>
            </div>
          ) : (
            <div className={styles.projectList}>
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    onProjectChange(project.id);
                    setShowDropdown(false);
                  }}
                  className={
                    project.id === currentProjectId
                      ? styles.projectItemActive
                      : styles.projectItem
                  }
                >
                  <div className={styles.projectInfo}>
                    <span className={styles.projectItemName}>{project.name}</span>
                    <span className={styles.projectMeta}>
                      {new Date(project.updatedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      {project.bpm && ` • ${project.bpm} BPM`}
                    </span>
                  </div>
                  {project.id === currentProjectId && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className={styles.divider} />

          <button
            onClick={() => {
              onNewProject();
              setShowDropdown(false);
            }}
            className={styles.newProjectButton}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M12 5v14M5 12h14"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            New Project
          </button>
        </div>
      )}
    </div>
  );
}
