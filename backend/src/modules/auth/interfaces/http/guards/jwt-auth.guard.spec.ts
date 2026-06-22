import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { User } from '../../../domain/entities/user.entity';
import type { AuthRepositoryPort } from '../../../domain/ports/auth-repository.port';
import { JwtAuthGuard } from './jwt-auth.guard';

function createRepository(): jest.Mocked<AuthRepositoryPort> {
  return {
    register: jest.fn(),
    findByIdentifier: jest.fn(),
    findById: jest.fn(),
    updateRole: jest.fn(),
  };
}

function createContext(authorization?: string) {
  const request = { headers: { authorization } };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('JwtAuthGuard', () => {
  let repository: jest.Mocked<AuthRepositoryPort>;
  let jwtService: { verifyAsync: jest.Mock };
  let guard: JwtAuthGuard;

  beforeEach(() => {
    repository = createRepository();
    jwtService = { verifyAsync: jest.fn() };
    guard = new JwtAuthGuard(jwtService as unknown as JwtService, repository);
  });

  it('authenticates a valid token and reloads the current user state', async () => {
    const user = new User({
      id: 'cc2fbfe5-e99e-41b4-909f-99bd8f8687f7',
      email: 'admin@deskly.test',
      username: 'admin',
      passwordHash: 'hash',
      role: 'ADMIN',
      active: true,
    });
    jwtService.verifyAsync.mockResolvedValue({ sub: user.id });
    repository.findById.mockResolvedValue(user);
    const { context, request } = createContext('Bearer valid-token');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(repository.findById.mock.calls).toEqual([[user.id]]);
    expect(request).toHaveProperty('user.role', 'ADMIN');
  });

  it('returns 401 when the token is expired', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));
    const { context } = createContext('Bearer expired-token');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(repository.findById.mock.calls).toHaveLength(0);
  });

  it('returns 401 when the bearer token is missing', async () => {
    const { context } = createContext();
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('returns 401 when the current user is inactive', async () => {
    const user = new User({
      id: 'cc2fbfe5-e99e-41b4-909f-99bd8f8687f7',
      email: 'member@deskly.test',
      username: 'member',
      passwordHash: 'hash',
      role: 'MIEMBRO',
      active: false,
    });
    jwtService.verifyAsync.mockResolvedValue({ sub: user.id });
    repository.findById.mockResolvedValue(user);
    const { context } = createContext('Bearer valid-token');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
