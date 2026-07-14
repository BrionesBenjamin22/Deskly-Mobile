import type { Reservation } from '../types/reservation.types';

export type ReservationLocationFixture = {
  areaId: string;
  areaName: string;
  localityId: string;
  localityName: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};

export type ReservationFixture = Reservation & {
  location?: ReservationLocationFixture;
};

export function buildReservationLocation(
  overrides: Partial<ReservationLocationFixture> = {},
): ReservationLocationFixture {
  return {
    areaId: 'area-1',
    areaName: 'Area abierta',
    localityId: 'locality-1',
    localityName: 'Chascomus',
    address: 'Av. Costanera Espana 120',
    latitude: -35.577,
    longitude: -57.997,
    ...overrides,
  };
}

export function buildReservation(
  overrides: Partial<ReservationFixture> = {},
): ReservationFixture {
  return {
    id: 'reservation-1',
    deskId: 'desk-1',
    deskCode: 'A-01',
    deskName: 'Escritorio ventana',
    memberFullName: 'Ada Lovelace',
    date: '2026-07-14',
    dateLabel: 'martes, 14 de julio',
    startTime: '09:00',
    endTime: '13:00',
    status: 'reserved',
    location: buildReservationLocation(),
    ...overrides,
  };
}

export function buildReservationWithoutLocation(
  overrides: Partial<Omit<ReservationFixture, 'location'>> = {},
): ReservationFixture {
  const reservation = buildReservation(overrides);

  delete reservation.location;

  return reservation;
}

export function buildReservationWithPartialLocation(
  overrides: Partial<ReservationFixture> = {},
): ReservationFixture {
  return buildReservation({
    location: buildReservationLocation({
      latitude: undefined,
      longitude: undefined,
    }),
    ...overrides,
  });
}
