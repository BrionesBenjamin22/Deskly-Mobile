import { ReservationOutput } from './reservation.output';

export type ListReservationsOutput = {
  reservations: ReservationOutput[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
