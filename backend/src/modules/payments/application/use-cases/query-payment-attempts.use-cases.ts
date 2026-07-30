import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { UserRoleValue } from '../../../auth/domain/entities/user.entity';
import { RESERVATION_REPOSITORY } from '../../../reservations/domain/ports/reservation-repository.port';
import type { ReservationRepositoryPort } from '../../../reservations/domain/ports/reservation-repository.port';
import { PaymentAttempt } from '../../domain/entities/payment-attempt.entity';
import {
  DuplicateReservationApprovalError,
  PaymentGatewayError,
} from '../../domain/errors/payment-domain.errors';
import { PaymentNotFoundError } from '../../domain/errors/payment-not-found.error';
import { ReservationNotFoundError } from '../../domain/errors/reservation-not-found.error';
import { PAYMENT_ATTEMPT_REPOSITORY } from '../../domain/ports/payment-attempt-repository.port';
import type { PaymentAttemptRepositoryPort } from '../../domain/ports/payment-attempt-repository.port';
import { PAYMENT_GATEWAY } from '../../domain/ports/payment-gateway.port';
import type { PaymentGatewayPort } from '../../domain/ports/payment-gateway.port';

export type PaymentActor = { role: UserRoleValue; memberId?: string };

export class PaymentAccessDeniedError extends Error {
  constructor() {
    super('El usuario no puede consultar pagos de otro miembro.');
    this.name = 'PaymentAccessDeniedError';
    Object.setPrototypeOf(this, PaymentAccessDeniedError.prototype);
  }
}

export type PaymentAttemptOutput = ReturnType<typeof toPaymentAttemptOutput>;

export function toPaymentAttemptOutput(payment: PaymentAttempt) {
  return {
    paymentId: payment.id!,
    reservationId: payment.reservationId,
    memberId: payment.memberId,
    amountMinorUnits: payment.amount.minorUnits,
    currency: payment.amount.currency,
    option: payment.option,
    pricingVersion: payment.pricingVersion,
    provider: payment.provider,
    status: payment.status,
    checkoutUrl: payment.checkoutUrl ?? null,
    expiresAt: payment.expiresAt,
    createdAt: payment.createdAt,
  };
}

function assertAccess(memberId: string, actor: PaymentActor): void {
  if (actor.role === 'MIEMBRO' && actor.memberId !== memberId)
    throw new PaymentAccessDeniedError();
}

@Injectable()
export class SynchronizePaymentAttemptUseCase {
  private readonly logger = new Logger(SynchronizePaymentAttemptUseCase.name);

  constructor(
    @Inject(PAYMENT_ATTEMPT_REPOSITORY)
    private readonly payments: PaymentAttemptRepositoryPort,
    @Inject(PAYMENT_GATEWAY)
    private readonly gateway: PaymentGatewayPort,
  ) {}

  async execute(payment: PaymentAttempt): Promise<PaymentAttempt> {
    if (
      !['PENDING', 'PROCESSING'].includes(payment.status) ||
      payment.provider !== this.gateway.provider
    )
      return payment;

    try {
      const expectation = {
        externalReference: payment.externalReference,
        amountMinorUnits: payment.amount.minorUnits,
        currency: payment.amount.currency,
      };
      const snapshot = payment.externalPaymentId
        ? await this.gateway.getPayment(payment.externalPaymentId, expectation)
        : await this.gateway.findPaymentByExternalReference(
            payment.externalReference,
            expectation,
          );
      if (!snapshot) return payment;

      let synchronized = payment;
      if (!payment.externalPaymentId) {
        synchronized = await this.payments.bindExternalPaymentId(
          payment.id!,
          payment.provider,
          snapshot.externalPaymentId,
        );
      }
      if (
        synchronized.status === snapshot.status ||
        !synchronized.canTransitionTo(snapshot.status)
      )
        return synchronized;

      const previousStatus = synchronized.status;
      synchronized.transitionTo(snapshot.status, snapshot.occurredAt);
      try {
        return await this.payments.saveStatus(synchronized, {
          eventId: randomUUID(),
          paymentId: synchronized.id!,
          provider: synchronized.provider,
          externalEventId: `synchronization:${randomUUID()}`,
          previousStatus,
          newStatus: synchronized.status,
          occurredAt: snapshot.occurredAt,
          processedAt: new Date(),
        });
      } catch (error) {
        if (!this.isDuplicateApproval(error)) throw error;
        const refunded = await this.gateway.refundPayment(
          snapshot.externalPaymentId,
          `duplicate-approval:${synchronized.id}`,
        );
        synchronized.transitionTo('REFUNDED', refunded.occurredAt);
        return this.payments.saveStatus(synchronized, {
          eventId: randomUUID(),
          paymentId: synchronized.id!,
          provider: synchronized.provider,
          externalEventId: `synchronization:${randomUUID()}`,
          previousStatus: 'APPROVED',
          newStatus: 'REFUNDED',
          occurredAt: refunded.occurredAt,
          processedAt: new Date(),
        });
      }
    } catch (error) {
      if (this.isRetryableGatewayError(error)) {
        this.logger.warn(
          `sincronizacion reintentable payment=${payment.id?.slice(0, 12) ?? 'unknown'}`,
        );
        return payment;
      }
      throw error;
    }
  }

  private isRetryableGatewayError(error: unknown): boolean {
    return (
      (error instanceof PaymentGatewayError ||
        (error instanceof Error && error.name === 'PaymentGatewayError')) &&
      (error as PaymentGatewayError).retryable
    );
  }

  private isDuplicateApproval(error: unknown): boolean {
    return (
      error instanceof DuplicateReservationApprovalError ||
      (error instanceof Error &&
        error.name === 'DuplicateReservationApprovalError')
    );
  }
}

@Injectable()
export class GetPaymentAttemptUseCase {
  constructor(
    @Inject(PAYMENT_ATTEMPT_REPOSITORY)
    private readonly payments: PaymentAttemptRepositoryPort,
    private readonly synchronizePayment: SynchronizePaymentAttemptUseCase,
  ) {}

  async execute(
    id: string,
    actor: PaymentActor,
  ): Promise<PaymentAttemptOutput> {
    const payment = await this.payments.findById(id);
    if (!payment) throw new PaymentNotFoundError();
    assertAccess(payment.memberId, actor);
    return toPaymentAttemptOutput(
      await this.synchronizePayment.execute(payment),
    );
  }
}

@Injectable()
export class ListReservationPaymentsUseCase {
  constructor(
    @Inject(PAYMENT_ATTEMPT_REPOSITORY)
    private readonly payments: PaymentAttemptRepositoryPort,
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservations: ReservationRepositoryPort,
    private readonly synchronizePayment: SynchronizePaymentAttemptUseCase,
  ) {}

  async execute(
    reservationId: string,
    actor: PaymentActor,
  ): Promise<PaymentAttemptOutput[]> {
    const reservation = await this.reservations.findById(reservationId);
    if (!reservation) throw new ReservationNotFoundError();
    assertAccess(reservation.memberId, actor);
    const payments = await this.payments.listByReservationId(reservationId);
    return Promise.all(
      payments.map(async (payment) =>
        toPaymentAttemptOutput(await this.synchronizePayment.execute(payment)),
      ),
    );
  }
}
