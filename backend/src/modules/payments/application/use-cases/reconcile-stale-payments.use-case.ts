import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';

import { PaymentAttempt } from '../../domain/entities/payment-attempt.entity';
import {
  ConcurrentPaymentUpdateError,
  DuplicateReservationApprovalError,
  PaymentGatewayError,
} from '../../domain/errors/payment-domain.errors';
import { PAYMENT_ATTEMPT_REPOSITORY } from '../../domain/ports/payment-attempt-repository.port';
import type { PaymentAttemptRepositoryPort } from '../../domain/ports/payment-attempt-repository.port';
import { PAYMENT_GATEWAY } from '../../domain/ports/payment-gateway.port';
import type { PaymentGatewayPort } from '../../domain/ports/payment-gateway.port';

export type ReconciliationInput = {
  limit?: number;
  minAgeMinutes?: number;
};

export type ReconciliationResult = {
  scanned: number;
  updated: number;
  expired: number;
  retryableFailures: number;
  inconsistencies: number;
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const DEFAULT_MIN_AGE_MINUTES = 5;
export const PAYMENT_RECONCILIATION_CLOCK = Symbol(
  'PAYMENT_RECONCILIATION_CLOCK',
);

@Injectable()
export class ReconcileStalePaymentsUseCase {
  private readonly logger = new Logger(ReconcileStalePaymentsUseCase.name);

  constructor(
    @Inject(PAYMENT_ATTEMPT_REPOSITORY)
    private readonly repository: PaymentAttemptRepositoryPort,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGatewayPort,
    @Optional()
    @Inject(PAYMENT_RECONCILIATION_CLOCK)
    clock?: () => Date,
  ) {
    this.clock = clock ?? (() => new Date());
  }

  private readonly clock: () => Date;

  async execute(
    input: ReconciliationInput = {},
  ): Promise<ReconciliationResult> {
    const now = this.clock();
    const limit = Math.min(
      Math.max(input.limit ?? DEFAULT_LIMIT, 1),
      MAX_LIMIT,
    );
    const minAgeMinutes = Math.max(
      input.minAgeMinutes ?? DEFAULT_MIN_AGE_MINUTES,
      1,
    );
    const updatedBefore = new Date(now.getTime() - minAgeMinutes * 60_000);
    const payments = await this.repository.listStale(
      this.gateway.provider,
      ['PENDING', 'PROCESSING'],
      updatedBefore,
      limit,
    );
    const result: ReconciliationResult = {
      scanned: payments.length,
      updated: 0,
      expired: 0,
      retryableFailures: 0,
      inconsistencies: 0,
    };

    for (const payment of payments) {
      try {
        const reconciledStatus = await this.reconcileOne(payment, now);
        if (reconciledStatus) {
          result.updated += 1;
          if (reconciledStatus === 'EXPIRED') result.expired += 1;
        }
      } catch (error) {
        if (this.isRetryableGatewayError(error)) {
          result.retryableFailures += 1;
          this.logger.warn(
            `conciliacion reintentable payment=${this.safeId(payment)}`,
          );
          continue;
        }
        if (this.isRecoverableConcurrencyError(error)) {
          result.inconsistencies += 1;
          this.logger.warn(
            `conciliacion concurrente payment=${this.safeId(payment)}`,
          );
          continue;
        }
        result.inconsistencies += 1;
        this.logger.error(
          `conciliacion inconsistente payment=${this.safeId(payment)}`,
        );
      }
    }

    this.logger.log(
      `conciliacion scanned=${result.scanned} updated=${result.updated} expired=${result.expired} retryable=${result.retryableFailures} inconsistent=${result.inconsistencies}`,
    );
    return result;
  }

  private async reconcileOne(
    payment: PaymentAttempt,
    now: Date,
  ): Promise<PaymentAttempt['status'] | null> {
    const previousStatus = payment.status;
    let occurredAt = now;
    let synchronized = payment;
    const expectation = {
      externalReference: payment.externalReference,
      amountMinorUnits: payment.amount.minorUnits,
      currency: payment.amount.currency,
    };

    if (!payment.externalPaymentId) {
      const snapshot = await this.gateway.findPaymentByExternalReference(
        payment.externalReference,
        expectation,
      );
      if (snapshot) {
        synchronized = await this.repository.bindExternalPaymentId(
          payment.id!,
          payment.provider,
          snapshot.externalPaymentId,
        );
        occurredAt = snapshot.occurredAt;
        const nextStatus =
          snapshot.status === 'PENDING' &&
          payment.expiresAt.getTime() <= now.getTime()
            ? 'EXPIRED'
            : snapshot.status;
        if (!synchronized.canTransitionTo(nextStatus)) return null;
        synchronized.transitionTo(nextStatus, occurredAt);
      } else {
        if (payment.expiresAt.getTime() > now.getTime()) return null;
        synchronized.transitionTo('EXPIRED', now);
      }
    } else {
      const snapshot = await this.gateway.getPayment(
        payment.externalPaymentId,
        expectation,
      );
      occurredAt = snapshot.occurredAt;
      const nextStatus =
        snapshot.status === 'PENDING' &&
        payment.expiresAt.getTime() <= now.getTime()
          ? 'EXPIRED'
          : snapshot.status;
      if (!synchronized.canTransitionTo(nextStatus)) return null;
      synchronized.transitionTo(nextStatus, occurredAt);
    }

    if (synchronized.status === previousStatus) return null;
    const event = {
      eventId: randomUUID(),
      paymentId: synchronized.id!,
      provider: synchronized.provider,
      externalEventId: `reconciliation:${randomUUID()}`,
      previousStatus,
      newStatus: synchronized.status,
      occurredAt,
      processedAt: now,
    };
    try {
      await this.repository.saveStatus(synchronized, event);
    } catch (error) {
      if (!this.isDuplicateApproval(error) || !synchronized.externalPaymentId) {
        throw error;
      }
      const refunded = await this.gateway.refundPayment(
        synchronized.externalPaymentId,
        `duplicate-approval:${synchronized.id}`,
      );
      synchronized.transitionTo('REFUNDED', refunded.occurredAt);
      await this.repository.saveStatus(synchronized, {
        ...event,
        eventId: randomUUID(),
        externalEventId: `reconciliation:${randomUUID()}`,
        newStatus: 'REFUNDED',
        occurredAt: refunded.occurredAt,
      });
    }
    return synchronized.status;
  }

  private isRetryableGatewayError(error: unknown): boolean {
    return (
      (error instanceof PaymentGatewayError ||
        (error instanceof Error && error.name === 'PaymentGatewayError')) &&
      (error as PaymentGatewayError).retryable
    );
  }

  private isRecoverableConcurrencyError(error: unknown): boolean {
    return (
      error instanceof ConcurrentPaymentUpdateError ||
      error instanceof DuplicateReservationApprovalError ||
      (error instanceof Error &&
        [
          'ConcurrentPaymentUpdateError',
          'DuplicateReservationApprovalError',
        ].includes(error.name))
    );
  }

  private isDuplicateApproval(error: unknown): boolean {
    return (
      error instanceof DuplicateReservationApprovalError ||
      (error instanceof Error &&
        error.name === 'DuplicateReservationApprovalError')
    );
  }

  private safeId(payment: PaymentAttempt): string {
    return payment.id?.slice(0, 12) ?? 'unknown';
  }
}
