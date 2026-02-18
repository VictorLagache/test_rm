import { supabase } from '../lib/supabase.js';

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

function toProject(p: Record<string, unknown>): Project {
  return {
    id: p.id as number,
    name: p.name as string,
    client_name: p.client_name as string,
    color: p.color as string,
    start_date: p.start_date as string | null,
    end_date: p.end_date as string | null,
    budget_hours: p.budget_hours as number | null,
    is_active: p.is_active ? 1 : 0,
    created_at: p.created_at as string,
    updated_at: p.updated_at as string,
  };
}

export async function getAllProjects(): Promise<Project[]> {
  const { data, error } = await supabase.from('Project').select('*').order('name');
  if (error) throw new Error(error.message);
  return (data ?? []).map(toProject);
}

export async function getProjectById(id: number): Promise<Project | undefined> {
  const { data, error } = await supabase.from('Project').select('*').eq('id', id).single();
  if (error) return undefined;
  return toProject(data);
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const { data, error } = await supabase
    .from('Project')
    .insert({
      name: input.name,
      client_name: input.client_name ?? '',
      color: input.color ?? '#8B5CF6',
      start_date: input.start_date ?? null,
      end_date: input.end_date ?? null,
      budget_hours: input.budget_hours ?? null,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return toProject(data);
}

export async function updateProject(id: number, input: UpdateProjectInput): Promise<Project | undefined> {
  const existing = await getProjectById(id);
  if (!existing) return undefined;

  const { data, error } = await supabase
    .from('Project')
    .update({
      name: input.name ?? existing.name,
      client_name: input.client_name ?? existing.client_name,
      color: input.color ?? existing.color,
      start_date: input.start_date !== undefined ? input.start_date : existing.start_date,
      end_date: input.end_date !== undefined ? input.end_date : existing.end_date,
      budget_hours: input.budget_hours !== undefined ? input.budget_hours : existing.budget_hours,
      is_active: input.is_active !== undefined ? input.is_active : Boolean(existing.is_active),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return toProject(data);
}

export async function deleteProject(id: number): Promise<boolean> {
  const { error } = await supabase.from('Project').delete().eq('id', id);
  return !error;
}
