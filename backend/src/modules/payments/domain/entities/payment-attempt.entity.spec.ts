import { PaymentAttempt, PaymentStatus } from './payment-attempt.entity';
import {
  InvalidPaymentAmountError,
  InvalidPaymentAttemptError,
  InvalidPaymentTransitionError,
} from '../errors/payment-domain.errors';

function buildPayment(status: PaymentStatus = 'PENDING') {
  return new PaymentAttempt({
    id: 'payment-1',
    reservationId: 'reservation-1',
    memberId: 'member-1',
    amountMinorUnits: 180_000,
    currency: 'ARS',
    option: 'DEPOSIT',
    pricingVersion: 'ARS_1500_HOUR_DEPOSIT_30_V1',
    provider: 'FAKE',
    status,
    idempotencyKey: 'idempotency-key-1',
    operationFingerprint: 'fingerprint-1',
    externalReference: 'payment-1',
    expiresAt: new Date('2026-07-17T15:15:00.000Z'),
  });
}

describe('PaymentAttempt', () => {
  it('keeps money, pricing and reconciliation identifiers', () => {
    const payment = buildPayment();
    expect(payment.amount.minorUnits).toBe(180_000);
    expect(payment.amount.currency).toBe('ARS');
    expect(payment.option).toBe('DEPOSIT');
    expect(payment.idempotencyKey).toBe('idempotency-key-1');
    expect(payment.externalReference).toBe('payment-1');
  });

  it.each([
    ['PENDING', 'PROCESSING'],
    ['PENDING', 'APPROVED'],
    ['PENDING', 'REJECTED'],
    ['PENDING', 'CANCELLED'],
    ['PENDING', 'EXPIRED'],
    ['PROCESSING', 'APPROVED'],
    ['PROCESSING', 'REJECTED'],
    ['PROCESSING', 'CANCELLED'],
    ['PROCESSING', 'EXPIRED'],
    ['APPROVED', 'REFUNDED'],
  ] as [PaymentStatus, PaymentStatus][])('allows %s -> %s', (from, to) => {
    const payment = buildPayment(from);
    payment.transitionTo(to, new Date('2026-07-17T15:01:00.000Z'));
    expect(payment.status).toBe(to);
  });

  it.each(['REJECTED', 'CANCELLED', 'EXPIRED', 'REFUNDED'] as PaymentStatus[])(
    'treats %s as terminal',
    (status) => {
      const payment = buildPayment(status);
      expect(() => payment.transitionTo('APPROVED', new Date())).toThrow(
        InvalidPaymentTransitionError,
      );
    },
  );

  it('rejects refunding a payment that was not approved', () => {
    expect(() => buildPayment().transitionTo('REFUNDED', new Date())).toThrow(
      InvalidPaymentTransitionError,
    );
  });

  it('makes duplicate state notifications idempotent', () => {
    const payment = buildPayment('APPROVED');
    expect(() => payment.transitionTo('APPROVED', new Date())).not.toThrow();
    expect(payment.status).toBe('APPROVED');
  });

  it('records approval, cancellation, refund and rejection facts', () => {
    const at = new Date('2026-07-17T15:01:00.000Z');
    const approved = buildPayment('PROCESSING');
    approved.transitionTo('APPROVED', at);
    approved.transitionTo('REFUNDED', at);
    expect(approved.approvedAt).toEqual(at);
    expect(approved.refundedAt).toEqual(at);

    const cancelled = buildPayment();
    cancelled.transitionTo('CANCELLED', at);
    expect(cancelled.cancelledAt).toEqual(at);

    const rejected = buildPayment();
    rejected.transitionTo('REJECTED', at, 'provider_rejected');
    expect(rejected.failureReason).toBe('provider_rejected');
  });

  it.each([0, -1, 1.1, Number.POSITIVE_INFINITY])(
    'rejects unsafe minor units %s',
    (amountMinorUnits) => {
      expect(
        () =>
          new PaymentAttempt({
            reservationId: 'r',
            memberId: 'm',
            amountMinorUnits,
            currency: 'ARS',
            option: 'FULL',
            pricingVersion: 'v1',
            provider: 'FAKE',
            status: 'PENDING',
            idempotencyKey: 'key',
            operationFingerprint: 'hash',
            externalReference: 'ref',
            expiresAt: new Date(),
          }),
      ).toThrow(InvalidPaymentAmountError);
    },
  );

  it('rejects empty critical identifiers and invalid expiration', () => {
    expect(
      () =>
        new PaymentAttempt({
          reservationId: '',
          memberId: 'm',
          amountMinorUnits: 100,
          currency: 'ARS',
          option: 'FULL',
          pricingVersion: 'v1',
          provider: 'FAKE',
          status: 'PENDING',
          idempotencyKey: 'key',
          operationFingerprint: 'hash',
          externalReference: 'ref',
          expiresAt: new Date('invalid'),
        }),
    ).toThrow(InvalidPaymentAttemptError);
  });
});
