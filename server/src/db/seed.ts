import { getDb } from './connection.js';
import { initializeDatabase } from './schema.js';
import { format, addDays, startOfWeek, addWeeks } from 'date-fns';

function seed() {
  initializeDatabase();
  const db = getDb();

  // Clear existing data
  db.exec(`
    DELETE FROM bookings;
    DELETE FROM resources;
    DELETE FROM projects;
    DELETE FROM departments;
  `);

  // Departments
  const insertDept = db.prepare('INSERT INTO departments (name) VALUES (?)');
  const depts = ['Engineering', 'Design', 'Marketing'];
  const deptIds: Record<string, number> = {};
  for (const name of depts) {
    const result = insertDept.run(name);
    deptIds[name] = Number(result.lastInsertRowid);
  }

  // Resources
  const insertResource = db.prepare(`
    INSERT INTO resources (first_name, last_name, email, role, department_id, capacity_hours, color)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const resourcesData = [
    ['Alice', 'Martin', 'alice@company.com', 'Senior Developer', deptIds['Engineering'], 8, '#3B82F6'],
    ['Bob', 'Chen', 'bob@company.com', 'Full-Stack Developer', deptIds['Engineering'], 8, '#10B981'],
    ['Clara', 'Jones', 'clara@company.com', 'UI Designer', deptIds['Design'], 8, '#F59E0B'],
    ['David', 'Kim', 'david@company.com', 'UX Researcher', deptIds['Design'], 6, '#EF4444'],
    ['Emma', 'Wilson', 'emma@company.com', 'Project Manager', deptIds['Engineering'], 8, '#8B5CF6'],
    ['Frank', 'Garcia', 'frank@company.com', 'Backend Developer', deptIds['Engineering'], 8, '#06B6D4'],
    ['Grace', 'Lee', 'grace@company.com', 'Content Strategist', deptIds['Marketing'], 8, '#EC4899'],
    ['Henry', 'Brown', 'henry@company.com', 'Marketing Lead', deptIds['Marketing'], 8, '#F97316'],
  ];

  const resourceIds: number[] = [];
  for (const r of resourcesData) {
    const result = insertResource.run(...r);
    resourceIds.push(Number(result.lastInsertRowid));
  }

  // Projects
  const insertProject = db.prepare(`
    INSERT INTO projects (name, client_name, color, start_date, end_date, budget_hours)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

  const projectsData = [
    ['Website Redesign', 'Acme Corp', '#3B82F6', fmt(weekStart), fmt(addWeeks(weekStart, 8)), 480],
    ['Mobile App', 'TechStart Inc', '#10B981', fmt(weekStart), fmt(addWeeks(weekStart, 12)), 640],
    ['Brand Refresh', 'Global Media', '#F59E0B', fmt(addWeeks(weekStart, 1)), fmt(addWeeks(weekStart, 6)), 240],
    ['API Integration', 'DataFlow Ltd', '#8B5CF6', fmt(addWeeks(weekStart, 2)), fmt(addWeeks(weekStart, 10)), 320],
    ['Marketing Campaign', 'FreshBrand Co', '#EC4899', fmt(weekStart), fmt(addWeeks(weekStart, 4)), 160],
  ];

  const projectIds: number[] = [];
  for (const p of projectsData) {
    const result = insertProject.run(...p);
    projectIds.push(Number(result.lastInsertRowid));
  }

  // Bookings
  const insertBooking = db.prepare(`
    INSERT INTO bookings (resource_id, project_id, start_date, end_date, hours_per_day, booking_type, leave_type, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const bookingsData = [
    // Alice - Website Redesign
    [resourceIds[0], projectIds[0], fmt(weekStart), fmt(addDays(weekStart, 9)), 6, 'project', null, 'Frontend development'],
    // Alice - API Integration (partial)
    [resourceIds[0], projectIds[3], fmt(addWeeks(weekStart, 2)), fmt(addDays(addWeeks(weekStart, 2), 4)), 4, 'project', null, 'API review'],
    // Bob - Mobile App
    [resourceIds[1], projectIds[1], fmt(weekStart), fmt(addDays(weekStart, 14)), 8, 'project', null, 'Core features'],
    // Clara - Website Redesign
    [resourceIds[2], projectIds[0], fmt(weekStart), fmt(addDays(weekStart, 6)), 8, 'project', null, 'UI mockups'],
    // Clara - Brand Refresh
    [resourceIds[2], projectIds[2], fmt(addWeeks(weekStart, 1)), fmt(addDays(addWeeks(weekStart, 1), 9)), 4, 'project', null, 'Visual identity'],
    // David - Website Redesign
    [resourceIds[3], projectIds[0], fmt(weekStart), fmt(addDays(weekStart, 4)), 6, 'project', null, 'User research'],
    // David - leave
    [resourceIds[3], null, fmt(addWeeks(weekStart, 1)), fmt(addDays(addWeeks(weekStart, 1), 4)), 6, 'leave', 'vacation', 'Family trip'],
    // Emma - Website Redesign
    [resourceIds[4], projectIds[0], fmt(weekStart), fmt(addDays(weekStart, 19)), 4, 'project', null, 'Project coordination'],
    // Emma - Mobile App
    [resourceIds[4], projectIds[1], fmt(weekStart), fmt(addDays(weekStart, 19)), 4, 'project', null, 'Project coordination'],
    // Frank - API Integration
    [resourceIds[5], projectIds[3], fmt(addWeeks(weekStart, 2)), fmt(addDays(addWeeks(weekStart, 2), 14)), 8, 'project', null, 'Backend implementation'],
    // Frank - Mobile App (first 2 weeks)
    [resourceIds[5], projectIds[1], fmt(weekStart), fmt(addDays(weekStart, 9)), 8, 'project', null, 'API endpoints'],
    // Grace - Marketing Campaign
    [resourceIds[6], projectIds[4], fmt(weekStart), fmt(addDays(weekStart, 14)), 6, 'project', null, 'Content creation'],
    // Grace - Brand Refresh
    [resourceIds[6], projectIds[2], fmt(addWeeks(weekStart, 1)), fmt(addDays(addWeeks(weekStart, 1), 9)), 2, 'project', null, 'Copy writing'],
    // Henry - Marketing Campaign
    [resourceIds[7], projectIds[4], fmt(weekStart), fmt(addDays(weekStart, 14)), 8, 'project', null, 'Campaign management'],
    // Henry - leave
    [resourceIds[7], null, fmt(addWeeks(weekStart, 3)), fmt(addDays(addWeeks(weekStart, 3), 2)), 8, 'leave', 'sick', 'Doctor appointment'],
    // Bob - leave
    [resourceIds[1], null, fmt(addWeeks(weekStart, 3)), fmt(addDays(addWeeks(weekStart, 3), 4)), 8, 'leave', 'vacation', 'Summer break'],
  ];

  for (const b of bookingsData) {
    insertBooking.run(...b);
  }

  console.log('Database seeded successfully!');
  console.log(`  - ${depts.length} departments`);
  console.log(`  - ${resourcesData.length} resources`);
  console.log(`  - ${projectsData.length} projects`);
  console.log(`  - ${bookingsData.length} bookings`);
}

seed();
