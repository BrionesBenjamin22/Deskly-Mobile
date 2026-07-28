import type { AuthRepositoryPort } from '../../domain/ports/auth-repository.port';
import { GetRegistrationStatusUseCase } from './get-registration-status.use-case';

function createRepository(): jest.Mocked<AuthRepositoryPort> {
  return {
    hasUsers: jest.fn(),
    register: jest.fn(),
    findByIdentifier: jest.fn(),
    findById: jest.fn(),
    updateRole: jest.fn(),
  };
}

describe('GetRegistrationStatusUseCase', () => {
  it.each([false, true])(
    'reports registration availability when hasUsers=%s',
    async (hasUsers) => {
      const repository = createRepository();
      repository.hasUsers.mockResolvedValue(hasUsers);

      await expect(
        new GetRegistrationStatusUseCase(repository).execute(),
      ).resolves.toEqual({
        requiresMember: true,
        registrationAvailable: hasUsers,
      });
    },
  );
});
