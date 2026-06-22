import { Inject, Injectable } from '@nestjs/common';

import { toPublicUser } from '../dto/auth.output';
import { MemberDataRequiredError } from '../../domain/errors/auth.errors';
import { AUTH_REPOSITORY } from '../../domain/ports/auth-repository.port';
import type { AuthRepositoryPort } from '../../domain/ports/auth-repository.port';
import { PASSWORD_HASHER } from '../../domain/ports/password-hasher.port';
import type { PasswordHasherPort } from '../../domain/ports/password-hasher.port';

export type RegisterInput = {
  email: string;
  username: string;
  password: string;
  member?: { firstName: string; lastName: string };
};

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly repository: AuthRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(input: RegisterInput) {
    const passwordHash = await this.passwordHasher.hash(input.password);
    const result = await this.repository.register({
      email: input.email.trim().toLowerCase(),
      username: input.username.trim().toLowerCase(),
      passwordHash,
      member: input.member
        ? { firstName: input.member.firstName.trim(), lastName: input.member.lastName.trim() }
        : undefined,
    });

    if (!result.isFirstUser && !result.user.member) {
      throw new MemberDataRequiredError();
    }

    return { user: toPublicUser(result.user) };
  }
}
