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
import type {
  CreateGatewayPaymentResult,
  PaymentGatewayPort,
} from '../../domain/ports/payment-gateway.port';
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
    const key = `${this.gateway.provider}:${input.idempotencyKey}`;
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
    const approvedMinorUnits = reservationPayments
      .filter((payment) => payment.status === 'APPROVED')
      .reduce((total, payment) => total + payment.amount.minorUnits, 0);
    const durationMinutes =
      this.toMinutes(reservation.endTime) -
      this.toMinutes(reservation.startTime);
    const fullQuote = this.pricing.quote(durationMinutes, 'FULL');
    if (approvedMinorUnits >= fullQuote.total.minorUnits)
      throw new InvalidPaymentAttemptError(
        'La reserva ya se encuentra pagada en su totalidad.',
      );
    if (input.option === 'DEPOSIT' && approvedMinorUnits > 0)
      throw new InvalidPaymentAttemptError(
        'La seña ya fue abonada. Solo puede completarse el saldo pendiente.',
      );
    const activeCheckout = reservationPayments.find(
      (payment) =>
        ['PENDING', 'PROCESSING'].includes(payment.status) &&
        payment.expiresAt > new Date(),
    );
    const requestedQuote = this.pricing.quote(durationMinutes, input.option);
    const amountMinorUnits =
      input.option === 'FULL'
        ? fullQuote.total.minorUnits - approvedMinorUnits
        : requestedQuote.payable.minorUnits;
    const fingerprint = this.fingerprint(input);
    const prior = await this.payments.findByIdempotencyKey(
      this.gateway.provider,
      input.idempotencyKey,
    );
    if (prior && prior.operationFingerprint !== fingerprint)
      throw new PaymentIdempotencyConflictError();
    if (
      activeCheckout &&
      (activeCheckout.option !== input.option ||
        activeCheckout.amount.minorUnits !== amountMinorUnits ||
        activeCheckout.operationFingerprint !== fingerprint)
    )
      throw new InvalidPaymentAttemptError(
        'La reserva ya posee un checkout vigente.',
      );
    if (activeCheckout?.checkoutUrl) return this.output(activeCheckout);
    if (prior?.checkoutUrl) return this.output(prior);
    const expiresAt =
      prior?.expiresAt ??
      new Date(Date.now() + PAYMENT_HOLD_DURATION_MINUTES * 60_000);
    const paymentId = randomUUID();
    const payment =
      activeCheckout ??
      prior ??
      (await this.payments.createWithReservationHold(
        new PaymentAttempt({
          id: paymentId,
          reservationId: input.reservationId,
          memberId: input.memberId,
          amountMinorUnits,
          currency: 'ARS',
          option: input.option,
          pricingVersion: requestedQuote.pricingVersion,
          provider: this.gateway.provider,
          status: 'PENDING',
          idempotencyKey: input.idempotencyKey,
          operationFingerprint: fingerprint,
          externalReference: `payment:${paymentId}`,
          expiresAt,
        }),
      ));
    let checkout: CreateGatewayPaymentResult;
    try {
      checkout = await this.gateway.createPayment({
        paymentId: payment.id!,
        externalReference: payment.externalReference,
        amountMinorUnits: payment.amount.minorUnits,
        currency: 'ARS',
        description: `Reserva ${input.reservationId}`,
        expiresAt,
        idempotencyKey: payment.idempotencyKey,
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

  private toMinutes(value: string): number {
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
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
