import { fireEvent, render, screen } from '@testing-library/react-native';

import { BottomTabBar } from './BottomTabBar';

describe('BottomTabBar permissions', () => {
  it('muestra solo el panel, Gestion de usuarios y Cuenta para administradores', () => {
    render(<BottomTabBar activeTab="users" userRole="ADMIN" />);

    expect(screen.getByText('Panel')).toBeOnTheScreen();
    expect(screen.getByText('Gestión de usuarios')).toBeOnTheScreen();
    expect(screen.getByText('Cuenta')).toBeOnTheScreen();
    expect(screen.queryByText('Pagos')).toBeNull();
    expect(screen.queryByText('Escritorios')).toBeNull();
    expect(screen.queryByText('Mis reservas')).toBeNull();
  });

  it('mantiene Pagos visible para miembros', () => {
    render(<BottomTabBar activeTab="payments" userRole="MIEMBRO" />);

    expect(screen.getByText('Pagos')).toBeOnTheScreen();
  });

  it('cierra el menu de Cuenta al tocar fuera', () => {
    render(<BottomTabBar activeTab="users" userRole="ADMIN" />);

    fireEvent.press(screen.getByText('Cuenta'));
    expect(screen.getByText('Mi perfil')).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId('bottom-tab-menu-backdrop'));
    expect(screen.queryByText('Mi perfil')).toBeNull();
  });
});
