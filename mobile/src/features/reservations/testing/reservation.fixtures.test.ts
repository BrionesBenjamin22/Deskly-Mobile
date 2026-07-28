import {
  buildReservation,
  buildReservationWithPartialLocation,
  buildReservationWithoutLocation,
} from './reservation.fixtures';

describe('reservation fixtures', () => {
  it('builds a reservation with complete location details', () => {
    const reservation = buildReservation();

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

  it('builds a reservation without location details', () => {
    const reservation = buildReservationWithoutLocation();

    expect(reservation).not.toHaveProperty('location');
  });

  it('builds a reservation with partial location details', () => {
    const reservation = buildReservationWithPartialLocation();

    expect(reservation.location).toEqual(
      expect.objectContaining({
        areaName: 'Area abierta',
        localityName: 'Chascomus',
        latitude: undefined,
        longitude: undefined,
      }),
    );
  });

  it('supports independent overrides without sharing nested data', () => {
    const first = buildReservation({ id: 'reservation-1' });
    const second = buildReservation({ id: 'reservation-2' });

    expect(first.id).toBe('reservation-1');
    expect(second.id).toBe('reservation-2');
    expect(first.location).not.toBe(second.location);
  });
});
