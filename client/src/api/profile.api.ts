import { api } from './client';
import type { Teacher } from '../types';

interface Envelope<T> {
  data: T;
}

export const profileApi = {
  get: () => api.get<Envelope<{ teacher: Teacher }>>('/profile').then((r) => r.data.data.teacher),

  update: (body: { name?: string; dept?: string | null; photoUrl?: string | null }) =>
    api.put<Envelope<{ teacher: Teacher }>>('/profile', body).then((r) => r.data.data.teacher),

  changePassword: (body: { currentPassword?: string; newPassword: string }) =>
    api.put<Envelope<{ teacher: Teacher }>>('/profile/password', body).then((r) => r.data.data.teacher),
};
