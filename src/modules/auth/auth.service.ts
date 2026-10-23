import bcrypt from 'bcryptjs';
import { ConflictError, UnauthorizedError } from '../../common/errors/app-error';
import type { UserRepository } from '../users/user.repository';
import { toUserResponse } from '../users/user.dto';
import type { User } from '../users/user.model';
import type { AuthResponseDto, AuthTokensDto, LoginDto, RefreshTokenDto, RegisterDto } from './auth.dto';
import type { TokenService } from './token.service';

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly tokens: TokenService,
    private readonly saltRounds: number,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    if (await this.users.findByEmail(dto.email)) throw new ConflictError('Email is already registered');
    const password = await bcrypt.hash(dto.password, this.saltRounds);
    return this.authResponse(await this.users.create({ ...dto, password }));
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.users.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedError('Invalid email or password');
    }
    return this.authResponse(user);
  }

  // shortcut: refresh tokens are stateless (no rotation/revocation list); add a token store if logout-everywhere is needed.
  async refresh(dto: RefreshTokenDto): Promise<AuthTokensDto> {
    const userId = this.tokens.verifyRefreshToken(dto.refreshToken);
    if (!(await this.users.findById(userId))) throw new UnauthorizedError('Invalid or expired token');
    return this.tokens.issue(userId);
  }

  private authResponse(user: User): AuthResponseDto {
    return { user: toUserResponse(user), ...this.tokens.issue(user.id) };
  }
}
