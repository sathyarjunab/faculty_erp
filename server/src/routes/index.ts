import { Router, RequestHandler } from 'express';
import { makeAuthRouter } from './auth.routes';
import { makeProfileRouter } from './profile.routes';
import { makeClassroomRouter } from './classroom.routes';
import { makeMarksRouter } from './marks.routes';
import { makeDashboardRouter } from './dashboard.routes';
import type { Controllers } from '../controllers';

interface Deps {
  controllers: Controllers;
  authMiddleware: RequestHandler;
}

/**
 * Route registry factory. Builds each router with its controller + the auth
 * middleware, then mounts them under /api.
 */
export const makeRoutes = ({ controllers, authMiddleware }: Deps): Router => {
  const router = Router();

  router.use('/api/auth', makeAuthRouter({ authController: controllers.auth, authMiddleware }));
  router.use('/api/profile', makeProfileRouter({ profileController: controllers.profile, authMiddleware }));
  router.use('/api/classrooms', makeClassroomRouter({ classroomController: controllers.classroom, authMiddleware }));
  router.use('/api', makeMarksRouter({ marksController: controllers.marks, authMiddleware }));
  router.use('/api/dashboard', makeDashboardRouter({ dashboardController: controllers.dashboard, authMiddleware }));

  return router;
};
