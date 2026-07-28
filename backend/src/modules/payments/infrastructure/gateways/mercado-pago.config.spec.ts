import {
  readMercadoPagoConfig,
  readPaymentGatewayName,
} from './mercado-pago.config';

const valid = {
  NODE_ENV: 'production',
  PAYMENT_GATEWAY: 'MERCADO_PAGO',
  MERCADO_PAGO_ACCESS_TOKEN: 'APP_USR_valid_access_token_123456789',
  MERCADO_PAGO_WEBHOOK_SECRET: 'valid-webhook-secret-123456',
  MERCADO_PAGO_SUCCESS_URL: 'https://deskly.example/success',
  MERCADO_PAGO_FAILURE_URL: 'https://deskly.example/failure',
  MERCADO_PAGO_PENDING_URL: 'https://deskly.example/pending',
  MERCADO_PAGO_TIMEOUT_MS: '3000',
  MERCADO_PAGO_ALLOWED_RETURN_ORIGINS: 'https://deskly.example',
};

describe('MercadoPagoConfig', () => {
  it('mantiene el fake como proveedor seguro por defecto', () => {
    expect(readPaymentGatewayName({})).toBe('FAKE');
  });
  it('acepta configuracion productiva completa y HTTPS', () => {
    expect(readMercadoPagoConfig(valid)).toMatchObject({
      production: true,
      timeoutMs: 3000,
    });
  });
  it.each([
    ['MERCADO_PAGO_ACCESS_TOKEN', 'short'],
    ['MERCADO_PAGO_WEBHOOK_SECRET', 'short'],
    ['MERCADO_PAGO_TIMEOUT_MS', '50'],
    ['MERCADO_PAGO_SUCCESS_URL', 'javascript:alert(1)'],
  ])('rechaza configuracion insegura en %s', (key, value) => {
    expect(() => readMercadoPagoConfig({ ...valid, [key]: value })).toThrow(
      key,
    );
  });
  it('exige HTTPS para retornos productivos', () => {
    expect(() =>
      readMercadoPagoConfig({
        ...valid,
        MERCADO_PAGO_PENDING_URL: 'http://deskly.example/pending',
      }),
    ).toThrow('MERCADO_PAGO_PENDING_URL');
  });
  it('rechaza un retorno fuera de la allowlist', () => {
    expect(() =>
      readMercadoPagoConfig({
        ...valid,
        MERCADO_PAGO_FAILURE_URL: 'https://evil.example/failure',
      }),
    ).toThrow('MERCADO_PAGO_FAILURE_URL');
  });
});
