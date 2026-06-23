import { Inject, Injectable } from '@nestjs/common';

import { AUTH_REPOSITORY } from '../../domain/ports/auth-repository.port';
import type { AuthRepositoryPort } from '../../domain/ports/auth-repository.port';

@Injectable()
export class GetRegistrationStatusUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly repository: AuthRepositoryPort,
  ) {}

  async execute() {
    return {
      requiresMember: await this.repository.hasUsers(),
    };
  }
}
