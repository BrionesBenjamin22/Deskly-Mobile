import { Inject, Injectable } from '@nestjs/common';

import { ReservationDate } from '../../domain/value-objects/reservation-date.vo';
import { TimeSlot } from '../../domain/value-objects/time-slot.vo';
import { DESK_REPOSITORY } from '../../domain/ports/desk-repository.port';
import type { DeskRepositoryPort } from '../../domain/ports/desk-repository.port';
import { GetAvailableDesksInput } from '../dto/get-available-desks.input';
import { GetAvailableDesksOutput } from '../dto/get-available-desks.output';

@Injectable()
export class GetAvailableDesksUseCase {
  constructor(
    @Inject(DESK_REPOSITORY)
    private readonly deskRepository: DeskRepositoryPort,
  ) {}

  async execute(
    input: GetAvailableDesksInput,
  ): Promise<GetAvailableDesksOutput> {
    const reservationDate = ReservationDate.create(input.date);
    const timeSlot = TimeSlot.create(input.startTime, input.endTime);

    const desks = await this.deskRepository.findAvailableByTimeSlot({
      date: reservationDate.value,
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime,
    });

    return {
      desks: desks.map((desk) => ({
        id: desk.id,
        code: desk.code,
        ...(desk.name ? { name: desk.name } : {}),
        ...(desk.descriptionId ? { descriptionId: desk.descriptionId } : {}),
        ...(desk.description ? { description: desk.description } : {}),
        ...(desk.zone ? { zone: desk.zone } : {}),
        amenities: desk.amenities,
      })),
    };
  }
}
