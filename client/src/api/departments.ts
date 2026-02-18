import { api } from './client';
import type { Department } from '../types';

export const departmentsApi = {
  getAll: () => api.get<Department[]>('/departments'),
  create: (name: string) => api.post<Department>('/departments', { name }),
};
