import { API_BASE_URL } from '../../../config/api';
import type { LoginResponse } from '../types/auth.types';
import {
  getRuntimeSession,
  updateRuntimeSession,
} from './session-runtime';

let refreshInFlight: Promise<LoginResponse> | null = null;

async function renewSession(): Promise<LoginResponse> {
  const refreshToken = getRuntimeSession()?.refresh_token;
  if (!refreshToken) {
    throw new Error('No refresh token is available.');
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const body = (await response.json().catch(() => null)) as
    | LoginResponse
    | null;

  if (!response.ok || !body?.access_token || !body.refresh_token) {
    await updateRuntimeSession(null);
    throw new Error('Session refresh was rejected.');
  }

  await updateRuntimeSession(body);
  return body;
}

function refreshOnce() {
  refreshInFlight ??= renewSession().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

export async function authenticatedFetch(
  input: RequestInfo | URL,
  accessToken?: string,
  init?: RequestInit,
) {
  const execute = (token?: string) =>
    fetch(input, {
      ...init,
      headers: {
        ...init?.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

  const currentToken =
    getRuntimeSession()?.access_token || accessToken;
  const response = await execute(currentToken);
  if (response.status !== 401 || !getRuntimeSession()?.refresh_token) {
    return response;
  }

  const renewed = await refreshOnce();
  return execute(renewed.access_token);
}
