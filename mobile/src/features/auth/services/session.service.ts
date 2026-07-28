import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { LoginResponse } from '../types/auth.types';
import { AuthServiceError, getCurrentUser } from './auth.service';

const ACCESS_TOKEN_KEY = 'deskly.session.access-token.v1';

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
  if (!session.access_token.trim()) {
    throw new SessionPersistenceError('La sesion no contiene un token valido.');
  }

  if (!(await canUseSecureStore())) {
    return;
  }

  try {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, session.access_token, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
  } catch (error) {
    throw new SessionPersistenceError(
      'No fue posible guardar la sesion de forma segura.',
      { cause: error },
    );
  }
}

export async function clearPersistedSession(): Promise<void> {
  if (!(await canUseSecureStore())) {
    return;
  }

  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
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
  try {
    accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch (error) {
    throw new SessionPersistenceError(
      'No fue posible recuperar la sesion guardada.',
      { cause: error },
    );
  }

  if (!accessToken?.trim()) {
    return null;
  }

  try {
    const currentUser = await getCurrentUser(accessToken);
    return {
      access_token: accessToken,
      user: currentUser.user,
    };
  } catch (error) {
    if (
      (error instanceof AuthServiceError ||
        (error instanceof Error && error.name === 'AuthServiceError')) &&
      (error as AuthServiceError).causeType === 'api'
    ) {
      await clearPersistedSession();
      return null;
    }

    throw error;
  }
}
