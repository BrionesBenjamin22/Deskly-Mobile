import { API_BASE_URL } from '../../../config/api';
import { Reservation, ReservationStatus } from '../types/reservation.types';

type ApiErrorBody = {
  error?: string;
  message?: string | string[];
};

type ReservationResponse = {
  reservationId: string;
  deskId: string;
  deskCode: string;
  deskName?: string;
  memberFullName?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'ACTIVE' | 'CANCELLED';
  cancelledAt?: string;
  checkedInAt?: string;
};

type ListReservationsResponse = {
  reservations: ReservationResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CreateReservationPayload = {
  deskId: string;
  date: string;
  startTime: string;
  endTime: string;
};

const REQUEST_TIMEOUT_MS = 8000;

export class ReservationServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReservationServiceError';
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

  return 'Lo sentimos, no pudimos recuperar sus reservas. Intente nuevamente.';
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      signal: controller.signal,
    });
  } catch (error) {
    const isTimeout =
      error instanceof Error &&
      (error.name === 'AbortError' || error.message.includes('aborted'));

    throw new ReservationServiceError(
      isTimeout
        ? 'La conexión con Deskly está tardando más de lo esperado. Verificá que el backend esté encendido y que el celular esté en la misma red.'
        : 'No pudimos conectar con Deskly. Verificá que el backend esté encendido y que tu celular esté en la misma red.',
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const body = (await response.json().catch(() => null)) as T | ApiErrorBody | null;

  if (!response.ok) {
    throw new ReservationServiceError(getErrorMessage(body as ApiErrorBody | null));
  }

  return body as T;
}

function toDateLabel(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getReservationStatus(reservation: ReservationResponse): ReservationStatus {
  if (reservation.status === 'CANCELLED') {
    return 'cancelled';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reservationDate = new Date(`${reservation.date}T00:00:00`);

  if (!Number.isNaN(reservationDate.getTime()) && reservationDate < today) {
    return 'completed';
  }

  return 'active';
}

function mapReservation(reservation: ReservationResponse): Reservation {
  return {
    id: reservation.reservationId,
    deskId: reservation.deskId,
    deskCode: reservation.deskCode,
    deskName: reservation.deskName ?? `Escritorio ${reservation.deskCode}`,
    memberFullName: reservation.memberFullName,
    date: reservation.date,
    dateLabel: toDateLabel(reservation.date),
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    status: getReservationStatus(reservation),
    checkedInAt: reservation.checkedInAt,
  };
}

export async function listReservations(
  accessToken: string,
  page = 1,
  limit = 9,
  status?: 'ACTIVE' | 'CANCELLED',
  date?: string,
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(status ? { status } : {}),
    ...(date ? { date } : {}),
  });

  const response = await requestJson<ListReservationsResponse>(
    `/reservations?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  return {
    reservations: response.reservations.map(mapReservation),
    pagination: response.pagination,
  };
}

export async function validateArrival(id: string, accessToken: string) {
  const response = await requestJson<ReservationResponse>(
    `/reservations/${id}/check-in`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  return mapReservation(response);
}

export async function createReservation(
  accessToken: string,
  payload: CreateReservationPayload,
) {
  const response = await requestJson<ReservationResponse>('/reservations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
  });

  return mapReservation(response);
}

export async function cancelReservation(id: string, accessToken: string) {
  const response = await requestJson<ReservationResponse>(
    `/reservations/${id}/cancel`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  return mapReservation(response);
}
