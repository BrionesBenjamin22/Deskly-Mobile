import { Inject, Injectable } from '@nestjs/common';
import { UserRoleValue } from '../../../auth/domain/entities/user.entity';
import { RESERVATION_REPOSITORY } from '../../../reservations/domain/ports/reservation-repository.port';
import type { ReservationRepositoryPort } from '../../../reservations/domain/ports/reservation-repository.port';
import { PaymentAttempt } from '../../domain/entities/payment-attempt.entity';
import { PaymentNotFoundError } from '../../domain/errors/payment-not-found.error';
import { ReservationNotFoundError } from '../../domain/errors/reservation-not-found.error';
import { PAYMENT_ATTEMPT_REPOSITORY } from '../../domain/ports/payment-attempt-repository.port';
import type { PaymentAttemptRepositoryPort } from '../../domain/ports/payment-attempt-repository.port';

export type PaymentActor = { role: UserRoleValue; memberId?: string };

export class PaymentAccessDeniedError extends Error {
  constructor() {
    super('El usuario no puede consultar pagos de otro miembro.');
    this.name = 'PaymentAccessDeniedError';
    Object.setPrototypeOf(this, PaymentAccessDeniedError.prototype);
  }
}

export type PaymentAttemptOutput = ReturnType<typeof toOutput>;

function toOutput(payment: PaymentAttempt) {
  return {
    paymentId: payment.id!,
    reservationId: payment.reservationId,
    memberId: payment.memberId,
    amountMinorUnits: payment.amount.minorUnits,
    currency: payment.amount.currency,
    option: payment.option,
    pricingVersion: payment.pricingVersion,
    provider: payment.provider,
    status: payment.status,
    checkoutUrl: payment.checkoutUrl ?? null,
    expiresAt: payment.expiresAt,
    createdAt: payment.createdAt,
  };
}

function assertAccess(memberId: string, actor: PaymentActor): void {
  if (actor.role === 'MIEMBRO' && actor.memberId !== memberId)
    throw new PaymentAccessDeniedError();
}

@Injectable()
export class GetPaymentAttemptUseCase {
  constructor(
    @Inject(PAYMENT_ATTEMPT_REPOSITORY)
    private readonly payments: PaymentAttemptRepositoryPort,
  ) {}

  async execute(
    id: string,
    actor: PaymentActor,
  ): Promise<PaymentAttemptOutput> {
    const payment = await this.payments.findById(id);
    if (!payment) throw new PaymentNotFoundError();
    assertAccess(payment.memberId, actor);
    return toOutput(payment);
  }
}

@Injectable()
export class ListReservationPaymentsUseCase {
  constructor(
    @Inject(PAYMENT_ATTEMPT_REPOSITORY)
    private readonly payments: PaymentAttemptRepositoryPort,
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservations: ReservationRepositoryPort,
  ) {}

  async execute(
    reservationId: string,
    actor: PaymentActor,
  ): Promise<PaymentAttemptOutput[]> {
    const reservation = await this.reservations.findById(reservationId);
    if (!reservation) throw new ReservationNotFoundError();
    assertAccess(reservation.memberId, actor);
    return (await this.payments.listByReservationId(reservationId)).map(
      toOutput,
    );
  }
}
