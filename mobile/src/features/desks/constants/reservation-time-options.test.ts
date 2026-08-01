import { RESERVATION_TIME_OPTIONS } from './reservation-time-options';

describe('RESERVATION_TIME_OPTIONS', () => {
  it('permite seleccionar reservas hasta las 23 horas', () => {
    expect(RESERVATION_TIME_OPTIONS).toEqual(
      expect.arrayContaining(['21:00', '22:00', '23:00']),
    );
    expect(RESERVATION_TIME_OPTIONS.at(-1)).toBe('23:00');
  });
});
