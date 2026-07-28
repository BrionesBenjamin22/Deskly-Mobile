import { Inject, Injectable } from '@nestjs/common';

import { UserNotFoundError } from '../../domain/errors/auth.errors';
import { AUTH_REPOSITORY } from '../../domain/ports/auth-repository.port';
import type { AuthRepositoryPort } from '../../domain/ports/auth-repository.port';
import { toManagedUserOutput } from '../dto/managed-user.output';

@Injectable()
export class RestoreUserAccessUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly repository: AuthRepositoryPort,
  ) {}

  async execute(input: { userId: string; actorId: string }) {
    const user = await this.repository.restoreAccess({
      userId: input.userId,
      changedById: input.actorId,
    });
    if (!user) throw new UserNotFoundError();
    return { user: toManagedUserOutput(user) };
  }
}
