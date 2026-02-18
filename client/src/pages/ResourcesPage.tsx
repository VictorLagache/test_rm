import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Mail } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { ResourceModal } from '../components/resources/ResourceModal';
import { resourcesApi } from '../api/resources';
import type { Resource } from '../types';

export function ResourcesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [search, setSearch] = useState('');

  const { data: resources, isLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: resourcesApi.getAll,
  });

  const filtered = (resources || []).filter((r) => {
    const q = search.toLowerCase();
    return (
      r.first_name.toLowerCase().includes(q) ||
      r.last_name.toLowerCase().includes(q) ||
      r.role.toLowerCase().includes(q) ||
      (r.department_name || '').toLowerCase().includes(q)
    );
  });

  const handleEdit = (resource: Resource) => {
    setSelectedResource(resource);
    setModalOpen(true);
  };

  const handleNew = () => {
    setSelectedResource(null);
    setModalOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Resources"
        description={`${resources?.length ?? 0} team members`}
        actions={
          <Button onClick={handleNew} size="sm">
            <Plus size={16} />
            Add Resource
          </Button>
        }
      />

      <div className="px-8 py-6">
        <div className="relative max-w-sm mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search resources..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="text-gray-400 text-center py-12">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((resource) => (
              <div
                key={resource.id}
                onClick={() => handleEdit(resource)}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                    style={{ backgroundColor: resource.color }}
                  >
                    {resource.first_name[0]}{resource.last_name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900">
                      {resource.first_name} {resource.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{resource.role}</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Mail size={14} />
                    {resource.email}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  {resource.department_name && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs">
                      {resource.department_name}
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-md text-xs">
                    {resource.capacity_hours}h/day
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ResourceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        resource={selectedResource}
      />
    </div>
  );
}
