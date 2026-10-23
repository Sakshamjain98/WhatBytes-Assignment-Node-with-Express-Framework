import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import bcrypt from 'bcryptjs';
import { ConflictError, UnauthorizedError } from '../../common/errors/app-error';
import type { User } from '../users/user.model';
import type { UserRepository } from '../users/user.repository';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

const tokens = new TokenService({
  JWT_ACCESS_SECRET: 'access-secret-for-tests',
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_SECRET: 'refresh-secret-for-tests',
  JWT_REFRESH_EXPIRES_IN: '7d',
});

const inMemoryUsers = () => {
  const users: User[] = [];
  return {
    create: async (data: Partial<User>) => {
      const user = { ...data, id: users.length + 1, createdAt: new Date() } as User;
      users.push(user);
      return user;
    },
    findByEmail: async (email: string) => users.find((u) => u.email === email) ?? null,
    findById: async (id: number) => users.find((u) => u.id === id) ?? null,
  } as unknown as UserRepository;
};

describe('AuthService', () => {
  it('hashes the password and never returns it', async () => {
    const repo = inMemoryUsers();
    const res = await new AuthService(repo, tokens, 4).register({
      name: 'A',
      email: 'a@x.com',
      password: 'password123',
    });

    assert.equal('password' in res.user, false);
    const stored = await repo.findByEmail('a@x.com');
    assert.ok(stored && (await bcrypt.compare('password123', stored.password)));
  });

  it('rejects duplicate emails and wrong passwords', async () => {
    const service = new AuthService(inMemoryUsers(), tokens, 4);
    await service.register({ name: 'A', email: 'a@x.com', password: 'password123' });

    await assert.rejects(
      service.register({ name: 'B', email: 'a@x.com', password: 'password123' }),
      ConflictError,
    );
    await assert.rejects(service.login({ email: 'a@x.com', password: 'nope-nope' }), UnauthorizedError);
    await assert.rejects(service.login({ email: 'b@x.com', password: 'password123' }), UnauthorizedError);
  });

  it('issues tokens that cannot be swapped for each other', async () => {
    const service = new AuthService(inMemoryUsers(), tokens, 4);
    const { accessToken, refreshToken, user } = await service.register({
      name: 'A',
      email: 'a@x.com',
      password: 'password123',
    });

    assert.equal(tokens.verifyAccessToken(accessToken), user.id);
    assert.throws(() => tokens.verifyAccessToken(refreshToken), UnauthorizedError);
    await assert.rejects(service.refresh({ refreshToken: accessToken }), UnauthorizedError);
    assert.ok((await service.refresh({ refreshToken })).accessToken);
  });
});
