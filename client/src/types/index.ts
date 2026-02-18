export interface Department {
  id: number;
  name: string;
  created_at: string;
}

export interface Resource {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  department_id: number | null;
  department_name?: string;
  capacity_hours: number;
  color: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  name: string;
  client_name: string;
  color: string;
  start_date: string | null;
  end_date: string | null;
  budget_hours: number | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

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
  project_name?: string;
  project_color?: string;
  resource_name?: string;
}

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

export interface CreateResourceInput {
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
  department_id?: number | null;
  capacity_hours?: number;
  color?: string;
}

export interface CreateProjectInput {
  name: string;
  client_name?: string;
  color?: string;
  start_date?: string | null;
  end_date?: string | null;
  budget_hours?: number | null;
}
