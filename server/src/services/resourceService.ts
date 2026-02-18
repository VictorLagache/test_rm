import { supabase } from '../lib/supabase.js';

export interface Resource {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  department_id: number | null;
  department_name?: string | null;
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

function toResource(r: Record<string, unknown>): Resource {
  const dept = r.Department as { name: string } | null;
  return {
    id: r.id as number,
    first_name: r.first_name as string,
    last_name: r.last_name as string,
    email: r.email as string,
    role: r.role as string,
    department_id: r.department_id as number | null,
    department_name: dept?.name ?? null,
    capacity_hours: r.capacity_hours as number,
    color: r.color as string,
    is_active: r.is_active ? 1 : 0,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
  };
}

export async function getAllResources(): Promise<Resource[]> {
  const { data, error } = await supabase
    .from('Resource')
    .select('*, Department(name)')
    .order('first_name')
    .order('last_name');
  if (error) throw new Error(error.message);
  return (data ?? []).map(toResource);
}

export async function getResourceById(id: number): Promise<Resource | undefined> {
  const { data, error } = await supabase
    .from('Resource')
    .select('*, Department(name)')
    .eq('id', id)
    .single();
  if (error) return undefined;
  return toResource(data);
}

export async function createResource(input: CreateResourceInput): Promise<Resource> {
  const { data, error } = await supabase
    .from('Resource')
    .insert({
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email,
      role: input.role ?? '',
      department_id: input.department_id ?? null,
      capacity_hours: input.capacity_hours ?? 8,
      color: input.color ?? '#3B82F6',
    })
    .select('*, Department(name)')
    .single();
  if (error) throw new Error(error.message);
  return toResource(data);
}

export async function updateResource(id: number, input: UpdateResourceInput): Promise<Resource | undefined> {
  const existing = await getResourceById(id);
  if (!existing) return undefined;

  const { data, error } = await supabase
    .from('Resource')
    .update({
      first_name: input.first_name ?? existing.first_name,
      last_name: input.last_name ?? existing.last_name,
      email: input.email ?? existing.email,
      role: input.role ?? existing.role,
      department_id: input.department_id !== undefined ? input.department_id : existing.department_id,
      capacity_hours: input.capacity_hours ?? existing.capacity_hours,
      color: input.color ?? existing.color,
      is_active: input.is_active !== undefined ? input.is_active : Boolean(existing.is_active),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, Department(name)')
    .single();
  if (error) throw new Error(error.message);
  return toResource(data);
}

export async function deleteResource(id: number): Promise<boolean> {
  const { error } = await supabase.from('Resource').delete().eq('id', id);
  return !error;
}
