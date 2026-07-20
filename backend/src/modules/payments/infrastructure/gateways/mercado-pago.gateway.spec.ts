import { createHmac } from 'node:crypto';
import { InvalidWebhookSignatureError } from '../../domain/errors/payment-domain.errors';
import { MercadoPagoConfig } from './mercado-pago.config';
import { MercadoPagoGateway } from './mercado-pago.gateway';

const config: MercadoPagoConfig = {
  accessToken: 'APP_USR_super_secret_access_token',
  webhookSecret: 'webhook-secret-for-tests',
  successUrl: 'https://deskly.test/success',
  failureUrl: 'https://deskly.test/failure',
  pendingUrl: 'https://deskly.test/pending',
  allowedReturnOrigins: ['https://deskly.test'],
  timeoutMs: 50,
  production: false,
};
const input = {
  paymentId: 'payment-1',
  externalReference: 'reservation:1',
  amountMinorUnits: 12345,
  currency: 'ARS' as const,
  description: 'Reserva 1',
  expiresAt: new Date('2026-07-20T20:00:00Z'),
  idempotencyKey: 'checkout-key-1',
};
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });
const payment = (status = 'approved', currency_id = 'ARS') => ({
  id: 123,
  external_reference: 'reservation:1',
  status,
  transaction_amount: 123.45,
  currency_id,
  date_last_updated: '2026-07-20T19:00:00Z',
});

