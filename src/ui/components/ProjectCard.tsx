import React from 'react';
import { Music2, Clock, Calendar, Users } from 'lucide-react';
import type { Project } from '../../api/types';

interface ProjectCardProps {
  project: Project;
  onOpen: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onOpen, onDelete }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div
      data-testid="project-card"
      className="group relative bg-gradient-to-br from-daw-surface/90 to-daw-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all cursor-pointer"
      onClick={() => onOpen(project)}
    >
      {/* Thumbnail */}
      <div className="relative h-32 mb-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl overflow-hidden border border-white/5">
        {project.thumbnailUrl ? (
          <img
            src={project.thumbnailUrl}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Music2 className="w-12 h-12 text-blue-400/50" />
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
          <span className="text-white font-semibold text-sm">Open Project</span>
        </div>
      </div>

      {/* Project Info */}
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-bold text-white mb-1 truncate">{project.name}</h3>
          {project.description && (
            <p className="text-sm text-gray-400 line-clamp-2">{project.description}</p>
          )}
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-gray-400">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>{project.bpm} BPM</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400">
            <Music2 className="w-3.5 h-3.5 text-purple-400" />
            <span>{project.key || 'C'} {project.timeSignature || '4/4'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400">
            <Calendar className="w-3.5 h-3.5 text-green-400" />
            <span>{formatDate(project.updatedAt)}</span>
          </div>
          {project.collaborators && project.collaborators.length > 0 && (
            <div className="flex items-center gap-1.5 text-gray-400">
              <Users className="w-3.5 h-3.5 text-yellow-400" />
              <span>{project.collaborators.length}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <span className="text-xs text-gray-500">v{project.version}</span>
          {project.isPublic && (
            <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">
              Public
            </span>
          )}
        </div>
      </div>

      {/* Delete button */}
      {onDelete && (
        <button
          data-testid="delete-project"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(project);
          }}
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg backdrop-blur-sm"
        >
          <span className="text-red-400 text-xs">Delete</span>
        </button>
      )}
    </div>
  );
};
