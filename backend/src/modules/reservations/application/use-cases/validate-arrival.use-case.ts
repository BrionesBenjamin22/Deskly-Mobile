import { Inject, Injectable } from '@nestjs/common';

import { ReservationCannotCheckInError } from '../../domain/errors/reservation-cannot-check-in.error';
import { ReservationNotFoundError } from '../../domain/errors/reservation-not-found.error';
import { RESERVATION_REPOSITORY } from '../../domain/ports/reservation-repository.port';
import type { ReservationRepositoryPort } from '../../domain/ports/reservation-repository.port';
import { ReservationOutput } from '../dto/reservation.output';
import { toReservationOutput } from '../mappers/reservation-output.mapper';

@Injectable()
export class ValidateArrivalUseCase {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly repository: ReservationRepositoryPort,
  ) {}

  async execute(id: string, now = new Date()): Promise<ReservationOutput> {
    const reservation = await this.repository.findById(id);
    if (!reservation) throw new ReservationNotFoundError();
    if (
      reservation.status !== 'ACTIVE' ||
      reservation.date !== this.getBusinessDate(now)
    ) {
      throw new ReservationCannotCheckInError();
    }
    if (reservation.checkedInAt) return toReservationOutput(reservation);

    const updated = await this.repository.validateArrival(id, now);
    if (!updated?.checkedInAt) throw new ReservationCannotCheckInError();
    return toReservationOutput(updated);
  }

  private getBusinessDate(value: Date): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(value);
  }
}
