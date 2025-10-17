/**
 * ProjectSelector Example Widget
 * Copy-paste ready project selector dropdown
 *
 * Integration: Add to app/page.tsx header section
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import styles from './ProjectSelector.example.module.css';

interface Project {
  id: string;
  name: string;
  updatedAt: string;
}

interface ProjectSelectorProps {
  currentProjectId?: string;
  onProjectChange: (projectId: string) => void;
  onNewProject: () => void;
}

export function ProjectSelector({
  currentProjectId,
  onProjectChange,
  onNewProject,
}: ProjectSelectorProps) {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch user's projects
  useEffect(() => {
    if (!session) return;

    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects/list');
        const data = await response.json();

        if (data.success) {
          setProjects(data.projects);
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [session]);

  const currentProject = projects.find((p) => p.id === currentProjectId);

  if (!session) {
    return null; // Don't show if not authenticated
  }

  return (
    <div className={styles.container}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={styles.trigger}
        aria-label="Select project"
      >
        <span className={styles.projectName}>
          {loading ? 'Loading...' : currentProject?.name || 'New Project'}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            d="M6 9l6 6 6-6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {showDropdown && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span>Recent Projects</span>
          </div>

          {projects.length === 0 ? (
            <div className={styles.emptyState}>No projects yet</div>
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
                    <span className={styles.projectDate}>
                      {new Date(project.updatedAt).toLocaleDateString()}
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
