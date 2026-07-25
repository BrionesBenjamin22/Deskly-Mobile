import {
  PaymentProvider,
  PaymentStatus,
} from '../entities/payment-attempt.entity';
import { Currency } from '../value-objects/money.value-object';

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

export type CreateGatewayPaymentInput = {
  paymentId: string;
  externalReference: string;
  amountMinorUnits: number;
  currency: Currency;
  description: string;
  expiresAt: Date;
  idempotencyKey: string;
};

export type GatewayPaymentSnapshot = {
  provider: PaymentProvider;
  externalPaymentId: string;
  externalReference: string;
  status: PaymentStatus;
  amountMinorUnits: number;
  currency: Currency;
  occurredAt: Date;
};

export type CreateGatewayPaymentResult = {
  provider: PaymentProvider;
  externalPaymentId?: string | null;
  externalReference: string;
  status: PaymentStatus;
  amountMinorUnits: number;
  currency: Currency;
  occurredAt: Date;
  checkoutUrl: string;
  expiresAt: Date;
};

export type GatewayWebhookRequest = {
  rawBody: string;
  headers: Readonly<Record<string, string | undefined>>;
};

export type GatewayNotification = {
  eventId: string;
  externalPaymentId: string;
  eventType: string;
};

export type GatewayPaymentExpectation = {
  externalReference: string;
  amountMinorUnits: number;
  currency: Currency;
};

export interface PaymentGatewayPort {
  readonly provider: PaymentProvider;
  createPayment(
    input: CreateGatewayPaymentInput,
  ): Promise<CreateGatewayPaymentResult>;
  getPayment(
    externalPaymentId: string,
    expectation?: GatewayPaymentExpectation,
  ): Promise<GatewayPaymentSnapshot>;
  findPaymentByExternalReference(
    externalReference: string,
    expectation: GatewayPaymentExpectation,
  ): Promise<GatewayPaymentSnapshot | null>;
  verifyAndParseWebhook(
    request: GatewayWebhookRequest,
  ): Promise<GatewayNotification>;
  refundPayment(
    externalPaymentId: string,
    idempotencyKey: string,
  ): Promise<GatewayPaymentSnapshot>;
}
