export type PaymentGatewayName = 'FAKE' | 'MERCADO_PAGO';

export type MercadoPagoConfig = {
  accessToken: string;
  webhookSecret: string;
  successUrl: string;
  failureUrl: string;
  pendingUrl: string;
  notificationUrl: string;
  timeoutMs: number;
  production: boolean;
  allowedReturnOrigins: readonly string[];
  allowedNotificationOrigins: readonly string[];
};

export function readPaymentGatewayName(
  env: Record<string, string | undefined> = process.env,
): PaymentGatewayName {
  return env.PAYMENT_GATEWAY === 'MERCADO_PAGO' ? 'MERCADO_PAGO' : 'FAKE';
}

export function readMercadoPagoConfig(
  env: Record<string, string | undefined> = process.env,
): MercadoPagoConfig {
  const required = (key: string, minimumLength = 1) => {
    const value = env[key]?.trim() ?? '';
    if (value.length < minimumLength)
      throw new Error(`Invalid payment provider configuration: ${key}`);
    return value;
  };
  const production = env.NODE_ENV === 'production';
  const allowedReturnOrigins = required('MERCADO_PAGO_ALLOWED_RETURN_ORIGINS')
    .split(',')
    .map((value) => {
      try {
        const url = new URL(value.trim());
        if (!['http:', 'https:'].includes(url.protocol) || url.pathname !== '/')
          throw new Error();
        if (production && url.protocol !== 'https:') throw new Error();
        return url.origin;
      } catch {
        throw new Error(
          'Invalid payment provider configuration: MERCADO_PAGO_ALLOWED_RETURN_ORIGINS',
        );
      }
    });
  const allowedNotificationOrigins = required(
    'MERCADO_PAGO_ALLOWED_NOTIFICATION_ORIGINS',
  )
    .split(',')
    .map((value) => {
      try {
        const url = new URL(value.trim());
        if (url.protocol !== 'https:' || url.pathname !== '/')
          throw new Error();
        return url.origin;
      } catch {
        throw new Error(
          'Invalid payment provider configuration: MERCADO_PAGO_ALLOWED_NOTIFICATION_ORIGINS',
        );
      }
    });
  const validateUrl = (key: string) => {
    const value = required(key);
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new Error(`Invalid payment provider configuration: ${key}`);
    }
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw new Error(`Invalid payment provider configuration: ${key}`);
    if (production && url.protocol !== 'https:')
      throw new Error(`Invalid payment provider configuration: ${key}`);
    if (!allowedReturnOrigins.includes(url.origin))
      throw new Error(`Invalid payment provider configuration: ${key}`);
    return url.toString();
  };
  const timeoutMs = Number(env.MERCADO_PAGO_TIMEOUT_MS ?? 5000);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 500 || timeoutMs > 30000)
    throw new Error(
      'Invalid payment provider configuration: MERCADO_PAGO_TIMEOUT_MS',
    );
  const notificationUrl = (() => {
    const key = 'MERCADO_PAGO_NOTIFICATION_URL';
    let url: URL;
    try {
      url = new URL(required(key));
    } catch {
      throw new Error(`Invalid payment provider configuration: ${key}`);
    }
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.pathname !== '/webhooks/payments' ||
      url.searchParams.get('source_news') !== 'webhooks' ||
      !allowedNotificationOrigins.includes(url.origin)
    )
      throw new Error(`Invalid payment provider configuration: ${key}`);
    return url.toString();
  })();
  return {
    accessToken: required('MERCADO_PAGO_ACCESS_TOKEN', 20),
    webhookSecret: required('MERCADO_PAGO_WEBHOOK_SECRET', 16),
    successUrl: validateUrl('MERCADO_PAGO_SUCCESS_URL'),
    failureUrl: validateUrl('MERCADO_PAGO_FAILURE_URL'),
    pendingUrl: validateUrl('MERCADO_PAGO_PENDING_URL'),
    notificationUrl,
    timeoutMs,
    production,
    allowedReturnOrigins,
    allowedNotificationOrigins,
  };
}
