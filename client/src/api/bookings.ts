import { api } from './client';
import type { Booking, CreateBookingInput, ScheduleResource } from '../types';

export const bookingsApi = {
  getAll: () => api.get<Booking[]>('/bookings'),
  getById: (id: number) => api.get<Booking>(`/bookings/${id}`),
  create: (data: CreateBookingInput) => api.post<Booking>('/bookings', data),
  update: (id: number, data: Partial<CreateBookingInput>) =>
    api.put<Booking>(`/bookings/${id}`, data),
  delete: (id: number) => api.delete(`/bookings/${id}`),
  getSchedule: (start: string, end: string) =>
    api.get<ScheduleResource[]>(`/bookings/schedule?start=${start}&end=${end}`),
};
