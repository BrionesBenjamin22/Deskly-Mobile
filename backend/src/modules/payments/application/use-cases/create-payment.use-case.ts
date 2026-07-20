import { createHash, randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { RESERVATION_REPOSITORY } from '../../../reservations/domain/ports/reservation-repository.port';
import type { ReservationRepositoryPort } from '../../../reservations/domain/ports/reservation-repository.port';
import { PaymentAttempt } from '../../domain/entities/payment-attempt.entity';
import {
  InvalidPaymentAttemptError,
  PaymentGatewayError,
  PaymentIdempotencyConflictError,
} from '../../domain/errors/payment-domain.errors';
import { ReservationNotFoundError } from '../../domain/errors/reservation-not-found.error';
import { PAYMENT_ATTEMPT_REPOSITORY } from '../../domain/ports/payment-attempt-repository.port';
import type { PaymentAttemptRepositoryPort } from '../../domain/ports/payment-attempt-repository.port';
import { PAYMENT_GATEWAY } from '../../domain/ports/payment-gateway.port';
import type { PaymentGatewayPort } from '../../domain/ports/payment-gateway.port';
import {
  PAYMENT_HOLD_DURATION_MINUTES,
  PAYMENT_PRICING_VERSION,
  PaymentPricingPolicy,
} from '../../domain/services/payment-pricing-policy';
import { CreatePaymentInput } from '../dto/create-payment.input';

@Injectable()
export class CreatePaymentUseCase {
  private readonly pricing = new PaymentPricingPolicy();
  private readonly inFlight = new Map<
    string,
    {
      fingerprint: string;
      promise: Promise<ReturnType<CreatePaymentUseCase['output']>>;
    }
  >();
  constructor(
    @Inject(PAYMENT_ATTEMPT_REPOSITORY)
    private readonly payments: PaymentAttemptRepositoryPort,
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservations: ReservationRepositoryPort,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGatewayPort,
  ) {}

  async execute(input: CreatePaymentInput) {
    const key = `FAKE:${input.idempotencyKey}`;
    const fingerprint = this.fingerprint(input);
    const current = this.inFlight.get(key);
    if (current) {
      if (current.fingerprint !== fingerprint)
        throw new PaymentIdempotencyConflictError();
      return current.promise;
    }
    const promise = this.executeOnce(input);
    this.inFlight.set(key, { fingerprint, promise });
    try {
      return await promise;
    } finally {
      if (this.inFlight.get(key)?.promise === promise)
        this.inFlight.delete(key);
    }
  }

  private async executeOnce(input: CreatePaymentInput) {
    const reservation = await this.reservations.findById(input.reservationId);
    if (!reservation) throw new ReservationNotFoundError();
    if (reservation.memberId !== input.memberId)
      throw new InvalidPaymentAttemptError(
        'La reserva no pertenece al miembro autenticado.',
      );
    if (!['RESERVED', 'PENDING_PAYMENT'].includes(reservation.status))
      throw new InvalidPaymentAttemptError(
        'La reserva no se encuentra en un estado pagable.',
      );
    const reservationPayments = await this.payments.listByReservationId(
      input.reservationId,
    );
    if (reservationPayments.some((payment) => payment.status === 'APPROVED'))
      throw new InvalidPaymentAttemptError(
        'La reserva ya posee un pago aprobado.',
      );
    const incompatibleCheckout = reservationPayments.find(
      (payment) =>
        ['PENDING', 'PROCESSING'].includes(payment.status) &&
        payment.expiresAt > new Date() &&
        payment.idempotencyKey !== input.idempotencyKey,
    );
    if (incompatibleCheckout)
      throw new InvalidPaymentAttemptError(
        'La reserva ya posee un checkout vigente.',
      );
    const toMinutes = (value: string) => {
      const [h, m] = value.split(':').map(Number);
      return h * 60 + m;
    };
    const quote = this.pricing.quote(
      toMinutes(reservation.endTime) - toMinutes(reservation.startTime),
      input.option,
    );
    const fingerprint = this.fingerprint(input);
    const prior = await this.payments.findByIdempotencyKey(
      'FAKE',
      input.idempotencyKey,
    );
    if (prior && prior.operationFingerprint !== fingerprint)
      throw new PaymentIdempotencyConflictError();
    if (prior?.checkoutUrl) return this.output(prior);
    const expiresAt =
      prior?.expiresAt ??
      new Date(Date.now() + PAYMENT_HOLD_DURATION_MINUTES * 60_000);
    const payment =
      prior ??
      (await this.payments.createWithReservationHold(
        new PaymentAttempt({
          id: randomUUID(),
          reservationId: input.reservationId,
          memberId: input.memberId,
          amountMinorUnits: quote.payable.minorUnits,
          currency: 'ARS',
          option: input.option,
          pricingVersion: quote.pricingVersion,
          provider: 'FAKE',
          status: 'PENDING',
          idempotencyKey: input.idempotencyKey,
          operationFingerprint: fingerprint,
          externalReference: `reservation:${input.reservationId}`,
          expiresAt,
        }),
      ));
    let checkout;
    try {
      checkout = await this.gateway.createPayment({
        paymentId: payment.id!,
        externalReference: payment.externalReference,
        amountMinorUnits: payment.amount.minorUnits,
        currency: 'ARS',
        description: `Reserva ${input.reservationId}`,
        expiresAt,
        idempotencyKey: input.idempotencyKey,
        successUrl: 'https://deskly.app/payments/success',
        failureUrl: 'https://deskly.app/payments/failure',
        pendingUrl: 'https://deskly.app/payments/pending',
      });
    } catch (error) {
      if (
        (error instanceof PaymentGatewayError ||
          (error instanceof Error && error.name === 'PaymentGatewayError')) &&
        !(error as PaymentGatewayError).retryable
      ) {
        payment.transitionTo(
          'REJECTED',
          new Date(),
          'Fallo definitivo del proveedor.',
        );
        await this.payments.saveStatus(payment);
        await this.reservations.releasePaymentHold(input.reservationId);
      }
      throw error;
    }
    payment.attachCheckout({
      externalPaymentId: checkout.externalPaymentId,
      checkoutUrl: checkout.checkoutUrl,
    });
    return this.output(await this.payments.saveCheckout(payment));
  }

  private fingerprint(input: CreatePaymentInput): string {
    return createHash('sha256')
      .update(
        [
          input.memberId,
          input.reservationId,
          input.option,
          PAYMENT_PRICING_VERSION,
        ].join(':'),
      )
      .digest('hex');
  }

  private output(payment: PaymentAttempt) {
    return {
      paymentId: payment.id!,
      reservationId: payment.reservationId,
      status: payment.status,
      option: payment.option,
      amountMinorUnits: payment.amount.minorUnits,
      currency: 'ARS' as const,
      pricingVersion: payment.pricingVersion,
      checkoutUrl: payment.checkoutUrl ?? null,
      expiresAt: payment.expiresAt,
    };
  }
}
