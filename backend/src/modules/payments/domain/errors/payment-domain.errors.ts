export class InvalidPaymentAmountError extends Error {
  constructor() {
    super('El monto del pago debe expresarse en centavos enteros positivos.');
    this.name = 'InvalidPaymentAmountError';
    Object.setPrototypeOf(this, InvalidPaymentAmountError.prototype);
  }
}

export class InvalidPaymentTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`No se puede cambiar el pago de ${from} a ${to}.`);
    this.name = 'InvalidPaymentTransitionError';
    Object.setPrototypeOf(this, InvalidPaymentTransitionError.prototype);
  }
}

export class InvalidPaymentAttemptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPaymentAttemptError';
    Object.setPrototypeOf(this, InvalidPaymentAttemptError.prototype);
  }
}

export class PaymentIdempotencyConflictError extends Error {
  constructor() {
    super('La clave de idempotencia ya fue utilizada para otra operacion.');
    this.name = 'PaymentIdempotencyConflictError';
    Object.setPrototypeOf(this, PaymentIdempotencyConflictError.prototype);
  }
}

export class ConcurrentPaymentUpdateError extends Error {
  constructor() {
    super('El pago fue actualizado por otra operacion. Intente nuevamente.');
    this.name = 'ConcurrentPaymentUpdateError';
    Object.setPrototypeOf(this, ConcurrentPaymentUpdateError.prototype);
  }
}

export class PaymentGatewayError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'PaymentGatewayError';
    Object.setPrototypeOf(this, PaymentGatewayError.prototype);
  }
}

export class InvalidWebhookSignatureError extends Error {
  constructor() {
    super('La firma de la notificacion no es valida.');
    this.name = 'InvalidWebhookSignatureError';
    Object.setPrototypeOf(this, InvalidWebhookSignatureError.prototype);
  }
}
