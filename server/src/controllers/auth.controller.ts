import { Response, CookieOptions } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import type { AuthService } from '../services/auth.service';
import type { ProfileService } from '../services/profile.service';
import type { AppConfig } from '../config/env';

const REFRESH_COOKIE = 'refreshToken';
const REFRESH_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface AuthControllerDeps {
  authService: AuthService;
  profileService: ProfileService;
  config: AppConfig;
}

export const makeAuthController = ({ authService, profileService, config }: AuthControllerDeps) => {
  const setRefreshCookie = (res: Response, token: string): void => {
    const options: CookieOptions = {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      maxAge: REFRESH_MAX_AGE_MS,
      path: '/api/auth',
    };
    res.cookie(REFRESH_COOKIE, token, options);
  };

  const clearRefreshCookie = (res: Response): void => {
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  };

  const signup = asyncHandler(async (req, res) => {
    const result = await authService.signup(req.body);
    setRefreshCookie(res, result.refreshToken);
    sendSuccess(res, { statusCode: 201, message: 'Account created.', data: result });
  });

  const login = asyncHandler(async (req, res) => {
    const result = await authService.loginWithPassword(req.body);
    setRefreshCookie(res, result.refreshToken);
    sendSuccess(res, { message: 'Logged in.', data: result });
  });

  const requestOtp = asyncHandler(async (req, res) => {
    const result = await authService.requestOtp(req.body);
    sendSuccess(res, { message: 'If the email is registered, a login code has been sent.', data: result });
  });

  const verifyOtp = asyncHandler(async (req, res) => {
    const result = await authService.verifyOtp(req.body);
    setRefreshCookie(res, result.refreshToken);
    sendSuccess(res, { message: 'Logged in.', data: result });
  });

  const googleLogin = asyncHandler(async (req, res) => {
    const result = await authService.loginWithGoogle(req.body);
    setRefreshCookie(res, result.refreshToken);
    sendSuccess(res, { message: 'Logged in with Google.', data: result });
  });

  const refresh = asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
    const result = await authService.refresh(token);
    setRefreshCookie(res, result.refreshToken);
    sendSuccess(res, { message: 'Token refreshed.', data: result });
  });

  const logout = asyncHandler(async (_req, res) => {
    clearRefreshCookie(res);
    sendSuccess(res, { message: 'Logged out.' });
  });

  const me = asyncHandler(async (req, res) => {
    const teacher = await profileService.getProfile(req.user!.id);
    sendSuccess(res, { message: 'OK', data: { teacher } });
  });

  return { signup, login, requestOtp, verifyOtp, googleLogin, refresh, logout, me };
};

export type AuthController = ReturnType<typeof makeAuthController>;
