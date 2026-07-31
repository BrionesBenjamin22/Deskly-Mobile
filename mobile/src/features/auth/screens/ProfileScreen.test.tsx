import { render, screen } from '@testing-library/react-native';

import { AuthProvider } from '../context/AuthContext';
import type { LoginResponse } from '../types/auth.types';
import { ProfileScreen } from './ProfileScreen';

const mockGetCurrentUser = jest.fn();

jest.mock('../services/auth.service', () => ({
  AuthServiceError: class AuthServiceError extends Error {},
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
  updateProfile: jest.fn(),
}));

jest.mock('../../penalties/components/ProfilePenaltiesCard', () => {
  const { Text } = require('react-native') as typeof import('react-native');
  return {
    ProfilePenaltiesCard: () => <Text>Penalizaciones del perfil</Text>,
  };
});

const props = {
  onPressDesks: jest.fn(),
  onPressReservations: jest.fn(),
  onPressPayments: jest.fn(),
  onPressProfile: jest.fn(),
  onPressLogout: jest.fn(),
  onPressSwitchAccount: jest.fn(),
  onPressUserManagement: jest.fn(),
  onPressAdminCatalog: jest.fn(),
  onPressChangePassword: jest.fn(),
};

function session(role: 'GESTOR' | 'MIEMBRO'): LoginResponse {
  return {
    access_token: 'access-token',
    refresh_token: 'refresh-token',
    user: {
      id: `${role.toLowerCase()}-1`,
      email: `${role.toLowerCase()}@deskly.test`,
      username: role.toLowerCase(),
      role,
      active: true,
      member: {
        id: `member-${role.toLowerCase()}`,
        fullName: 'Usuario de prueba',
        active: true,
      },
    },
  };
}

function renderProfile(role: 'GESTOR' | 'MIEMBRO') {
  const currentSession = session(role);
  mockGetCurrentUser.mockResolvedValue({ user: currentSession.user });
  return render(
    <AuthProvider session={currentSession}>
      <ProfileScreen {...props} />
    </AuthProvider>,
  );
}

describe('ProfileScreen penalties visibility', () => {
  beforeEach(() => jest.clearAllMocks());

  it('oculta las penalizaciones para el gestor aunque tenga perfil de miembro', () => {
    renderProfile('GESTOR');

    expect(screen.queryByText('Penalizaciones del perfil')).toBeNull();
  });

  it('mantiene las penalizaciones asociadas al miembro', () => {
    renderProfile('MIEMBRO');

    expect(screen.getByText('Penalizaciones del perfil')).toBeOnTheScreen();
  });
});
