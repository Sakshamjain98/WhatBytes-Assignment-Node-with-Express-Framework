import { z } from 'zod';
import type { UserResponseDto } from '../users/user.dto';

const email = z.string().trim().toLowerCase().email().max(255);

export const registerDto = z
  .object({
    name: z.string().trim().min(1).max(100),
    email,
    password: z.string().min(8).max(72), // bcrypt ignores bytes beyond 72
  })
  .strict();
export type RegisterDto = z.infer<typeof registerDto>;

export const loginDto = z.object({ email, password: z.string().min(1).max(72) }).strict();
export type LoginDto = z.infer<typeof loginDto>;

export const refreshTokenDto = z.object({ refreshToken: z.string().min(1) }).strict();
export type RefreshTokenDto = z.infer<typeof refreshTokenDto>;

export interface AuthTokensDto {
  tokenType: 'Bearer';
  accessToken: string;
  accessTokenExpiresIn: string;
  refreshToken: string;
  refreshTokenExpiresIn: string;
}

export interface AuthResponseDto extends AuthTokensDto {
  user: UserResponseDto;
}
