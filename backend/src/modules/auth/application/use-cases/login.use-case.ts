import { Inject, Injectable } from '@nestjs/common';
import { SessionTokenService } from '../services/session-token.service';
import {
  BlockedUserError,
  InactiveUserError,
  InvalidCredentialsError,
} from '../../domain/errors/auth.errors';
import { AUTH_REPOSITORY } from '../../domain/ports/auth-repository.port';
import type { AuthRepositoryPort } from '../../domain/ports/auth-repository.port';
import { PASSWORD_HASHER } from '../../domain/ports/password-hasher.port';
import type { PasswordHasherPort } from '../../domain/ports/password-hasher.port';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly repository: AuthRepositoryPort,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasherPort,
    private readonly sessionTokenService: SessionTokenService,
  ) {}

  async execute(input: { identifier: string; password: string }) {
    const user = await this.repository.findByIdentifier(
      input.identifier.trim().toLowerCase(),
    );
    const validPassword = user
      ? await this.passwordHasher.compare(input.password, user.passwordHash)
      : false;

    if (!user || !validPassword) throw new InvalidCredentialsError();
    if (!user.active || user.member?.active === false)
      throw new InactiveUserError();
    if (user.blockedUntil && user.blockedUntil.getTime() > Date.now())
      throw new BlockedUserError(user.blockedUntil);

    return this.sessionTokenService.issue(user);
  }
}
