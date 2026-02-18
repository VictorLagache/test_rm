import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { projectsApi } from '../../api/projects';
import { useToast } from '../ui/Toast';
import type { Project } from '../../types';
import { Trash2 } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#F97316'];

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  project?: Project | null;
}

export function ProjectModal({ open, onClose, project }: ProjectModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: '',
    client_name: '',
    color: COLORS[0],
    start_date: '',
    end_date: '',
    budget_hours: '' as string | number,
  });

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name,
        client_name: project.client_name,
        color: project.color,
        start_date: project.start_date || '',
        end_date: project.end_date || '',
        budget_hours: project.budget_hours ?? '',
      });
    } else {
      setForm({
        name: '',
        client_name: '',
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        start_date: '',
        end_date: '',
        budget_hours: '',
      });
    }
  }, [project, open]);

  const createMutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast('Project created');
      onClose();
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof projectsApi.update>[1] }) =>
      projectsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast('Project updated');
      onClose();
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: projectsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast('Project deleted');
      onClose();
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: form.name,
      client_name: form.client_name,
      color: form.color,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      budget_hours: form.budget_hours ? Number(form.budget_hours) : null,
    };
    if (project) {
      updateMutation.mutate({ id: project.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={project ? 'Edit Project' : 'New Project'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Project Name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <Input
          label="Client Name"
          value={form.client_name}
          onChange={(e) => setForm({ ...form, client_name: e.target.value })}
          placeholder="e.g. Acme Corp"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
          />
          <Input
            label="End Date"
            type="date"
            value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
          />
        </div>

        <Input
          label="Budget (hours)"
          type="number"
          min={0}
          step={1}
          value={form.budget_hours}
          onChange={(e) => setForm({ ...form, budget_hours: e.target.value })}
          placeholder="Optional"
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Color</label>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`w-8 h-8 rounded-full border-2 transition-transform ${
                  form.color === c ? 'border-gray-900 scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
                onClick={() => setForm({ ...form, color: c })}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            {project && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => deleteMutation.mutate(project.id)}
              >
                <Trash2 size={16} />
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {project ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
