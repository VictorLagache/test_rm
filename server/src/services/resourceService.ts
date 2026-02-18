import { getDb } from '../db/connection.js';

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

export interface CreateResourceInput {
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
  department_id?: number | null;
  capacity_hours?: number;
  color?: string;
}

export interface UpdateResourceInput extends Partial<CreateResourceInput> {
  is_active?: boolean;
}

export function getAllResources(): Resource[] {
  const db = getDb();
  return db.prepare(`
    SELECT r.*, d.name as department_name
    FROM resources r
    LEFT JOIN departments d ON r.department_id = d.id
    ORDER BY r.first_name, r.last_name
  `).all() as Resource[];
}

export function getResourceById(id: number): Resource | undefined {
  const db = getDb();
  return db.prepare(`
    SELECT r.*, d.name as department_name
    FROM resources r
    LEFT JOIN departments d ON r.department_id = d.id
    WHERE r.id = ?
  `).get(id) as Resource | undefined;
}

export function createResource(input: CreateResourceInput): Resource {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO resources (first_name, last_name, email, role, department_id, capacity_hours, color)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.first_name,
    input.last_name,
    input.email,
    input.role ?? '',
    input.department_id ?? null,
    input.capacity_hours ?? 8,
    input.color ?? '#3B82F6'
  );
  return getResourceById(Number(result.lastInsertRowid))!;
}

export function updateResource(id: number, input: UpdateResourceInput): Resource | undefined {
  const db = getDb();
  const existing = getResourceById(id);
  if (!existing) return undefined;

  db.prepare(`
    UPDATE resources
    SET first_name = ?, last_name = ?, email = ?, role = ?,
        department_id = ?, capacity_hours = ?, color = ?, is_active = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(
    input.first_name ?? existing.first_name,
    input.last_name ?? existing.last_name,
    input.email ?? existing.email,
    input.role ?? existing.role,
    input.department_id !== undefined ? input.department_id : existing.department_id,
    input.capacity_hours ?? existing.capacity_hours,
    input.color ?? existing.color,
    input.is_active !== undefined ? (input.is_active ? 1 : 0) : existing.is_active,
    id
  );
  return getResourceById(id);
}

export function deleteResource(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM resources WHERE id = ?').run(id);
  return result.changes > 0;
}
