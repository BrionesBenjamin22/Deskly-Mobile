import { InvalidPaymentAttemptError } from '../errors/payment-domain.errors';
import { Money } from '../value-objects/money.value-object';

export const PAYMENT_PRICING_VERSION = 'ARS_1500_HOUR_DEPOSIT_30_V1';
export const PRICE_PER_HOUR_MINOR_UNITS = 150_000;
export const DEPOSIT_PERCENTAGE = 30;
export const PAYMENT_HOLD_DURATION_MINUTES = 15;

export type PaymentOption = 'DEPOSIT' | 'FULL';

export type PaymentQuote = {
  total: Money;
  payable: Money;
  option: PaymentOption;
  pricingVersion: typeof PAYMENT_PRICING_VERSION;
};

export class PaymentPricingPolicy {
  quote(durationMinutes: number, option: PaymentOption): PaymentQuote {
    if (!Number.isSafeInteger(durationMinutes) || durationMinutes <= 0) {
      throw new InvalidPaymentAttemptError(
        'La duracion de la reserva debe expresarse en minutos enteros positivos.',
      );
    }

    const totalMinorUnits = Math.round(
      (durationMinutes * PRICE_PER_HOUR_MINOR_UNITS) / 60,
    );
    const payableMinorUnits =
      option === 'DEPOSIT'
        ? Math.round((totalMinorUnits * DEPOSIT_PERCENTAGE) / 100)
        : totalMinorUnits;

    return {
      total: Money.ars(totalMinorUnits),
      payable: Money.ars(payableMinorUnits),
      option,
      pricingVersion: PAYMENT_PRICING_VERSION,
    };
  }
}
