import { Router, RequestHandler } from 'express';
import validate from '../middleware/validate.middleware';
import * as rules from '../validators/marks.validator';
import type { MarksController } from '../controllers/marks.controller';

interface Deps {
  marksController: MarksController;
  authMiddleware: RequestHandler;
}

/**
 * Mounted at /api so it can expose both /assignments/:id/exams and /marks/*.
 */
export const makeMarksRouter = ({ marksController, authMiddleware }: Deps): Router => {
  const router = Router();
  router.use(authMiddleware);

  /**
   * @openapi
   * /api/assignments/{assignmentId}/exams:
   *   get:
   *     tags: [Marks]
   *     summary: List the exams available for a subject/classroom assignment
   *     parameters:
   *       - in: path
   *         name: assignmentId
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         description: Exams for the assignment's class
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
   *                         exams:
   *                           type: array
   *                           items: { $ref: '#/components/schemas/Exam' }
   *       404: { $ref: '#/components/responses/NotFound' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   */
  router.get('/assignments/:assignmentId/exams', rules.assignmentParam, validate, marksController.listExams);

  /**
   * @openapi
   * /api/marks:
   *   get:
   *     tags: [Marks]
   *     summary: Get the student marks sheet for a subject + exam
   *     parameters:
   *       - in: query
   *         name: assignmentId
   *         required: true
   *         schema: { type: integer }
   *       - in: query
   *         name: examId
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         description: Students with their marks
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
   *                         students:
   *                           type: array
   *                           items: { $ref: '#/components/schemas/StudentMark' }
   *       404: { $ref: '#/components/responses/NotFound' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   */
  router.get('/marks', rules.sheetQuery, validate, marksController.getMarksSheet);

  /**
   * @openapi
   * /api/marks:
   *   post:
   *     tags: [Marks]
   *     summary: Bulk create/update marks (writes a change log per change)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [assignmentId, examId, entries]
   *             properties:
   *               assignmentId: { type: integer, example: 7 }
   *               examId: { type: integer, example: 4 }
   *               entries:
   *                 type: array
   *                 items: { $ref: '#/components/schemas/MarkInput' }
   *     responses:
   *       200:
   *         description: Marks saved; returns the refreshed sheet with created/updated counts
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       404: { $ref: '#/components/responses/NotFound' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   */
  router.post('/marks', rules.saveMarks, validate, marksController.saveMarks);

  /**
   * @openapi
   * /api/marks/export:
   *   get:
   *     tags: [Marks]
   *     summary: Download the marks sheet as an Excel (.xlsx) file
   *     parameters:
   *       - in: query
   *         name: assignmentId
   *         required: true
   *         schema: { type: integer }
   *       - in: query
   *         name: examId
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         description: Excel file
   *         content:
   *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
   *             schema: { type: string, format: binary }
   *       404: { $ref: '#/components/responses/NotFound' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   */
  router.get('/marks/export', rules.sheetQuery, validate, marksController.exportMarks);

  return router;
};
