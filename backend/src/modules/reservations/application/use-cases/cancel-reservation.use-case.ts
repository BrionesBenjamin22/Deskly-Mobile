import { Inject, Injectable, Optional } from '@nestjs/common';

import { PenaltyRegistrationService } from '../../../penalties/application/services/penalty-registration.service';

import { ReservationCannotBeCancelledError } from '../../domain/errors/reservation-cannot-be-cancelled.error';
import { ReservationNotFoundError } from '../../domain/errors/reservation-not-found.error';
import { RESERVATION_REPOSITORY } from '../../domain/ports/reservation-repository.port';
import type { ReservationRepositoryPort } from '../../domain/ports/reservation-repository.port';
import { CancelReservationOutput } from '../dto/cancel-reservation.output';

@Injectable()
export class CancelReservationUseCase {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservationRepository: ReservationRepositoryPort,
    @Optional()
    private readonly penaltyRegistrationService?: PenaltyRegistrationService,
  ) {}

  async execute(id: string): Promise<CancelReservationOutput> {
    const reservation = await this.reservationRepository.findById(id);

    if (!reservation) {
      throw new ReservationNotFoundError();
    }

    if (reservation.status !== 'RESERVED' || reservation.checkedInAt) {
      throw new ReservationCannotBeCancelledError();
    }

    const cancelledAt = new Date();
    const cancelledReservation = await this.reservationRepository.cancel(
      id,
      cancelledAt,
    );

    await this.penaltyRegistrationService?.registerLateCancellationIfApplicable(
      {
        reservationId: id,
        cancelledAt,
      },
    );

    if (!cancelledReservation.id || !cancelledReservation.cancelledAt) {
      throw new Error('Reservation was not cancelled correctly.');
    }

    return {
      reservationId: cancelledReservation.id,
      status: 'CANCELLED',
      cancelledAt: cancelledReservation.cancelledAt.toISOString(),
    };
  }
}
