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

  it('muestra solo acciones operativas permitidas para miembros', () => {
    render(<BottomTabBar activeTab="payments" userRole="MIEMBRO" />);

    expect(screen.getByText('Escritorios')).toBeOnTheScreen();
    expect(screen.getByText('Mis reservas')).toBeOnTheScreen();
    expect(screen.getByText('Pagos')).toBeOnTheScreen();
    expect(screen.getByText('Cuenta')).toBeOnTheScreen();
    expect(screen.queryByText('Panel')).toBeNull();
    expect(screen.queryByText('GestiÃ³n de usuarios')).toBeNull();
  });

  it('aplica minimo privilegio cuando el rol no esta disponible', () => {
    render(<BottomTabBar activeTab="profile" />);

    expect(screen.getByText('Cuenta')).toBeOnTheScreen();
    expect(screen.queryByText('Panel')).toBeNull();
    expect(screen.queryByText('GestiÃ³n de usuarios')).toBeNull();
    expect(screen.queryByText('Pagos')).toBeNull();
  });

  it('cierra el menu de Cuenta al tocar fuera', () => {
    render(<BottomTabBar activeTab="users" userRole="ADMIN" />);

    fireEvent.press(screen.getByText('Cuenta'));
    expect(screen.getByText('Mi perfil')).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId('bottom-tab-menu-backdrop'));
    expect(screen.queryByText('Mi perfil')).toBeNull();
  });
});
