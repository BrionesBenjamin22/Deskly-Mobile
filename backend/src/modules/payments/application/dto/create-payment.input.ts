import { PaymentOption } from '../../domain/services/payment-pricing-policy';

export type CreatePaymentInput = {
  reservationId: string;
  memberId: string;
  option: PaymentOption;
  idempotencyKey: string;
};
