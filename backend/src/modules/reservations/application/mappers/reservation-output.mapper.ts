import { Reservation } from '../../domain/entities/reservation.entity';
import { WorkAreaLocation } from '../../../desks/domain/value-objects/work-area-location.vo';
import { ReservationOutput } from '../dto/reservation.output';

function toOptionalWorkAreaLocation(
  address: unknown,
  latitude: unknown,
  longitude: unknown,
) {
  const hasValidCoordinates =
    typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    typeof longitude === 'number' &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180;

  return WorkAreaLocation.create({
    ...(typeof address === 'string' ? { address } : {}),
    ...(hasValidCoordinates ? { latitude, longitude } : {}),
  }).toPrimitives();
}

export function toReservationOutput(
  reservation: Reservation,
): ReservationOutput {
  if (!reservation.id || !reservation.deskCode) {
    throw new Error('Reservation output requires persisted reservation data.');
  }

  return {
    reservationId: reservation.id,
    deskId: reservation.deskId,
    memberId: reservation.memberId,
    ...(reservation.memberFullName
      ? { memberFullName: reservation.memberFullName }
      : {}),
    deskCode: reservation.deskCode,
    ...(reservation.deskName ? { deskName: reservation.deskName } : {}),
    ...(reservation.areaId &&
    reservation.areaName &&
    reservation.localityId &&
    reservation.localityName
      ? {
          location: {
            areaId: reservation.areaId,
            areaName: reservation.areaName,
            localityId: reservation.localityId,
            localityName: reservation.localityName,
            ...toOptionalWorkAreaLocation(
              reservation.address,
              reservation.latitude,
              reservation.longitude,
            ),
          },
        }
      : {}),
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
    ...(reservation.checkedInAt
      ? { checkedInAt: reservation.checkedInAt.toISOString() }
      : {}),
  };
}
