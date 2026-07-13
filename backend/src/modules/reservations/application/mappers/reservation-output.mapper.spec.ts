import {
  Reservation,
  ReservationProperties,
} from '../../domain/entities/reservation.entity';
import { toReservationOutput } from './reservation-output.mapper';

type RelatedReservationProperties = ReservationProperties & {
  areaId: string;
  areaName: string;
  localityId: string;
  localityName: string;
  address?: unknown;
  latitude?: unknown;
  longitude?: unknown;
};

const createReservation = (
  overrides: Partial<RelatedReservationProperties> = {},
): Reservation =>
  new Reservation({
    id: 'reservation-1',
    deskId: 'desk-1',
    memberId: 'member-1',
    deskCode: 'A-01',
    deskName: 'Escritorio ventana',
    date: '2026-07-14',
    startTime: '09:00',
    endTime: '13:00',
    status: 'RESERVED',
    areaId: 'area-1',
    areaName: 'Area abierta',
    localityId: 'locality-1',
    localityName: 'Chascomus',
    ...overrides,
  } as RelatedReservationProperties);

describe('toReservationOutput', () => {
  it('maps work area and locality identifiers and names', () => {
    const output = toReservationOutput(createReservation());

    expect(output).toMatchObject({
      location: {
        areaId: 'area-1',
        areaName: 'Area abierta',
        localityId: 'locality-1',
        localityName: 'Chascomus',
      },
    });
  });

  it('keeps each reservation related to its own area and locality', () => {
    const firstOutput = toReservationOutput(createReservation());
    const secondOutput = toReservationOutput(
      createReservation({
        id: 'reservation-2',
        deskId: 'desk-2',
        deskCode: 'S-02',
        areaId: 'area-2',
        areaName: 'Sala silenciosa',
        localityId: 'locality-2',
        localityName: 'La Plata',
      }),
    );

    expect([firstOutput, secondOutput]).toMatchObject([
      {
        reservationId: 'reservation-1',
        location: {
          areaId: 'area-1',
          localityId: 'locality-1',
        },
      },
      {
        reservationId: 'reservation-2',
        location: {
          areaId: 'area-2',
          localityId: 'locality-2',
        },
      },
    ]);
  });

  it('omits location when a legacy reservation has no loaded relation', () => {
    const reservation = new Reservation({
      id: 'legacy-reservation',
      deskId: 'legacy-desk',
      memberId: 'member-1',
      deskCode: 'L-01',
      date: '2026-07-14',
      startTime: '14:00',
      endTime: '18:00',
      status: 'RESERVED',
    });

    expect(toReservationOutput(reservation)).not.toHaveProperty('location');
  });

  it('maps valid work area address and coordinates', () => {
    const output = toReservationOutput(
      createReservation({
        address: 'Av. Costanera Espana 120',
        latitude: -35.577,
        longitude: -57.997,
      }),
    );

    expect(output.location).toEqual({
      areaId: 'area-1',
      areaName: 'Area abierta',
      localityId: 'locality-1',
      localityName: 'Chascomus',
      address: 'Av. Costanera Espana 120',
      latitude: -35.577,
      longitude: -57.997,
    });
  });

  it.each([
    { address: null, latitude: null, longitude: null },
    { latitude: Number.NaN, longitude: -57.997 },
    { latitude: '-35.577', longitude: '-57.997' },
    { latitude: 91, longitude: -57.997 },
    { latitude: -35.577, longitude: -181 },
    { latitude: -35.577, longitude: undefined },
  ])('omits null, partial or invalid geographic values: %o', (values) => {
    const output = toReservationOutput(createReservation(values));

    expect(output.location).toEqual({
      areaId: 'area-1',
      areaName: 'Area abierta',
      localityId: 'locality-1',
      localityName: 'Chascomus',
    });
  });

  it('keeps geographic values isolated between reservations', () => {
    const outputs = [
      toReservationOutput(
        createReservation({
          address: 'Av. Costanera Espana 120',
          latitude: -35.577,
          longitude: -57.997,
        }),
      ),
      toReservationOutput(
        createReservation({
          id: 'reservation-2',
          areaId: 'area-2',
          areaName: 'Sala silenciosa',
          localityId: 'locality-2',
          localityName: 'La Plata',
          address: 'Calle 50 450',
          latitude: -34.921,
          longitude: -57.955,
        }),
      ),
    ];

    expect(outputs).toMatchObject([
      {
        reservationId: 'reservation-1',
        location: {
          address: 'Av. Costanera Espana 120',
          latitude: -35.577,
          longitude: -57.997,
        },
      },
      {
        reservationId: 'reservation-2',
        location: {
          address: 'Calle 50 450',
          latitude: -34.921,
          longitude: -57.955,
        },
      },
    ]);
  });
});
