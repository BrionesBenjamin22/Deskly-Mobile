import { Reservation } from '../entities/reservation.entity';

export const RESERVATION_REPOSITORY = Symbol('RESERVATION_REPOSITORY');

export type OverlappingReservationParams = {
  deskId: string;
  date: string;
  startTime: string;
  endTime: string;
  excludeReservationId?: string;
};

export type ListReservationsParams = {
  page: number;
  limit: number;
  status?: 'ACTIVE' | 'CANCELLED';
  date?: string;
  memberId?: string;
};

export type ListReservationsResult = {
  reservations: Reservation[];
  total: number;
};

export type UpdateReservationParams = {
  id: string;
  deskId: string;
  date: string;
  startTime: string;
  endTime: string;
};

export interface ReservationRepositoryPort {
  memberExists(memberId: string): Promise<boolean>;
  existsOverlappingReservation(
    params: OverlappingReservationParams,
  ): Promise<boolean>;
  save(reservation: Reservation): Promise<Reservation>;
  list(params: ListReservationsParams): Promise<ListReservationsResult>;
  findById(id: string): Promise<Reservation | null>;
  update(params: UpdateReservationParams): Promise<Reservation>;
  cancel(id: string, cancelledAt: Date): Promise<Reservation>;
  validateArrival(id: string, checkedInAt: Date): Promise<Reservation | null>;
}
