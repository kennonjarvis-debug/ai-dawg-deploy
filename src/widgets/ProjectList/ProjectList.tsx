/**
 * ProjectList Widget
 * Grid view of user's projects with search, sort, and delete
 * Shows project metadata (BPM, tracks, last updated)
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import styles from './ProjectList.module.css';

import { logger } from '$lib/utils/logger';
interface Project {
  id: string;
  name: string;
  description?: string;
  bpm: number;
  genre?: string;
  key?: string;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string;
  isArchived: boolean;
}

interface ProjectListProps {
  onProjectSelect: (projectId: string) => void;
  onProjectDelete?: (projectId: string) => void;
  currentProjectId?: string;
}

export function ProjectList({
  onProjectSelect,
  onProjectDelete,
  currentProjectId,
}: ProjectListProps) {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'name'>('updated');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    fetchProjects();
  }, [session]);

  const fetchProjects = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await fetch('/api/projects/list');
      const data = await response.json();

      if (data.success) {
        setProjects(data.projects || []);
      } else {
        setError(data.error || 'Failed to load projects');
      }
    } catch (err) {
      logger.error('Failed to fetch projects:', err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    try {
      const response = await fetch('/api/projects/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      const data = await response.json();

      if (data.success) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        setDeleteConfirm(null);
        onProjectDelete?.(projectId);
      } else {
        setError(data.error || 'Failed to delete project');
      }
    } catch (err) {
      logger.error('Failed to delete project:', err);
      setError('Failed to delete project');
    }
  };

  // Filter and sort projects
  const filteredProjects = projects
    .filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.genre?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'updated':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

  if (!session) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <p>Sign in to view your projects</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading projects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          {error}
          <button onClick={fetchProjects} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>My Projects</h2>
        <div className={styles.controls}>
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={styles.sortSelect}
          >
            <option value="updated">Last Updated</option>
            <option value="created">Date Created</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className={styles.emptyState}>
          {searchQuery ? (
            <p>No projects match "{searchQuery}"</p>
          ) : (
            <>
              <p>No projects yet</p>
              <span>Create your first project to get started</span>
            </>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className={
                project.id === currentProjectId ? styles.projectCardActive : styles.projectCard
              }
            >
              <button
                onClick={() => onProjectSelect(project.id)}
                className={styles.projectCardContent}
              >
                <div className={styles.projectHeader}>
                  <h3 className={styles.projectName}>{project.name}</h3>
                  {project.id === currentProjectId && (
                    <span className={styles.currentBadge}>Current</span>
                  )}
                </div>

                {project.description && (
                  <p className={styles.projectDescription}>{project.description}</p>
                )}

                <div className={styles.projectMeta}>
                  <span className={styles.metaItem}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    {project.bpm} BPM
                  </span>
                  {project.genre && (
                    <span className={styles.metaItem}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M9 18V5l12-2v13M9 18c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm12-2c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {project.genre}
                    </span>
                  )}
                  {project.key && (
                    <span className={styles.metaItem}>♪ {project.key}</span>
                  )}
                </div>

                <div className={styles.projectFooter}>
                  <span className={styles.timestamp}>
                    Updated {new Date(project.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </button>

              {onProjectDelete && (
                <div className={styles.projectActions}>
                  {deleteConfirm === project.id ? (
                    <div className={styles.confirmDelete}>
                      <span>Delete?</span>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className={styles.confirmButton}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className={styles.cancelButton}
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(project.id)}
                      className={styles.deleteButton}
                      aria-label="Delete project"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
