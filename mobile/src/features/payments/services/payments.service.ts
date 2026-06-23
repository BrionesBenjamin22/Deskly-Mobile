import { API_BASE_URL } from '../../../config/api';
import { Payment } from '../types/payment.types';

type ApiErrorBody = {
  error?: string;
  message?: string | string[];
};

type PaymentResponse = {
  paymentId: string;
  reservationId: string;
  date: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
};

type ListPaymentsResponse = {
  payments: PaymentResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CreatePaymentPayload = {
  reservationId: string;
  date: string;
  amount: number;
};

const REQUEST_TIMEOUT_MS = 8000;

export class PaymentServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentServiceError';
  }
}

function getErrorMessage(body: ApiErrorBody | null) {
  if (Array.isArray(body?.message)) {
    return body.message.join(' ');
  }
  if (body?.message) {
    return body.message;
  }
  if (body?.error) {
    return body.error;
  }
  return 'Lo sentimos, no pudimos procesar el pago. Intente nuevamente.';
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      signal: controller.signal,
      ...init,
    });
  } catch (error) {
    const isTimeout =
      error instanceof Error &&
      (error.name === 'AbortError' || error.message.includes('aborted'));

    throw new PaymentServiceError(
      isTimeout
        ? 'La conexión con Deskly está tardando más de lo esperado. Verificá que el backend esté encendido y que el celular esté en la misma red.'
        : 'No pudimos conectar con Deskly. Verificá que el backend esté encendido y que tu celular esté en la misma red.',
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const body = (await response.json().catch(() => null)) as T | ApiErrorBody | null;

  if (!response.ok) {
    throw new PaymentServiceError(getErrorMessage(body as ApiErrorBody | null));
  }

  return body as T;
}

function mapPayment(p: PaymentResponse): Payment {
  return {
    id: p.paymentId,
    reservationId: p.reservationId,
    date: p.date,
    amount: p.amount,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export async function createPayment(payload: CreatePaymentPayload): Promise<Payment> {
  const response = await requestJson<PaymentResponse>('/payments', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      date: `${payload.date}T00:00:00Z`,
    }),
  });
  return mapPayment(response);
}

export async function listPayments(page = 1, limit = 50): Promise<{
  payments: Payment[];
  pagination: ListPaymentsResponse['pagination'];
}> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const response = await requestJson<ListPaymentsResponse>(`/payments?${params}`);

  return {
    payments: response.payments.map(mapPayment),
    pagination: response.pagination,
  };
}
