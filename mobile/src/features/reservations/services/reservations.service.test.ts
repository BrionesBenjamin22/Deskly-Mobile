import type { ReservationFixture } from '../testing/reservation.fixtures';
import { listReservations } from './reservations.service';

type ApiLocation = {
  areaId: string;
  areaName: string;
  localityId: string;
  localityName: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};

type ApiReservationOverrides = {
  reservationId?: string;
  deskId?: string;
  deskCode?: string;
  deskName?: string;
  location?: ApiLocation;
};

function buildApiReservation(overrides: ApiReservationOverrides = {}) {
  return {
    reservationId: 'reservation-1',
    deskId: 'desk-1',
    deskCode: 'A-01',
    deskName: 'Escritorio ventana',
    date: '2026-07-14',
    startTime: '09:00',
    endTime: '13:00',
    status: 'RESERVED',
    location: {
      areaId: 'area-1',
      areaName: 'Area abierta',
      localityId: 'locality-1',
      localityName: 'Chascomus',
      address: 'Av. Costanera Espana 120',
      latitude: -35.577,
      longitude: -57.997,
    },
    ...overrides,
  };
}

function mockListResponse(reservations: ReturnType<typeof buildApiReservation>[]) {
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({
      reservations,
      pagination: {
        page: 1,
        limit: 50,
        total: reservations.length,
        totalPages: reservations.length > 0 ? 1 : 0,
      },
    }),
  } as Response);
}

describe('reservations service related location mapping', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('maps the work area and locality associated with the reserved desk', async () => {
    mockListResponse([buildApiReservation()]);

    const response = await listReservations('access-token', 1, 50);
    const reservation = response.reservations[0] as ReservationFixture;

    expect(reservation.location).toEqual({
      areaId: 'area-1',
      areaName: 'Area abierta',
      localityId: 'locality-1',
      localityName: 'Chascomus',
      address: 'Av. Costanera Espana 120',
      latitude: -35.577,
      longitude: -57.997,
    });
  });

  it('keeps each reservation associated with its own related location', async () => {
    mockListResponse([
      buildApiReservation(),
      buildApiReservation({
        reservationId: 'reservation-2',
        deskId: 'desk-2',
        deskCode: 'B-07',
        deskName: 'Escritorio patio',
        location: {
          areaId: 'area-2',
          areaName: 'Sala silenciosa',
          localityId: 'locality-2',
          localityName: 'La Plata',
          address: 'Calle 50 450',
          latitude: -34.921,
          longitude: -57.955,
        },
      }),
    ]);

    const response = await listReservations('access-token', 1, 50);
    const reservations = response.reservations as ReservationFixture[];

    expect(reservations[0].location?.areaName).toBe('Area abierta');
    expect(reservations[0].location?.localityName).toBe('Chascomus');
    expect(reservations[1].location?.areaName).toBe('Sala silenciosa');
    expect(reservations[1].location?.localityName).toBe('La Plata');
    expect(reservations[0].location).not.toBe(reservations[1].location);
  });

  it('omits optional address and coordinates without losing area data', async () => {
    mockListResponse([
      buildApiReservation({
        location: {
          areaId: 'area-1',
          areaName: 'Area abierta',
          localityId: 'locality-1',
          localityName: 'Chascomus',
        },
      }),
    ]);

    const response = await listReservations('access-token', 1, 50);
    const reservation = response.reservations[0] as ReservationFixture;

    expect(reservation.location).toEqual({
      areaId: 'area-1',
      areaName: 'Area abierta',
      localityId: 'locality-1',
      localityName: 'Chascomus',
    });
    expect(reservation.location).not.toHaveProperty('address');
    expect(reservation.location).not.toHaveProperty('latitude');
    expect(reservation.location).not.toHaveProperty('longitude');
  });

  it('does not turn absent related values into visible text', async () => {
    mockListResponse([
      buildApiReservation({
        location: {
          areaId: 'area-1',
          areaName: 'Area abierta',
          localityId: 'locality-1',
          localityName: 'Chascomus',
        },
      }),
    ]);

    const response = await listReservations('access-token', 1, 50);
    const serializedReservation = JSON.stringify(response.reservations[0]);

    expect(serializedReservation).toContain('Area abierta');
    expect(serializedReservation).toContain('Chascomus');
    expect(serializedReservation).not.toContain('undefined');
    expect(serializedReservation).not.toContain('null');
  });
});
