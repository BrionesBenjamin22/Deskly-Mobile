import { Inject, Injectable } from '@nestjs/common';
import { toPublicUser } from '../dto/auth.output';
import {
  SelfRoleChangeForbiddenError,
  UserNotFoundError,
} from '../../domain/errors/auth.errors';
import { UserRoleValue } from '../../domain/entities/user.entity';
import { AUTH_REPOSITORY } from '../../domain/ports/auth-repository.port';
import type { AuthRepositoryPort } from '../../domain/ports/auth-repository.port';

@Injectable()
export class UpdateUserRoleUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly repository: AuthRepositoryPort,
  ) {}

  async execute(input: {
    userId: string;
    role: UserRoleValue;
    actorId: string;
  }) {
    if (input.userId === input.actorId)
      throw new SelfRoleChangeForbiddenError();
    const user = await this.repository.updateRole({
      userId: input.userId,
      role: input.role,
      changedById: input.actorId,
    });
    if (!user) throw new UserNotFoundError();
    return { user: toPublicUser(user) };
  }
}
