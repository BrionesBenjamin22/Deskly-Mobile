import { Inject, Injectable } from '@nestjs/common';

import { AUTH_REPOSITORY } from '../../domain/ports/auth-repository.port';
import type { AuthRepositoryPort } from '../../domain/ports/auth-repository.port';
import { toManagedUserOutput } from '../dto/managed-user.output';

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly repository: AuthRepositoryPort,
  ) {}

  async execute(input: { page?: number; limit?: number; search?: string }) {
    const page = Math.max(input.page ?? 1, 1);
    const limit = Math.min(Math.max(input.limit ?? 9, 1), 50);
    const result = await this.repository.listUsers({
      page,
      limit,
      ...(input.search?.trim() ? { search: input.search.trim() } : {}),
    });
    return {
      users: result.users.map(toManagedUserOutput),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }
}
