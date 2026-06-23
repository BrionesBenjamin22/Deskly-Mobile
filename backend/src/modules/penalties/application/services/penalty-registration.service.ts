import { Inject, Injectable } from '@nestjs/common';

import { Penalty } from '../../domain/entities/penalty.entity';
import {
  AbsenceToleranceNotReachedError,
  PenaltyReservationNotFoundError,
  ReservationNotActiveForAbsenceError,
  ReservationAlreadyCheckedInError,
} from '../../domain/errors/penalty.errors';
import { PENALTY_REPOSITORY } from '../../domain/ports/penalty-repository.port';
import type {
  PenaltyRepositoryPort,
  PenaltyReservationContext,
} from '../../domain/ports/penalty-repository.port';

const ABSENCE_TOLERANCE_MS = 60 * 60 * 1000;
const LATE_CANCELLATION_WINDOW_MS = 2 * 60 * 60 * 1000;

@Injectable()
export class PenaltyRegistrationService {
  constructor(
    @Inject(PENALTY_REPOSITORY)
    private readonly repository: PenaltyRepositoryPort,
  ) {}

  async registerAbsence(input: {
    reservationId: string;
    reason: string;
    registeredById: string;
    now?: Date;
  }): Promise<Penalty> {
    const now = input.now ?? new Date();
    const reservation = await this.getReservation(input.reservationId);
    if (reservation.status !== 'RESERVED')
      throw new ReservationNotActiveForAbsenceError();
    if (reservation.checkedInAt) throw new ReservationAlreadyCheckedInError();
    if (
      now.getTime() <
      this.getStartDate(reservation).getTime() + ABSENCE_TOLERANCE_MS
    ) {
      throw new AbsenceToleranceNotReachedError();
    }

    return this.repository.register({
      reservationId: reservation.id,
      memberId: reservation.memberId,
      registeredById: input.registeredById,
      type: 'ABSENCE',
      reason: input.reason.trim(),
      registeredAt: now,
      activeUntil: this.addOneMonth(now),
      cancelReservation: true,
    });
  }

  async registerLateCancellationIfApplicable(input: {
    reservationId: string;
    cancelledAt: Date;
  }): Promise<Penalty | null> {
    const reservation = await this.getReservation(input.reservationId);
    const start = this.getStartDate(reservation);
    const millisecondsBeforeStart =
      start.getTime() - input.cancelledAt.getTime();
    if (
      millisecondsBeforeStart < 0 ||
      millisecondsBeforeStart > LATE_CANCELLATION_WINDOW_MS
    )
      return null;

    return this.repository.register({
      reservationId: reservation.id,
      memberId: reservation.memberId,
      registeredById: null,
      type: 'LATE_CANCELLATION',
      reason:
        'Cancelacion realizada dentro de las 2 horas previas al inicio de la reserva.',
      registeredAt: input.cancelledAt,
      activeUntil: this.addOneMonth(input.cancelledAt),
      cancelReservation: false,
    });
  }

  private async getReservation(id: string): Promise<PenaltyReservationContext> {
    const reservation = await this.repository.findReservation(id);
    if (!reservation) throw new PenaltyReservationNotFoundError();
    return reservation;
  }

  private getStartDate(reservation: PenaltyReservationContext): Date {
    return new Date(`${reservation.date}T${reservation.startTime}:00-03:00`);
  }

  private addOneMonth(value: Date): Date {
    const result = new Date(value);
    result.setUTCMonth(result.getUTCMonth() + 1);
    return result;
  }
}