describe('MercadoPagoGateway', () => {
  it('crea preferencia exacta con URLs backend e idempotencia externa', async () => {
    const http = jest.fn().mockResolvedValue(
      response({
        id: 'pref-1',
        sandbox_init_point: 'https://sandbox.mercadopago.com/checkout/pref-1',
      }),
    );
    const result = await new MercadoPagoGateway(config, http).createPayment(
      input,
    );
    const request = http.mock.calls[0][1],
      body = JSON.parse(request.body);
    expect(result).toMatchObject({
      provider: 'MERCADO_PAGO',
      status: 'PENDING',
      amountMinorUnits: 12345,
    });
    expect(request.headers).toMatchObject({
      Authorization: `Bearer ${config.accessToken}`,
      'X-Idempotency-Key': input.idempotencyKey,
    });
    expect(body).toMatchObject({
      items: [{ unit_price: 123.45, currency_id: 'ARS' }],
      external_reference: input.externalReference,
      metadata: { payment_id: input.paymentId },
      back_urls: {
        success: config.successUrl,
        failure: config.failureUrl,
        pending: config.pendingUrl,
      },
    });
    expect(JSON.stringify(result)).not.toContain(config.accessToken);
  });

  it.each([
    ['pending', 'PENDING'],
    ['in_process', 'PROCESSING'],
    ['authorized', 'PROCESSING'],
    ['approved', 'APPROVED'],
    ['rejected', 'REJECTED'],
    ['cancelled', 'CANCELLED'],
    ['expired', 'EXPIRED'],
    ['refunded', 'REFUNDED'],
    ['charged_back', 'REFUNDED'],
    ['unknown', 'PROCESSING'],
  ])('mapea %s a %s', async (external, expected) => {
    const gateway = new MercadoPagoGateway(
      config,
      jest.fn().mockResolvedValue(response(payment(external))),
    );
    await expect(gateway.getPayment('123')).resolves.toMatchObject({
      status: expected,
      amountMinorUnits: 12345,
    });
  });

  it.each([
    [400, false],
    [404, false],
    [408, true],
    [429, true],
    [500, true],
    [503, true],
  ])('clasifica HTTP %s', async (status, retryable) => {
    const gateway = new MercadoPagoGateway(
      config,
      jest
        .fn()
        .mockResolvedValue(response({ message: config.accessToken }, status)),
    );
    await expect(gateway.getPayment('123')).rejects.toMatchObject({
      name: 'PaymentGatewayError',
      retryable,
    });
    await expect(gateway.getPayment('123')).rejects.not.toThrow(
      config.accessToken,
    );
  });

  it('clasifica desconexion y timeout como reintentables', async () => {
    const disconnected = new MercadoPagoGateway(
      config,
      jest.fn().mockRejectedValue(new Error('ECONNRESET')),
    );
    await expect(disconnected.getPayment('1')).rejects.toMatchObject({
      retryable: true,
    });
    const hanging = new MercadoPagoGateway(
      config,
      jest.fn(
        (_url, init) =>
          new Promise((_resolve, reject) =>
            init.signal.addEventListener('abort', () =>
              reject(new Error('aborted')),
            ),
          ),
      ),
    );
    await expect(hanging.getPayment('1')).rejects.toMatchObject({
      retryable: true,
    });
  });

  it('rechaza JSON, moneda y checkout incoherentes', async () => {
    const invalidJson = new MercadoPagoGateway(
      config,
      jest.fn().mockResolvedValue(new Response('{', { status: 200 })),
    );
    await expect(invalidJson.getPayment('1')).rejects.toMatchObject({
      retryable: false,
    });
    await expect(
      new MercadoPagoGateway(
        config,
        jest.fn().mockResolvedValue(response(payment('approved', 'USD'))),
      ).getPayment('1'),
    ).rejects.toThrow('moneda');
    await expect(
      new MercadoPagoGateway(
        config,
        jest.fn().mockResolvedValue(
          response({
            id: 'pref',
            sandbox_init_point: 'https://evil.example',
          }),
        ),
      ).createPayment(input),
    ).rejects.toThrow('checkout invalido');
  });

  it.each([
    [
      {
        externalReference: 'otra',
        amountMinorUnits: 12345,
        currency: 'ARS' as const,
      },
    ],
    [
      {
        externalReference: 'reservation:1',
        amountMinorUnits: 999,
        currency: 'ARS' as const,
      },
    ],
  ])(
    'rechaza referencia o importe distintos al intento interno',
    async (expectation) => {
      const gateway = new MercadoPagoGateway(
        config,
        jest.fn().mockResolvedValue(response(payment())),
      );
      await expect(
        gateway.getPayment('123', expectation),
      ).rejects.toMatchObject({ retryable: false });
    },
  );

  it('verifica firma HMAC y extrae solo datos minimos', async () => {
    const rawBody = JSON.stringify({
      id: 987,
      type: 'payment',
      data: { id: 'PAY-123' },
      ignored: config.accessToken,
    });
    const ts = '1742505638683',
      requestId = 'request-1';
    const v1 = createHmac('sha256', config.webhookSecret)
      .update(`id:pay-123;request-id:${requestId};ts:${ts};`)
      .digest('hex');
    const gateway = new MercadoPagoGateway(config, jest.fn());
    await expect(
      gateway.verifyAndParseWebhook({
        rawBody,
        headers: {
          'x-signature': `ts=${ts},v1=${v1}`,
          'x-request-id': requestId,
        },
      }),
    ).resolves.toEqual({
      eventId: '987',
      externalPaymentId: 'PAY-123',
      eventType: 'payment',
    });
    await expect(
      gateway.verifyAndParseWebhook({
        rawBody,
        headers: {
          'x-signature': `ts=${ts},v1=${'0'.repeat(64)}`,
          'x-request-id': requestId,
        },
      }),
    ).rejects.toBeInstanceOf(InvalidWebhookSignatureError);
  });

  it('reembolsa con idempotencia y consulta el estado definitivo', async () => {
    const http = jest
      .fn()
      .mockResolvedValueOnce(response({ id: 55 }))
      .mockResolvedValueOnce(response(payment('refunded')));
    await expect(
      new MercadoPagoGateway(config, http).refundPayment('123', 'refund-key'),
    ).resolves.toMatchObject({ status: 'REFUNDED' });
    expect(http.mock.calls[0][1].headers['X-Idempotency-Key']).toBe(
      'refund-key',
    );
    expect(http.mock.calls[1][0]).toContain('/v1/payments/123');
  });
});
