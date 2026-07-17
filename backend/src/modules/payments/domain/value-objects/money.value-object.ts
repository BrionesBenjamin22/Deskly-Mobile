import { InvalidPaymentAmountError } from '../errors/payment-domain.errors';

export type Currency = 'ARS';

export class Money {
  private constructor(
    readonly minorUnits: number,
    readonly currency: Currency,
  ) {}

  static ars(minorUnits: number): Money {
    if (!Number.isSafeInteger(minorUnits) || minorUnits <= 0) {
      throw new InvalidPaymentAmountError();
    }

    return new Money(minorUnits, 'ARS');
  }

  equals(other: Money): boolean {
    return (
      this.minorUnits === other.minorUnits && this.currency === other.currency
    );
  }
}
