import type { RequestHandler } from 'express';
import { UnauthorizedError } from '../errors/app-error';
import type { TokenService } from '../../modules/auth/token.service';

export const authenticate =
  (tokens: TokenService): RequestHandler =>
  (req, _res, next) => {
    const [scheme, token] = (req.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedError();
    req.user = { id: tokens.verifyAccessToken(token) };
    next();
  };
