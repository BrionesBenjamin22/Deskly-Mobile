import { render, screen, waitFor } from '@testing-library/react-native';

import {
  getAvailableDesks,
  listLocalities,
  listWorkAreas,
} from '../services/desks.service';
import { buildDesk, buildLocality, buildWorkArea } from '../testing/desk.fixtures';
import { DesksScreen } from './DesksScreen';

jest.mock('../services/desks.service', () => ({
  DeskServiceError: class DeskServiceError extends Error {},
  getAvailableDesks: jest.fn(),
  listLocalities: jest.fn(),
  listWorkAreas: jest.fn(),
}));

const mockedGetAvailableDesks = jest.mocked(getAvailableDesks);
const mockedListLocalities = jest.mocked(listLocalities);
const mockedListWorkAreas = jest.mocked(listWorkAreas);

describe('DesksScreen con area seleccionada', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedListLocalities.mockResolvedValue([buildLocality()]);
    mockedListWorkAreas.mockResolvedValue([buildWorkArea()]);
  });

  it('solicita disponibilidad para el area seleccionada', async () => {
    const selectedArea = buildWorkArea();
    mockedGetAvailableDesks.mockResolvedValue([
      buildDesk({ area: selectedArea, areaId: selectedArea.id }),
    ]);

    render(
      <DesksScreen
        accessToken="access-token"
        selectedWorkArea={selectedArea}
      />,
    );

    expect(await screen.findByText('Escritorio Norte 1')).toBeOnTheScreen();
    await waitFor(() => {
      expect(mockedGetAvailableDesks).toHaveBeenCalledWith(
        expect.objectContaining({
          areaId: selectedArea.id,
          localityId: selectedArea.localityId,
        }),
      );
    });
  }, 10_000);

  it('no muestra escritorios pertenecientes a otra area', async () => {
    const selectedArea = buildWorkArea();
    const otherArea = buildWorkArea({
      id: 'area-2',
      name: 'Sala Sur',
    });
    mockedGetAvailableDesks.mockResolvedValue([
      buildDesk({ area: selectedArea, areaId: selectedArea.id }),
      buildDesk({
        id: 'desk-2',
        code: 'ESC-002',
        name: 'Escritorio de otra area',
        area: otherArea,
        areaId: otherArea.id,
      }),
    ]);

    render(
      <DesksScreen
        accessToken="access-token"
        selectedWorkArea={selectedArea}
      />,
    );

    expect(await screen.findByText('Escritorio Norte 1')).toBeOnTheScreen();
    expect(screen.queryByText('Escritorio de otra area')).not.toBeOnTheScreen();
  });
});
