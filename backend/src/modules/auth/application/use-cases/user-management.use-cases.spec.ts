import { User } from '../../domain/entities/user.entity';
import { SelfDeactivationForbiddenError } from '../../domain/errors/auth.errors';
import type { AuthRepositoryPort } from '../../domain/ports/auth-repository.port';
import { DeactivateUserUseCase } from './deactivate-user.use-case';
import { ListUsersUseCase } from './list-users.use-case';

function createUser(active = true) {
  return new User({
    id: '10000000-0000-4000-8000-000000000001',
    email: 'usuario@deskly.test',
    username: 'usuario',
    passwordHash: 'hash',
    role: 'MIEMBRO',
    active,
    member: {
      id: '20000000-0000-4000-8000-000000000001',
      fullName: 'Usuario Prueba',
      dni: 12345678,
      phone: 1122334455,
      active,
    },
  });
}

function createRepository(): jest.Mocked<AuthRepositoryPort> {
  return {
    hasUsers: jest.fn(),
    register: jest.fn(),
    findByIdentifier: jest.fn(),
    findById: jest.fn(),
    updateRole: jest.fn(),
    listUsers: jest.fn(),
    deactivate: jest.fn(),
  };
}

describe('User management use cases', () => {
  it('lists users with project pagination defaults', async () => {
    const repository = createRepository();
    repository.listUsers.mockResolvedValue({ users: [createUser()], total: 1 });

    const result = await new ListUsersUseCase(repository).execute({});

    expect(result.pagination).toEqual({
      page: 1,
      limit: 9,
      total: 1,
      totalPages: 1,
    });
    expect(result.users[0]?.username).toBe('usuario');
  });

  it('prevents an administrator from deactivating their own account', async () => {
    const repository = createRepository();
    const useCase = new DeactivateUserUseCase(repository);

    await expect(
      useCase.execute({
        userId: '10000000-0000-4000-8000-000000000001',
        actorId: '10000000-0000-4000-8000-000000000001',
      }),
    ).rejects.toBeInstanceOf(SelfDeactivationForbiddenError);
  });

  it('returns the logically deactivated user', async () => {
    const repository = createRepository();
    repository.deactivate.mockResolvedValue(createUser(false));

    const result = await new DeactivateUserUseCase(repository).execute({
      userId: '10000000-0000-4000-8000-000000000001',
      actorId: '30000000-0000-4000-8000-000000000001',
    });

    expect(result.user.active).toBe(false);
    expect(result.user.member?.active).toBe(false);
  });
});
