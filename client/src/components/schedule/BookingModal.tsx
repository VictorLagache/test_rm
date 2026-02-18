import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { resourcesApi } from '../../api/resources';
import { projectsApi } from '../../api/projects';
import { useCreateBooking, useUpdateBooking, useDeleteBooking } from '../../hooks/useScheduleData';
import { useToast } from '../ui/Toast';
import type { Booking } from '../../types';
import { formatDate } from '../../lib/dates';
import { Trash2 } from 'lucide-react';

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  booking?: Booking | null;
  defaultResourceId?: number;
  defaultDate?: string;
}

export function BookingModal({ open, onClose, booking, defaultResourceId, defaultDate }: BookingModalProps) {
  const { toast } = useToast();
  const createBooking = useCreateBooking();
  const updateBooking = useUpdateBooking();
  const deleteBooking = useDeleteBooking();

  const { data: resources } = useQuery({ queryKey: ['resources'], queryFn: resourcesApi.getAll });
  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: projectsApi.getAll });

  const [form, setForm] = useState({
    resource_id: 0,
    booking_type: 'project' as 'project' | 'leave',
    project_id: 0,
    leave_type: 'vacation',
    start_date: '',
    end_date: '',
    hours_per_day: 8,
    notes: '',
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (booking) {
      setForm({
        resource_id: booking.resource_id,
        booking_type: booking.booking_type,
        project_id: booking.project_id || 0,
        leave_type: booking.leave_type || 'vacation',
        start_date: booking.start_date,
        end_date: booking.end_date,
        hours_per_day: booking.hours_per_day,
        notes: booking.notes,
      });
    } else {
      setForm({
        resource_id: defaultResourceId || (resources?.[0]?.id ?? 0),
        booking_type: 'project',
        project_id: projects?.[0]?.id ?? 0,
        leave_type: 'vacation',
        start_date: defaultDate || formatDate(new Date()),
        end_date: defaultDate || formatDate(new Date()),
        hours_per_day: 8,
        notes: '',
      });
    }
    setError('');
  }, [booking, defaultResourceId, defaultDate, open, resources, projects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const data = {
      resource_id: form.resource_id,
      booking_type: form.booking_type,
      project_id: form.booking_type === 'project' ? form.project_id : null,
      leave_type: form.booking_type === 'leave' ? form.leave_type : null,
      start_date: form.start_date,
      end_date: form.end_date,
      hours_per_day: form.hours_per_day,
      notes: form.notes,
    };

    try {
      if (booking) {
        await updateBooking.mutateAsync({ id: booking.id, data });
        toast('Booking updated');
      } else {
        await createBooking.mutateAsync(data);
        toast('Booking created');
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save booking';
      setError(msg);
      toast(msg, 'error');
    }
  };

  const handleDelete = async () => {
    if (!booking) return;
    try {
      await deleteBooking.mutateAsync(booking.id);
      toast('Booking deleted');
      onClose();
    } catch {
      toast('Failed to delete booking', 'error');
    }
  };

  const isLoading = createBooking.isPending || updateBooking.isPending;

  return (
    <Modal open={open} onClose={onClose} title={booking ? 'Edit Booking' : 'New Booking'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Resource"
          value={form.resource_id}
          onChange={(e) => setForm({ ...form, resource_id: Number(e.target.value) })}
          options={(resources || []).map((r) => ({
            value: r.id,
            label: `${r.first_name} ${r.last_name}`,
          }))}
        />

        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="booking_type"
              value="project"
              checked={form.booking_type === 'project'}
              onChange={() => setForm({ ...form, booking_type: 'project' })}
              className="text-primary-600"
            />
            <span className="text-sm">Project</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="booking_type"
              value="leave"
              checked={form.booking_type === 'leave'}
              onChange={() => setForm({ ...form, booking_type: 'leave' })}
              className="text-primary-600"
            />
            <span className="text-sm">Leave</span>
          </label>
        </div>

        {form.booking_type === 'project' ? (
          <Select
            label="Project"
            value={form.project_id}
            onChange={(e) => setForm({ ...form, project_id: Number(e.target.value) })}
            options={(projects || []).map((p) => ({ value: p.id, label: p.name }))}
          />
        ) : (
          <Select
            label="Leave Type"
            value={form.leave_type}
            onChange={(e) => setForm({ ...form, leave_type: e.target.value })}
            options={[
              { value: 'vacation', label: 'Vacation' },
              { value: 'sick', label: 'Sick Leave' },
              { value: 'personal', label: 'Personal' },
              { value: 'other', label: 'Other' },
            ]}
          />
        )}

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
          label="Hours per Day"
          type="number"
          min={0.5}
          max={24}
          step={0.5}
          value={form.hours_per_day}
          onChange={(e) => setForm({ ...form, hours_per_day: Number(e.target.value) })}
        />

        <Input
          label="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Optional notes..."
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div>
            {booking && (
              <Button type="button" variant="danger" size="sm" onClick={handleDelete}>
                <Trash2 size={16} />
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : booking ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
