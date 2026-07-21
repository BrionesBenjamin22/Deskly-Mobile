import {
  PaymentAttempt,
  PaymentProvider,
  PaymentStatus,
} from '../entities/payment-attempt.entity';

export const PAYMENT_ATTEMPT_REPOSITORY = Symbol('PAYMENT_ATTEMPT_REPOSITORY');

export type PaymentEventRecord = {
  eventId: string;
  paymentId: string;
  externalEventId: string;
  provider: PaymentProvider;
  previousStatus: PaymentStatus;
  newStatus: PaymentStatus;
  occurredAt: Date;
  processedAt: Date;
};

export interface PaymentAttemptRepositoryPort {
  create(payment: PaymentAttempt): Promise<PaymentAttempt>;
  createWithReservationHold(payment: PaymentAttempt): Promise<PaymentAttempt>;
  saveCheckout(payment: PaymentAttempt): Promise<PaymentAttempt>;
  findById(id: string): Promise<PaymentAttempt | null>;
  findByIdempotencyKey(
    provider: PaymentProvider,
    key: string,
  ): Promise<PaymentAttempt | null>;
  findByExternalPaymentId(
    provider: PaymentProvider,
    externalPaymentId: string,
  ): Promise<PaymentAttempt | null>;
  listByReservationId(reservationId: string): Promise<PaymentAttempt[]>;
  listStale(
    provider: PaymentProvider,
    statuses: PaymentStatus[],
    updatedBefore: Date,
    limit: number,
  ): Promise<PaymentAttempt[]>;
  saveStatus(
    payment: PaymentAttempt,
    event?: PaymentEventRecord,
  ): Promise<PaymentAttempt>;
  externalEventExists(
    provider: PaymentProvider,
    externalEventId: string,
  ): Promise<boolean>;
}
