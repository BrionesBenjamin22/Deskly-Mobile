import {
  PaymentAttempt,
  PaymentStatus,
} from '../entities/payment-attempt.entity';

export const PAYMENT_ATTEMPT_REPOSITORY = Symbol('PAYMENT_ATTEMPT_REPOSITORY');

export type PaymentEventRecord = {
  eventId: string;
  paymentId: string;
  externalEventId: string;
  previousStatus: PaymentStatus;
  newStatus: PaymentStatus;
  occurredAt: Date;
  processedAt: Date;
};

export interface PaymentAttemptRepositoryPort {
  create(payment: PaymentAttempt): Promise<PaymentAttempt>;
  findById(id: string): Promise<PaymentAttempt | null>;
  findByIdempotencyKey(key: string): Promise<PaymentAttempt | null>;
  findByExternalPaymentId(
    externalPaymentId: string,
  ): Promise<PaymentAttempt | null>;
  listByReservationId(reservationId: string): Promise<PaymentAttempt[]>;
  saveStatus(
    payment: PaymentAttempt,
    event?: PaymentEventRecord,
  ): Promise<PaymentAttempt>;
  externalEventExists(externalEventId: string): Promise<boolean>;
}
