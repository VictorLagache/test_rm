import { supabase } from '../lib/supabase.js';
import { eachDayOfInterval, parseISO, isWeekend, format } from 'date-fns';
import { AppError } from '../middleware/errorHandler.js';

export interface Booking {
  id: number;
  resource_id: number;
  project_id: number | null;
  start_date: string;
  end_date: string;
  hours_per_day: number;
  booking_type: 'project' | 'leave';
  leave_type: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
  project_name?: string | null;
  project_color?: string | null;
  resource_name?: string | null;
}

export interface CreateBookingInput {
  resource_id: number;
  project_id?: number | null;
  start_date: string;
  end_date: string;
  hours_per_day?: number;
  booking_type: 'project' | 'leave';
  leave_type?: string | null;
  notes?: string;
}

export interface UpdateBookingInput extends Partial<CreateBookingInput> {}

export interface ScheduleResource {
  id: number;
  first_name: string;
  last_name: string;
  role: string;
  department_name: string | null;
  capacity_hours: number;
  color: string;
  bookings: Booking[];
}

function toBooking(b: Record<string, unknown>): Booking {
  const project = b.Project as { name: string; color: string } | null;
  const resource = b.Resource as { first_name: string; last_name: string } | null;
  return {
    id: b.id as number,
    resource_id: b.resource_id as number,
    project_id: b.project_id as number | null,
    start_date: b.start_date as string,
    end_date: b.end_date as string,
    hours_per_day: b.hours_per_day as number,
    booking_type: b.booking_type as 'project' | 'leave',
    leave_type: b.leave_type as string | null,
    notes: b.notes as string,
    created_at: b.created_at as string,
    updated_at: b.updated_at as string,
    project_name: project?.name ?? null,
    project_color: project?.color ?? null,
    resource_name: resource ? `${resource.first_name} ${resource.last_name}` : null,
  };
}

export async function getAllBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('Booking')
    .select('*, Project(name, color), Resource(first_name, last_name)')
    .order('start_date');
  if (error) throw new Error(error.message);
  return (data ?? []).map(toBooking);
}

export async function getBookingById(id: number): Promise<Booking | undefined> {
  const { data, error } = await supabase
    .from('Booking')
    .select('*, Project(name, color), Resource(first_name, last_name)')
    .eq('id', id)
    .single();
  if (error) return undefined;
  return toBooking(data);
}

async function checkClashes(
  resourceId: number,
  startDate: string,
  endDate: string,
  hoursPerDay: number,
  excludeBookingId?: number
): Promise<{ date: string; totalHours: number; capacity: number }[]> {
  const { data: resource } = await supabase
    .from('Resource')
    .select('capacity_hours')
    .eq('id', resourceId)
    .single();
  if (!resource) throw new AppError(404, 'Resource not found');

  let query = supabase
    .from('Booking')
    .select('start_date, end_date, hours_per_day')
    .eq('resource_id', resourceId)
    .lte('start_date', endDate)
    .gte('end_date', startDate);

  if (excludeBookingId) query = query.neq('id', excludeBookingId);

  const { data: overlapping } = await query;

  const days = eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) });
  const clashes: { date: string; totalHours: number; capacity: number }[] = [];

  for (const day of days) {
    if (isWeekend(day)) continue;
    const dateStr = format(day, 'yyyy-MM-dd');
    let totalHours = hoursPerDay;

    for (const b of overlapping ?? []) {
      if (dateStr >= b.start_date && dateStr <= b.end_date) {
        totalHours += b.hours_per_day;
      }
    }

    if (totalHours > resource.capacity_hours) {
      clashes.push({ date: dateStr, totalHours, capacity: resource.capacity_hours });
    }
  }

  return clashes;
}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  if (input.start_date > input.end_date) {
    throw new AppError(400, 'Start date must be before or equal to end date');
  }

  const hoursPerDay = input.hours_per_day ?? 8;
  const clashes = await checkClashes(input.resource_id, input.start_date, input.end_date, hoursPerDay);
  if (clashes.length > 0) throw new AppError(409, 'Booking would cause overallocation', { clashes });

  const { data, error } = await supabase
    .from('Booking')
    .insert({
      resource_id: input.resource_id,
      project_id: input.booking_type === 'project' ? (input.project_id ?? null) : null,
      start_date: input.start_date,
      end_date: input.end_date,
      hours_per_day: hoursPerDay,
      booking_type: input.booking_type,
      leave_type: input.booking_type === 'leave' ? (input.leave_type ?? 'other') : null,
      notes: input.notes ?? '',
    })
    .select('*, Project(name, color), Resource(first_name, last_name)')
    .single();
  if (error) throw new Error(error.message);
  return toBooking(data);
}

export async function updateBooking(id: number, input: UpdateBookingInput): Promise<Booking | undefined> {
  const existing = await getBookingById(id);
  if (!existing) return undefined;

  const newResourceId = input.resource_id ?? existing.resource_id;
  const newStartDate = input.start_date ?? existing.start_date;
  const newEndDate = input.end_date ?? existing.end_date;
  const newHoursPerDay = input.hours_per_day ?? existing.hours_per_day;
  const newBookingType = input.booking_type ?? existing.booking_type;

  if (newStartDate > newEndDate) throw new AppError(400, 'Start date must be before or equal to end date');

  const clashes = await checkClashes(newResourceId, newStartDate, newEndDate, newHoursPerDay, id);
  if (clashes.length > 0) throw new AppError(409, 'Booking would cause overallocation', { clashes });

  const { data, error } = await supabase
    .from('Booking')
    .update({
      resource_id: newResourceId,
      project_id: newBookingType === 'project'
        ? (input.project_id !== undefined ? input.project_id : existing.project_id)
        : null,
      start_date: newStartDate,
      end_date: newEndDate,
      hours_per_day: newHoursPerDay,
      booking_type: newBookingType,
      leave_type: newBookingType === 'leave'
        ? ((input.leave_type !== undefined ? input.leave_type : existing.leave_type) ?? 'other')
        : null,
      notes: input.notes !== undefined ? input.notes : existing.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, Project(name, color), Resource(first_name, last_name)')
    .single();
  if (error) throw new Error(error.message);
  return toBooking(data);
}

export async function deleteBooking(id: number): Promise<boolean> {
  const { error } = await supabase.from('Booking').delete().eq('id', id);
  return !error;
}

export async function getSchedule(startDate: string, endDate: string): Promise<ScheduleResource[]> {
  const [{ data: resources }, { data: bookings }] = await Promise.all([
    supabase
      .from('Resource')
      .select('*, Department(name)')
      .eq('is_active', true)
      .order('first_name')
      .order('last_name'),
    supabase
      .from('Booking')
      .select('*, Project(name, color)')
      .lte('start_date', endDate)
      .gte('end_date', startDate)
      .order('start_date'),
  ]);

  const bookingsByResource = new Map<number, Booking[]>();
  for (const b of bookings ?? []) {
    const list = bookingsByResource.get(b.resource_id) || [];
    list.push(toBooking(b));
    bookingsByResource.set(b.resource_id, list);
  }

  return (resources ?? []).map((r: Record<string, unknown>) => {
    const dept = r.Department as { name: string } | null;
    return {
      id: r.id as number,
      first_name: r.first_name as string,
      last_name: r.last_name as string,
      role: r.role as string,
      department_name: dept?.name ?? null,
      capacity_hours: r.capacity_hours as number,
      color: r.color as string,
      bookings: bookingsByResource.get(r.id as number) || [],
    };
  });
}
