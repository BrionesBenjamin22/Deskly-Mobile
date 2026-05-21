import { Reservation } from '../../domain/entities/reservation.entity';
import { ReservationOutput } from '../dto/reservation.output';

export function toReservationOutput(
  reservation: Reservation,
): ReservationOutput {
  if (!reservation.id || !reservation.deskCode) {
    throw new Error('Reservation output requires persisted reservation data.');
  }

  return {
    reservationId: reservation.id,
    deskId: reservation.deskId,
    deskCode: reservation.deskCode,
    ...(reservation.deskName ? { deskName: reservation.deskName } : {}),
    date: reservation.date,
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    status: reservation.status,
    ...(reservation.createdAt
      ? { createdAt: reservation.createdAt.toISOString() }
      : {}),
    ...(reservation.updatedAt
      ? { updatedAt: reservation.updatedAt.toISOString() }
      : {}),
    ...(reservation.cancelledAt
      ? { cancelledAt: reservation.cancelledAt.toISOString() }
      : {}),
  };
}
