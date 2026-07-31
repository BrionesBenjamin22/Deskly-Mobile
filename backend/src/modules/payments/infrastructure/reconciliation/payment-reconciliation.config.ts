export const PAYMENT_RECONCILIATION_CONFIG = Symbol(
  'PAYMENT_RECONCILIATION_CONFIG',
);

export type PaymentReconciliationConfig = {
  enabled: boolean;
  intervalMs: number;
  limit: number;
  minAgeMinutes: number;
};

export function readPaymentReconciliationConfig(
  env: Record<string, string | undefined> = process.env,
): PaymentReconciliationConfig {
  const enabledValue = env.PAYMENT_RECONCILIATION_ENABLED ?? 'false';
  if (!['true', 'false'].includes(enabledValue))
    throw new Error(
      'Invalid payment reconciliation configuration: PAYMENT_RECONCILIATION_ENABLED',
    );

  const integer = (
    key: string,
    fallback: number,
    minimum: number,
    maximum: number,
  ) => {
    const value = Number(env[key] ?? fallback);
    if (!Number.isInteger(value) || value < minimum || value > maximum)
      throw new Error(`Invalid payment reconciliation configuration: ${key}`);
    return value;
  };

  return {
    enabled: enabledValue === 'true',
    intervalMs: integer(
      'PAYMENT_RECONCILIATION_INTERVAL_MS',
      60_000,
      30_000,
      3_600_000,
    ),
    limit: integer('PAYMENT_RECONCILIATION_LIMIT', 50, 1, 100),
    minAgeMinutes: integer(
      'PAYMENT_RECONCILIATION_MIN_AGE_MINUTES',
      5,
      1,
      1_440,
    ),
  };
}
