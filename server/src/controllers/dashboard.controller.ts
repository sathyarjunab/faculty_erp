import asyncHandler from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import type { DashboardService } from '../services/dashboard.service';

export const makeDashboardController = ({ dashboardService }: { dashboardService: DashboardService }) => {
  const getSummary = asyncHandler(async (req, res) => {
    const data = await dashboardService.getSummary(req.user!.id);
    sendSuccess(res, { message: 'OK', data });
  });

  const getAnalytics = asyncHandler(async (req, res) => {
    const data = await dashboardService.getAnalytics(req.user!.id);
    sendSuccess(res, { message: 'OK', data });
  });

  const getLogs = asyncHandler(async (req, res) => {
    const page = req.query.page as string | undefined;
    const limit = req.query.limit as string | undefined;
    const data = await dashboardService.getLogs(req.user!.id, { page, limit });
    sendSuccess(res, { message: 'OK', data: data.logs, meta: data.meta });
  });

  const getHomerooms = asyncHandler(async (req, res) => {
    const data = await dashboardService.getHomerooms(req.user!.id);
    sendSuccess(res, { message: 'OK', data });
  });

  const getHomeroomAnalytics = asyncHandler(async (req, res) => {
    const sectionId = Number(req.params.sectionId);
    const data = await dashboardService.getHomeroomAnalytics(req.user!.id, sectionId);
    sendSuccess(res, { message: 'OK', data });
  });

  return { getSummary, getAnalytics, getLogs, getHomerooms, getHomeroomAnalytics };
};

export type DashboardController = ReturnType<typeof makeDashboardController>;
