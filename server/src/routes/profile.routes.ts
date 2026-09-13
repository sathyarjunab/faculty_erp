import { Router, RequestHandler } from 'express';
import validate from '../middleware/validate.middleware';
import * as rules from '../validators/profile.validator';
import type { ProfileController } from '../controllers/profile.controller';

interface Deps {
  profileController: ProfileController;
  authMiddleware: RequestHandler;
}

export const makeProfileRouter = ({ profileController, authMiddleware }: Deps): Router => {
  const router = Router();
  router.use(authMiddleware);

  /**
   * @openapi
   * /api/profile:
   *   get:
   *     tags: [Profile]
   *     summary: Get the current teacher's profile
   *     responses:
   *       200:
   *         description: Profile
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
   *                         teacher: { $ref: '#/components/schemas/Teacher' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   */
  router.get('/', profileController.getProfile);

  /**
   * @openapi
   * /api/profile:
   *   put:
   *     tags: [Profile]
   *     summary: Update the current teacher's profile
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name: { type: string }
   *               dept: { type: string }
   *               photoUrl: { type: string }
   *     responses:
   *       200: { description: Updated }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   */
  router.put('/', rules.updateProfile, validate, profileController.updateProfile);

  /**
   * @openapi
   * /api/profile/password:
   *   put:
   *     tags: [Profile]
   *     summary: Change / set the account password
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [newPassword]
   *             properties:
   *               currentPassword: { type: string, description: Required only if a password is already set }
   *               newPassword: { type: string }
   *     responses:
   *       200: { description: Password updated }
   *       400: { description: Current password incorrect / validation error }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   */
  router.put('/password', rules.changePassword, validate, profileController.changePassword);

  return router;
};
