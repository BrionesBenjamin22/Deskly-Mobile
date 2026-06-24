import { Inject, Injectable } from '@nestjs/common';
import { toCurrentUser } from '../dto/auth.output';
import { UserNotFoundError } from '../../domain/errors/auth.errors';
import { AUTH_REPOSITORY } from '../../domain/ports/auth-repository.port';
import type { AuthRepositoryPort } from '../../domain/ports/auth-repository.port';

export type UpdateProfileInput = {
  userId: string;
  email?: string;
  username?: string;
  fullName?: string;
  phone?: number;
};

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly repository: AuthRepositoryPort,
  ) {}

  async execute(input: UpdateProfileInput) {
    const user = await this.repository.updateProfile({
      userId: input.userId,
      email: input.email,
      username: input.username,
      fullName: input.fullName,
      phone: input.phone,
    });

    if (!user) throw new UserNotFoundError();
    return { user: toCurrentUser(user) };
  }
}
