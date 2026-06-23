import { Payment } from '../../domain/entities/payment.entity';
import type { PaymentDetailOutput } from '../dto/payment.output';
import type { PaymentOutput } from '../dto/list-payments.output';

export class PaymentOutputMapper {
  static toPaymentOutput(payment: Payment): PaymentOutput {
    return {
      paymentId: payment.id!,
      reservationId: payment.reservationId,
      date: payment.date,
      amount: payment.amount,
      createdAt: payment.createdAt!,
      updatedAt: payment.updatedAt!,
    };
  }

  static toPaymentDetailOutput(payment: Payment): PaymentDetailOutput {
    return {
      paymentId: payment.id!,
      reservationId: payment.reservationId,
      date: payment.date,
      amount: payment.amount,
      createdAt: payment.createdAt!,
      updatedAt: payment.updatedAt!,
    };
  }
}
