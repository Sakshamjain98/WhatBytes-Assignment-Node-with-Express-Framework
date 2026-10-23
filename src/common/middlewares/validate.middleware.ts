import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

/** Replaces req.body with the parsed DTO; ZodErrors are turned into 400s by the error handler. */
export const validateBody =
  (schema: ZodTypeAny): RequestHandler =>
  (req, _res, next) => {
    req.body = schema.parse(req.body);
    next();
  };
