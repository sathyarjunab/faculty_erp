import { api } from './client';
import type { AuthResult, Teacher } from '../types';

interface Envelope<T> {
  data: T;
}

export const authApi = {
  signup: (body: { name: string; email: string; password: string }) =>
    api.post<Envelope<AuthResult>>('/auth/signup', body).then((r) => r.data.data),

  login: (body: { email: string; password: string }) =>
    api.post<Envelope<AuthResult>>('/auth/login', body).then((r) => r.data.data),

  requestOtp: (email: string) =>
    api
      .post<Envelope<{ emailSent: boolean; devCode?: string }>>('/auth/otp/request', { email })
      .then((r) => r.data.data),

  verifyOtp: (email: string, code: string) =>
    api.post<Envelope<AuthResult>>('/auth/otp/verify', { email, code }).then((r) => r.data.data),

  google: (idToken: string) =>
    api.post<Envelope<AuthResult>>('/auth/google', { idToken }).then((r) => r.data.data),

  me: () => api.get<Envelope<{ teacher: Teacher }>>('/auth/me').then((r) => r.data.data.teacher),

  logout: () => api.post('/auth/logout').then(() => undefined),
};
