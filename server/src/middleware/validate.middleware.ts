import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError';

/**
 * Runs after a chain of express-validator rules. Collects any errors and
 * converts them into a 400 with a details array.
 */
const validate = (req: Request, _res: Response, next: NextFunction): void => {
  const result = validationResult(req);
  if (result.isEmpty()) {
    next();
    return;
  }

  const details = result.array().map((e) => ({
    field: 'path' in e ? e.path : undefined,
    message: e.msg,
  }));
  next(ApiError.badRequest('Validation failed.', details));
};

export default validate;
