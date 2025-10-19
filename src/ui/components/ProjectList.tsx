import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, FolderOpen, LogOut } from 'lucide-react';
import { ProjectCard } from './ProjectCard';
import { CreateProjectModal } from './CreateProjectModal';
import { apiClient } from '../../api';
import type { Project, CreateProjectRequest, User } from '../../api/types';

interface ProjectListProps {
  onOpenProject: (project: Project) => void;
  currentUser?: User;
  onLogout?: () => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ onOpenProject, currentUser, onLogout }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [planLimits, setPlanLimits] = useState<{ plan: string; maxProjects: number } | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  useEffect(() => {
    loadProjects();
    loadEntitlements();
  }, []);

  const loadEntitlements = async () => {
    try {
      const entitlements = await apiClient.getEntitlements();
      // Map plan to project limits
      const limits = {
        FREE: 2,
        BASIC: 10,
        PRO: 100,
        ENTERPRISE: 1000,
      };
      setPlanLimits({
        plan: entitlements.plan,
        maxProjects: limits[entitlements.plan as keyof typeof limits] || 2,
      });
    } catch (err) {
      console.warn('Backend not available, using demo entitlements:', err);
      // Fallback to PRO plan in demo mode
      setPlanLimits({
        plan: 'PRO',
        maxProjects: 100,
      });
    }
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      // Demo mode: Use mock projects
      const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
      if (isDemoMode) {
        const mockProjects: Project[] = [
          {
            id: 'demo-project-1',
            name: 'Demo Song - Electronic Dance',
            description: 'A demo project showcasing the DAWG AI features',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: 'demo-user',
            settings: { tempo: 128, timeSignature: '4/4', key: 'C' },
          },
          {
            id: 'demo-project-2',
            name: 'Demo Song - Hip Hop Beat',
            description: 'Another demo project with hip hop vibes',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: 'demo-user',
            settings: { tempo: 90, timeSignature: '4/4', key: 'Am' },
          },
        ];
        setProjects(mockProjects);
        setLoading(false);
        return;
      }

      const response = await apiClient.listProjects({ limit: 50 });
      setProjects(response.projects);
    } catch (err: any) {
      console.warn('Backend not available, using demo projects:', err);
      // Fallback to empty projects in case of error
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (data: CreateProjectRequest) => {
    try {
      const newProject = await apiClient.createProject(data);
      setProjects([newProject, ...projects]);
      onOpenProject(newProject);
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
      console.error('Failed to create project:', err);
    }
  };

  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      await apiClient.deleteProject(projectToDelete.id);
      setProjects(projects.filter((p) => p.id !== projectToDelete.id));
      setProjectToDelete(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete project');
      console.error('Failed to delete project:', err);
      setProjectToDelete(null);
    }
  };

  const handleNewProjectClick = () => {
    // Check if user has reached project limit
    // Default to FREE plan limits (2 projects) if not loaded yet
    const maxProjects = planLimits?.maxProjects || 2;
    const currentPlan = planLimits?.plan || 'FREE';

    if (projects.length >= maxProjects) {
      setShowLimitModal(true);
      return;
    }
    setIsCreateModalOpen(true);
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-r from-daw-surface/60 to-daw-bg/60 backdrop-blur-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <FolderOpen className="w-7 h-7 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Projects</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  {currentUser && `${currentUser.firstName || currentUser.username} • `}
                  {projects.length} {projects.length === 1 ? 'project' : 'projects'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleNewProjectClick}
                data-testid="new-project-button"
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl text-white font-medium shadow-lg shadow-blue-500/25 transition-all"
              >
                <Plus className="w-5 h-5" />
                New Project
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  data-testid="logout-button"
                  className="flex items-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl text-red-300 font-medium transition-all"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              )}
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="search-projects-input"
                className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
              />
            </div>
            <button data-testid="filter-button" className="px-4 py-3 bg-black/40 border border-white/10 rounded-xl hover:bg-white/5 transition-colors">
              <Filter className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
              <p className="text-gray-400">Loading projects...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={loadProjects}
                data-testid="retry-load-projects"
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-blue-300 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <FolderOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">
                {searchQuery ? 'No projects found' : 'No projects yet'}
              </p>
              {!searchQuery && (
                <button
                  onClick={handleNewProjectClick}
                  data-testid="create-first-project"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Create your first project
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={onOpenProject}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateProject}
      />

      {/* Project Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50" data-testid="upsell-modal">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-white/20 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">⚠️</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Project Limit Reached</h2>
              <p className="text-gray-300 mb-6">
                You've reached the maximum number of projects for your {planLimits?.plan || 'FREE'} plan ({planLimits?.maxProjects || 2} projects).
              </p>
              <p className="text-gray-400 mb-6">
                Upgrade to create more projects and unlock premium features.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLimitModal(false)}
                  data-testid="close-limit-modal"
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 hover:text-white transition-colors"
                >
                  Close
                </button>
                <a
                  href="/settings/billing"
                  data-testid="upgrade-plan-link"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg text-white font-semibold text-center transition-colors"
                >
                  Upgrade Plan
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-white/20 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🗑️</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Delete Project?</h2>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete <strong>"{projectToDelete.name}"</strong>?
              </p>
              <p className="text-gray-400 mb-6">
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setProjectToDelete(null)}
                  data-testid="cancel-delete"
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteProject}
                  data-testid="confirm-delete"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg text-white font-semibold transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
