import { Penalty, PenaltyTypeValue } from '../entities/penalty.entity';

export const PENALTY_REPOSITORY = Symbol('PENALTY_REPOSITORY');

export type PenaltyReservationContext = {
  id: string;
  memberId: string;
  date: string;
  startTime: string;
  status: 'ACTIVE' | 'CANCELLED';
  checkedInAt: Date | null;
};

export type RegisterInfractionParams = {
  reservationId: string;
  memberId: string;
  registeredById: string | null;
  type: PenaltyTypeValue;
  reason: string;
  registeredAt: Date;
  activeUntil: Date;
  cancelReservation: boolean;
};

export type ListPenaltiesParams = {
  memberId?: string;
  page: number;
  limit: number;
};
export type ListPenaltiesResult = { penalties: Penalty[]; total: number };

export interface PenaltyRepositoryPort {
  findReservation(id: string): Promise<PenaltyReservationContext | null>;
  register(params: RegisterInfractionParams): Promise<Penalty>;
  list(params: ListPenaltiesParams): Promise<ListPenaltiesResult>;
}
