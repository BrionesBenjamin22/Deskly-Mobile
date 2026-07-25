import { render, screen } from '@testing-library/react-native';

import { BottomTabBar } from './BottomTabBar';

describe('BottomTabBar permissions', () => {
  it('oculta Pagos para administradores', () => {
    render(<BottomTabBar activeTab="desks" userRole="ADMIN" />);

    expect(screen.queryByText('Pagos')).toBeNull();
    expect(screen.getByText('Escritorios')).toBeOnTheScreen();
    expect(screen.getByText('Mis reservas')).toBeOnTheScreen();
    expect(screen.getByText('Cuenta')).toBeOnTheScreen();
  });

  it('mantiene Pagos visible para miembros', () => {
    render(<BottomTabBar activeTab="payments" userRole="MIEMBRO" />);

    expect(screen.getByText('Pagos')).toBeOnTheScreen();
  });
});
