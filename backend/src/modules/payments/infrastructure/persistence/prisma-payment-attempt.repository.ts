import { Injectable } from '@nestjs/common';
import {
  Payment as PrismaPayment,
  PaymentEvent as PrismaPaymentEvent,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import {
  PaymentAttempt,
  PaymentProvider,
} from '../../domain/entities/payment-attempt.entity';
import {
  ConcurrentPaymentUpdateError,
  PaymentIdempotencyConflictError,
} from '../../domain/errors/payment-domain.errors';
import {
  PaymentAttemptRepositoryPort,
  PaymentEventRecord,
} from '../../domain/ports/payment-attempt-repository.port';

@Injectable()
export class PrismaPaymentAttemptRepository implements PaymentAttemptRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(payment: PaymentAttempt): Promise<PaymentAttempt> {
    try {
      const saved = await this.prisma.payment.create({
        data: {
          reservationId: payment.reservationId,
          memberId: payment.memberId,
          date: payment.createdAt ?? new Date(),
          amountMinorUnits: BigInt(payment.amount.minorUnits),
          currency: payment.amount.currency,
          option: payment.option,
          pricingVersion: payment.pricingVersion,
          provider: payment.provider,
          status: payment.status,
          idempotencyKey: payment.idempotencyKey,
          operationFingerprint: payment.operationFingerprint,
          externalPaymentId: payment.externalPaymentId,
          externalReference: payment.externalReference,
          checkoutUrl: payment.checkoutUrl,
          failureReason: payment.failureReason,
          expiresAt: payment.expiresAt,
          approvedAt: payment.approvedAt,
          cancelledAt: payment.cancelledAt,
          refundedAt: payment.refundedAt,
          version: payment.version,
        },
      });
      return this.toDomain(saved);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        const existing = await this.findByIdempotencyKey(
          payment.provider,
          payment.idempotencyKey,
        );
        if (
          existing &&
          existing.operationFingerprint === payment.operationFingerprint
        ) {
          return existing;
        }
        throw new PaymentIdempotencyConflictError();
      }
      throw error;
    }
  }

  async findById(id: string): Promise<PaymentAttempt | null> {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    return payment ? this.toDomain(payment) : null;
  }

  async findByIdempotencyKey(
    provider: PaymentProvider,
    key: string,
  ): Promise<PaymentAttempt | null> {
    const payment = await this.prisma.payment.findUnique({
      where: {
        provider_idempotencyKey: { provider, idempotencyKey: key },
      },
    });
    return payment ? this.toDomain(payment) : null;
  }

  async findByExternalPaymentId(
    provider: PaymentProvider,
    externalPaymentId: string,
  ): Promise<PaymentAttempt | null> {
    const payment = await this.prisma.payment.findUnique({
      where: {
        provider_externalPaymentId: { provider, externalPaymentId },
      },
    });
    return payment ? this.toDomain(payment) : null;
  }

  async listByReservationId(reservationId: string): Promise<PaymentAttempt[]> {
    const payments = await this.prisma.payment.findMany({
      where: { reservationId },
      orderBy: { createdAt: 'desc' },
    });
    return payments.map((payment) => this.toDomain(payment));
  }

  async saveStatus(
    payment: PaymentAttempt,
    event?: PaymentEventRecord,
  ): Promise<PaymentAttempt> {
    if (!payment.id) {
      throw new ConcurrentPaymentUpdateError();
    }
    const paymentId = payment.id;

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const updated = await transaction.payment.updateMany({
          where: { id: paymentId, version: payment.version },
          data: {
            status: payment.status,
            failureReason: payment.failureReason,
            approvedAt: payment.approvedAt,
            cancelledAt: payment.cancelledAt,
            refundedAt: payment.refundedAt,
            version: { increment: 1 },
          },
        });
        if (updated.count !== 1) throw new ConcurrentPaymentUpdateError();

        if (event) {
          await transaction.paymentEvent.create({
            data: {
              id: event.eventId,
              paymentId,
              provider: event.provider,
              externalEventId: event.externalEventId,
              previousStatus: event.previousStatus,
              newStatus: event.newStatus,
              occurredAt: event.occurredAt,
              processedAt: event.processedAt,
            },
          });
        }

        const saved = await transaction.payment.findUniqueOrThrow({
          where: { id: paymentId },
        });
        return this.toDomain(saved);
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new PaymentIdempotencyConflictError();
      }
      throw error;
    }
  }

  async externalEventExists(
    provider: PaymentProvider,
    externalEventId: string,
  ): Promise<boolean> {
    const event = await this.prisma.paymentEvent.findUnique({
      where: {
        provider_externalEventId: { provider, externalEventId },
      },
      select: { id: true },
    });
    return event !== null;
  }

  private toDomain(
    payment: PrismaPayment & { events?: PrismaPaymentEvent[] },
  ): PaymentAttempt {
    const amount = Number(payment.amountMinorUnits);
    if (!Number.isSafeInteger(amount)) {
      throw new Error('El monto persistido excede el rango entero seguro.');
    }
    return new PaymentAttempt({
      id: payment.id,
      reservationId: payment.reservationId,
      memberId: payment.memberId,
      amountMinorUnits: amount,
      currency: payment.currency,
      option: payment.option,
      pricingVersion: payment.pricingVersion,
      provider: payment.provider,
      status: payment.status,
      idempotencyKey: payment.idempotencyKey,
      operationFingerprint: payment.operationFingerprint,
      externalPaymentId: payment.externalPaymentId,
      externalReference: payment.externalReference,
      checkoutUrl: payment.checkoutUrl,
      failureReason: payment.failureReason,
      expiresAt: payment.expiresAt,
      approvedAt: payment.approvedAt,
      cancelledAt: payment.cancelledAt,
      refundedAt: payment.refundedAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      version: payment.version,
    });
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
