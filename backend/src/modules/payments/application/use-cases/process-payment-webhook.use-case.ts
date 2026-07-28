import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';

import type { PaymentStatus } from '../../domain/entities/payment-attempt.entity';
import {
  ConcurrentPaymentUpdateError,
  DuplicatePaymentEventError,
  DuplicateReservationApprovalError,
  PaymentGatewayError,
} from '../../domain/errors/payment-domain.errors';
import { PAYMENT_ATTEMPT_REPOSITORY } from '../../domain/ports/payment-attempt-repository.port';
import type { PaymentAttemptRepositoryPort } from '../../domain/ports/payment-attempt-repository.port';
import { PAYMENT_GATEWAY } from '../../domain/ports/payment-gateway.port';
import type {
  GatewayWebhookRequest,
  PaymentGatewayPort,
} from '../../domain/ports/payment-gateway.port';

export type ProcessPaymentWebhookResult = {
  accepted: true;
  duplicate: boolean;
  applied: boolean;
};

@Injectable()
export class ProcessPaymentWebhookUseCase {
  private readonly logger = new Logger(ProcessPaymentWebhookUseCase.name);

  constructor(
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGatewayPort,
    @Inject(PAYMENT_ATTEMPT_REPOSITORY)
    private readonly repository: PaymentAttemptRepositoryPort,
  ) {}

  async execute(
    request: GatewayWebhookRequest,
  ): Promise<ProcessPaymentWebhookResult> {
    const startedAt = Date.now();
    const notification = await this.gateway.verifyAndParseWebhook(request);
    const safeEventId = notification.eventId.slice(0, 12);
    if (notification.eventType.toLowerCase() !== 'payment') {
      this.logger.log(`webhook ignorado event=${safeEventId} type=no-payment`);
      return { accepted: true, duplicate: false, applied: false };
    }
    if (
      await this.repository.externalEventExists(
        this.gateway.provider,
        notification.eventId,
      )
    ) {
      this.logger.log(`webhook duplicado event=${safeEventId}`);
      return { accepted: true, duplicate: true, applied: false };
    }
    const snapshot = await this.gateway.getPayment(
      notification.externalPaymentId,
    );
    let payment = await this.repository.findByExternalPaymentId(
      this.gateway.provider,
      notification.externalPaymentId,
    );
    payment ??= await this.repository.findByExternalReference(
      this.gateway.provider,
      snapshot.externalReference,
    );
    if (!payment) {
      this.logger.warn(`webhook sin pago local event=${safeEventId}`);
      return { accepted: true, duplicate: false, applied: false };
    }
    if (
      snapshot.externalReference !== payment.externalReference ||
      snapshot.amountMinorUnits !== payment.amount.minorUnits ||
      snapshot.currency !== payment.amount.currency
    )
      throw new PaymentGatewayError(
        'Los datos informados por el proveedor no coinciden con el pago.',
        false,
      );
    if (payment.externalPaymentId !== notification.externalPaymentId)
      payment = await this.repository.bindExternalPaymentId(
        payment.id!,
        this.gateway.provider,
        notification.externalPaymentId,
      );
    const nextStatus = this.resolveStatus(
      payment.status,
      snapshot.status,
      payment.expiresAt,
      new Date(),
    );
    const previousStatus = payment.status;
    if (payment.canTransitionTo(nextStatus))
      payment.transitionTo(nextStatus, snapshot.occurredAt);
    try {
      await this.repository.saveStatus(payment, {
        eventId: randomUUID(),
        paymentId: payment.id!,
        provider: this.gateway.provider,
        externalEventId: notification.eventId,
        previousStatus,
        newStatus: payment.status,
        occurredAt: snapshot.occurredAt,
        processedAt: new Date(),
      });
    } catch (error) {
      if (
        error instanceof DuplicatePaymentEventError ||
        (error instanceof Error && error.name === 'DuplicatePaymentEventError')
      )
        return { accepted: true, duplicate: true, applied: false };
      if (
        error instanceof ConcurrentPaymentUpdateError ||
        (error instanceof Error &&
          error.name === 'ConcurrentPaymentUpdateError')
      ) {
        if (
          await this.repository.externalEventExists(
            this.gateway.provider,
            notification.eventId,
          )
        )
          return { accepted: true, duplicate: true, applied: false };
      }
      if (
        error instanceof DuplicateReservationApprovalError ||
        (error instanceof Error &&
          error.name === 'DuplicateReservationApprovalError')
      ) {
        const refunded = await this.gateway.refundPayment(
          notification.externalPaymentId,
          `duplicate-approval:${payment.id}`,
        );
        payment.transitionTo('REFUNDED', refunded.occurredAt);
        await this.repository.saveStatus(payment, {
          eventId: randomUUID(),
          paymentId: payment.id!,
          provider: this.gateway.provider,
          externalEventId: notification.eventId,
          previousStatus,
          newStatus: payment.status,
          occurredAt: refunded.occurredAt,
          processedAt: new Date(),
        });
        return { accepted: true, duplicate: false, applied: true };
      }
      throw error;
    }
    this.logger.log(
      `webhook procesado payment=${payment.id} event=${safeEventId} status=${payment.status} durationMs=${Date.now() - startedAt}`,
    );
    return {
      accepted: true,
      duplicate: false,
      applied: previousStatus !== payment.status,
    };
  }

  private resolveStatus(
    current: PaymentStatus,
    authoritative: PaymentStatus,
    expiresAt: Date,
    now: Date,
  ): PaymentStatus {
    if (current === 'APPROVED' || current === 'REFUNDED') return current;
    if (authoritative === 'PENDING' && expiresAt.getTime() <= now.getTime())
      return 'EXPIRED';
    return authoritative;
  }
}
