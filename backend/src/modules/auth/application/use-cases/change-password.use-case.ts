import { Inject, Injectable } from '@nestjs/common';

import {
  InvalidCurrentPasswordError,
  UserNotFoundError,
} from '../../domain/errors/auth.errors';
import { AUTH_REPOSITORY } from '../../domain/ports/auth-repository.port';
import type { AuthRepositoryPort } from '../../domain/ports/auth-repository.port';
import { PASSWORD_HASHER } from '../../domain/ports/password-hasher.port';
import type { PasswordHasherPort } from '../../domain/ports/password-hasher.port';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly repository: AuthRepositoryPort,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(input: {
    userId: string;
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    const user = await this.repository.findById(input.userId);
    if (!user) throw new UserNotFoundError();

    const isValid = await this.passwordHasher.compare(
      input.currentPassword,
      user.passwordHash,
    );
    if (!isValid) throw new InvalidCurrentPasswordError();

    const newPasswordHash = await this.passwordHasher.hash(input.newPassword);
    await this.repository.changePassword({
      userId: input.userId,
      newPasswordHash,
    });
  }
}
