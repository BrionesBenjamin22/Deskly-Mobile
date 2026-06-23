import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { UserRoleValue } from '../../../domain/entities/user.entity';
import { RolesGuard } from './roles.guard';

function createContext(role: UserRoleValue): ExecutionContext {
  return {
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({
      getRequest: () => ({ user: { role } }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('allows ADMIN when the endpoint requires ADMIN', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['ADMIN']),
    };
    const guard = new RolesGuard(reflector as unknown as Reflector);

    expect(guard.canActivate(createContext('ADMIN'))).toBe(true);
  });

  it.each<UserRoleValue>(['GESTOR', 'MIEMBRO'])(
    'returns 403 for %s when the endpoint requires ADMIN',
    (role) => {
      const reflector = {
        getAllAndOverride: jest.fn().mockReturnValue(['ADMIN']),
      };
      const guard = new RolesGuard(reflector as unknown as Reflector);

      expect(() => guard.canActivate(createContext(role))).toThrow(
        ForbiddenException,
      );
    },
  );

  it('allows access when an endpoint has no role metadata', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    };
    const guard = new RolesGuard(reflector as unknown as Reflector);

    expect(guard.canActivate(createContext('MIEMBRO'))).toBe(true);
  });
});
