import { ReservationStatusValue } from '../../domain/entities/reservation.entity';

export type ReservationOutput = {
  reservationId: string;
  deskId: string;
  memberId: string;
  memberFullName?: string;
  deskCode: string;
  deskName?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: ReservationStatusValue;
  createdAt?: string;
  updatedAt?: string;
  cancelledAt?: string;
  checkedInAt?: string;
};
