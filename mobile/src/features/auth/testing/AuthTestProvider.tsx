import type { PropsWithChildren } from 'react';

import { AuthProvider } from '../context/AuthContext';
import type { LoginResponse, UserRole } from '../types/auth.types';

export function createTestSession(
  role: UserRole = 'MIEMBRO',
  overrides: Partial<LoginResponse> = {},
): LoginResponse {
  return {
    access_token: 'access-token',
    refresh_token: 'refresh-token',
    user: {
      id: 'user-1',
      email: 'user@example.com',
      username: 'user',
      role,
      active: true,
      member: null,
    },
    ...overrides,
  };
}

type AuthTestProviderProps = PropsWithChildren<{
  session?: LoginResponse;
}>;

export function AuthTestProvider({
  children,
  session = createTestSession(),
}: AuthTestProviderProps) {
  return <AuthProvider session={session}>{children}</AuthProvider>;
}
