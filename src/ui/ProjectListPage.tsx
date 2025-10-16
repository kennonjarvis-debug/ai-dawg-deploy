/**
 * Project List Page
 * Standalone page for displaying user's project list
 * Separated from DAWDashboard to avoid React hooks violations
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectList } from './components';
import { useAuth } from '../contexts/AuthContext';
import type { Project } from '../api/types';

export const ProjectListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleOpenProject = (project: Project) => {
    // Navigate to DAW with the selected project
    navigate(`/project/${project.id}`, { state: { project } });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <ProjectList
      onOpenProject={handleOpenProject}
      currentUser={user || undefined}
      onLogout={handleLogout}
    />
  );
};
