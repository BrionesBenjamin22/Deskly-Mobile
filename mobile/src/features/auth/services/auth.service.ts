import { API_BASE_URL } from '../../../config/api';
import {
  CurrentUserResponse,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  RegistrationStatusResponse,
  UpdateProfilePayload,
} from '../types/auth.types';

type ApiErrorBody = {
  error?: string;
  message?: string | string[];
  blockedUntil?: string;
  errorCode?: string;
};

const REQUEST_TIMEOUT_MS = 8000;

export class AuthServiceError extends Error {
  constructor(
    message: string,
    readonly causeType: 'network' | 'api' | 'unknown' = 'unknown',
  ) {
    super(message);
    this.name = 'AuthServiceError';
    Object.setPrototypeOf(this, AuthServiceError.prototype);
  }
}

export class BlockedAccountServiceError extends AuthServiceError {
  constructor(
    message: string,
    readonly blockedUntil: Date | null,
  ) {
    super(message, 'api');
    this.name = 'BlockedAccountServiceError';
    Object.setPrototypeOf(this, BlockedAccountServiceError.prototype);
  }
}

export class InactiveAccountServiceError extends AuthServiceError {
  constructor(message: string) {
    super(message, 'api');
    this.name = 'InactiveAccountServiceError';
    Object.setPrototypeOf(this, InactiveAccountServiceError.prototype);
  }
}

function getErrorMessage(body: ApiErrorBody | null) {
  if (body?.error) {
    return body.error;
  }

  if (Array.isArray(body?.message)) {
    return body.message.join(' ');
  }

  if (body?.message) {
    return body.message;
  }

  return 'Lo sentimos, no pudimos completar la solicitud. Revise los datos e intente nuevamente.';
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      signal: controller.signal,
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
    const body = (await response.json().catch(() => null)) as
      | T
      | ApiErrorBody
      | null;

    if (!response.ok) {
      const errorBody = body as ApiErrorBody | null;
      if (errorBody?.blockedUntil) {
        throw new BlockedAccountServiceError(
          getErrorMessage(errorBody),
          new Date(errorBody.blockedUntil),
        );
      }
      if (errorBody?.errorCode === 'ACCOUNT_INACTIVE') {
        throw new InactiveAccountServiceError(getErrorMessage(errorBody));
      }
      throw new AuthServiceError(getErrorMessage(errorBody), 'api');
    }

    return body as T;
  } catch (error) {
    if (error instanceof AuthServiceError) {
      throw error;
    }

    const isTimeout =
      error instanceof Error &&
      (error.name === 'AbortError' || error.message.includes('aborted'));

    throw new AuthServiceError(
      isTimeout
        ? 'Lo sentimos, la conexión está tardando más de lo esperado. Verifique el backend e intente nuevamente.'
        : 'Lo sentimos, no pudimos conectar con Deskly. Verifique su conexión e intente nuevamente.',
      'network',
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export function login(payload: LoginPayload) {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      identifier: payload.identifier.trim().toLowerCase(),
      password: payload.password,
    }),
  });
}

export function register(payload: RegisterPayload) {
  return request<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: payload.email.trim().toLowerCase(),
      username: payload.username.trim().toLowerCase(),
      password: payload.password,
      ...(payload.member
        ? {
            member: {
              fullName: payload.member.fullName.trim(),
              dni: payload.member.dni,
              phone: payload.member.phone,
            },
          }
        : {}),
    }),
  });
}

export function getRegistrationStatus() {
  return request<RegistrationStatusResponse>('/auth/registration-status');
}

export function getCurrentUser(accessToken: string) {
  return request<CurrentUserResponse>('/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function updateProfile(accessToken: string, payload: UpdateProfilePayload) {
  return request<CurrentUserResponse>('/auth/me', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      email: payload.email?.trim().toLowerCase(),
      username: payload.username?.trim().toLowerCase(),
      fullName: payload.fullName?.trim(),
      phone: payload.phone,
    }),
  });
}
