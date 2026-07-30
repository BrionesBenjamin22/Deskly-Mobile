import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { LoginResponse } from '../types/auth.types';
import { API_BASE_URL } from '../../../config/api';
import {
  configureSessionPersistence,
  replaceRuntimeSession,
} from './session-runtime';

const ACCESS_TOKEN_KEY = 'deskly.session.access-token.v1';
const REFRESH_TOKEN_KEY = 'deskly.session.refresh-token.v1';

export class SessionPersistenceError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'SessionPersistenceError';
    Object.setPrototypeOf(this, SessionPersistenceError.prototype);
  }
}

async function canUseSecureStore(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    const isAvailable = await SecureStore.isAvailableAsync();
    if (!isAvailable) {
      throw new SessionPersistenceError(
        'El almacenamiento seguro no esta disponible en este dispositivo.',
      );
    }
    return true;
  } catch (error) {
    if (
      error instanceof SessionPersistenceError ||
      (error instanceof Error && error.name === 'SessionPersistenceError')
    ) {
      throw error;
    }
    throw new SessionPersistenceError(
      'No fue posible acceder al almacenamiento seguro.',
      { cause: error },
    );
  }
}

export async function persistSession(session: LoginResponse): Promise<void> {
  if (!session.access_token.trim() || !session.refresh_token.trim()) {
    throw new SessionPersistenceError('La sesion no contiene tokens validos.');
  }

  if (!(await canUseSecureStore())) {
    replaceRuntimeSession(session);
    return;
  }

  try {
    const options = {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    };
    await Promise.all([
      SecureStore.setItemAsync(
        ACCESS_TOKEN_KEY,
        session.access_token,
        options,
      ),
      SecureStore.setItemAsync(
        REFRESH_TOKEN_KEY,
        session.refresh_token,
        options,
      ),
    ]);
    replaceRuntimeSession(session);
  } catch (error) {
    throw new SessionPersistenceError(
      'No fue posible guardar la sesion de forma segura.',
      { cause: error },
    );
  }
}

export async function clearPersistedSession(): Promise<void> {
  if (!(await canUseSecureStore())) {
    replaceRuntimeSession(null);
    return;
  }

  try {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
    replaceRuntimeSession(null);
  } catch (error) {
    throw new SessionPersistenceError(
      'No fue posible eliminar la sesion del dispositivo.',
      { cause: error },
    );
  }
}

export async function restorePersistedSession(): Promise<LoginResponse | null> {
  if (!(await canUseSecureStore())) {
    return null;
  }

  let accessToken: string | null;
  let refreshToken: string | null;
  try {
    [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    ]);
  } catch (error) {
    throw new SessionPersistenceError(
      'No fue posible recuperar la sesion guardada.',
      { cause: error },
    );
  }

  if (!accessToken?.trim() || !refreshToken?.trim()) {
    await clearPersistedSession();
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const session = (await response.json().catch(() => null)) as
      | LoginResponse
      | null;
    if (!response.ok || !session) {
      await clearPersistedSession();
      return null;
    }
    await persistSession(session);
    return session;
  } catch {
    throw new SessionPersistenceError(
      'No fue posible validar la sesion guardada.',
    );
  }
}

configureSessionPersistence(async (session) => {
  if (session) {
    await persistSession(session);
  } else {
    await clearPersistedSession();
  }
});
