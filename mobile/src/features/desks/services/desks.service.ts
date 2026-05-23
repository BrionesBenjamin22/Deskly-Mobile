import { API_BASE_URL } from '../../../config/api';
import { Desk, DeskAmenity, DeskDescription, DeskZone } from '../types/desk.types';

type AvailableDeskResponse = {
  id: string;
  code: string;
  name?: string | null;
  peopleCapacity: number;
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
  zone?: DeskZone;
};

export type DeskPayload = {
  name?: string;
  peopleCapacity?: number;
  descriptionId?: string;
  zone?: DeskZone;
  amenityIds?: string[];
  enabled?: boolean;
};

export type AmenityPayload = {
  name?: string;
};

type ApiErrorBody = {
  error?: string;
  message?: string | string[];
};

const REQUEST_TIMEOUT_MS = 8000;
const DESK_ZONES: DeskZone[] = ['A', 'B', 'C'];

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
  if (Array.isArray(body?.message)) {
    return body.message.join(' ');
  }

  if (body?.message) {
    return body.message;
  }

  if (body?.error) {
    return body.error;
  }

  return (
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
    peopleCapacity: desk.peopleCapacity,
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
    ...(payload.name?.trim() ? { name: payload.name.trim() } : {}),
    ...(typeof payload.peopleCapacity === 'number' && payload.peopleCapacity >= 1
      ? { peopleCapacity: payload.peopleCapacity }
      : {}),
    ...(payload.descriptionId ? { descriptionId: payload.descriptionId } : {}),
    ...(payload.zone ? { zone: payload.zone } : {}),
    ...(payload.amenityIds ? { amenityIds: payload.amenityIds } : {}),
    ...(typeof payload.enabled === 'boolean' ? { enabled: payload.enabled } : {}),
  };
}

function sanitizeAmenityPayload(payload: AmenityPayload): AmenityPayload {
  return {
    ...(payload.name?.trim() ? { name: payload.name.trim() } : {}),
  };
}

function validateDeskPayloadTypes(payload: DeskPayload) {
  if (payload.name !== undefined && typeof payload.name !== 'string') {
    throw new DeskServiceError('El nombre del escritorio debe ser texto.', 'api');
  }

  if (
    payload.peopleCapacity !== undefined &&
    (!Number.isInteger(payload.peopleCapacity) || payload.peopleCapacity < 1)
  ) {
    throw new DeskServiceError(
      'La cantidad de personas debe ser un numero entero mayor o igual a 1.',
      'api',
    );
  }

  if (
    payload.descriptionId !== undefined &&
    typeof payload.descriptionId !== 'string'
  ) {
    throw new DeskServiceError('El tipo de escritorio seleccionado no es valido.', 'api');
  }

  if (payload.zone !== undefined && !DESK_ZONES.includes(payload.zone)) {
    throw new DeskServiceError('La zona debe ser A, B o C.', 'api');
  }

  if (
    payload.amenityIds !== undefined &&
    (!Array.isArray(payload.amenityIds) ||
      payload.amenityIds.some((amenityId) => typeof amenityId !== 'string'))
  ) {
    throw new DeskServiceError(
      'Los amenities seleccionados deben enviarse como una lista valida.',
      'api',
    );
  }

  if (payload.enabled !== undefined && typeof payload.enabled !== 'boolean') {
    throw new DeskServiceError(
      'El estado del escritorio debe ser verdadero o falso.',
      'api',
    );
  }
}

function validateAmenityPayloadTypes(payload: AmenityPayload) {
  if (payload.name !== undefined && typeof payload.name !== 'string') {
    throw new DeskServiceError('El nombre del amenity debe ser texto.', 'api');
  }
}

export async function getAvailableDesks({
  date,
  startTime,
  endTime,
  zone,
}: GetAvailableDesksParams): Promise<Desk[]> {
  const params = new URLSearchParams({
    date,
    startTime,
    endTime,
  });

  if (zone) {
    params.set('zone', zone);
  }

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
  validateDeskPayloadTypes(payload);

  return requestJson<Desk>('/desks', {
    method: 'POST',
    body: JSON.stringify(sanitizePayload(payload)),
  });
}

export function updateDesk(id: string, payload: DeskPayload) {
  validateDeskPayloadTypes(payload);

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

export function createAmenity(payload: AmenityPayload) {
  validateAmenityPayloadTypes(payload);

  return requestJson<DeskAmenity>('/amenities', {
    method: 'POST',
    body: JSON.stringify(sanitizeAmenityPayload(payload)),
  });
}

export function updateAmenity(id: string, payload: AmenityPayload) {
  validateAmenityPayloadTypes(payload);

  return requestJson<DeskAmenity>(`/amenities/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(sanitizeAmenityPayload(payload)),
  });
}

export function deleteAmenity(id: string) {
  return requestJson<void>(`/amenities/${id}`, {
    method: 'DELETE',
  });
}
