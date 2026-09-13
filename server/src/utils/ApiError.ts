/**
 * Operational error carrying an HTTP status code.
 * Thrown from services/controllers and translated to a JSON response
 * by the central error middleware.
 */
export type ErrorDetails = unknown;

export default class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: ErrorDetails;

  constructor(statusCode: number, message: string, details?: ErrorDetails) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.isOperational = true;
    if (details !== undefined) this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', details?: ErrorDetails): ApiError {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Unauthorized', details?: ErrorDetails): ApiError {
    return new ApiError(401, message, details);
  }

  static forbidden(message = 'Forbidden', details?: ErrorDetails): ApiError {
    return new ApiError(403, message, details);
  }

  static notFound(message = 'Resource not found', details?: ErrorDetails): ApiError {
    return new ApiError(404, message, details);
  }

  static conflict(message = 'Conflict', details?: ErrorDetails): ApiError {
    return new ApiError(409, message, details);
  }

  static unprocessable(message = 'Unprocessable entity', details?: ErrorDetails): ApiError {
    return new ApiError(422, message, details);
  }

  static internal(message = 'Internal server error', details?: ErrorDetails): ApiError {
    return new ApiError(500, message, details);
  }
}
