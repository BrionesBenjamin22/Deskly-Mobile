import { sortReservationsForDisplay } from './useReservations';
import type { Reservation } from '../types/reservation.types';

function reservation(
  id: string,
  status: Reservation['status'],
  date: string,
): Reservation {
  return {
    id,
    deskId: `desk-${id}`,
    deskCode: id,
    deskName: id,
    date,
    dateLabel: date,
    startTime: '09:00',
    endTime: '10:00',
    status,
  };
}

describe('orden visible de reservas', () => {
  it('prioriza activas y pendientes de pago y deja canceladas al final', () => {
    const result = sortReservationsForDisplay([
      reservation('cancelada', 'cancelled', '2026-07-20'),
      reservation('finalizada', 'completed', '2026-07-21'),
      reservation('reservada', 'reserved', '2026-08-03'),
      reservation('pendiente', 'pending_payment', '2026-08-01'),
      reservation('activa', 'active', '2026-07-24'),
    ]);

    expect(result.map((item) => item.id)).toEqual([
      'activa',
      'pendiente',
      'reservada',
      'finalizada',
      'cancelada',
    ]);
  });

  it('ordena por fecha dentro del mismo estado', () => {
    const result = sortReservationsForDisplay([
      reservation('posterior', 'reserved', '2026-08-10'),
      reservation('anterior', 'reserved', '2026-08-02'),
    ]);

    expect(result.map((item) => item.id)).toEqual(['anterior', 'posterior']);
  });
});
