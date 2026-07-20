import { validateEnvironment } from './env.validation';

const base = { DATABASE_URL: 'postgresql://test', JWT_SECRET: 'local-secret' };

describe('validateEnvironment payment provider', () => {
  it('inicia con FAKE sin secretos externos', () => {
    expect(validateEnvironment(base).PAYMENT_GATEWAY).toBe('FAKE');
  });
  it('rechaza un proveedor desconocido', () => {
    expect(() =>
      validateEnvironment({ ...base, PAYMENT_GATEWAY: 'OTHER' }),
    ).toThrow('PAYMENT_GATEWAY');
  });
  it('rechaza Mercado Pago sin credenciales', () => {
    expect(() =>
      validateEnvironment({ ...base, PAYMENT_GATEWAY: 'MERCADO_PAGO' }),
    ).toThrow('MERCADO_PAGO_ACCESS_TOKEN');
  });
});
