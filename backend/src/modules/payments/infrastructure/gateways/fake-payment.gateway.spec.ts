import {
  InvalidWebhookSignatureError,
  PaymentGatewayError,
  PaymentIdempotencyConflictError,
} from '../../domain/errors/payment-domain.errors';
import { CreateGatewayPaymentInput } from '../../domain/ports/payment-gateway.port';
import { FakePaymentGateway } from './fake-payment.gateway';

function input(
  overrides: Partial<CreateGatewayPaymentInput> = {},
): CreateGatewayPaymentInput {
  return {
    paymentId: 'payment-1',
    externalReference: 'payment-1',
    amountMinorUnits: 180_000,
    currency: 'ARS',
    description: 'Reserva Deskly',
    expiresAt: new Date('2026-07-17T15:15:00.000Z'),
    idempotencyKey: 'idempotency-key-1',
    ...overrides,
  };
}

describe('FakePaymentGateway', () => {
  it('creates a hosted pending checkout without payment credentials', async () => {
    const gateway = new FakePaymentGateway();
    const payment = await gateway.createPayment(input());
    expect(payment).toMatchObject({
      provider: 'FAKE',
      status: 'PENDING',
      amountMinorUnits: 180_000,
      currency: 'ARS',
      externalReference: 'payment-1',
    });
    expect(payment.checkoutUrl).toMatch(
      /^https:\/\/fake-payments\.test\/checkout\//,
    );
  });

  it('returns the same external payment for sequential retries', async () => {
    const gateway = new FakePaymentGateway();
    const first = await gateway.createPayment(input());
    const second = await gateway.createPayment(input());
    expect(second.externalPaymentId).toBe(first.externalPaymentId);
    expect(gateway.createdPaymentCount).toBe(1);
  });

  it('creates only one external payment for concurrent retries', async () => {
    const gateway = new FakePaymentGateway();
    const results = await Promise.all(
      Array.from({ length: 10 }, () => gateway.createPayment(input())),
    );
    expect(new Set(results.map((item) => item.externalPaymentId)).size).toBe(1);
    expect(gateway.createdPaymentCount).toBe(1);
  });

  it('rejects reusing the key with incompatible data', async () => {
    const gateway = new FakePaymentGateway();
    await gateway.createPayment(input());
    await expect(
      gateway.createPayment(input({ amountMinorUnits: 200_000 })),
    ).rejects.toThrow(PaymentIdempotencyConflictError);
  });

  it('reads provider state independently from a webhook body', async () => {
    const gateway = new FakePaymentGateway();
    const created = await gateway.createPayment(input());
    gateway.setPaymentStatus(created.externalPaymentId, 'APPROVED');
    await expect(
      gateway.getPayment(created.externalPaymentId),
    ).resolves.toMatchObject({ status: 'APPROVED', amountMinorUnits: 180_000 });
  });

  it('validates and parses a signed webhook', async () => {
    const gateway = new FakePaymentGateway('secret');
    const request = gateway.signWebhook({
      eventId: 'event-1',
      externalPaymentId: 'fake-payment-1',
      eventType: 'payment.updated',
    });
    await expect(gateway.verifyAndParseWebhook(request)).resolves.toEqual({
      eventId: 'event-1',
      externalPaymentId: 'fake-payment-1',
      eventType: 'payment.updated',
    });
  });

  it.each([
    { rawBody: '{}', headers: {} },
    { rawBody: '{}', headers: { 'x-fake-signature': '00' } },
  ])('rejects absent or invalid webhook signatures', async (request) => {
    await expect(
      new FakePaymentGateway().verifyAndParseWebhook(request),
    ).rejects.toThrow(InvalidWebhookSignatureError);
  });

  it('rejects malformed signed webhook content', async () => {
    const gateway = new FakePaymentGateway();
    const signed = gateway.signWebhook({
      eventId: 'event-1',
      externalPaymentId: 'fake-payment-1',
      eventType: 'payment.updated',
    });
    const request = gateway.signWebhook(JSON.parse('{}'));
    await expect(gateway.verifyAndParseWebhook(request)).rejects.toThrow(
      PaymentGatewayError,
    );
    expect(signed.headers['x-fake-signature']).not.toBe(
      request.headers['x-fake-signature'],
    );
  });

  it('refunds an approved payment idempotently', async () => {
    const gateway = new FakePaymentGateway();
    const created = await gateway.createPayment(input());
    gateway.setPaymentStatus(created.externalPaymentId, 'APPROVED');
    const first = await gateway.refundPayment(
      created.externalPaymentId,
      'refund-key',
    );
    const second = await gateway.refundPayment(
      created.externalPaymentId,
      'refund-key',
    );
    expect(first.status).toBe('REFUNDED');
    expect(second.status).toBe('REFUNDED');
  });

  it('rejects refunds for a payment that is not approved', async () => {
    const gateway = new FakePaymentGateway();
    const created = await gateway.createPayment(input());
    await expect(
      gateway.refundPayment(created.externalPaymentId, 'refund-key'),
    ).rejects.toThrow(PaymentGatewayError);
  });
});
