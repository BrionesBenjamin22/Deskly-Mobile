import { Inject, Injectable } from '@nestjs/common';

import { DESK_REPOSITORY } from '../../domain/ports/desk-repository.port';
import type { DeskRepositoryPort } from '../../domain/ports/desk-repository.port';
import { ReservationDate } from '../../domain/value-objects/reservation-date.vo';
import { TimeSlot } from '../../domain/value-objects/time-slot.vo';
import { GetAvailableDesksInput } from '../dto/get-available-desks.input';
import { WorkAreaAvailabilityOutput } from '../dto/work-area.output';

@Injectable()
export class GetAvailableWorkAreasUseCase {
  constructor(
    @Inject(DESK_REPOSITORY)
    private readonly deskRepository: DeskRepositoryPort,
  ) {}

  async execute(
    input: GetAvailableDesksInput,
  ): Promise<WorkAreaAvailabilityOutput> {
    const reservationDate = ReservationDate.create(input.date);
    const timeSlot = TimeSlot.create(input.startTime, input.endTime);
    const areas =
      await this.deskRepository.findAvailableWorkAreasByTimeSlot({
        date: reservationDate.value,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        ...(input.zone ? { zone: input.zone } : {}),
        ...(input.areaId ? { areaId: input.areaId } : {}),
        ...(input.localityId ? { localityId: input.localityId } : {}),
      });

    return {
      areas: areas.map(({ area, availableDeskCount, totalDeskCount }) => ({
        ...area,
        availableDeskCount,
        totalDeskCount,
      })),
    };
  }
}
