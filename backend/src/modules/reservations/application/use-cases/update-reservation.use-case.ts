import { Inject, Injectable } from '@nestjs/common';

import { DeskNotFoundError } from '../../../desks/domain/errors/desk-not-found.error';
import { InvalidReservationDateError } from '../../../desks/domain/errors/invalid-reservation-date.error';
import { InvalidTimeFormatError } from '../../../desks/domain/errors/invalid-time-format.error';
import { DESK_REPOSITORY } from '../../../desks/domain/ports/desk-repository.port';
import type { DeskRepositoryPort } from '../../../desks/domain/ports/desk-repository.port';
import { ReservationDate } from '../../../desks/domain/value-objects/reservation-date.vo';
import { TimeSlot } from '../../../desks/domain/value-objects/time-slot.vo';
import { DeskUnavailableError } from '../../domain/errors/desk-unavailable.error';
import { ReservationCannotBeUpdatedError } from '../../domain/errors/reservation-cannot-be-updated.error';
import { ReservationNotFoundError } from '../../domain/errors/reservation-not-found.error';
import { RESERVATION_REPOSITORY } from '../../domain/ports/reservation-repository.port';
import type { ReservationRepositoryPort } from '../../domain/ports/reservation-repository.port';
import { ReservationOutput } from '../dto/reservation.output';
import { UpdateReservationInput } from '../dto/update-reservation.input';
import { toReservationOutput } from '../mappers/reservation-output.mapper';

@Injectable()
export class UpdateReservationUseCase {
  constructor(
    @Inject(DESK_REPOSITORY)
    private readonly deskRepository: DeskRepositoryPort,
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservationRepository: ReservationRepositoryPort,
  ) {}

  async execute(input: UpdateReservationInput): Promise<ReservationOutput> {
    const currentReservation = await this.reservationRepository.findById(
      input.id,
    );

    if (!currentReservation) {
      throw new ReservationNotFoundError();
    }

    if (currentReservation.status !== 'RESERVED') {
      throw new ReservationCannotBeUpdatedError();
    }

    const nextDeskId = input.deskId ?? currentReservation.deskId;
    const nextDate = input.date ?? currentReservation.date;
    const nextStartTime = input.startTime ?? currentReservation.startTime;
    const nextEndTime = input.endTime ?? currentReservation.endTime;

    if (!nextDate) {
      throw new InvalidReservationDateError();
    }

    if (!nextStartTime || !nextEndTime) {
      throw new InvalidTimeFormatError();
    }

    const reservationDate = ReservationDate.create(nextDate);
    const timeSlot = TimeSlot.create(nextStartTime, nextEndTime);
    const desk = await this.deskRepository.findById(nextDeskId);

    if (!desk || !desk.enabled) {
      throw new DeskNotFoundError();
    }

    const hasOverlappingReservation =
      await this.reservationRepository.existsOverlappingReservation({
        deskId: desk.id,
        date: reservationDate.value,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        excludeReservationId: input.id,
      });

    if (hasOverlappingReservation) {
      throw new DeskUnavailableError();
    }

    const reservation = await this.reservationRepository.update({
      id: input.id,
      deskId: desk.id,
      date: reservationDate.value,
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime,
    });

    return toReservationOutput(reservation);
  }
}
