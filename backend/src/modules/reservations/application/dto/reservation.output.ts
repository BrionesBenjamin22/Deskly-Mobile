import { ReservationStatusValue } from '../../domain/entities/reservation.entity';

export type ReservationLocationOutput = {
  areaId: string;
  areaName: string;
  localityId: string;
  localityName: string;
};

export type ReservationOutput = {
  reservationId: string;
  deskId: string;
  memberId: string;
  memberFullName?: string;
  deskCode: string;
  deskName?: string;
  location?: ReservationLocationOutput;
  date: string;
  startTime: string;
  endTime: string;
  status: ReservationStatusValue;
  createdAt?: string;
  updatedAt?: string;
  cancelledAt?: string;
  checkedInAt?: string;
};
