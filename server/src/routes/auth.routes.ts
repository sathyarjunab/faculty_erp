import { Router, RequestHandler } from 'express';
import validate from '../middleware/validate.middleware';
import * as rules from '../validators/auth.validator';
import type { AuthController } from '../controllers/auth.controller';

interface Deps {
  authController: AuthController;
  authMiddleware: RequestHandler;
}

export const makeAuthRouter = ({ authController, authMiddleware }: Deps): Router => {
  const router = Router();

  /**
   * @openapi
   * /api/auth/signup:
   *   post:
   *     tags: [Auth]
   *     summary: Self sign-up with email + password
   *     description: Creates a new teacher, or claims a pre-seeded account that shares the email but has no password yet.
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name, email, password]
   *             properties:
   *               name: { type: string, example: Anita Sharma }
   *               email: { type: string, example: anita@school.edu }
   *               password: { type: string, example: secret123 }
   *     responses:
   *       201:
   *         description: Account created and logged in
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessEnvelope'
   *                 - type: object
   *                   properties:
   *                     data: { $ref: '#/components/schemas/AuthTokens' }
   *       409: { description: Email already registered }
   *       400: { $ref: '#/components/responses/ValidationError' }
   */
  router.post('/signup', rules.signup, validate, authController.signup);

  /**
   * @openapi
   * /api/auth/login:
   *   post:
   *     tags: [Auth]
   *     summary: Login with email + password
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password]
   *             properties:
   *               email: { type: string, example: anita@school.edu }
   *               password: { type: string, example: secret123 }
   *     responses:
   *       200:
   *         description: Logged in
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessEnvelope'
   *                 - type: object
   *                   properties:
   *                     data: { $ref: '#/components/schemas/AuthTokens' }
   *       401: { description: Invalid credentials }
   */
  router.post('/login', rules.login, validate, authController.login);

  /**
   * @openapi
   * /api/auth/otp/request:
   *   post:
   *     tags: [Auth]
   *     summary: Request an email OTP
   *     description: Sends a one-time login code to the email if it belongs to a teacher. In dev (no SMTP), the code is returned as data.devCode.
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email]
   *             properties:
   *               email: { type: string, example: anita@school.edu }
   *     responses:
   *       200: { description: Generic success (no email enumeration) }
   */
  router.post('/otp/request', rules.requestOtp, validate, authController.requestOtp);

  /**
   * @openapi
   * /api/auth/otp/verify:
   *   post:
   *     tags: [Auth]
   *     summary: Verify an email OTP and log in
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, code]
   *             properties:
   *               email: { type: string, example: anita@school.edu }
   *               code: { type: string, example: "123456" }
   *     responses:
   *       200:
   *         description: Logged in
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessEnvelope'
   *                 - type: object
   *                   properties:
   *                     data: { $ref: '#/components/schemas/AuthTokens' }
   *       401: { description: Invalid or expired code }
   */
  router.post('/otp/verify', rules.verifyOtp, validate, authController.verifyOtp);

  /**
   * @openapi
   * /api/auth/google:
   *   post:
   *     tags: [Auth]
   *     summary: Login/sign-up with a Google ID token
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [idToken]
   *             properties:
   *               idToken: { type: string, description: Google ID token from the SPA }
   *     responses:
   *       200:
   *         description: Logged in
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessEnvelope'
   *                 - type: object
   *                   properties:
   *                     data: { $ref: '#/components/schemas/AuthTokens' }
   *       401: { description: Invalid Google token }
   */
  router.post('/google', rules.google, validate, authController.googleLogin);

  /**
   * @openapi
   * /api/auth/refresh:
   *   post:
   *     tags: [Auth]
   *     summary: Exchange a refresh token for a new access token
   *     description: Reads the refresh token from the httpOnly cookie or the request body.
   *     security: []
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               refreshToken: { type: string }
   *     responses:
   *       200: { description: New tokens issued }
   *       401: { description: Invalid or expired refresh token }
   */
  router.post('/refresh', authController.refresh);

  /**
   * @openapi
   * /api/auth/logout:
   *   post:
   *     tags: [Auth]
   *     summary: Clear the refresh token cookie
   *     security: []
   *     responses:
   *       200: { description: Logged out }
   */
  router.post('/logout', authController.logout);

  /**
   * @openapi
   * /api/auth/me:
   *   get:
   *     tags: [Auth]
   *     summary: Get the currently authenticated teacher
   *     responses:
   *       200:
   *         description: Current teacher
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
  router.get('/me', authMiddleware, authController.me);

  return router;
};
