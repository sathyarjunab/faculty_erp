import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import ApiError from '../utils/ApiError';
import type { Logger } from '../utils/logger';
import type { AppConfig } from '../config/env';

interface SequelizeErrorItem {
  path?: string;
  message?: string;
}

/** 404 handler for unmatched routes. */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Central error handler factory. Translates ApiError, Sequelize and JWT errors
 * into the uniform ErrorEnvelope shape.
 */
export const makeErrorHandler = ({ logger, config }: { logger: Logger; config: AppConfig }): ErrorRequestHandler => (
  err,
  _req,
  res,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next
) => {
  let statusCode: number = err.statusCode || 500;
  let message: string = err.message || 'Internal server error';
  let details: unknown = err.details;

  switch (err.name) {
    case 'SequelizeUniqueConstraintError':
      statusCode = 409;
      message = 'A record with these values already exists.';
      details = (err.errors as SequelizeErrorItem[] | undefined)?.map((e) => ({ field: e.path, message: e.message }));
      break;
    case 'SequelizeValidationError':
      statusCode = 400;
      message = 'Validation failed.';
      details = (err.errors as SequelizeErrorItem[] | undefined)?.map((e) => ({ field: e.path, message: e.message }));
      break;
    case 'SequelizeForeignKeyConstraintError':
      statusCode = 409;
      message = 'Related record constraint failed.';
      break;
    case 'JsonWebTokenError':
    case 'TokenExpiredError':
      statusCode = 401;
      message = 'Invalid or expired token.';
      break;
    default:
      break;
  }

  if (statusCode >= 500) {
    logger.error(err.stack || err);
  }

  const body: Record<string, unknown> = { success: false, message };
  if (details) body.details = details;
  if (!config.isProduction && statusCode >= 500) body.stack = err.stack;

  res.status(statusCode).json(body);
};
