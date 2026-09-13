import { Router, RequestHandler } from 'express';
import type { DashboardController } from '../controllers/dashboard.controller';

interface Deps {
  dashboardController: DashboardController;
  authMiddleware: RequestHandler;
}

export const makeDashboardRouter = ({ dashboardController, authMiddleware }: Deps): Router => {
  const router = Router();
  router.use(authMiddleware);

  /**
   * @openapi
   * /api/dashboard/summary:
   *   get:
   *     tags: [Dashboard]
   *     summary: KPI cards (classrooms, subjects, students, averages, pending entries)
   *     responses:
   *       200: { description: KPI summary }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   */
  router.get('/summary', dashboardController.getSummary);

  /**
   * @openapi
   * /api/dashboard/analytics:
   *   get:
   *     tags: [Dashboard]
   *     summary: Chart datasets (section/subject performance, exam trend, pass-fail, grade distribution)
   *     responses:
   *       200: { description: Analytics datasets }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   */
  router.get('/analytics', dashboardController.getAnalytics);

  /**
   * @openapi
   * /api/dashboard/logs:
   *   get:
   *     tags: [Dashboard]
   *     summary: Score-change log for the teacher's own classes (paginated)
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 20 }
   *     responses:
   *       200:
   *         description: Paginated logs
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessEnvelope'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items: { $ref: '#/components/schemas/ScoreChangeLog' }
   *                     meta: { type: object }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   */
  router.get('/logs', dashboardController.getLogs);

  /**
   * @openapi
   * /api/dashboard/homerooms:
   *   get:
   *     tags: [Dashboard]
   *     summary: List the sections this teacher is class teacher (homeroom) of
   *     responses:
   *       200: { description: Homeroom sections with student counts }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   */
  router.get('/homerooms', dashboardController.getHomerooms);

  /**
   * @openapi
   * /api/dashboard/homeroom/{sectionId}/analytics:
   *   get:
   *     tags: [Dashboard]
   *     summary: Whole-class analytics for a homeroom section (all subjects, all teachers)
   *     parameters:
   *       - in: path
   *         name: sectionId
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200: { description: Whole-class analytics for the homeroom }
   *       404: { $ref: '#/components/responses/NotFound' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   */
  router.get('/homeroom/:sectionId/analytics', dashboardController.getHomeroomAnalytics);

  return router;
};
