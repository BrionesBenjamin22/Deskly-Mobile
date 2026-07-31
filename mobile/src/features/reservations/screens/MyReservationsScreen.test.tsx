import { render, screen, waitFor } from '@testing-library/react-native';

import {
  AuthTestProvider,
  createTestSession,
} from '../../auth/testing/AuthTestProvider';
import {
  listReservations,
  ReservationServiceError,
} from '../services/reservations.service';
import {
  buildReservation,
  buildReservationWithoutLocation,
} from '../testing/reservation.fixtures';
import { MyReservationsScreen } from './MyReservationsScreen';

jest.mock('../services/reservations.service', () => ({
  ReservationServiceError: class ReservationServiceError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ReservationServiceError';
      Object.setPrototypeOf(this, ReservationServiceError.prototype);
    }
  },
  cancelReservation: jest.fn(),
  listReservations: jest.fn(),
}));

const mockedListReservations = jest.mocked(listReservations);

function buildListResponse(
  reservations: Awaited<ReturnType<typeof listReservations>>['reservations'],
): Awaited<ReturnType<typeof listReservations>> {
  return {
    reservations,
    pagination: {
      page: 1,
      limit: 50,
      total: reservations.length,
      totalPages: reservations.length > 0 ? 1 : 0,
    },
  };
}

describe('MyReservationsScreen current rendering states', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderMemberScreen = () =>
    render(
      <AuthTestProvider
        session={createTestSession('MIEMBRO', {
          access_token: 'member-token',
        })}
      >
        <MyReservationsScreen />
      </AuthTestProvider>,
    );

  it('starts the member query with the access token and current parameters', async () => {
    mockedListReservations.mockResolvedValue(buildListResponse([]));

    renderMemberScreen();

    await waitFor(() => {
      expect(mockedListReservations).toHaveBeenCalledWith(
        'member-token',
        1,
        50,
      );
    });
    expect(mockedListReservations).toHaveBeenCalledTimes(1);
  });

  it('keeps the loading feedback visible while the query is pending', () => {
    mockedListReservations.mockReturnValue(new Promise(() => undefined));

    renderMemberScreen();

    expect(screen.getByText('Cargando reservas')).toBeOnTheScreen();
  });

  it('renders multiple reservations without mixing their details', async () => {
    mockedListReservations.mockResolvedValue(
      buildListResponse([
        buildReservation({
          id: 'reservation-1',
          deskCode: 'A-01',
          deskName: 'Escritorio ventana',
          startTime: '09:00',
          endTime: '13:00',
        }),
        buildReservation({
          id: 'reservation-2',
          deskId: 'desk-2',
          deskCode: 'B-07',
          deskName: 'Escritorio patio',
          startTime: '14:00',
          endTime: '18:00',
          status: 'completed',
        }),
      ]),
    );

    renderMemberScreen();

    expect(await screen.findByText('Escritorio ventana')).toBeOnTheScreen();
    expect(screen.getByText('Escritorio patio')).toBeOnTheScreen();
    expect(screen.getByText(/A-01$/)).toBeOnTheScreen();
    expect(screen.getByText(/B-07$/)).toBeOnTheScreen();
    expect(screen.getByText('09:00 - 13:00')).toBeOnTheScreen();
    expect(screen.getByText('14:00 - 18:00')).toBeOnTheScreen();
  });

  it('shows actionable error feedback when loading fails', async () => {
    mockedListReservations.mockRejectedValue(
      new ReservationServiceError('Revise su conexiÃ³n e intente nuevamente.'),
    );

    renderMemberScreen();

    expect(
      await screen.findByText('Lo sentimos, no pudimos recuperar sus reservas'),
    ).toBeOnTheScreen();
    expect(
      screen.getByText('Revise su conexiÃ³n e intente nuevamente.'),
    ).toBeOnTheScreen();
  });

  it('shows the empty state when the query has no reservations', async () => {
    mockedListReservations.mockResolvedValue(buildListResponse([]));

    renderMemberScreen();

    expect(await screen.findByText(/reservas todav/)).toBeOnTheScreen();
  });

  it('renders a reservation response without optional location data', async () => {
    mockedListReservations.mockResolvedValue(
      buildListResponse([
        buildReservationWithoutLocation({
          id: 'reservation-without-location',
          deskName: 'Escritorio sin ubicacion',
        }),
      ]),
    );

    renderMemberScreen();

    expect(await screen.findByText('Escritorio sin ubicacion')).toBeOnTheScreen();
    expect(screen.queryByText('undefined')).not.toBeOnTheScreen();
    expect(screen.queryByText('null')).not.toBeOnTheScreen();
  });
});
