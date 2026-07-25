import { createHmac } from 'node:crypto';
import { InvalidWebhookSignatureError } from '../../domain/errors/payment-domain.errors';
import { MercadoPagoConfig } from './mercado-pago.config';
import {
  MercadoPagoGateway,
  MercadoPagoSdkClients,
} from './mercado-pago.gateway';

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
const payment = (status = 'approved', currency_id = 'ARS') => ({
  id: 123,
  external_reference: 'reservation:1',
  status,
  transaction_amount: 123.45,
  currency_id,
  date_last_updated: '2026-07-20T19:00:00Z',
});
const sdk = (overrides: Partial<MercadoPagoSdkClients> = {}) => ({
  createPreference: jest.fn(),
  getPayment: jest.fn(),
  searchPayments: jest.fn(),
  refundPayment: jest.fn(),
  ...overrides,
});

describe('MercadoPagoGateway', () => {
  it('crea preferencia exacta con URLs backend e idempotencia externa', async () => {
    const clients = sdk({
      createPreference: jest.fn().mockResolvedValue({
        id: 'pref-1',
        sandbox_init_point: 'https://sandbox.mercadopago.com/checkout/pref-1',
      }),
    });
    const result = await new MercadoPagoGateway(config, clients).createPayment(
      input,
    );
    expect(result).toMatchObject({
      provider: 'MERCADO_PAGO',
      externalPaymentId: null,
      status: 'PENDING',
      amountMinorUnits: 12345,
    });
    expect(clients.createPreference).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          {
            id: input.paymentId,
            title: input.description,
            quantity: 1,
            unit_price: 123.45,
            currency_id: 'ARS',
          },
        ],
        external_reference: input.externalReference,
        metadata: { payment_id: input.paymentId },
        back_urls: {
          success: config.successUrl,
          failure: config.failureUrl,
          pending: config.pendingUrl,
        },
      }),
      {
        timeout: config.timeoutMs,
        idempotencyKey: input.idempotencyKey,
      },
    );
    expect(JSON.stringify(result)).not.toContain(config.accessToken);
  });

  it('acepta el dominio regional oficial de Checkout Pro para Argentina', async () => {
    const gateway = new MercadoPagoGateway(
      config,
      sdk({
        createPreference: jest.fn().mockResolvedValue({
          id: 'pref-ar',
          sandbox_init_point:
            'https://sandbox.mercadopago.com.ar/checkout/v1/redirect',
        }),
      }),
    );

    await expect(gateway.createPayment(input)).resolves.toMatchObject({
      checkoutUrl: 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect',
    });
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
      sdk({ getPayment: jest.fn().mockResolvedValue(payment(external)) }),
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
  ])('clasifica errores SDK con HTTP %s', async (status, retryable) => {
    const gateway = new MercadoPagoGateway(
      config,
      sdk({
        getPayment: jest
          .fn()
          .mockRejectedValue({ status, message: config.accessToken }),
      }),
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
      sdk({ getPayment: jest.fn().mockRejectedValue(new Error('ECONNRESET')) }),
    );
    await expect(disconnected.getPayment('1')).rejects.toMatchObject({
      retryable: true,
    });
    const timedOut = new MercadoPagoGateway(
      config,
      sdk({ getPayment: jest.fn().mockRejectedValue(new Error('aborted')) }),
    );
    await expect(timedOut.getPayment('1')).rejects.toMatchObject({
      retryable: true,
    });
  });

  it('rechaza respuesta, moneda y checkout incoherentes', async () => {
    const invalidResponse = new MercadoPagoGateway(
      config,
      sdk({ getPayment: jest.fn().mockResolvedValue('invalid') }),
    );
    await expect(invalidResponse.getPayment('1')).rejects.toMatchObject({
      retryable: false,
    });
    await expect(
      new MercadoPagoGateway(
        config,
        sdk({
          getPayment: jest.fn().mockResolvedValue(payment('approved', 'USD')),
        }),
      ).getPayment('1'),
    ).rejects.toThrow('moneda');
    await expect(
      new MercadoPagoGateway(
        config,
        sdk({
          createPreference: jest.fn().mockResolvedValue({
            id: 'pref',
            sandbox_init_point: 'https://evil.example',
          }),
        }),
      ).createPayment(input),
    ).rejects.toThrow('checkout invalido');
    await expect(
      new MercadoPagoGateway(
        config,
        sdk({
          createPreference: jest.fn().mockResolvedValue({
            id: 'pref',
            sandbox_init_point:
              'https://sandbox.mercadopago.com.ar.evil.example/checkout',
          }),
        }),
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
        sdk({ getPayment: jest.fn().mockResolvedValue(payment()) }),
      );
      await expect(
        gateway.getPayment('123', expectation),
      ).rejects.toMatchObject({ retryable: false });
    },
  );

  it('recupera un pago por referencia externa cuando el webhook no llego', async () => {
    const clients = sdk({
      searchPayments: jest.fn().mockResolvedValue({
        paging: { total: 1, limit: 20, offset: 0 },
        results: [payment('approved')],
      }),
    });

    await expect(
      new MercadoPagoGateway(config, clients).findPaymentByExternalReference(
        'reservation:1',
        {
          externalReference: 'reservation:1',
          amountMinorUnits: 12345,
          currency: 'ARS',
        },
      ),
    ).resolves.toMatchObject({
      externalPaymentId: '123',
      status: 'APPROVED',
    });
    expect(clients.searchPayments).toHaveBeenCalledWith(
      {
        external_reference: 'reservation:1',
        sort: 'date_last_updated',
        criteria: 'desc',
        limit: 20,
      },
      { timeout: config.timeoutMs },
    );
  });

  it('no inventa un pago cuando la referencia externa no tiene resultados', async () => {
    const clients = sdk({
      searchPayments: jest.fn().mockResolvedValue({ results: [] }),
    });

    await expect(
      new MercadoPagoGateway(config, clients).findPaymentByExternalReference(
        'reservation:1',
        {
          externalReference: 'reservation:1',
          amountMinorUnits: 12345,
          currency: 'ARS',
        },
      ),
    ).resolves.toBeNull();
  });

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
    const gateway = new MercadoPagoGateway(config, sdk());
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
    const clients = sdk({
      refundPayment: jest.fn().mockResolvedValue({ id: 55 }),
      getPayment: jest.fn().mockResolvedValue(payment('refunded')),
    });
    await expect(
      new MercadoPagoGateway(config, clients).refundPayment(
        '123',
        'refund-key',
      ),
    ).resolves.toMatchObject({ status: 'REFUNDED' });
    expect(clients.refundPayment).toHaveBeenCalledWith('123', {
      timeout: config.timeoutMs,
      idempotencyKey: 'refund-key',
    });
    expect(clients.getPayment).toHaveBeenCalledWith('123', {
      timeout: config.timeoutMs,
    });
  });
});
