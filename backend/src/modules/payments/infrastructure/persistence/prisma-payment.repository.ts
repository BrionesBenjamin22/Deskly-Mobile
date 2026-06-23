import { Injectable } from '@nestjs/common';

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
    const savedPayment = await this.prisma.payment.create({
      data: {
        reservationId: payment.reservationId,
        date: payment.date,
        amount: payment.amount,
      },
    });

    return new Payment({
      id: savedPayment.id,
      reservationId: savedPayment.reservationId,
      date: this.dateToString(savedPayment.date),
      amount: savedPayment.amount,
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
            amount: p.amount,
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
      amount: payment.amount,
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
          amount: p.amount,
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
}
