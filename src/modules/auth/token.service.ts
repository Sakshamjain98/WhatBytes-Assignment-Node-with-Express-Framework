import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import type { Env } from '../../config/env';
import { UnauthorizedError } from '../../common/errors/app-error';
import type { AuthTokensDto } from './auth.dto';

type TokenConfig = Pick<
  Env,
  'JWT_ACCESS_SECRET' | 'JWT_ACCESS_EXPIRES_IN' | 'JWT_REFRESH_SECRET' | 'JWT_REFRESH_EXPIRES_IN'
>;

// Access and refresh tokens use different secrets, so one can never be used as the other.
export class TokenService {
  constructor(private readonly config: TokenConfig) {}

  issue(userId: number): AuthTokensDto {
    const c = this.config;
    return {
      tokenType: 'Bearer',
      accessToken: this.sign(userId, c.JWT_ACCESS_SECRET, c.JWT_ACCESS_EXPIRES_IN),
      accessTokenExpiresIn: c.JWT_ACCESS_EXPIRES_IN,
      refreshToken: this.sign(userId, c.JWT_REFRESH_SECRET, c.JWT_REFRESH_EXPIRES_IN),
      refreshTokenExpiresIn: c.JWT_REFRESH_EXPIRES_IN,
    };
  }

  verifyAccessToken(token: string): number {
    return this.verify(token, this.config.JWT_ACCESS_SECRET);
  }

  verifyRefreshToken(token: string): number {
    return this.verify(token, this.config.JWT_REFRESH_SECRET);
  }

  private sign(userId: number, secret: string, expiresIn: string): string {
    return jwt.sign({}, secret, {
      subject: String(userId),
      expiresIn: expiresIn as SignOptions['expiresIn'],
      algorithm: 'HS256',
    });
  }

  private verify(token: string, secret: string): number {
    try {
      const { sub } = jwt.verify(token, secret, { algorithms: ['HS256'] }) as jwt.JwtPayload;
      const id = Number(sub);
      if (!Number.isInteger(id) || id <= 0) throw new Error('bad subject');
      return id;
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }
}
