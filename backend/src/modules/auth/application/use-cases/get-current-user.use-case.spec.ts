import { User } from '../../domain/entities/user.entity';
import type { AuthRepositoryPort } from '../../domain/ports/auth-repository.port';
import { GetCurrentUserUseCase } from './get-current-user.use-case';

function createRepository(): jest.Mocked<AuthRepositoryPort> {
  return {
    hasUsers: jest.fn(),
    register: jest.fn(),
    findByIdentifier: jest.fn(),
    findById: jest.fn(),
    updateRole: jest.fn(),
  };
}

describe('GetCurrentUserUseCase', () => {
  it('returns the authenticated member profile without password data', async () => {
    const repository = createRepository();
    const user = new User({
      id: 'cc2fbfe5-e99e-41b4-909f-99bd8f8687f7',
      email: 'member@deskly.test',
      username: 'member',
      passwordHash: 'private-hash',
      role: 'MIEMBRO',
      active: true,
      member: {
        id: '8ae2e38a-300c-4cc1-b6ba-cee270f163f7',
        fullName: 'Deskly Member',
        dni: 12345678,
        phone: 1123456789,
        active: true,
      },
    });
    repository.findById.mockResolvedValue(user);

    const result = await new GetCurrentUserUseCase(repository).execute(user.id);

    expect(result.user.member).toEqual({
      id: user.member?.id,
      fullName: user.member?.fullName,
      dni: user.member?.dni,
      phone: user.member?.phone,
      active: true,
    });
    expect(result.user).not.toHaveProperty('passwordHash');
  });
});
