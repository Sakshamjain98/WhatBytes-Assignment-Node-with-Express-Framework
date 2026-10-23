import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { env } from '../../config/env';
import { authController } from '../../container';
import { validateBody } from '../../common/middlewares/validate.middleware';
import { TooManyRequestsBody } from '../../common/dto/error-response.dto';
import { loginDto, refreshTokenDto, registerDto } from './auth.dto';

// Brute-force protection on credential endpoints.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: TooManyRequestsBody,
});

export const authRouter = Router();
authRouter.use(authLimiter);
authRouter.post('/register', validateBody(registerDto), authController.register);
authRouter.post('/login', validateBody(loginDto), authController.login);
authRouter.post('/refresh', validateBody(refreshTokenDto), authController.refresh);
