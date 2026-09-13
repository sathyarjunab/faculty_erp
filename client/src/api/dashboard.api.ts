import { api } from './client';
import type { DashboardSummary, DashboardAnalytics, ScoreChangeLogEntry, PaginationMeta } from '../types';

interface Envelope<T> {
  data: T;
}

interface LogsEnvelope {
  data: ScoreChangeLogEntry[];
  meta: PaginationMeta;
}

export const dashboardApi = {
  summary: () => api.get<Envelope<DashboardSummary>>('/dashboard/summary').then((r) => r.data.data),

  analytics: () => api.get<Envelope<DashboardAnalytics>>('/dashboard/analytics').then((r) => r.data.data),

  logs: (page = 1, limit = 10) =>
    api
      .get<LogsEnvelope>('/dashboard/logs', { params: { page, limit } })
      .then((r) => ({ logs: r.data.data, meta: r.data.meta })),
};
