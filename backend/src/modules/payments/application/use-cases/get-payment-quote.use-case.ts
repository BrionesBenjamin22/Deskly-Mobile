import { Inject, Injectable } from '@nestjs/common';

import { RESERVATION_REPOSITORY } from '../../../reservations/domain/ports/reservation-repository.port';
import type { ReservationRepositoryPort } from '../../../reservations/domain/ports/reservation-repository.port';
import { InvalidPaymentAttemptError } from '../../domain/errors/payment-domain.errors';
import { ReservationNotFoundError } from '../../domain/errors/reservation-not-found.error';
import { PAYMENT_ATTEMPT_REPOSITORY } from '../../domain/ports/payment-attempt-repository.port';
import type { PaymentAttemptRepositoryPort } from '../../domain/ports/payment-attempt-repository.port';
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
    @Inject(PAYMENT_ATTEMPT_REPOSITORY)
    private readonly payments: PaymentAttemptRepositoryPort,
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
    const approvedMinorUnits = (
      await this.payments.listByReservationId(reservationId)
    )
      .filter((payment) => payment.status === 'APPROVED')
      .reduce((total, payment) => total + payment.amount.minorUnits, 0);
    const pendingMinorUnits = Math.max(
      0,
      full.total.minorUnits - approvedMinorUnits,
    );
    const options =
      approvedMinorUnits === 0
        ? [
            {
              option: 'DEPOSIT' as const,
              amountMinorUnits: deposit.payable.minorUnits,
            },
            {
              option: 'FULL' as const,
              amountMinorUnits: full.payable.minorUnits,
            },
          ]
        : pendingMinorUnits > 0
          ? [
              {
                option: 'FULL' as const,
                amountMinorUnits: pendingMinorUnits,
              },
            ]
          : [];

    return {
      reservationId,
      currency: 'ARS' as const,
      pricingVersion: PAYMENT_PRICING_VERSION,
      totalMinorUnits: full.total.minorUnits,
      approvedMinorUnits,
      pendingMinorUnits,
      options,
    };
  }

  private toMinutes(value: string): number {
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
