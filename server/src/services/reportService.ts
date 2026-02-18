import { getDb } from '../db/connection.js';
import { eachDayOfInterval, parseISO, isWeekend, format } from 'date-fns';

export interface UtilizationReport {
  resource_id: number;
  resource_name: string;
  department_name: string | null;
  capacity_hours: number;
  booked_hours: number;
  leave_hours: number;
  utilization_percent: number;
  working_days: number;
}

export interface ProjectReport {
  project_id: number;
  project_name: string;
  client_name: string;
  color: string;
  budget_hours: number | null;
  booked_hours: number;
  budget_used_percent: number | null;
  resource_count: number;
}

export function getUtilizationReport(startDate: string, endDate: string): UtilizationReport[] {
  const db = getDb();

  const days = eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) });
  const workingDays = days.filter((d) => !isWeekend(d));
  const workingDayCount = workingDays.length;
  const workingDayStrings = workingDays.map((d) => format(d, 'yyyy-MM-dd'));

  const resources = db.prepare(`
    SELECT r.id, r.first_name || ' ' || r.last_name as resource_name,
           r.capacity_hours, d.name as department_name
    FROM resources r
    LEFT JOIN departments d ON r.department_id = d.id
    WHERE r.is_active = 1
    ORDER BY r.first_name, r.last_name
  `).all() as { id: number; resource_name: string; capacity_hours: number; department_name: string | null }[];

  const bookings = db.prepare(`
    SELECT resource_id, start_date, end_date, hours_per_day, booking_type
    FROM bookings
    WHERE start_date <= ? AND end_date >= ?
  `).all(endDate, startDate) as {
    resource_id: number;
    start_date: string;
    end_date: string;
    hours_per_day: number;
    booking_type: string;
  }[];

  return resources.map((resource) => {
    const totalCapacity = resource.capacity_hours * workingDayCount;
    let bookedHours = 0;
    let leaveHours = 0;

    const resourceBookings = bookings.filter((b) => b.resource_id === resource.id);

    for (const dayStr of workingDayStrings) {
      for (const booking of resourceBookings) {
        if (dayStr >= booking.start_date && dayStr <= booking.end_date) {
          if (booking.booking_type === 'project') {
            bookedHours += booking.hours_per_day;
          } else {
            leaveHours += booking.hours_per_day;
          }
        }
      }
    }

    return {
      resource_id: resource.id,
      resource_name: resource.resource_name,
      department_name: resource.department_name,
      capacity_hours: totalCapacity,
      booked_hours: bookedHours,
      leave_hours: leaveHours,
      utilization_percent: totalCapacity > 0 ? Math.round((bookedHours / totalCapacity) * 100) : 0,
      working_days: workingDayCount,
    };
  });
}

export function getProjectReport(startDate: string, endDate: string): ProjectReport[] {
  const db = getDb();

  const days = eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) });
  const workingDayStrings = days.filter((d) => !isWeekend(d)).map((d) => format(d, 'yyyy-MM-dd'));

  const projects = db.prepare(`
    SELECT id, name, client_name, color, budget_hours
    FROM projects
    WHERE is_active = 1
    ORDER BY name
  `).all() as { id: number; name: string; client_name: string; color: string; budget_hours: number | null }[];

  const bookings = db.prepare(`
    SELECT project_id, resource_id, start_date, end_date, hours_per_day
    FROM bookings
    WHERE booking_type = 'project'
      AND start_date <= ? AND end_date >= ?
  `).all(endDate, startDate) as {
    project_id: number;
    resource_id: number;
    start_date: string;
    end_date: string;
    hours_per_day: number;
  }[];

  return projects.map((project) => {
    const projectBookings = bookings.filter((b) => b.project_id === project.id);
    let bookedHours = 0;
    const resourceIds = new Set<number>();

    for (const booking of projectBookings) {
      resourceIds.add(booking.resource_id);
      for (const dayStr of workingDayStrings) {
        if (dayStr >= booking.start_date && dayStr <= booking.end_date) {
          bookedHours += booking.hours_per_day;
        }
      }
    }

    return {
      project_id: project.id,
      project_name: project.name,
      client_name: project.client_name,
      color: project.color,
      budget_hours: project.budget_hours,
      booked_hours: bookedHours,
      budget_used_percent: project.budget_hours ? Math.round((bookedHours / project.budget_hours) * 100) : null,
      resource_count: resourceIds.size,
    };
  });
}
