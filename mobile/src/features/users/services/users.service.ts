import { API_BASE_URL } from '../../../config/api';
import { UserRole } from '../../auth/types/auth.types';
import { ManagedUser, ManagedUsersResponse } from '../types/managed-user.types';

type ApiErrorBody = { error?: string; message?: string | string[] };
type ManagedUserResponse = { user: ManagedUser };

export class UserManagementServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserManagementServiceError';
  }
}

function getErrorMessage(body: ApiErrorBody | null) {
  if (body?.error) return body.error;
  if (Array.isArray(body?.message)) return body.message.join(' ');
  if (body?.message) return body.message;
  return 'Lo sentimos, no pudimos completar la gestion del usuario. Intente nuevamente.';
}

async function request<T>(accessToken: string, path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      signal: controller.signal,
    });
    const body = (await response.json().catch(() => null)) as T | ApiErrorBody | null;
    if (!response.ok) throw new UserManagementServiceError(getErrorMessage(body as ApiErrorBody | null));
    return body as T;
  } catch (error) {
    if (error instanceof UserManagementServiceError) throw error;
    throw new UserManagementServiceError(
      'Lo sentimos, no pudimos conectar con Deskly. Verifique su conexion e intente nuevamente.',
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export function listUsers(accessToken: string, page = 1, search?: string) {
  const params = new URLSearchParams({ page: String(page), limit: '9' });
  if (search?.trim()) params.set('search', search.trim());
  return request<ManagedUsersResponse>(accessToken, `/users?${params}`);
}

export function updateUserRole(accessToken: string, userId: string, role: UserRole) {
  return request<ManagedUserResponse>(accessToken, `/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export function deactivateUser(accessToken: string, userId: string) {
  return request<ManagedUserResponse>(accessToken, `/users/${userId}`, {
    method: 'DELETE',
  });
}
