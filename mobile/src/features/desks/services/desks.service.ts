import { API_BASE_URL } from '../../../config/api';
import { Desk, DeskAmenity, DeskDescription, DeskZone } from '../types/desk.types';

type AvailableDeskResponse = {
  id: string;
  code: string;
  name?: string | null;
  descriptionId?: string | null;
  description?: Desk['description'] | null;
  zone?: Desk['zone'] | null;
  amenities: Desk['amenities'];
};

type GetAvailableDesksResponse = {
  desks: AvailableDeskResponse[];
};

type ListDesksResponse = {
  desks: Desk[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type GetAvailableDesksParams = {
  date: string;
  startTime: string;
  endTime: string;
};

export type DeskPayload = {
  code?: string;
  name?: string;
  descriptionId?: string;
  zone?: DeskZone;
  amenityIds?: string[];
  enabled?: boolean;
};

type ApiErrorBody = {
  error?: string;
  message?: string | string[];
};

const REQUEST_TIMEOUT_MS = 8000;

export class DeskServiceError extends Error {
  constructor(
    message: string,
    readonly causeType: 'network' | 'api' | 'unknown' = 'unknown',
  ) {
    super(message);
    this.name = 'DeskServiceError';
  }
}

function getErrorMessage(body: ApiErrorBody | null) {
  if (body?.error) {
    return body.error;
  }

  if (Array.isArray(body?.message)) {
    return body.message.join(' ');
  }

  return (
    body?.message ??
    'Lo sentimos, no pudimos recuperar su informaci\u00f3n. Intente nuevamente.'
  );
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

    throw new DeskServiceError(
      isTimeout
        ? 'La conexión con Deskly está tardando más de lo esperado. Verificá que el backend esté encendido y que el celular esté en la misma red.'
        : 'No pudimos conectar con Deskly. Verificá que el backend esté encendido y que tu celular esté en la misma red.',
      'network',
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json().catch(() => null)) as T | ApiErrorBody | null;

  if (!response.ok) {
    throw new DeskServiceError(getErrorMessage(body as ApiErrorBody | null), 'api');
  }

  return body as T;
}

function mapAvailableDesk(desk: AvailableDeskResponse): Desk {
  return {
    id: desk.id,
    code: desk.code,
    ...(desk.name ? { name: desk.name } : {}),
    ...(desk.descriptionId ? { descriptionId: desk.descriptionId } : {}),
    ...(desk.description ? { description: desk.description } : {}),
    ...(desk.zone ? { zone: desk.zone } : {}),
    amenities: desk.amenities ?? [],
    enabled: true,
    status: 'available',
  };
}

function sanitizePayload(payload: DeskPayload): DeskPayload {
  return {
    ...(payload.code?.trim() ? { code: payload.code.trim() } : {}),
    ...(payload.name?.trim() ? { name: payload.name.trim() } : {}),
    ...(payload.descriptionId ? { descriptionId: payload.descriptionId } : {}),
    ...(payload.zone ? { zone: payload.zone } : {}),
    ...(payload.amenityIds?.length ? { amenityIds: payload.amenityIds } : {}),
    ...(typeof payload.enabled === 'boolean' ? { enabled: payload.enabled } : {}),
  };
}

export async function getAvailableDesks({
  date,
  startTime,
  endTime,
}: GetAvailableDesksParams): Promise<Desk[]> {
  const params = new URLSearchParams({
    date,
    startTime,
    endTime,
  });

  const body = await requestJson<GetAvailableDesksResponse>(
    `/desks/availability?${params}`,
  );

  return body.desks.map(mapAvailableDesk);
}

export async function listDesks(page = 1, limit = 9) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  return requestJson<ListDesksResponse>(`/desks?${params}`);
}

export function createDesk(payload: DeskPayload) {
  return requestJson<Desk>('/desks', {
    method: 'POST',
    body: JSON.stringify(sanitizePayload(payload)),
  });
}

export function updateDesk(id: string, payload: DeskPayload) {
  return requestJson<Desk>(`/desks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(sanitizePayload(payload)),
  });
}

export function deleteDesk(id: string) {
  return requestJson<void>(`/desks/${id}`, {
    method: 'DELETE',
  });
}

export function listDeskDescriptions() {
  return requestJson<DeskDescription[]>('/desk-descriptions');
}

export function listAmenities() {
  return requestJson<DeskAmenity[]>('/amenities');
}
