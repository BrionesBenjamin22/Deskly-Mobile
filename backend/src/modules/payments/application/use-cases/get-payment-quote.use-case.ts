import { Inject, Injectable } from '@nestjs/common';

import { RESERVATION_REPOSITORY } from '../../../reservations/domain/ports/reservation-repository.port';
import type { ReservationRepositoryPort } from '../../../reservations/domain/ports/reservation-repository.port';
import { InvalidPaymentAttemptError } from '../../domain/errors/payment-domain.errors';
import { ReservationNotFoundError } from '../../domain/errors/reservation-not-found.error';
import {
  PAYMENT_PRICING_VERSION,
  PaymentPricingPolicy,
} from '../../domain/services/payment-pricing-policy';
import { PaymentAccessDeniedError } from './query-payment-attempts.use-cases';

@Injectable()
export class GetPaymentQuoteUseCase {
  private readonly pricing = new PaymentPricingPolicy();

  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservations: ReservationRepositoryPort,
  ) {}

  async execute(reservationId: string, memberId: string) {
    const reservation = await this.reservations.findById(reservationId);
    if (!reservation) throw new ReservationNotFoundError();
    if (reservation.memberId !== memberId) throw new PaymentAccessDeniedError();
    if (!['RESERVED', 'PENDING_PAYMENT'].includes(reservation.status))
      throw new InvalidPaymentAttemptError(
        'La reserva no se encuentra en un estado pagable.',
      );

    const durationMinutes =
      this.toMinutes(reservation.endTime) -
      this.toMinutes(reservation.startTime);
    const deposit = this.pricing.quote(durationMinutes, 'DEPOSIT');
    const full = this.pricing.quote(durationMinutes, 'FULL');

    return {
      reservationId,
      currency: 'ARS' as const,
      pricingVersion: PAYMENT_PRICING_VERSION,
      options: [
        {
          option: 'DEPOSIT' as const,
          amountMinorUnits: deposit.payable.minorUnits,
        },
        { option: 'FULL' as const, amountMinorUnits: full.payable.minorUnits },
      ],
    };
  }

  private toMinutes(value: string): number {
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
