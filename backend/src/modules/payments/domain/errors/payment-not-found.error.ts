export class PaymentNotFoundError extends Error {
  constructor() {
    super('Payment not found.');
    this.name = 'PaymentNotFoundError';
    Object.setPrototypeOf(this, PaymentNotFoundError.prototype);
  }
}
