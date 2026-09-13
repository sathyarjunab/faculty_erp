import { api } from './client';
import type { ClassroomsResponse, SubjectsResponse } from '../types';

interface Envelope<T> {
  data: T;
}

export const classroomsApi = {
  list: () => api.get<Envelope<ClassroomsResponse>>('/classrooms').then((r) => r.data.data),

  subjects: (sectionId: number) =>
    api.get<Envelope<SubjectsResponse>>(`/classrooms/${sectionId}/subjects`).then((r) => r.data.data),
};
