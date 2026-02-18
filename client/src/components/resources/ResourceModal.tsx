import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { resourcesApi } from '../../api/resources';
import { departmentsApi } from '../../api/departments';
import { useToast } from '../ui/Toast';
import type { Resource } from '../../types';
import { Trash2 } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#F97316'];

interface ResourceModalProps {
  open: boolean;
  onClose: () => void;
  resource?: Resource | null;
}

export function ResourceModal({ open, onClose, resource }: ResourceModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: departments } = useQuery({ queryKey: ['departments'], queryFn: departmentsApi.getAll });

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: '',
    department_id: '' as string,
    capacity_hours: 8,
    color: COLORS[0],
  });

  useEffect(() => {
    if (resource) {
      setForm({
        first_name: resource.first_name,
        last_name: resource.last_name,
        email: resource.email,
        role: resource.role,
        department_id: resource.department_id?.toString() || '',
        capacity_hours: resource.capacity_hours,
        color: resource.color,
      });
    } else {
      setForm({
        first_name: '',
        last_name: '',
        email: '',
        role: '',
        department_id: '',
        capacity_hours: 8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }
  }, [resource, open]);

  const createMutation = useMutation({
    mutationFn: resourcesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      toast('Resource created');
      onClose();
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof resourcesApi.update>[1] }) =>
      resourcesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      toast('Resource updated');
      onClose();
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: resourcesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      toast('Resource deleted');
      onClose();
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...form,
      department_id: form.department_id ? Number(form.department_id) : null,
    };
    if (resource) {
      updateMutation.mutate({ id: resource.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={resource ? 'Edit Resource' : 'New Resource'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            required
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
          />
          <Input
            label="Last Name"
            required
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
          />
        </div>

        <Input
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <Input
          label="Role"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          placeholder="e.g. Senior Developer"
        />

        <Select
          label="Department"
          value={form.department_id}
          onChange={(e) => setForm({ ...form, department_id: e.target.value })}
          options={[
            { value: '', label: 'No department' },
            ...(departments || []).map((d) => ({ value: d.id, label: d.name })),
          ]}
        />

        <Input
          label="Capacity (hours/day)"
          type="number"
          min={1}
          max={24}
          step={0.5}
          value={form.capacity_hours}
          onChange={(e) => setForm({ ...form, capacity_hours: Number(e.target.value) })}
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
            {resource && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => deleteMutation.mutate(resource.id)}
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
              {resource ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
