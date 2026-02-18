import { getDb } from '../db/connection.js';
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
  // Joined fields
  project_name?: string;
  project_color?: string;
  resource_name?: string;
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

export function getAllBookings(): Booking[] {
  const db = getDb();
  return db.prepare(`
    SELECT b.*, p.name as project_name, p.color as project_color,
           r.first_name || ' ' || r.last_name as resource_name
    FROM bookings b
    LEFT JOIN projects p ON b.project_id = p.id
    LEFT JOIN resources r ON b.resource_id = r.id
    ORDER BY b.start_date
  `).all() as Booking[];
}

export function getBookingById(id: number): Booking | undefined {
  const db = getDb();
  return db.prepare(`
    SELECT b.*, p.name as project_name, p.color as project_color,
           r.first_name || ' ' || r.last_name as resource_name
    FROM bookings b
    LEFT JOIN projects p ON b.project_id = p.id
    LEFT JOIN resources r ON b.resource_id = r.id
    WHERE b.id = ?
  `).get(id) as Booking | undefined;
}

function checkClashes(
  resourceId: number,
  startDate: string,
  endDate: string,
  hoursPerDay: number,
  excludeBookingId?: number
): { date: string; totalHours: number; capacity: number }[] {
  const db = getDb();

  // Get resource capacity
  const resource = db.prepare('SELECT capacity_hours FROM resources WHERE id = ?').get(resourceId) as
    | { capacity_hours: number }
    | undefined;
  if (!resource) throw new AppError(404, 'Resource not found');

  // Get overlapping bookings for this resource
  let query = `
    SELECT start_date, end_date, hours_per_day
    FROM bookings
    WHERE resource_id = ?
      AND start_date <= ?
      AND end_date >= ?
  `;
  const params: unknown[] = [resourceId, endDate, startDate];

  if (excludeBookingId) {
    query += ' AND id != ?';
    params.push(excludeBookingId);
  }

  const overlapping = db.prepare(query).all(...params) as {
    start_date: string;
    end_date: string;
    hours_per_day: number;
  }[];

  // Check each working day in the range
  const days = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  });

  const clashes: { date: string; totalHours: number; capacity: number }[] = [];

  for (const day of days) {
    if (isWeekend(day)) continue;

    const dateStr = format(day, 'yyyy-MM-dd');
    let totalHours = hoursPerDay; // Include the new booking

    for (const booking of overlapping) {
      if (dateStr >= booking.start_date && dateStr <= booking.end_date) {
        totalHours += booking.hours_per_day;
      }
    }

    if (totalHours > resource.capacity_hours) {
      clashes.push({
        date: dateStr,
        totalHours,
        capacity: resource.capacity_hours,
      });
    }
  }

  return clashes;
}

export function createBooking(input: CreateBookingInput): Booking {
  const db = getDb();

  // Validate dates
  if (input.start_date > input.end_date) {
    throw new AppError(400, 'Start date must be before or equal to end date');
  }

  const hoursPerDay = input.hours_per_day ?? 8;

  // Check for clashes
  const clashes = checkClashes(input.resource_id, input.start_date, input.end_date, hoursPerDay);
  if (clashes.length > 0) {
    throw new AppError(409, 'Booking would cause overallocation', { clashes });
  }

  const result = db.prepare(`
    INSERT INTO bookings (resource_id, project_id, start_date, end_date, hours_per_day, booking_type, leave_type, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.resource_id,
    input.booking_type === 'project' ? input.project_id : null,
    input.start_date,
    input.end_date,
    hoursPerDay,
    input.booking_type,
    input.booking_type === 'leave' ? (input.leave_type ?? 'other') : null,
    input.notes ?? ''
  );

  return getBookingById(Number(result.lastInsertRowid))!;
}

export function updateBooking(id: number, input: UpdateBookingInput): Booking | undefined {
  const db = getDb();
  const existing = getBookingById(id);
  if (!existing) return undefined;

  const newResourceId = input.resource_id ?? existing.resource_id;
  const newStartDate = input.start_date ?? existing.start_date;
  const newEndDate = input.end_date ?? existing.end_date;
  const newHoursPerDay = input.hours_per_day ?? existing.hours_per_day;
  const newBookingType = input.booking_type ?? existing.booking_type;

  if (newStartDate > newEndDate) {
    throw new AppError(400, 'Start date must be before or equal to end date');
  }

  // Check for clashes (excluding current booking)
  const clashes = checkClashes(newResourceId, newStartDate, newEndDate, newHoursPerDay, id);
  if (clashes.length > 0) {
    throw new AppError(409, 'Booking would cause overallocation', { clashes });
  }

  db.prepare(`
    UPDATE bookings
    SET resource_id = ?, project_id = ?, start_date = ?, end_date = ?,
        hours_per_day = ?, booking_type = ?, leave_type = ?, notes = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(
    newResourceId,
    newBookingType === 'project' ? (input.project_id !== undefined ? input.project_id : existing.project_id) : null,
    newStartDate,
    newEndDate,
    newHoursPerDay,
    newBookingType,
    newBookingType === 'leave'
      ? (input.leave_type !== undefined ? input.leave_type : existing.leave_type) ?? 'other'
      : null,
    input.notes !== undefined ? input.notes : existing.notes,
    id
  );

  return getBookingById(id);
}

export function deleteBooking(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM bookings WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getSchedule(startDate: string, endDate: string): ScheduleResource[] {
  const db = getDb();

  const resources = db.prepare(`
    SELECT r.id, r.first_name, r.last_name, r.role, r.capacity_hours, r.color,
           d.name as department_name
    FROM resources r
    LEFT JOIN departments d ON r.department_id = d.id
    WHERE r.is_active = 1
    ORDER BY r.first_name, r.last_name
  `).all() as ScheduleResource[];

  const bookings = db.prepare(`
    SELECT b.*, p.name as project_name, p.color as project_color
    FROM bookings b
    LEFT JOIN projects p ON b.project_id = p.id
    WHERE b.start_date <= ? AND b.end_date >= ?
    ORDER BY b.start_date
  `).all(endDate, startDate) as Booking[];

  // Group bookings by resource
  const bookingsByResource = new Map<number, Booking[]>();
  for (const booking of bookings) {
    const list = bookingsByResource.get(booking.resource_id) || [];
    list.push(booking);
    bookingsByResource.set(booking.resource_id, list);
  }

  for (const resource of resources) {
    resource.bookings = bookingsByResource.get(resource.id) || [];
  }

  return resources;
}
