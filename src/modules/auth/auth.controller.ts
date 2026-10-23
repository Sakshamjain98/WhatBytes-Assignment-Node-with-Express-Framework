import type { Response } from 'express';
import type { TypedRequest } from '../../types/http';
import type { LoginDto, RefreshTokenDto, RegisterDto } from './auth.dto';
import type { AuthService } from './auth.service';

export class AuthController {
  constructor(private readonly service: AuthService) {}

  register = async (req: TypedRequest<RegisterDto>, res: Response) => {
    res.status(201).json(await this.service.register(req.body));
  };

  login = async (req: TypedRequest<LoginDto>, res: Response) => {
    res.json(await this.service.login(req.body));
  };

  refresh = async (req: TypedRequest<RefreshTokenDto>, res: Response) => {
    res.json(await this.service.refresh(req.body));
  };
}
