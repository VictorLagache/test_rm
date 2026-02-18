import { api } from './client';
import type { Resource, CreateResourceInput } from '../types';

export const resourcesApi = {
  getAll: () => api.get<Resource[]>('/resources'),
  getById: (id: number) => api.get<Resource>(`/resources/${id}`),
  create: (data: CreateResourceInput) => api.post<Resource>('/resources', data),
  update: (id: number, data: Partial<CreateResourceInput> & { is_active?: boolean }) =>
    api.put<Resource>(`/resources/${id}`, data),
  delete: (id: number) => api.delete(`/resources/${id}`),
};
