import { Inject, Injectable } from '@nestjs/common';

import { ReservationNotFoundError } from '../../domain/errors/reservation-not-found.error';
import { RESERVATION_REPOSITORY } from '../../domain/ports/reservation-repository.port';
import type { ReservationRepositoryPort } from '../../domain/ports/reservation-repository.port';
import { ReservationOutput } from '../dto/reservation.output';
import { toReservationOutput } from '../mappers/reservation-output.mapper';

@Injectable()
export class GetReservationByIdUseCase {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservationRepository: ReservationRepositoryPort,
  ) {}

  async execute(id: string): Promise<ReservationOutput> {
    const reservation = await this.reservationRepository.findById(id);

    if (!reservation) {
      throw new ReservationNotFoundError();
    }

    return toReservationOutput(reservation);
  }
}
