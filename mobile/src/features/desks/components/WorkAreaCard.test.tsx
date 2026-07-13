import { fireEvent, render, screen } from '@testing-library/react-native';

import type { WorkArea } from '../types/desk.types';
import { WorkAreaCard } from './WorkAreaCard';

const workArea: WorkArea = {
  id: 'area-1',
  name: 'Sala Norte',
  description: 'Espacio compartido y silencioso.',
  localityId: 'locality-1',
  active: true,
  availableDeskCount: 2,
  totalDeskCount: 4,
  locality: {
    id: 'locality-1',
    name: 'Sede Centro',
    active: true,
  },
};

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
