import { api } from './client';
import type { UtilizationReport, ProjectReport } from '../types';

export const reportsApi = {
  getUtilization: (start: string, end: string) =>
    api.get<UtilizationReport[]>(`/reports/utilization?start=${start}&end=${end}`),
  getProjects: (start: string, end: string) =>
    api.get<ProjectReport[]>(`/reports/projects?start=${start}&end=${end}`),
};
