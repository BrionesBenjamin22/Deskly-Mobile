import { API_BASE_URL } from '../../../config/api';
import type {
  PaymentAttempt,
  PaymentCheckout,
  PaymentOption,
  PaymentQuote,
} from '../types/payment.types';

type ApiErrorBody = {
  error?: string;
  message?: string | string[];
};

const REQUEST_TIMEOUT_MS = 8000;

export class PaymentServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentServiceError';
    Object.setPrototypeOf(this, PaymentServiceError.prototype);
  }
}

export function createPaymentOperationKey(): string {
  const random = Math.random().toString(36).slice(2, 14);
  return `checkout-${Date.now().toString(36)}-${random}`;
}

function getErrorMessage(body: ApiErrorBody | null) {
  if (body?.error) return body.error;
  if (Array.isArray(body?.message)) return body.message.join(' ');
  if (body?.message) return body.message;
  return 'Lo sentimos, no pudimos procesar el pago. Intente nuevamente.';
}

async function requestJson<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      signal: controller.signal,
    });
  } catch (error) {
    const timeout = error instanceof Error && error.name === 'AbortError';
    throw new PaymentServiceError(
      timeout
        ? 'Lo sentimos, la consulta esta tardando demasiado. Intente nuevamente.'
        : 'Lo sentimos, no pudimos conectar con Deskly. Revise su conexion e intente nuevamente.',
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const body = (await response.json().catch(() => null)) as
    | T
    | ApiErrorBody
    | null;
  if (!response.ok)
    throw new PaymentServiceError(getErrorMessage(body as ApiErrorBody | null));
  return body as T;
}

export function getPaymentQuote(accessToken: string, reservationId: string) {
  return requestJson<PaymentQuote>(
    `/reservations/${encodeURIComponent(reservationId)}/payment-quote`,
    accessToken,
  );
}

export function createPaymentCheckout(
  accessToken: string,
  input: {
    reservationId: string;
    option: PaymentOption;
    idempotencyKey: string;
  },
) {
  return requestJson<PaymentCheckout>('/payments/checkout', accessToken, {
    method: 'POST',
    headers: { 'Idempotency-Key': input.idempotencyKey },
    body: JSON.stringify({
      reservationId: input.reservationId,
      option: input.option,
    }),
  });
}

export function getPaymentAttempt(accessToken: string, paymentId: string) {
  return requestJson<PaymentAttempt>(
    `/payments/${encodeURIComponent(paymentId)}`,
    accessToken,
  );
}

export function listReservationPayments(
  accessToken: string,
  reservationId: string,
) {
  return requestJson<PaymentAttempt[]>(
    `/reservations/${encodeURIComponent(reservationId)}/payments`,
    accessToken,
  );
}
