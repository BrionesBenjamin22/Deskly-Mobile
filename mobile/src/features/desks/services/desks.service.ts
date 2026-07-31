import { API_BASE_URL } from '../../../config/api';
import { authenticatedFetch } from '../../auth/services/authenticated-fetch';
import {
  Desk,
  DeskAmenity,
  DeskDescription,
  DeskZone,
  Locality,
  WorkArea,
} from '../types/desk.types';

type AvailableDeskResponse = {
  id: string;
  code: string;
  name?: string | null;
  peopleCapacity: number;
  descriptionId?: string | null;
  description?: Desk['description'] | null;
  areaId?: string | null;
  area?: Desk['area'] | null;
  zone?: Desk['zone'] | null;
  amenities: Desk['amenities'];
  status?: 'available' | 'unavailable';
  reservedSlots?: {
    startTime: string;
    endTime: string;
  }[];
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
  areaId?: string;
  localityId?: string;
};

export type DeskPayload = {
  name?: string;
  peopleCapacity?: number;
  descriptionId?: string;
  areaId?: string;
  zone?: DeskZone;
  amenityIds?: string[];
  enabled?: boolean;
};

export type AmenityPayload = {
  name?: string;
};

export type DeskDescriptionPayload = {
  name?: string;
  description?: string;
  peopleCapacity?: number;
};

export type LocalityPayload = {
  name?: string;
  active?: boolean;
};

export type WorkAreaPayload = {
  name?: string;
  description?: string;
  localityId?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  active?: boolean;
};

type ApiErrorBody = {
  error?: string;
  message?: string | string[];
};

