import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { User } from '../../domain/entities/user.entity';
import {
  BlockedUserError,
  InactiveUserError,
  InvalidCredentialsError,
} from '../../domain/errors/auth.errors';
import type { AuthRepositoryPort } from '../../domain/ports/auth-repository.port';
import type { PasswordHasherPort } from '../../domain/ports/password-hasher.port';
import { LoginUseCase } from './login.use-case';

const activeUser = new User({
  id: 'cc2fbfe5-e99e-41b4-909f-99bd8f8687f7',
  email: 'member@deskly.test',
  username: 'member',
  passwordHash: 'secure-hash',
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

function createRepository(): jest.Mocked<AuthRepositoryPort> {
  return {
    hasUsers: jest.fn(),
    register: jest.fn(),
    findByIdentifier: jest.fn(),
    findById: jest.fn(),
    updateRole: jest.fn(),
    updateProfile: jest.fn(),
    listUsers: jest.fn(),
    deactivate: jest.fn(),
    restoreAccess: jest.fn(),
  };
}

describe('LoginUseCase', () => {
  let repository: jest.Mocked<AuthRepositoryPort>;
  let passwordHasher: jest.Mocked<PasswordHasherPort>;
  let jwtService: { signAsync: jest.Mock };
  let useCase: LoginUseCase;

  beforeEach(() => {
    repository = createRepository();
    passwordHasher = { hash: jest.fn(), compare: jest.fn() };
    jwtService = { signAsync: jest.fn().mockResolvedValue('signed-token') };
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('1h'),
    };

    useCase = new LoginUseCase(
      repository,
      passwordHasher,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
    );
  });

  it('returns a one-hour access token and only public user data', async () => {
    repository.findByIdentifier.mockResolvedValue(activeUser);
    passwordHasher.compare.mockResolvedValue(true);

    const result = await useCase.execute({
      identifier: 'MEMBER@DESKLY.TEST',
      password: 'Password123',
    });

    expect(repository.findByIdentifier.mock.calls).toEqual([
      ['member@deskly.test'],
    ]);
    expect(jwtService.signAsync.mock.calls[0]).toEqual([
      {
        email: activeUser.email,
        username: activeUser.username,
        role: 'MIEMBRO',
        active: true,
        tokenVersion: 0,
      },
      { subject: activeUser.id, expiresIn: '1h' },
    ]);
    expect(result).toEqual({
      access_token: 'signed-token',
      user: {
        id: activeUser.id,
        email: activeUser.email,
        username: activeUser.username,
        role: 'MIEMBRO',
        active: true,
        member: {
          id: activeUser.member?.id,
          fullName: activeUser.member?.fullName,
          active: activeUser.member?.active,
        },
      },
    });
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('rejects invalid credentials with the same domain error', async () => {
    repository.findByIdentifier.mockResolvedValue(activeUser);
    passwordHasher.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({ identifier: 'member', password: 'bad-password' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('rejects inactive users', async () => {
    repository.findByIdentifier.mockResolvedValue(
      new User({
        ...activeUser,
        active: false,
      } as any),
    );
    passwordHasher.compare.mockResolvedValue(true);

    await expect(
      useCase.execute({ identifier: 'member', password: 'Password123' }),
    ).rejects.toBeInstanceOf(InactiveUserError);
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  describe('penalty blocking', () => {
    it('throws BlockedUserError when blockedUntil is in the future', async () => {
      const blockedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      repository.findByIdentifier.mockResolvedValue(
        new User({
          id: activeUser.id,
          email: activeUser.email,
          username: activeUser.username,
          passwordHash: activeUser.passwordHash,
          role: activeUser.role,
          active: true,
          blockedUntil,
          member: activeUser.member,
        }),
      );
      passwordHasher.compare.mockResolvedValue(true);

      await expect(
        useCase.execute({ identifier: 'member', password: 'Password123' }),
      ).rejects.toBeInstanceOf(BlockedUserError);
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('BlockedUserError carries the exact blockedUntil date', async () => {
      const blockedUntil = new Date('2099-01-01T00:00:00.000Z');
      repository.findByIdentifier.mockResolvedValue(
        new User({
          id: activeUser.id,
          email: activeUser.email,
          username: activeUser.username,
          passwordHash: activeUser.passwordHash,
          role: activeUser.role,
          active: true,
          blockedUntil,
          member: activeUser.member,
        }),
      );
      passwordHasher.compare.mockResolvedValue(true);

      const error = await useCase
        .execute({ identifier: 'member', password: 'Password123' })
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(BlockedUserError);
      expect((error as BlockedUserError).blockedUntil).toEqual(blockedUntil);
    });

    it('allows login when blockedUntil is in the past (auto-unblock)', async () => {
      const expiredBlock = new Date(Date.now() - 1000);
      repository.findByIdentifier.mockResolvedValue(
        new User({
          id: activeUser.id,
          email: activeUser.email,
          username: activeUser.username,
          passwordHash: activeUser.passwordHash,
          role: activeUser.role,
          active: true,
          blockedUntil: expiredBlock,
          member: activeUser.member,
        }),
      );
      passwordHasher.compare.mockResolvedValue(true);

      const result = await useCase.execute({
        identifier: 'member',
        password: 'Password123',
      });

      expect(result.access_token).toBe('signed-token');
      expect(jwtService.signAsync).toHaveBeenCalledTimes(1);
    });

    it('allows login when blockedUntil is null', async () => {
      repository.findByIdentifier.mockResolvedValue(
        new User({
          id: activeUser.id,
          email: activeUser.email,
          username: activeUser.username,
          passwordHash: activeUser.passwordHash,
          role: activeUser.role,
          active: true,
          blockedUntil: null,
          member: activeUser.member,
        }),
      );
      passwordHasher.compare.mockResolvedValue(true);

      const result = await useCase.execute({
        identifier: 'member',
        password: 'Password123',
      });

      expect(result.access_token).toBe('signed-token');
    });

    it('does not confuse an inactive account with a penalty block', async () => {
      repository.findByIdentifier.mockResolvedValue(
        new User({
          id: activeUser.id,
          email: activeUser.email,
          username: activeUser.username,
          passwordHash: activeUser.passwordHash,
          role: activeUser.role,
          active: false,
          blockedUntil: new Date('2099-01-01T00:00:00.000Z'),
          member: activeUser.member,
        }),
      );
      passwordHasher.compare.mockResolvedValue(true);

      await expect(
        useCase.execute({ identifier: 'member', password: 'Password123' }),
      ).rejects.toBeInstanceOf(InactiveUserError);
    });
  });
});
