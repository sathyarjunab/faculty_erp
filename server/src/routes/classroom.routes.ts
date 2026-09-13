import { Router, RequestHandler } from 'express';
import { param } from 'express-validator';
import validate from '../middleware/validate.middleware';
import type { ClassroomController } from '../controllers/classroom.controller';

interface Deps {
  classroomController: ClassroomController;
  authMiddleware: RequestHandler;
}

export const makeClassroomRouter = ({ classroomController, authMiddleware }: Deps): Router => {
  const router = Router();
  router.use(authMiddleware);

  /**
   * @openapi
   * /api/classrooms:
   *   get:
   *     tags: [Classrooms]
   *     summary: List the class-sections the teacher handles this year
   *     responses:
   *       200:
   *         description: Classrooms
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessEnvelope'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: object
   *                       properties:
   *                         academicYear: { type: object }
   *                         classrooms:
   *                           type: array
   *                           items: { $ref: '#/components/schemas/Classroom' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   */
  router.get('/', classroomController.listClassrooms);

  /**
   * @openapi
   * /api/classrooms/{sectionId}/subjects:
   *   get:
   *     tags: [Classrooms]
   *     summary: List the subjects the teacher teaches in a classroom (section)
   *     parameters:
   *       - in: path
   *         name: sectionId
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         description: Subjects for this classroom
   *       404: { $ref: '#/components/responses/NotFound' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   */
  router.get(
    '/:sectionId/subjects',
    [param('sectionId').isInt({ min: 1 }).withMessage('Valid sectionId is required.')],
    validate,
    classroomController.listSubjects
  );

  return router;
};
