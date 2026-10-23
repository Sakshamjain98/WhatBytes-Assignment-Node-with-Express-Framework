import type { Request } from 'express';
import { UnauthorizedError } from '../errors/app-error';

export const currentUserId = (req: Request): number => {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
};
