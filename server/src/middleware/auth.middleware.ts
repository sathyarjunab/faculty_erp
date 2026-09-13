import { RequestHandler } from 'express';
import ApiError from '../utils/ApiError';
import type { TokenService } from '../services/token.service';

/**
 * Auth middleware factory. Verifies the Bearer access token and attaches
 * req.user = { id, email }. Injected with the tokenService so it stays testable.
 */
export const makeAuthMiddleware = ({ tokenService }: { tokenService: TokenService }): RequestHandler => (
  req,
  _res,
  next
) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(ApiError.unauthorized('Authentication required. Provide a Bearer access token.'));
  }

  try {
    const decoded = tokenService.verifyAccessToken(token);
    req.user = { id: decoded.sub, email: decoded.email };
    return next();
  } catch {
    return next(ApiError.unauthorized('Invalid or expired access token.'));
  }
};
