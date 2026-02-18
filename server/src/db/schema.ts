import { getDb } from './connection.js';

export function initializeDatabase(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT '',
      department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
      capacity_hours REAL NOT NULL DEFAULT 8.0,
      color TEXT NOT NULL DEFAULT '#3B82F6',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      client_name TEXT NOT NULL DEFAULT '',
      color TEXT NOT NULL DEFAULT '#8B5CF6',
      start_date TEXT,
      end_date TEXT,
      budget_hours REAL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      hours_per_day REAL NOT NULL DEFAULT 8.0,
      booking_type TEXT NOT NULL CHECK (booking_type IN ('project', 'leave')),
      leave_type TEXT CHECK (leave_type IN ('vacation', 'sick', 'personal', 'other')),
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      CHECK (
        (booking_type = 'project' AND project_id IS NOT NULL) OR
        (booking_type = 'leave' AND leave_type IS NOT NULL)
      )
    );

    CREATE INDEX IF NOT EXISTS idx_bookings_resource_dates
      ON bookings(resource_id, start_date, end_date);

    CREATE INDEX IF NOT EXISTS idx_bookings_project
      ON bookings(project_id);

    CREATE INDEX IF NOT EXISTS idx_resources_department
      ON resources(department_id);
  `);
}
