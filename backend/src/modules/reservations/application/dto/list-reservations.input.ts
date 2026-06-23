import { ReservationStatusValue } from '../../domain/entities/reservation.entity';

export type ListReservationsInput = {
  page?: number;
  limit?: number;
  status?: ReservationStatusValue;
  date?: string;
  memberId?: string;
};
