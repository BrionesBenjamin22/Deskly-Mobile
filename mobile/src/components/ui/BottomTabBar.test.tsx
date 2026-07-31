import { fireEvent, render, screen } from '@testing-library/react-native';

import {
  AuthTestProvider,
  createTestSession,
} from '../../features/auth/testing/AuthTestProvider';
import { BottomTabBar } from './BottomTabBar';

describe('BottomTabBar permissions', () => {
  const renderForRole = (
    role: 'ADMIN' | 'GESTOR' | 'MIEMBRO',
    activeTab: 'users' | 'payments' | 'profile',
  ) =>
    render(
      <AuthTestProvider session={createTestSession(role)}>
        <BottomTabBar activeTab={activeTab} />
      </AuthTestProvider>,
    );

  it('muestra solo el panel, Gestion de usuarios y Cuenta para administradores', () => {
    renderForRole('ADMIN', 'users');

    expect(screen.getByText('Panel')).toBeOnTheScreen();
    expect(screen.getByText('Gestión de usuarios')).toBeOnTheScreen();
    expect(screen.getByText('Cuenta')).toBeOnTheScreen();
    expect(screen.queryByText('Pagos')).toBeNull();
    expect(screen.queryByText('Escritorios')).toBeNull();
    expect(screen.queryByText('Mis reservas')).toBeNull();
  });

  it('muestra solo acciones operativas permitidas para miembros', () => {
    renderForRole('MIEMBRO', 'payments');

    expect(screen.getByText('Escritorios')).toBeOnTheScreen();
    expect(screen.getByText('Mis reservas')).toBeOnTheScreen();
    expect(screen.getByText('Pagos')).toBeOnTheScreen();
    expect(screen.getByText('Cuenta')).toBeOnTheScreen();
    expect(screen.queryByText('Panel')).toBeNull();
    expect(screen.queryByText('GestiÃ³n de usuarios')).toBeNull();
  });

  it('muestra solo reservas y cuenta para gestores', () => {
    renderForRole('GESTOR', 'profile');

    expect(screen.getByText('Cuenta')).toBeOnTheScreen();
    expect(screen.queryByText('Panel')).toBeNull();
    expect(screen.queryByText('GestiÃ³n de usuarios')).toBeNull();
    expect(screen.queryByText('Pagos')).toBeNull();
  });

  it('cierra el menu de Cuenta al tocar fuera', () => {
    renderForRole('ADMIN', 'users');

    fireEvent.press(screen.getByText('Cuenta'));
    expect(screen.getByText('Mi perfil')).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId('bottom-tab-menu-backdrop'));
    expect(screen.queryByText('Mi perfil')).toBeNull();
  });
});
