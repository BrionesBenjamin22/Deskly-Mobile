import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import { AdminCatalogScreen } from './AdminCatalogScreen';

const mockRemoveAmenity = jest.fn();
const mockSaveDesk = jest.fn().mockResolvedValue(true);
const mockClearFeedback = jest.fn();
let mockErrorMessage: string | null = null;
let mockSuccessMessage: string | null = null;

jest.mock('../hooks/useAdminCatalog', () => ({
  useAdminCatalog: () => ({
    amenities: [
      { id: 'amenity-1', name: 'Monitor' },
      { id: 'amenity-2', name: 'Silla ergonómica' },
    ],
    clearFeedback: mockClearFeedback,
    descriptions: [],
    desks: [
      {
        id: 'desk-1',
        code: 'A1',
        name: 'Escritorio A1',
        peopleCapacity: 1,
        areaId: 'area-1',
        area: {
          id: 'area-1',
          name: 'Sede central',
          localityId: 'locality-1',
          active: true,
        },
        zone: 'A',
        amenities: [{ id: 'amenity-1', name: 'Monitor' }],
        enabled: true,
        status: 'available',
      },
    ],
    errorMessage: mockErrorMessage,
    isLoading: false,
    isSaving: false,
    localities: [{ id: 'locality-1', name: 'Chascomús', active: true }],
    removeAmenity: mockRemoveAmenity,
    removeDescription: jest.fn(),
    removeDesk: jest.fn(),
    removeLocality: jest.fn(),
    removeWorkArea: jest.fn(),
    saveAmenity: jest.fn(),
    saveDescription: jest.fn(),
    saveDesk: mockSaveDesk,
    saveLocality: jest.fn(),
    saveWorkArea: jest.fn(),
    successMessage: mockSuccessMessage,
    workAreas: [
      {
        id: 'area-1',
        name: 'Sede central',
        localityId: 'locality-1',
        locality: { id: 'locality-1', name: 'Chascomús', active: true },
        active: true,
      },
    ],
  }),
}));

const props = {
  accessToken: 'token',
  onPressAdminCatalog: jest.fn(),
  onPressUserManagement: jest.fn(),
  onPressProfile: jest.fn(),
  onPressLogout: jest.fn(),
  onPressSwitchAccount: jest.fn(),
  onPressChangePassword: jest.fn(),
};

describe('AdminCatalogScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockErrorMessage = null;
    mockSuccessMessage = null;
  });

  it('muestra las categorias administrables y sus instancias', () => {
    render(<AdminCatalogScreen {...props} />);

    expect(screen.getByText('Escritorios')).toBeOnTheScreen();
    expect(screen.queryByText('Tipos de escritorio')).not.toBeOnTheScreen();
    expect(screen.getByText('Localidades')).toBeOnTheScreen();
    expect(screen.getByText('Áreas de trabajo')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('Amenities'));
    expect(screen.getByText('Monitor')).toBeOnTheScreen();
    expect(screen.getAllByText('Editar')).toHaveLength(2);
    expect(screen.getAllByText('Eliminar')).toHaveLength(2);
  });

  it('solicita confirmacion antes de eliminar', () => {
    render(<AdminCatalogScreen {...props} />);

    fireEvent.press(screen.getByText('Amenities'));
    fireEvent.press(screen.getAllByText('Eliminar')[0]);

    expect(screen.getByText('Eliminar amenity')).toBeOnTheScreen();
    expect(mockRemoveAmenity).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText('Sí, eliminar'));
    expect(mockRemoveAmenity).toHaveBeenCalledWith('amenity-1');
  });

  it('permite agregar y quitar amenities al editar un escritorio', async () => {
    render(<AdminCatalogScreen {...props} />);

    fireEvent.press(screen.getByText('Escritorios'));
    fireEvent.press(screen.getByText('Editar'));
    fireEvent.press(screen.getByText('Monitor'));
    fireEvent.press(screen.getByText('Silla ergonómica'));
    fireEvent.press(screen.getByText('Guardar cambios'));

    await waitFor(() =>
      expect(mockSaveDesk).toHaveBeenCalledWith(
        { amenityIds: ['amenity-2'] },
        'desk-1',
      ),
    );
  });

  it.each([
    ['Localidades', 'Chascomús'],
    ['Áreas de trabajo', 'Sede central'],
  ])('lista las instancias de %s', (category, instance) => {
    render(<AdminCatalogScreen {...props} />);

    fireEvent.press(screen.getByText(category));

    expect(screen.getByText(instance)).toBeOnTheScreen();
    expect(screen.getByText('Editar')).toBeOnTheScreen();
    expect(screen.getByText('Eliminar')).toBeOnTheScreen();
  });

  it('muestra una confirmacion visual cuando una accion finaliza con exito', () => {
    mockSuccessMessage = 'La localidad se creó correctamente.';

    render(<AdminCatalogScreen {...props} />);

    expect(screen.getByText('Acción completada')).toBeOnTheScreen();
    expect(
      screen.getByText('La localidad se creó correctamente.'),
    ).toBeOnTheScreen();
  });

  it('muestra una confirmacion visual cuando una accion falla', () => {
    mockErrorMessage = 'No fue posible eliminar el área.';

    render(<AdminCatalogScreen {...props} />);

    expect(screen.getByText('No pudimos completar la acción')).toBeOnTheScreen();
    expect(screen.getByText('No fue posible eliminar el área.')).toBeOnTheScreen();
  });
});
