import { Response } from 'express';

interface SuccessOptions<T> {
  statusCode?: number;
  message?: string;
  data?: T;
  meta?: unknown;
}

/**
 * Uniform success envelope so every endpoint returns the same shape:
 *   { success: true, message, data, meta? }
 */
export const sendSuccess = <T>(
  res: Response,
  { statusCode = 200, message = 'OK', data = null as unknown as T, meta }: SuccessOptions<T> = {}
): Response => {
  const body: Record<string, unknown> = { success: true, message, data };
  if (meta !== undefined) body.meta = meta;
  return res.status(statusCode).json(body);
};
