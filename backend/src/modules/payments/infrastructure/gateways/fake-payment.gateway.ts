import { createHmac, timingSafeEqual } from 'node:crypto';
import { PaymentStatus } from '../../domain/entities/payment-attempt.entity';
import {
  InvalidWebhookSignatureError,
  PaymentGatewayError,
  PaymentIdempotencyConflictError,
} from '../../domain/errors/payment-domain.errors';
import {
  CreateGatewayPaymentInput,
  CreateGatewayPaymentResult,
  GatewayNotification,
  GatewayPaymentSnapshot,
  GatewayWebhookRequest,
  PaymentGatewayPort,
} from '../../domain/ports/payment-gateway.port';

export class FakePaymentGateway implements PaymentGatewayPort {
  private sequence = 0;
  private readonly payments = new Map<string, CreateGatewayPaymentResult>();
  private readonly creations = new Map<
    string,
    { fingerprint: string; id: string }
  >();
  private readonly refunds = new Map<string, string>();

  constructor(private readonly webhookSecret = 'fake-webhook-test-secret') {}

  async createPayment(input: CreateGatewayPaymentInput) {
    await Promise.resolve();
    const fingerprint = JSON.stringify([
      input.paymentId,
      input.externalReference,
      input.amountMinorUnits,
      input.currency,
      input.expiresAt.toISOString(),
    ]);
    const prior = this.creations.get(input.idempotencyKey);
    if (prior) {
      if (prior.fingerprint !== fingerprint)
        throw new PaymentIdempotencyConflictError();
      return this.clonePayment(this.payments.get(prior.id)!);
    }

    const externalPaymentId = `fake-payment-${++this.sequence}`;
    const result: CreateGatewayPaymentResult = {
      provider: 'FAKE',
      externalPaymentId,
      externalReference: input.externalReference,
      status: 'PENDING',
      amountMinorUnits: input.amountMinorUnits,
      currency: input.currency,
      occurredAt: new Date(),
      checkoutUrl: `https://fake-payments.test/checkout/${externalPaymentId}`,
      expiresAt: new Date(input.expiresAt),
    };
    this.payments.set(externalPaymentId, result);
    this.creations.set(input.idempotencyKey, {
      fingerprint,
      id: externalPaymentId,
    });
    return this.clonePayment(result);
  }

  async getPayment(externalPaymentId: string) {
    await Promise.resolve();
    return this.cloneSnapshot(this.requirePayment(externalPaymentId));
  }

  async verifyAndParseWebhook(request: GatewayWebhookRequest) {
    await Promise.resolve();
    const received = request.headers['x-fake-signature'];
    if (!received || !this.validSignature(request.rawBody, received)) {
      throw new InvalidWebhookSignatureError();
    }
    let value: unknown;
    try {
      value = JSON.parse(request.rawBody);
    } catch {
      throw new PaymentGatewayError('Notificacion externa invalida.', false);
    }
    if (!this.isNotification(value)) {
      throw new PaymentGatewayError('Notificacion externa invalida.', false);
    }
    return value;
  }

  async refundPayment(externalPaymentId: string, idempotencyKey: string) {
    await Promise.resolve();
    const priorId = this.refunds.get(idempotencyKey);
    if (priorId && priorId !== externalPaymentId)
      throw new PaymentIdempotencyConflictError();
    const payment = this.requirePayment(externalPaymentId);
    if (!priorId && payment.status !== 'APPROVED') {
      throw new PaymentGatewayError(
        'El pago externo no puede reembolsarse.',
        false,
      );
    }
    payment.status = 'REFUNDED';
    payment.occurredAt = new Date();
    this.refunds.set(idempotencyKey, externalPaymentId);
    return this.cloneSnapshot(payment);
  }

  setPaymentStatus(externalPaymentId: string, status: PaymentStatus): void {
    const payment = this.requirePayment(externalPaymentId);
    payment.status = status;
    payment.occurredAt = new Date();
  }

  signWebhook(notification: GatewayNotification): GatewayWebhookRequest {
    const rawBody = JSON.stringify(notification);
    return { rawBody, headers: { 'x-fake-signature': this.sign(rawBody) } };
  }

  get createdPaymentCount() {
    return this.payments.size;
  }

  private requirePayment(id: string) {
    const payment = this.payments.get(id);
    if (!payment)
      throw new PaymentGatewayError('Pago externo no encontrado.', false);
    return payment;
  }

  private sign(body: string) {
    return createHmac('sha256', this.webhookSecret).update(body).digest('hex');
  }

  private validSignature(body: string, received: string) {
    const expected = Buffer.from(this.sign(body), 'hex');
    const actual = Buffer.from(received, 'hex');
    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  }

  private isNotification(value: unknown): value is GatewayNotification {
    if (!value || typeof value !== 'object') return false;
    const item = value as Record<string, unknown>;
    return ['eventId', 'externalPaymentId', 'eventType'].every(
      (key) => typeof item[key] === 'string' && item[key].length > 0,
    );
  }

  private cloneSnapshot(
    payment: GatewayPaymentSnapshot,
  ): GatewayPaymentSnapshot {
    return { ...payment, occurredAt: new Date(payment.occurredAt) };
  }

  private clonePayment(
    payment: CreateGatewayPaymentResult,
  ): CreateGatewayPaymentResult {
    return {
      ...this.cloneSnapshot(payment),
      checkoutUrl: payment.checkoutUrl,
      expiresAt: new Date(payment.expiresAt),
    };
  }
}
