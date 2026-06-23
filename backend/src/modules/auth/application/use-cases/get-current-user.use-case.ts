import { Inject, Injectable } from '@nestjs/common';
import { toCurrentUser } from '../dto/auth.output';
import { UserNotFoundError } from '../../domain/errors/auth.errors';
import { AUTH_REPOSITORY } from '../../domain/ports/auth-repository.port';
import type { AuthRepositoryPort } from '../../domain/ports/auth-repository.port';

@Injectable()
export class GetCurrentUserUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly repository: AuthRepositoryPort,
  ) {}

  async execute(userId: string) {
    const user = await this.repository.findById(userId);
    if (!user) throw new UserNotFoundError();
    return { user: toCurrentUser(user) };
  }
}
