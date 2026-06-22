import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

import { toPublicUser } from '../../../application/dto/auth.output';
import { AUTH_REPOSITORY } from '../../../domain/ports/auth-repository.port';
import type { AuthRepositoryPort } from '../../../domain/ports/auth-repository.port';

type TokenPayload = { sub?: string };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(AUTH_REPOSITORY) private readonly repository: AuthRepositoryPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: unknown }>();
    const token = this.extractToken(request);
    if (!token) throw this.unauthorized();

    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token);
      if (!payload.sub) throw this.unauthorized();

      const user = await this.repository.findById(payload.sub);
      if (!user || !user.active || user.member?.active === false)
        throw this.unauthorized();

      request.user = toPublicUser(user);
      return true;
    } catch {
      throw this.unauthorized();
    }
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private unauthorized(): UnauthorizedException {
    return new UnauthorizedException({
      message: 'La sesion no es valida o ha expirado.',
      error: 'Lo sentimos, debe iniciar sesion nuevamente para continuar.',
    });
  }
}
