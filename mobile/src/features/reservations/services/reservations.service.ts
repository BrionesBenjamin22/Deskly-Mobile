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
  date: string;
  startTime: string;
  endTime: string;
  status: 'ACTIVE' | 'CANCELLED';
  cancelledAt?: string;
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

const REQUEST_TIMEOUT_MS = 8000;

export class ReservationServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReservationServiceError';
  }
}

function getErrorMessage(body: ApiErrorBody | null) {
  if (body?.error) {
    return body.error;
  }

  if (Array.isArray(body?.message)) {
    return body.message.join(' ');
  }

  return 'Lo sentimos, no pudimos recuperar sus reservas. Intente nuevamente.';
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
    dateLabel: toDateLabel(reservation.date),
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    status: getReservationStatus(reservation),
  };
}

export async function listReservations(page = 1, limit = 9) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const response = await requestJson<ListReservationsResponse>(
    `/reservations?${params}`,
  );

  return {
    reservations: response.reservations.map(mapReservation),
    pagination: response.pagination,
  };
}

export async function cancelReservation(id: string) {
  const response = await requestJson<ReservationResponse>(
    `/reservations/${id}/cancel`,
    {
      method: 'PATCH',
    },
  );

  return mapReservation(response);
}
