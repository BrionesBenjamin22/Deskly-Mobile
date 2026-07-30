import { API_BASE_URL } from '../../../config/api';
import { authenticatedFetch } from '../../auth/services/authenticated-fetch';
import {
  Penalty,
  PenaltyListResponse,
  RegisterAbsencePayload,
} from '../types/penalty.types';

type ApiErrorBody = { error?: string; message?: string | string[] };

export class PenaltyServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PenaltyServiceError';
  }
}

function getErrorMessage(body: ApiErrorBody | null): string {
  if (body?.error) return body.error;
  if (Array.isArray(body?.message)) return body.message.join(' ');
  if (body?.message) return body.message;
  return 'Lo sentimos, no pudimos registrar la penalizacion. Revise los datos e intente nuevamente.';
}

export async function registerAbsence(
  accessToken: string,
  payload: RegisterAbsencePayload,
): Promise<Penalty> {
  let response: Response;
  try {
    response = await authenticatedFetch(
      `${API_BASE_URL}/penalties/absence`,
      accessToken,
      {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...payload, reason: payload.reason.trim() }),
      },
    );
  } catch {
    throw new PenaltyServiceError(
      'Lo sentimos, no pudimos conectar con Deskly. Verifique su conexion e intente nuevamente.',
    );
  }

  const body = (await response.json().catch(() => null)) as Penalty | ApiErrorBody | null;
  if (!response.ok) throw new PenaltyServiceError(getErrorMessage(body as ApiErrorBody | null));
  return body as Penalty;
}

export async function listCurrentUserPenalties(
  accessToken: string,
  page = 1,
  limit = 3,
): Promise<PenaltyListResponse> {
  let response: Response;
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    response = await authenticatedFetch(
      `${API_BASE_URL}/penalties/me?${params}`,
      accessToken,
    );
  } catch {
    throw new PenaltyServiceError(
      'Lo sentimos, no pudimos conectar con Deskly. Verifique su conexion e intente nuevamente.',
    );
  }

  const body = (await response.json().catch(() => null)) as
    | PenaltyListResponse
    | ApiErrorBody
    | null;
  if (!response.ok) {
    throw new PenaltyServiceError(getErrorMessage(body as ApiErrorBody | null));
  }
  return body as PenaltyListResponse;
}
