import { render, screen } from '@testing-library/react-native';

import { PasswordRequirements } from './PasswordRequirements';

describe('PasswordRequirements', () => {
  it('oculta cada requisito a medida que se cumple', () => {
    const { rerender } = render(<PasswordRequirements password="" />);

    expect(screen.getByText(/Entre 8 y 72 caracteres/)).toBeOnTheScreen();
    expect(screen.getByText(/letra mayúscula/)).toBeOnTheScreen();
    expect(screen.getByText(/un número/)).toBeOnTheScreen();

    rerender(<PasswordRequirements password="Password" />);
    expect(screen.queryByText(/Entre 8 y 72 caracteres/)).toBeNull();
    expect(screen.queryByText(/letra mayúscula/)).toBeNull();
    expect(screen.getByText(/un número/)).toBeOnTheScreen();

    rerender(<PasswordRequirements password="Password1" />);
    expect(
      screen.queryByLabelText('Requisitos pendientes de la contraseña'),
    ).toBeNull();
  });
});
