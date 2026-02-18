import 'dotenv/config';
import { supabase } from '../lib/supabase.js';
import { format, addDays, startOfWeek, addWeeks } from 'date-fns';

async function seed() {
  // Clear in reverse dependency order
  await supabase.from('Booking').delete().neq('id', 0);
  await supabase.from('Resource').delete().neq('id', 0);
  await supabase.from('Project').delete().neq('id', 0);
  await supabase.from('Department').delete().neq('id', 0);

  // Departments
  const { data: depts } = await supabase
    .from('Department')
    .insert([{ name: 'Engineering' }, { name: 'Design' }, { name: 'Marketing' }])
    .select('id, name');

  const deptMap: Record<string, number> = {};
  for (const d of depts ?? []) deptMap[d.name] = d.id;

  // Resources
  const { data: resources } = await supabase
    .from('Resource')
    .insert([
      { first_name: 'Alice', last_name: 'Martin', email: 'alice@company.com', role: 'Senior Developer', department_id: deptMap['Engineering'], capacity_hours: 8, color: '#3B82F6' },
      { first_name: 'Bob', last_name: 'Chen', email: 'bob@company.com', role: 'Full-Stack Developer', department_id: deptMap['Engineering'], capacity_hours: 8, color: '#10B981' },
      { first_name: 'Clara', last_name: 'Jones', email: 'clara@company.com', role: 'UI Designer', department_id: deptMap['Design'], capacity_hours: 8, color: '#F59E0B' },
      { first_name: 'David', last_name: 'Kim', email: 'david@company.com', role: 'UX Researcher', department_id: deptMap['Design'], capacity_hours: 6, color: '#EF4444' },
      { first_name: 'Emma', last_name: 'Wilson', email: 'emma@company.com', role: 'Project Manager', department_id: deptMap['Engineering'], capacity_hours: 8, color: '#8B5CF6' },
      { first_name: 'Frank', last_name: 'Garcia', email: 'frank@company.com', role: 'Backend Developer', department_id: deptMap['Engineering'], capacity_hours: 8, color: '#06B6D4' },
      { first_name: 'Grace', last_name: 'Lee', email: 'grace@company.com', role: 'Content Strategist', department_id: deptMap['Marketing'], capacity_hours: 8, color: '#EC4899' },
      { first_name: 'Henry', last_name: 'Brown', email: 'henry@company.com', role: 'Marketing Lead', department_id: deptMap['Marketing'], capacity_hours: 8, color: '#F97316' },
    ])
    .select('id');

  const rId = (resources ?? []).map((r: { id: number }) => r.id);

  // Projects
  const today = new Date();
  const w = startOfWeek(today, { weekStartsOn: 1 });
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

  const { data: projects } = await supabase
    .from('Project')
    .insert([
      { name: 'Website Redesign', client_name: 'Acme Corp', color: '#3B82F6', start_date: fmt(w), end_date: fmt(addWeeks(w, 8)), budget_hours: 480 },
      { name: 'Mobile App', client_name: 'TechStart Inc', color: '#10B981', start_date: fmt(w), end_date: fmt(addWeeks(w, 12)), budget_hours: 640 },
      { name: 'Brand Refresh', client_name: 'Global Media', color: '#F59E0B', start_date: fmt(addWeeks(w, 1)), end_date: fmt(addWeeks(w, 6)), budget_hours: 240 },
      { name: 'API Integration', client_name: 'DataFlow Ltd', color: '#8B5CF6', start_date: fmt(addWeeks(w, 2)), end_date: fmt(addWeeks(w, 10)), budget_hours: 320 },
      { name: 'Marketing Campaign', client_name: 'FreshBrand Co', color: '#EC4899', start_date: fmt(w), end_date: fmt(addWeeks(w, 4)), budget_hours: 160 },
    ])
    .select('id');

  const pId = (projects ?? []).map((p: { id: number }) => p.id);

  // Bookings
  await supabase.from('Booking').insert([
    { resource_id: rId[0], project_id: pId[0], start_date: fmt(w), end_date: fmt(addDays(w, 9)), hours_per_day: 6, booking_type: 'project', notes: 'Frontend development' },
    { resource_id: rId[0], project_id: pId[3], start_date: fmt(addWeeks(w, 2)), end_date: fmt(addDays(addWeeks(w, 2), 4)), hours_per_day: 4, booking_type: 'project', notes: 'API review' },
    { resource_id: rId[1], project_id: pId[1], start_date: fmt(w), end_date: fmt(addDays(w, 14)), hours_per_day: 8, booking_type: 'project', notes: 'Core features' },
    { resource_id: rId[2], project_id: pId[0], start_date: fmt(w), end_date: fmt(addDays(w, 6)), hours_per_day: 8, booking_type: 'project', notes: 'UI mockups' },
    { resource_id: rId[2], project_id: pId[2], start_date: fmt(addWeeks(w, 1)), end_date: fmt(addDays(addWeeks(w, 1), 9)), hours_per_day: 4, booking_type: 'project', notes: 'Visual identity' },
    { resource_id: rId[3], project_id: pId[0], start_date: fmt(w), end_date: fmt(addDays(w, 4)), hours_per_day: 6, booking_type: 'project', notes: 'User research' },
    { resource_id: rId[3], project_id: null, start_date: fmt(addWeeks(w, 1)), end_date: fmt(addDays(addWeeks(w, 1), 4)), hours_per_day: 6, booking_type: 'leave', leave_type: 'vacation', notes: 'Family trip' },
    { resource_id: rId[4], project_id: pId[0], start_date: fmt(w), end_date: fmt(addDays(w, 19)), hours_per_day: 4, booking_type: 'project', notes: 'Project coordination' },
    { resource_id: rId[4], project_id: pId[1], start_date: fmt(w), end_date: fmt(addDays(w, 19)), hours_per_day: 4, booking_type: 'project', notes: 'Project coordination' },
    { resource_id: rId[5], project_id: pId[3], start_date: fmt(addWeeks(w, 2)), end_date: fmt(addDays(addWeeks(w, 2), 14)), hours_per_day: 8, booking_type: 'project', notes: 'Backend implementation' },
    { resource_id: rId[5], project_id: pId[1], start_date: fmt(w), end_date: fmt(addDays(w, 9)), hours_per_day: 8, booking_type: 'project', notes: 'API endpoints' },
    { resource_id: rId[6], project_id: pId[4], start_date: fmt(w), end_date: fmt(addDays(w, 14)), hours_per_day: 6, booking_type: 'project', notes: 'Content creation' },
    { resource_id: rId[6], project_id: pId[2], start_date: fmt(addWeeks(w, 1)), end_date: fmt(addDays(addWeeks(w, 1), 9)), hours_per_day: 2, booking_type: 'project', notes: 'Copy writing' },
    { resource_id: rId[7], project_id: pId[4], start_date: fmt(w), end_date: fmt(addDays(w, 14)), hours_per_day: 8, booking_type: 'project', notes: 'Campaign management' },
    { resource_id: rId[7], project_id: null, start_date: fmt(addWeeks(w, 3)), end_date: fmt(addDays(addWeeks(w, 3), 2)), hours_per_day: 8, booking_type: 'leave', leave_type: 'sick', notes: 'Doctor appointment' },
    { resource_id: rId[1], project_id: null, start_date: fmt(addWeeks(w, 3)), end_date: fmt(addDays(addWeeks(w, 3), 4)), hours_per_day: 8, booking_type: 'leave', leave_type: 'vacation', notes: 'Summer break' },
  ]);

  console.log('Database seeded successfully!');
  console.log('  - 3 departments');
  console.log('  - 8 resources');
  console.log('  - 5 projects');
  console.log('  - 16 bookings');
}

seed().catch((e) => { console.error(e); process.exit(1); });
