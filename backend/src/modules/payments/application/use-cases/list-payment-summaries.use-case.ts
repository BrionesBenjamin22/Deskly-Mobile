import { Inject, Injectable } from '@nestjs/common';

import { PAYMENT_ATTEMPT_REPOSITORY } from '../../domain/ports/payment-attempt-repository.port';
import type { PaymentAttemptRepositoryPort } from '../../domain/ports/payment-attempt-repository.port';
import {
  PAYMENT_PRICING_VERSION,
  PaymentPricingPolicy,
} from '../../domain/services/payment-pricing-policy';
import {
  SynchronizePaymentAttemptUseCase,
  toPaymentAttemptOutput,
} from './query-payment-attempts.use-cases';

export type PaymentSummaryFilter = 'ALL' | 'PENDING' | 'COMPLETED';

@Injectable()
export class ListPaymentSummariesUseCase {
  private readonly pricing = new PaymentPricingPolicy();

  constructor(
    @Inject(PAYMENT_ATTEMPT_REPOSITORY)
    private readonly payments: PaymentAttemptRepositoryPort,
    private readonly synchronizePayment: SynchronizePaymentAttemptUseCase,
  ) {}

  async execute(
    memberId: string,
    page: number,
    limit: number,
    filter: PaymentSummaryFilter = 'ALL',
  ) {
    const candidates =
      await this.payments.listPaymentSummaryCandidates(memberId);
    const synchronized = await Promise.all(
      candidates.map(async (reservation) => {
        const attempts = await Promise.all(
          reservation.attempts.map((payment) =>
            this.synchronizePayment.execute(payment),
          ),
        );
        const durationMinutes =
          this.toMinutes(reservation.endTime) -
          this.toMinutes(reservation.startTime);
        const totalMinorUnits = this.pricing.quote(durationMinutes, 'FULL')
          .total.minorUnits;
        const approvedMinorUnits = attempts
          .filter((payment) => payment.status === 'APPROVED')
          .reduce((total, payment) => total + payment.amount.minorUnits, 0);

        return {
          reservationId: reservation.id,
          deskName: reservation.deskName,
          date: reservation.date,
          totalMinorUnits,
          approvedMinorUnits,
          pendingMinorUnits: Math.max(0, totalMinorUnits - approvedMinorUnits),
          currency: 'ARS' as const,
          pricingVersion: PAYMENT_PRICING_VERSION,
          attempts: attempts.map(toPaymentAttemptOutput),
        };
      }),
    );
    const visible = synchronized.filter((item) =>
      item.attempts.some((attempt) => attempt.status === 'APPROVED'),
    );
    const filtered = visible.filter((item) => {
      if (filter === 'PENDING') return item.pendingMinorUnits > 0;
      if (filter === 'COMPLETED') return item.pendingMinorUnits === 0;
      return true;
    });
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return {
      items,
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit),
      },
    };
  }

  private toMinutes(value: string): number {
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
