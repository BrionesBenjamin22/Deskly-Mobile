import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { User } from '../../domain/entities/user.entity';
import {
  InactiveUserError,
  InvalidRefreshTokenError,
} from '../../domain/errors/auth.errors';
import type { AuthRepositoryPort } from '../../domain/ports/auth-repository.port';
import { SessionTokenService } from './session-token.service';

const user = new User({
  id: 'cc2fbfe5-e99e-41b4-909f-99bd8f8687f7',
  email: 'member@deskly.test',
  username: 'member',
  passwordHash: 'hash',
  role: 'MIEMBRO',
  active: true,
  tokenVersion: 3,
});

function createRepository(): jest.Mocked<AuthRepositoryPort> {
  return {
    hasUsers: jest.fn(),
    register: jest.fn(),
    findByIdentifier: jest.fn(),
    findById: jest.fn(),
    updateRole: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
    listUsers: jest.fn(),
    deactivate: jest.fn(),
    restoreAccess: jest.fn(),
  };
}

describe('SessionTokenService', () => {
  let repository: jest.Mocked<AuthRepositoryPort>;
  let jwt: { signAsync: jest.Mock; verifyAsync: jest.Mock };
  let service: SessionTokenService;

  beforeEach(() => {
    repository = createRepository();
    jwt = {
      signAsync: jest
        .fn()
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token'),
      verifyAsync: jest.fn(),
    };
    const values = {
      JWT_EXPIRES_IN: '15m',
      JWT_REFRESH_SECRET: 'refresh-secret',
      JWT_REFRESH_EXPIRES_IN: '30d',
    };
    service = new SessionTokenService(
      repository,
      jwt as unknown as JwtService,
      {
        getOrThrow: jest.fn((key: keyof typeof values) => values[key]),
      } as unknown as ConfigService,
    );
  });

  it('emite access y refresh con configuracion independiente', async () => {
    const result = await service.issue(user);

    expect(jwt.signAsync).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ tokenVersion: 3 }),
      { subject: user.id, expiresIn: '15m' },
    );
    expect(jwt.signAsync).toHaveBeenNthCalledWith(
      2,
      { tokenType: 'refresh', tokenVersion: 3 },
      {
        subject: user.id,
        secret: 'refresh-secret',
        expiresIn: '30d',
      },
    );
    expect(result).toEqual(
      expect.objectContaining({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      }),
    );
  });

  it('renueva tokens para un usuario vigente', async () => {
    jwt.verifyAsync.mockResolvedValue({
      sub: user.id,
      tokenType: 'refresh',
      tokenVersion: 3,
    });
    repository.findById.mockResolvedValue(user);

    const result = await service.refresh('previous-refresh-token');

    expect(jwt.verifyAsync).toHaveBeenCalledWith('previous-refresh-token', {
      secret: 'refresh-secret',
    });
    expect(result.refresh_token).toBe('refresh-token');
  });

  it.each([
    [{ sub: user.id, tokenType: 'access', tokenVersion: 3 }, user],
    [{ sub: user.id, tokenType: 'refresh', tokenVersion: 2 }, user],
    [{ sub: user.id, tokenType: 'refresh', tokenVersion: 3 }, null],
  ])(
    'rechaza tipo, version o usuario invalidos',
    async (payload, storedUser) => {
      jwt.verifyAsync.mockResolvedValue(payload);
      repository.findById.mockResolvedValue(storedUser);

      await expect(service.refresh('refresh-token')).rejects.toBeInstanceOf(
        InvalidRefreshTokenError,
      );
    },
  );

  it('rechaza usuarios inactivos', async () => {
    jwt.verifyAsync.mockResolvedValue({
      sub: user.id,
      tokenType: 'refresh',
      tokenVersion: 3,
    });
    repository.findById.mockResolvedValue(
      new User({
        id: user.id,
        email: user.email,
        username: user.username,
        passwordHash: user.passwordHash,
        role: user.role,
        active: false,
        tokenVersion: user.tokenVersion,
      }),
    );

    await expect(service.refresh('refresh-token')).rejects.toBeInstanceOf(
      InactiveUserError,
    );
  });

  it('traduce errores de firma o expiracion', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('expired'));

    await expect(service.refresh('refresh-token')).rejects.toBeInstanceOf(
      InvalidRefreshTokenError,
    );
  });
});
