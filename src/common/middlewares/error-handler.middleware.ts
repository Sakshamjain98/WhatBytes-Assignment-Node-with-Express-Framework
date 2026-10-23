import type { ErrorRequestHandler, RequestHandler } from 'express';
import { UniqueConstraintError, ForeignKeyConstraintError } from 'sequelize';
import { ZodError } from 'zod';
import { AppError, ConflictError, NotFoundError } from '../errors/app-error';
import type { ErrorResponseDto } from '../dto/error-response.dto';

export const notFoundHandler: RequestHandler = (req) => {
  throw new NotFoundError(`Route ${req.method} ${req.path}`);
};

const toAppError = (err: unknown): AppError | undefined => {
  if (err instanceof AppError) return err;
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return new AppError(400, 'VALIDATION_ERROR', 'Validation failed', details);
  }
  if (err instanceof UniqueConstraintError) return new ConflictError();
  if (err instanceof ForeignKeyConstraintError) {
    return new AppError(400, 'BAD_REFERENCE', 'Referenced resource does not exist');
  }
  // body-parser errors (malformed JSON, payload too large) carry a 4xx status
  const status = (err as { status?: number }).status;
  if (status && status >= 400 && status < 500) {
    return new AppError(status, 'BAD_REQUEST', (err as Error).message);
  }
  return undefined;
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const appError = toAppError(err);
  if (!appError) req.log.error({ err }, 'Unhandled error');

  const { statusCode, code, message, details } =
    appError ?? new AppError(500, 'INTERNAL_ERROR', 'Internal server error');
  const body: ErrorResponseDto = { error: { code, message, ...(details !== undefined && { details }) } };
  res.status(statusCode).json(body);
};
