import { fireEvent, render, screen } from '@testing-library/react-native';

import { buildWorkArea } from '../testing/desk.fixtures';
import { WorkAreaCard } from './WorkAreaCard';

const workArea = buildWorkArea();

describe('WorkAreaCard', () => {
  it('muestra la informacion visible del area disponible', () => {
    render(
      <WorkAreaCard
        area={workArea}
        expanded
        onToggle={jest.fn()}
        onReserve={jest.fn()}
      />,
    );

    expect(screen.getByText('Sala Norte')).toBeOnTheScreen();
    expect(screen.getByText('Sede Centro')).toBeOnTheScreen();
    expect(screen.getByText('2 disponibles')).toBeOnTheScreen();
    expect(screen.getByText('2 de 4 escritorios disponibles')).toBeOnTheScreen();
  });

  it('permite iniciar la reserva del area seleccionada', () => {
    const onReserve = jest.fn();

    render(
      <WorkAreaCard
        area={workArea}
        expanded
        onToggle={jest.fn()}
        onReserve={onReserve}
      />,
    );

    fireEvent.press(screen.getByText('Reservar'));

    expect(onReserve).toHaveBeenCalledTimes(1);
    expect(onReserve).toHaveBeenCalledWith(workArea);
  });
});
