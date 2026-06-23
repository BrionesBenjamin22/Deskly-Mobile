import { Inject, Injectable } from '@nestjs/common';

import { RESERVATION_REPOSITORY } from '../../../reservations/domain/ports/reservation-repository.port';
import type { ReservationRepositoryPort } from '../../../reservations/domain/ports/reservation-repository.port';
import { Payment } from '../../domain/entities/payment.entity';
import { ReservationNotFoundError } from '../../domain/errors/reservation-not-found.error';
import { PAYMENT_REPOSITORY } from '../../domain/ports/payment-repository.port';
import type { PaymentRepositoryPort } from '../../domain/ports/payment-repository.port';
import { CreatePaymentInput } from '../dto/create-payment.input';
import { CreatePaymentOutput } from '../dto/create-payment.output';

@Injectable()
export class CreatePaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepositoryPort,
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservationRepository: ReservationRepositoryPort,
  ) {}

  async execute(input: CreatePaymentInput): Promise<CreatePaymentOutput> {
    const reservation = await this.reservationRepository.findById(
      input.reservationId,
    );

    if (!reservation) {
      throw new ReservationNotFoundError();
    }

    const payment = await this.paymentRepository.save(
      new Payment({
        reservationId: input.reservationId,
        date: input.date,
        amount: input.amount,
      }),
    );

    if (!payment.id) {
      throw new Error('Payment was not persisted correctly.');
    }

    await this.reservationRepository.markReservedAfterPayment(
      input.reservationId,
    );

    return {
      paymentId: payment.id,
      reservationId: payment.reservationId,
      date: payment.date,
      amount: payment.amount,
    };
  }
}
