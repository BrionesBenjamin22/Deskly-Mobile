import { Inject, Injectable } from '@nestjs/common';

import { DeskNotFoundError } from '../../../desks/domain/errors/desk-not-found.error';
import { DESK_REPOSITORY } from '../../../desks/domain/ports/desk-repository.port';
import type { DeskRepositoryPort } from '../../../desks/domain/ports/desk-repository.port';
import { InvalidReservationDateError } from '../../../desks/domain/errors/invalid-reservation-date.error';
import { InvalidTimeFormatError } from '../../../desks/domain/errors/invalid-time-format.error';
import { ReservationDate } from '../../../desks/domain/value-objects/reservation-date.vo';
import { TimeSlot } from '../../../desks/domain/value-objects/time-slot.vo';
import { Reservation } from '../../domain/entities/reservation.entity';
import { DeskUnavailableError } from '../../domain/errors/desk-unavailable.error';
import { RESERVATION_REPOSITORY } from '../../domain/ports/reservation-repository.port';
import type { ReservationRepositoryPort } from '../../domain/ports/reservation-repository.port';
import { CreateReservationInput } from '../dto/create-reservation.input';
import { CreateReservationOutput } from '../dto/create-reservation.output';

@Injectable()
export class CreateReservationUseCase {
  constructor(
    @Inject(DESK_REPOSITORY)
    private readonly deskRepository: DeskRepositoryPort,
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservationRepository: ReservationRepositoryPort,
  ) {}

  async execute(
    input: CreateReservationInput,
  ): Promise<CreateReservationOutput> {
    if (!input.date) {
      throw new InvalidReservationDateError();
    }

    if (!input.startTime || !input.endTime) {
      throw new InvalidTimeFormatError();
    }

    const reservationDate = ReservationDate.create(input.date);
    const timeSlot = TimeSlot.create(input.startTime, input.endTime);
    const desk = await this.deskRepository.findById(input.deskId);

    if (!desk || !desk.enabled) {
      throw new DeskNotFoundError();
    }

    const hasOverlappingReservation =
      await this.reservationRepository.existsOverlappingReservation({
        deskId: desk.id,
        date: reservationDate.value,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
      });

    if (hasOverlappingReservation) {
      throw new DeskUnavailableError();
    }

    const reservation = await this.reservationRepository.save(
      new Reservation({
        deskId: desk.id,
        deskCode: desk.code,
        date: reservationDate.value,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        status: 'ACTIVE',
      }),
    );

    if (!reservation.id) {
      throw new Error('Reservation was not persisted correctly.');
    }

    return {
      reservationId: reservation.id,
      deskId: reservation.deskId,
      deskCode: reservation.deskCode ?? desk.code,
      date: reservation.date,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      status: 'ACTIVE',
    };
  }
}
