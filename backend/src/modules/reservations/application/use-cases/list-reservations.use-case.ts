import { Inject, Injectable } from '@nestjs/common';

import { RESERVATION_REPOSITORY } from '../../domain/ports/reservation-repository.port';
import type { ReservationRepositoryPort } from '../../domain/ports/reservation-repository.port';
import { ListReservationsInput } from '../dto/list-reservations.input';
import { ListReservationsOutput } from '../dto/list-reservations.output';
import { toReservationOutput } from '../mappers/reservation-output.mapper';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 9;
const MAX_LIMIT = 50;

@Injectable()
export class ListReservationsUseCase {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservationRepository: ReservationRepositoryPort,
  ) {}

  async execute(input: ListReservationsInput): Promise<ListReservationsOutput> {
    const page = Math.max(input.page ?? DEFAULT_PAGE, DEFAULT_PAGE);
    const limit = Math.min(
      Math.max(input.limit ?? DEFAULT_LIMIT, DEFAULT_PAGE),
      MAX_LIMIT,
    );
    const result = await this.reservationRepository.list({
      page,
      limit,
      ...(input.status ? { status: input.status } : {}),
      ...(input.date ? { date: input.date } : {}),
    });

    return {
      reservations: result.reservations.map(toReservationOutput),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }
}
