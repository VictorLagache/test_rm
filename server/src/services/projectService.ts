import { getDb } from '../db/connection.js';

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

export interface CreateProjectInput {
  name: string;
  client_name?: string;
  color?: string;
  start_date?: string | null;
  end_date?: string | null;
  budget_hours?: number | null;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  is_active?: boolean;
}

export function getAllProjects(): Project[] {
  const db = getDb();
  return db.prepare('SELECT * FROM projects ORDER BY name').all() as Project[];
}

export function getProjectById(id: number): Project | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project | undefined;
}

export function createProject(input: CreateProjectInput): Project {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO projects (name, client_name, color, start_date, end_date, budget_hours)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    input.name,
    input.client_name ?? '',
    input.color ?? '#8B5CF6',
    input.start_date ?? null,
    input.end_date ?? null,
    input.budget_hours ?? null
  );
  return getProjectById(Number(result.lastInsertRowid))!;
}

export function updateProject(id: number, input: UpdateProjectInput): Project | undefined {
  const db = getDb();
  const existing = getProjectById(id);
  if (!existing) return undefined;

  db.prepare(`
    UPDATE projects
    SET name = ?, client_name = ?, color = ?, start_date = ?, end_date = ?,
        budget_hours = ?, is_active = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    input.name ?? existing.name,
    input.client_name ?? existing.client_name,
    input.color ?? existing.color,
    input.start_date !== undefined ? input.start_date : existing.start_date,
    input.end_date !== undefined ? input.end_date : existing.end_date,
    input.budget_hours !== undefined ? input.budget_hours : existing.budget_hours,
    input.is_active !== undefined ? (input.is_active ? 1 : 0) : existing.is_active,
    id
  );
  return getProjectById(id);
}

export function deleteProject(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  return result.changes > 0;
}
