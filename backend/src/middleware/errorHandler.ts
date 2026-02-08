/**
 * Centralized Error Handler
 * Consistent error response format across all routes
 */

import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../lib/logger';

const logger = createLogger('error-handler');

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super('Too many requests', 429, 'RATE_LIMIT_EXCEEDED');
  }
}

/**
 * Global error handler middleware
 */
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const requestId = req.requestId || 'unknown';

  if (err instanceof AppError) {
    logger.warn(`Operational error: ${err.message}`, {
      requestId,
      code: err.code,
      statusCode: err.statusCode,
      path: req.path,
    });

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
      requestId,
    });
    return;
  }

  // Unexpected error
  logger.error('Unexpected error', err);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    },
    requestId,
  });
}

/**
 * Async route handler wrapper - catches async errors and forwards to error handler
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
