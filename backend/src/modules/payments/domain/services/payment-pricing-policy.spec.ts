import {
  DEPOSIT_PERCENTAGE,
  PAYMENT_HOLD_DURATION_MINUTES,
  PAYMENT_PRICING_VERSION,
  PaymentPricingPolicy,
  PRICE_PER_HOUR_MINOR_UNITS,
} from './payment-pricing-policy';
import { InvalidPaymentAttemptError } from '../errors/payment-domain.errors';

describe('PaymentPricingPolicy', () => {
  const policy = new PaymentPricingPolicy();

  it('quotes the full amount using ARS 1500 per hour', () => {
    const quote = policy.quote(240, 'FULL');
    expect(PRICE_PER_HOUR_MINOR_UNITS).toBe(150_000);
    expect(quote.total.minorUnits).toBe(600_000);
    expect(quote.payable.minorUnits).toBe(600_000);
    expect(quote.total.currency).toBe('ARS');
    expect(quote.pricingVersion).toBe(PAYMENT_PRICING_VERSION);
    expect(PAYMENT_HOLD_DURATION_MINUTES).toBe(15);
  });

  it('quotes a 30 percent deposit without floating point money', () => {
    const quote = policy.quote(90, 'DEPOSIT');
    expect(DEPOSIT_PERCENTAGE).toBe(30);
    expect(quote.total.minorUnits).toBe(225_000);
    expect(quote.payable.minorUnits).toBe(67_500);
    expect(Number.isSafeInteger(quote.payable.minorUnits)).toBe(true);
  });

  it.each([0, -1, 1.5, Number.NaN])(
    'rejects invalid reservation duration %s',
    (duration) => {
      expect(() => policy.quote(duration, 'FULL')).toThrow(
        InvalidPaymentAttemptError,
      );
    },
  );
});
