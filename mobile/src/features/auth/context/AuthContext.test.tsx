import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import type { LoginResponse } from '../types/auth.types';
import { AuthProvider, useAuth } from './AuthContext';

const adminSession: LoginResponse = {
  access_token: 'admin-access-token',
  refresh_token: 'admin-refresh-token',
  user: {
    id: 'admin-1',
    email: 'admin@example.com',
    username: 'admin',
    role: 'ADMIN',
    active: true,
    member: null,
  },
};

const memberSession: LoginResponse = {
  access_token: 'member-access-token',
  refresh_token: 'member-refresh-token',
  user: {
    id: 'member-1',
    email: 'member@example.com',
    username: 'member',
    role: 'MIEMBRO',
    active: true,
    member: {
      id: 'membership-1',
      fullName: 'Deskly Member',
      active: true,
    },
  },
};

function AuthConsumer() {
  const { accessToken, role, session, user } = useAuth();

  return (
    <>
      <Text>{accessToken}</Text>
      <Text>{role}</Text>
      <Text>{session.refresh_token}</Text>
      <Text>{user.email}</Text>
    </>
  );
}

describe('AuthContext', () => {
  it('expone la sesion autenticada y sus datos derivados', () => {
    render(
      <AuthProvider session={adminSession}>
        <AuthConsumer />
      </AuthProvider>,
    );

    expect(screen.getByText('admin-access-token')).toBeTruthy();
    expect(screen.getByText('ADMIN')).toBeTruthy();
    expect(screen.getByText('admin-refresh-token')).toBeTruthy();
    expect(screen.getByText('admin@example.com')).toBeTruthy();
  });

  it('actualiza todos los valores cuando cambia la sesion recibida', () => {
    const view = render(
      <AuthProvider session={adminSession}>
        <AuthConsumer />
      </AuthProvider>,
    );

    view.rerender(
      <AuthProvider session={memberSession}>
        <AuthConsumer />
      </AuthProvider>,
    );

    expect(screen.getByText('member-access-token')).toBeTruthy();
    expect(screen.getByText('MIEMBRO')).toBeTruthy();
    expect(screen.getByText('member-refresh-token')).toBeTruthy();
    expect(screen.getByText('member@example.com')).toBeTruthy();
    expect(screen.queryByText('admin-access-token')).toBeNull();
  });

  it('falla de forma explicita cuando el hook se usa fuera del provider', () => {
    expect(() => render(<AuthConsumer />)).toThrow(
      'useAuth debe utilizarse dentro de AuthProvider.',
    );
  });
});