const REQUEST_TIMEOUT_MS = 8000;
const DESK_ZONES: DeskZone[] = ['A', 'B', 'C'];
const AMENITY_NAME_PATTERN = /^(?=.*[A-Za-z])[A-Za-z0-9 ']+$/;

export class DeskServiceError extends Error {
  constructor(
    message: string,
    readonly causeType: 'network' | 'api' | 'unknown' = 'unknown',
  ) {
    super(message);
    this.name = 'DeskServiceError';
    Object.setPrototypeOf(this, DeskServiceError.prototype);
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
    const authorization = new Headers(init?.headers).get('Authorization');
    const accessToken = authorization?.replace(/^Bearer\s+/i, '');
    const requestInit = {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      signal: controller.signal,
    };
    response = await authenticatedFetch(
      `${API_BASE_URL}${path}`,
      accessToken,
      requestInit,
    );
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
    ...(desk.areaId ? { areaId: desk.areaId } : {}),
    ...(desk.area ? { area: desk.area } : {}),
    ...(desk.zone ? { zone: desk.zone } : {}),
    amenities: desk.amenities ?? [],
    enabled: true,
    status: desk.status ?? 'available',
    reservedSlots: desk.reservedSlots ?? [],
  };
}

function sanitizePayload(payload: DeskPayload): DeskPayload {
  return {
    ...(payload.name?.trim() ? { name: payload.name.trim() } : {}),
    ...(typeof payload.peopleCapacity === 'number' && payload.peopleCapacity >= 1
      ? { peopleCapacity: payload.peopleCapacity }
      : {}),
    ...(payload.descriptionId ? { descriptionId: payload.descriptionId } : {}),
    ...(payload.areaId ? { areaId: payload.areaId } : {}),
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

  if (payload.areaId !== undefined && typeof payload.areaId !== 'string') {
    throw new DeskServiceError('El area de trabajo seleccionada no es valida.', 'api');
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

  if (
    payload.name !== undefined &&
    payload.name.trim() &&
    !AMENITY_NAME_PATTERN.test(payload.name.trim())
  ) {
    throw new DeskServiceError(
      'Ingrese un nombre valido para el amenity.',
      'api',
    );
  }
}

export async function getAvailableDesks({
  date,
  startTime,
  endTime,
  zone,
  areaId,
  localityId,
}: GetAvailableDesksParams): Promise<Desk[]> {
  const params = new URLSearchParams({
    date,
    startTime,
    endTime,
  });

  if (zone) {
    params.set('zone', zone);
  }

  if (areaId) {
    params.set('areaId', areaId);
  }

  if (localityId) {
    params.set('localityId', localityId);
  }

  const body = await requestJson<GetAvailableDesksResponse>(
    `/desks/availability?${params}`,
  );

  return body.desks.map(mapAvailableDesk);
}

export function listLocalities() {
  return requestJson<Locality[]>('/localities');
}

export function createLocality(
  payload: LocalityPayload,
  accessToken?: string,
) {
  return requestJson<Locality>('/localities', {
    method: 'POST',
    headers: bearerHeaders(accessToken),
    body: JSON.stringify(payload),
  });
}

export function updateLocality(
  id: string,
  payload: LocalityPayload,
  accessToken?: string,
) {
  return requestJson<Locality>(`/localities/${id}`, {
    method: 'PATCH',
    headers: bearerHeaders(accessToken),
    body: JSON.stringify(payload),
  });
}

export function deleteLocality(id: string, accessToken?: string) {
  return requestJson<void>(`/localities/${id}`, {
    method: 'DELETE',
    headers: bearerHeaders(accessToken),
  });
}

export function listWorkAreas(localityId?: string) {
  const params = new URLSearchParams();

  if (localityId) {
    params.set('localityId', localityId);
  }

  const query = params.toString();

  return requestJson<WorkArea[]>(`/work-areas${query ? `?${query}` : ''}`);
}

export function createWorkArea(
  payload: WorkAreaPayload,
  accessToken?: string,
) {
  return requestJson<WorkArea>('/work-areas', {
    method: 'POST',
    headers: bearerHeaders(accessToken),
    body: JSON.stringify(payload),
  });
}

export function updateWorkArea(
  id: string,
  payload: WorkAreaPayload,
  accessToken?: string,
) {
  return requestJson<WorkArea>(`/work-areas/${id}`, {
    method: 'PATCH',
    headers: bearerHeaders(accessToken),
    body: JSON.stringify(payload),
  });
}

export function deleteWorkArea(id: string, accessToken?: string) {
  return requestJson<void>(`/work-areas/${id}`, {
    method: 'DELETE',
    headers: bearerHeaders(accessToken),
  });
}

export async function listAvailableWorkAreas(params: GetAvailableDesksParams) {
  const query = new URLSearchParams({
    date: params.date,
    startTime: params.startTime,
    endTime: params.endTime,
  });

  if (params.zone) query.set('zone', params.zone);
  if (params.areaId) query.set('areaId', params.areaId);
  if (params.localityId) query.set('localityId', params.localityId);

  const body = await requestJson<{ areas: WorkArea[] }>(
    `/work-areas/availability?${query}`,
  );

  return body.areas;
}

export async function listDesks(page = 1, limit = 9) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  return requestJson<ListDesksResponse>(`/desks?${params}`);
}

function bearerHeaders(accessToken?: string) {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
}

export function createDesk(payload: DeskPayload, accessToken?: string) {
  validateDeskPayloadTypes(payload);

  return requestJson<Desk>('/desks', {
    method: 'POST',
    headers: bearerHeaders(accessToken),
    body: JSON.stringify(sanitizePayload(payload)),
  });
}

export function updateDesk(
  id: string,
  payload: DeskPayload,
  accessToken?: string,
) {
  validateDeskPayloadTypes(payload);

  return requestJson<Desk>(`/desks/${id}`, {
    method: 'PATCH',
    headers: bearerHeaders(accessToken),
    body: JSON.stringify(sanitizePayload(payload)),
  });
}

export function deleteDesk(id: string, accessToken?: string) {
  return requestJson<void>(`/desks/${id}`, {
    method: 'DELETE',
    headers: bearerHeaders(accessToken),
  });
}

export function listDeskDescriptions() {
  return requestJson<DeskDescription[]>('/desk-descriptions');
}

export function createDeskDescription(
  payload: DeskDescriptionPayload,
  accessToken?: string,
) {
  return requestJson<DeskDescription>('/desk-descriptions', {
    method: 'POST',
    headers: bearerHeaders(accessToken),
    body: JSON.stringify(payload),
  });
}

export function updateDeskDescription(
  id: string,
  payload: DeskDescriptionPayload,
  accessToken?: string,
) {
  return requestJson<DeskDescription>(`/desk-descriptions/${id}`, {
    method: 'PATCH',
    headers: bearerHeaders(accessToken),
    body: JSON.stringify(payload),
  });
}

export function deleteDeskDescription(id: string, accessToken?: string) {
  return requestJson<void>(`/desk-descriptions/${id}`, {
    method: 'DELETE',
    headers: bearerHeaders(accessToken),
  });
}

export function listAmenities() {
  return requestJson<DeskAmenity[]>('/amenities');
}

export function createAmenity(payload: AmenityPayload, accessToken?: string) {
  validateAmenityPayloadTypes(payload);

  return requestJson<DeskAmenity>('/amenities', {
    method: 'POST',
    headers: bearerHeaders(accessToken),
    body: JSON.stringify(sanitizeAmenityPayload(payload)),
  });
}

export function updateAmenity(
  id: string,
  payload: AmenityPayload,
  accessToken?: string,
) {
  validateAmenityPayloadTypes(payload);

  return requestJson<DeskAmenity>(`/amenities/${id}`, {
    method: 'PATCH',
    headers: bearerHeaders(accessToken),
    body: JSON.stringify(sanitizeAmenityPayload(payload)),
  });
}

export function deleteAmenity(id: string, accessToken?: string) {
  return requestJson<void>(`/amenities/${id}`, {
    method: 'DELETE',
    headers: bearerHeaders(accessToken),
  });
}
