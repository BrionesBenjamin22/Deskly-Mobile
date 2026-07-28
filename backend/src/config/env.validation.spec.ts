import { validateEnvironment } from './env.validation';

const base = {
  DATABASE_URL: 'postgresql://test',
  JWT_SECRET: 'deterministic-test-secret-with-32-characters',
};

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

  it('rechaza secretos JWT cortos o usados como placeholder', () => {
    expect(() =>
      validateEnvironment({ ...base, JWT_SECRET: 'short-secret' }),
    ).toThrow('JWT_SECRET');
    expect(() =>
      validateEnvironment({
        ...base,
        JWT_SECRET: 'change_me_with_at_least_32_characters',
      }),
    ).toThrow('JWT_SECRET');
  });
});
