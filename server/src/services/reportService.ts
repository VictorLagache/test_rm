import { supabase } from '../lib/supabase.js';
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

export async function getUtilizationReport(startDate: string, endDate: string): Promise<UtilizationReport[]> {
  const days = eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) });
  const workingDays = days.filter((d) => !isWeekend(d));
  const workingDayCount = workingDays.length;
  const workingDayStrings = workingDays.map((d) => format(d, 'yyyy-MM-dd'));

  const [{ data: resources }, { data: bookings }] = await Promise.all([
    supabase
      .from('Resource')
      .select('id, first_name, last_name, capacity_hours, Department(name)')
      .eq('is_active', true)
      .order('first_name')
      .order('last_name'),
    supabase
      .from('Booking')
      .select('resource_id, start_date, end_date, hours_per_day, booking_type')
      .lte('start_date', endDate)
      .gte('end_date', startDate),
  ]);

  return (resources ?? []).map((resource: Record<string, unknown>) => {
    const dept = resource.Department as { name: string } | null;
    const cap = resource.capacity_hours as number;
    const totalCapacity = cap * workingDayCount;
    let bookedHours = 0;
    let leaveHours = 0;

    const resourceBookings = (bookings ?? []).filter((b: Record<string, unknown>) => b.resource_id === resource.id);

    for (const dayStr of workingDayStrings) {
      for (const b of resourceBookings) {
        if (dayStr >= (b.start_date as string) && dayStr <= (b.end_date as string)) {
          if (b.booking_type === 'project') bookedHours += b.hours_per_day as number;
          else leaveHours += b.hours_per_day as number;
        }
      }
    }

    return {
      resource_id: resource.id as number,
      resource_name: `${resource.first_name} ${resource.last_name}`,
      department_name: dept?.name ?? null,
      capacity_hours: totalCapacity,
      booked_hours: bookedHours,
      leave_hours: leaveHours,
      utilization_percent: totalCapacity > 0 ? Math.round((bookedHours / totalCapacity) * 100) : 0,
      working_days: workingDayCount,
    };
  });
}

export async function getProjectReport(startDate: string, endDate: string): Promise<ProjectReport[]> {
  const days = eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) });
  const workingDayStrings = days.filter((d) => !isWeekend(d)).map((d) => format(d, 'yyyy-MM-dd'));

  const [{ data: projects }, { data: bookings }] = await Promise.all([
    supabase.from('Project').select('id, name, client_name, color, budget_hours').eq('is_active', true).order('name'),
    supabase
      .from('Booking')
      .select('project_id, resource_id, start_date, end_date, hours_per_day')
      .eq('booking_type', 'project')
      .lte('start_date', endDate)
      .gte('end_date', startDate),
  ]);

  return (projects ?? []).map((project: Record<string, unknown>) => {
    const projectBookings = (bookings ?? []).filter((b: Record<string, unknown>) => b.project_id === project.id);
    let bookedHours = 0;
    const resourceIds = new Set<number>();

    for (const b of projectBookings) {
      resourceIds.add(b.resource_id as number);
      for (const dayStr of workingDayStrings) {
        if (dayStr >= (b.start_date as string) && dayStr <= (b.end_date as string)) {
          bookedHours += b.hours_per_day as number;
        }
      }
    }

    const budget = project.budget_hours as number | null;
    return {
      project_id: project.id as number,
      project_name: project.name as string,
      client_name: project.client_name as string,
      color: project.color as string,
      budget_hours: budget,
      booked_hours: bookedHours,
      budget_used_percent: budget ? Math.round((bookedHours / budget) * 100) : null,
      resource_count: resourceIds.size,
    };
  });
}
