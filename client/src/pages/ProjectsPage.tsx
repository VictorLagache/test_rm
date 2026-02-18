import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Calendar, Clock } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { ProjectModal } from '../components/projects/ProjectModal';
import { projectsApi } from '../api/projects';
import type { Project } from '../types';

export function ProjectsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [search, setSearch] = useState('');

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll,
  });

  const filtered = (projects || []).filter((p) => {
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.client_name.toLowerCase().includes(q);
  });

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setModalOpen(true);
  };

  const handleNew = () => {
    setSelectedProject(null);
    setModalOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Projects"
        description={`${projects?.length ?? 0} projects`}
        actions={
          <Button onClick={handleNew} size="sm">
            <Plus size={16} />
            Add Project
          </Button>
        }
      />

      <div className="px-8 py-6">
        <div className="relative max-w-sm mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="text-gray-400 text-center py-12">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((project) => (
              <div
                key={project.id}
                onClick={() => handleEdit(project)}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900">{project.name}</div>
                    {project.client_name && (
                      <div className="text-sm text-gray-500">{project.client_name}</div>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-gray-500">
                  {(project.start_date || project.end_date) && (
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>
                        {project.start_date || '?'} → {project.end_date || '?'}
                      </span>
                    </div>
                  )}
                  {project.budget_hours != null && (
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      <span>{project.budget_hours}h budget</span>
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs ${
                      project.is_active
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {project.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        project={selectedProject}
      />
    </div>
  );
}
