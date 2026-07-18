import { Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { Payment } from '../../domain/entities/payment.entity';
import type {
  PaymentRepositoryPort,
  ListPaymentsParams,
  ListPaymentsResult,
} from '../../domain/ports/payment-repository.port';

@Injectable()
export class PrismaPaymentRepository implements PaymentRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(payment: Payment): Promise<Payment> {
    const reservation = await this.prisma.reservation.findUniqueOrThrow({
      where: { id: payment.reservationId },
      select: { memberId: true },
    });
    const id = payment.id ?? randomUUID();
    const amountMinorUnits = this.majorToMinorUnits(payment.amount);
    const savedPayment = await this.prisma.payment.create({
      data: {
        id,
        reservationId: payment.reservationId,
        memberId: reservation.memberId,
        date: this.stringToDate(payment.date),
        amountMinorUnits: BigInt(amountMinorUnits),
        currency: 'ARS',
        option: 'FULL',
        pricingVersion: 'LEGACY_V1',
        provider: 'LEGACY',
        status: 'APPROVED',
        idempotencyKey: `legacy:${id}`,
        operationFingerprint: createHash('sha256')
          .update(`legacy:${id}`)
          .digest('hex'),
        externalReference: `legacy:${id}`,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        approvedAt: new Date(),
      },
    });

    return new Payment({
      id: savedPayment.id,
      reservationId: savedPayment.reservationId,
      date: this.dateToString(savedPayment.date),
      amount: this.minorToMajorUnits(savedPayment.amountMinorUnits),
      createdAt: savedPayment.createdAt,
      updatedAt: savedPayment.updatedAt,
    });
  }

  async list(params: ListPaymentsParams): Promise<ListPaymentsResult> {
    const offset = (params.page - 1) * params.limit;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: params.reservationId
          ? { reservationId: params.reservationId }
          : {},
        skip: offset,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({
        where: params.reservationId
          ? { reservationId: params.reservationId }
          : {},
      }),
    ]);

    return {
      payments: payments.map(
        (p) =>
          new Payment({
            id: p.id,
            reservationId: p.reservationId,
            date: this.dateToString(p.date),
            amount: this.minorToMajorUnits(p.amountMinorUnits),
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
          }),
      ),
      total,
    };
  }

  async findById(id: string): Promise<Payment | null> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      return null;
    }

    return new Payment({
      id: payment.id,
      reservationId: payment.reservationId,
      date: this.dateToString(payment.date),
      amount: this.minorToMajorUnits(payment.amountMinorUnits),
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    });
  }

  async findByReservationId(reservationId: string): Promise<Payment[]> {
    const payments = await this.prisma.payment.findMany({
      where: { reservationId },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map(
      (p) =>
        new Payment({
          id: p.id,
          reservationId: p.reservationId,
          date: this.dateToString(p.date),
          amount: this.minorToMajorUnits(p.amountMinorUnits),
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        }),
    );
  }

  async delete(id: string): Promise<void> {
    await this.prisma.payment.delete({
      where: { id },
    });
  }

  private dateToString(date: Date | string): string {
    if (typeof date === 'string') {
      return date;
    }
    return date.toISOString().split('T')[0];
  }

  private stringToDate(date: string): Date {
    return new Date(`${date}T00:00:00.000Z`);
  }

  private majorToMinorUnits(amount: number): number {
    const minorUnits = amount * 100;
    if (!Number.isSafeInteger(minorUnits) || minorUnits <= 0) {
      throw new Error('El monto debe tener como maximo dos decimales.');
    }
    return minorUnits;
  }

  private minorToMajorUnits(amount: bigint): number {
    const minorUnits = Number(amount);
    if (!Number.isSafeInteger(minorUnits)) {
      throw new Error('El monto persistido excede el rango entero seguro.');
    }
    return minorUnits / 100;
  }
}
