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

    const deskAvailability = await this.deskRepository.findAvailableByTimeSlot({
      date: reservationDate.value,
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime,
      ...(input.zone ? { zone: input.zone } : {}),
    });

    return {
      desks: deskAvailability.map(({ desk, reservedSlots }) => {
        const hasOverlap = reservedSlots.some((reservedSlot) =>
          this.overlaps(
            timeSlot.startTime,
            timeSlot.endTime,
            reservedSlot.startTime,
            reservedSlot.endTime,
          ),
        );

        return {
          id: desk.id,
          code: desk.code,
          ...(desk.name ? { name: desk.name } : {}),
          peopleCapacity: desk.peopleCapacity,
          ...(desk.descriptionId ? { descriptionId: desk.descriptionId } : {}),
          ...(desk.description ? { description: desk.description } : {}),
          ...(desk.zone ? { zone: desk.zone } : {}),
          amenities: desk.amenities,
          status: hasOverlap ? 'unavailable' : 'available',
          reservedSlots,
        };
      }),
    };
  }

  private overlaps(
    startTime: string,
    endTime: string,
    reservedStartTime: string,
    reservedEndTime: string,
  ) {
    return (
      this.toMinutes(startTime) < this.toMinutes(reservedEndTime) &&
      this.toMinutes(endTime) > this.toMinutes(reservedStartTime)
    );
  }

  private toMinutes(value: string) {
    const [hours, minutes] = value.split(':').map(Number);

    return hours * 60 + minutes;
  }
}
