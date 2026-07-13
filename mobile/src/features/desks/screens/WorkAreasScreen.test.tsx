import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import {
  listAvailableWorkAreas,
  listLocalities,
  listWorkAreas,
} from '../services/desks.service';
import { buildLocality, buildWorkArea } from '../testing/desk.fixtures';
import { WorkAreasScreen } from './WorkAreasScreen';

jest.mock('../services/desks.service', () => ({
  DeskServiceError: class DeskServiceError extends Error {},
  listAvailableWorkAreas: jest.fn(),
  listLocalities: jest.fn(),
  listWorkAreas: jest.fn(),
}));

const mockedListLocalities = jest.mocked(listLocalities);
const mockedListWorkAreas = jest.mocked(listWorkAreas);
const mockedListAvailableWorkAreas = jest.mocked(listAvailableWorkAreas);

describe('WorkAreasScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const locality = buildLocality();
    const area = buildWorkArea({ locality, localityId: locality.id });

    mockedListLocalities.mockResolvedValue([locality]);
    mockedListWorkAreas.mockResolvedValue([area]);
    mockedListAvailableWorkAreas.mockResolvedValue([area]);
  });

  it('muestra las areas de trabajo disponibles al ingresar', async () => {
    render(<WorkAreasScreen onSelectWorkArea={jest.fn()} />);

    expect(await screen.findByText('Sala Norte')).toBeOnTheScreen();
    expect(screen.getByText('Sede Centro')).toBeOnTheScreen();
    expect(screen.getByText('2 disponibles')).toBeOnTheScreen();
  });

  it('permite seleccionar un area conservando fecha y horario', async () => {
    const onSelectWorkArea = jest.fn();
    const area = buildWorkArea();
    mockedListWorkAreas.mockResolvedValue([area]);
    mockedListAvailableWorkAreas.mockResolvedValue([area]);

    render(<WorkAreasScreen onSelectWorkArea={onSelectWorkArea} />);

    fireEvent.press(await screen.findByText('Sala Norte'));
    fireEvent.press(screen.getByText('Reservar'));

    await waitFor(() => {
      expect(onSelectWorkArea).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'area-1' }),
        expect.objectContaining({ startTime: '09:00', endTime: '18:00' }),
      );
    });
  });
});
