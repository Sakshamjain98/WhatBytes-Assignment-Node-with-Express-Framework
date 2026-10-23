import type { User } from './user.model';

export interface UserResponseDto {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

// Explicit field list so the password hash can never leak into a response.
export const toUserResponse = (user: User): UserResponseDto => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});
