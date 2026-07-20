type EnvironmentVariables = {
  NODE_ENV: string;
  PORT: number;
  FRONTEND_URL: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  PAYMENT_GATEWAY: 'FAKE' | 'MERCADO_PAGO';
};

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const requiredVariables = ['DATABASE_URL', 'JWT_SECRET'] as const;

  for (const variable of requiredVariables) {
    if (!config[variable]) {
      throw new Error(`Missing required environment variable: ${variable}`);
    }
  }

  const getString = (key: string, fallback?: string): string => {
    const value = config[key] ?? fallback;

    if (typeof value !== 'string') {
      throw new Error(`Invalid environment variable: ${key}`);
    }

    return value;
  };

  const paymentGateway = getString('PAYMENT_GATEWAY', 'FAKE');
  if (!['FAKE', 'MERCADO_PAGO'].includes(paymentGateway)) {
    throw new Error('PAYMENT_GATEWAY must be FAKE or MERCADO_PAGO');
  }
  if (paymentGateway === 'MERCADO_PAGO') {
    validateMercadoPagoEnvironment(config);
  }

  return {
    NODE_ENV: getString('NODE_ENV', 'development'),
    PORT: Number(config.PORT ?? 3000),
    FRONTEND_URL: getString('FRONTEND_URL', 'http://localhost:5173'),
    DATABASE_URL: getString('DATABASE_URL'),
    JWT_SECRET: getString('JWT_SECRET'),
    JWT_EXPIRES_IN: validateJwtExpiration(getString('JWT_EXPIRES_IN', '1h')),
    PAYMENT_GATEWAY: paymentGateway as 'FAKE' | 'MERCADO_PAGO',
  };
}

function validateMercadoPagoEnvironment(config: Record<string, unknown>): void {
  const required = [
    'MERCADO_PAGO_ACCESS_TOKEN',
    'MERCADO_PAGO_WEBHOOK_SECRET',
    'MERCADO_PAGO_SUCCESS_URL',
    'MERCADO_PAGO_FAILURE_URL',
    'MERCADO_PAGO_PENDING_URL',
    'MERCADO_PAGO_ALLOWED_RETURN_ORIGINS',
  ];
  for (const key of required) {
    if (typeof config[key] !== 'string' || !config[key].trim())
      throw new Error(`Missing required environment variable: ${key}`);
  }
}

function validateJwtExpiration(value: string): string {
  const match = /^(\d+)(s|m|h|d)$/.exec(value);

  if (!match) {
    throw new Error(
      'JWT_EXPIRES_IN must use seconds, minutes, hours or days (for example: 1h, 1d)',
    );
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const seconds =
    amount *
    (unit === 'd' ? 86400 : unit === 'h' ? 3600 : unit === 'm' ? 60 : 1);

  if (seconds <= 0 || seconds > 7 * 86400) {
    throw new Error(
      'JWT_EXPIRES_IN must be greater than 0 and no longer than 7 days',
    );
  }

  return value;
}
