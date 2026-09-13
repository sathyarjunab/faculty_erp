import { api } from './client';
import type { ExamsResponse, MarksSheet, SaveMarksResult, MarkEntryInput } from '../types';

interface Envelope<T> {
  data: T;
}

export const marksApi = {
  exams: (assignmentId: number) =>
    api.get<Envelope<ExamsResponse>>(`/assignments/${assignmentId}/exams`).then((r) => r.data.data),

  sheet: (assignmentId: number, examId: number) =>
    api
      .get<Envelope<MarksSheet>>('/marks', { params: { assignmentId, examId } })
      .then((r) => r.data.data),

  save: (body: { assignmentId: number; examId: number; entries: MarkEntryInput[] }) =>
    api.post<Envelope<SaveMarksResult>>('/marks', body).then((r) => r.data.data),

  exportBlob: (assignmentId: number, examId: number) =>
    api
      .get('/marks/export', { params: { assignmentId, examId }, responseType: 'blob' })
      .then((r) => r.data as Blob),
};
