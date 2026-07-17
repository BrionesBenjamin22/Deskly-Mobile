import {
  InvalidPaymentAttemptError,
  InvalidPaymentTransitionError,
} from '../errors/payment-domain.errors';
import { PaymentOption } from '../services/payment-pricing-policy';
import { Currency, Money } from '../value-objects/money.value-object';

export const PAYMENT_STATUSES = [
  'PENDING',
  'PROCESSING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'EXPIRED',
  'REFUNDED',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type PaymentProvider = 'FAKE' | 'MERCADO_PAGO';

const ALLOWED_TRANSITIONS: Record<PaymentStatus, readonly PaymentStatus[]> = {
  PENDING: ['PROCESSING', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED'],
  PROCESSING: ['APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED'],
  APPROVED: ['REFUNDED'],
  REJECTED: [],
  CANCELLED: [],
  EXPIRED: [],
  REFUNDED: [],
};

export type PaymentAttemptProperties = {
  id?: string;
  reservationId: string;
  memberId: string;
  amountMinorUnits: number;
  currency: Currency;
  option: PaymentOption;
  pricingVersion: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  idempotencyKey: string;
  operationFingerprint: string;
  externalPaymentId?: string | null;
  externalReference: string;
  checkoutUrl?: string | null;
  failureReason?: string | null;
  expiresAt: Date;
  approvedAt?: Date | null;
  cancelledAt?: Date | null;
  refundedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export class PaymentAttempt {
  private statusValue: PaymentStatus;
  private failureReasonValue?: string | null;
  private approvedAtValue?: Date | null;
  private cancelledAtValue?: Date | null;
  private refundedAtValue?: Date | null;

  constructor(private readonly properties: PaymentAttemptProperties) {
    this.validate(properties);
    this.statusValue = properties.status;
    this.failureReasonValue = properties.failureReason;
    this.approvedAtValue = properties.approvedAt;
    this.cancelledAtValue = properties.cancelledAt;
    this.refundedAtValue = properties.refundedAt;
  }

  get id() {
    return this.properties.id;
  }
  get reservationId() {
    return this.properties.reservationId;
  }
  get memberId() {
    return this.properties.memberId;
  }
  get amount() {
    return Money.ars(this.properties.amountMinorUnits);
  }
  get option() {
    return this.properties.option;
  }
  get pricingVersion() {
    return this.properties.pricingVersion;
  }
  get provider() {
    return this.properties.provider;
  }
  get status() {
    return this.statusValue;
  }
  get idempotencyKey() {
    return this.properties.idempotencyKey;
  }
  get operationFingerprint() {
    return this.properties.operationFingerprint;
  }
  get externalPaymentId() {
    return this.properties.externalPaymentId;
  }
  get externalReference() {
    return this.properties.externalReference;
  }
  get checkoutUrl() {
    return this.properties.checkoutUrl;
  }
  get failureReason() {
    return this.failureReasonValue;
  }
  get expiresAt() {
    return new Date(this.properties.expiresAt);
  }
  get approvedAt() {
    return this.approvedAtValue
      ? new Date(this.approvedAtValue)
      : this.approvedAtValue;
  }
  get cancelledAt() {
    return this.cancelledAtValue
      ? new Date(this.cancelledAtValue)
      : this.cancelledAtValue;
  }
  get refundedAt() {
    return this.refundedAtValue
      ? new Date(this.refundedAtValue)
      : this.refundedAtValue;
  }

  canTransitionTo(next: PaymentStatus): boolean {
    return (
      this.statusValue === next ||
      ALLOWED_TRANSITIONS[this.statusValue].includes(next)
    );
  }

  transitionTo(next: PaymentStatus, occurredAt: Date, reason?: string): void {
    if (next === this.statusValue) return;
    if (!this.canTransitionTo(next)) {
      throw new InvalidPaymentTransitionError(this.statusValue, next);
    }
    this.statusValue = next;
    if (next === 'APPROVED') this.approvedAtValue = new Date(occurredAt);
    if (next === 'CANCELLED') this.cancelledAtValue = new Date(occurredAt);
    if (next === 'REFUNDED') this.refundedAtValue = new Date(occurredAt);
    if (next === 'REJECTED') this.failureReasonValue = reason?.trim() || null;
  }

  private validate(properties: PaymentAttemptProperties): void {
    Money.ars(properties.amountMinorUnits);
    const required = [
      properties.reservationId,
      properties.memberId,
      properties.pricingVersion,
      properties.idempotencyKey,
      properties.operationFingerprint,
      properties.externalReference,
    ];
    if (required.some((value) => !value.trim())) {
      throw new InvalidPaymentAttemptError(
        'El intento de pago contiene identificadores obligatorios vacios.',
      );
    }
    if (properties.currency !== 'ARS') {
      throw new InvalidPaymentAttemptError('La moneda del pago debe ser ARS.');
    }
    if (Number.isNaN(properties.expiresAt.getTime())) {
      throw new InvalidPaymentAttemptError(
        'La expiracion del pago no es valida.',
      );
    }
  }
}
