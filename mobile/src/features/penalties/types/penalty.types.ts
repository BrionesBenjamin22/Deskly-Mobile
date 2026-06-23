export type PenaltyType = 'ABSENCE' | 'LATE_CANCELLATION';
export type InfractionLevel = 'WARNING' | 'PENALTY';

export type Penalty = {
  penaltyId: string;
  reservationId: string;
  memberId: string;
  registeredById: string | null;
  type: PenaltyType;
  level: InfractionLevel;
  reason: string;
  registeredAt: string;
  activeUntil: string;
  active: boolean;
};

export type RegisterAbsencePayload = {
  reservationId: string;
  reason: string;
};
