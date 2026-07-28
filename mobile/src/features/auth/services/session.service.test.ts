import * as SecureStore from 'expo-secure-store';

import { AuthServiceError, getCurrentUser } from './auth.service';
import {
  clearPersistedSession,
  persistSession,
  restorePersistedSession,
} from './session.service';

jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'device-only',
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  isAvailableAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

jest.mock('./auth.service', () => {
  const actual = jest.requireActual('./auth.service');
  return {
    ...actual,
    getCurrentUser: jest.fn(),
  };
});

const secureStore = jest.mocked(SecureStore);
const getCurrentUserMock = jest.mocked(getCurrentUser);

const session = {
  access_token: 'access-token',
  user: {
    id: 'user-1',
    email: 'member@example.com',
    username: 'member',
    role: 'MIEMBRO' as const,
    active: true,
    member: {
      id: 'member-1',
      fullName: 'Deskly Member',
      active: true,
    },
  },
};

describe('session.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    secureStore.isAvailableAsync.mockResolvedValue(true);
  });

  it('persiste unicamente el access token en el almacenamiento seguro', async () => {
    await persistSession(session);

    expect(secureStore.setItemAsync).toHaveBeenCalledWith(
      'deskly.session.access-token.v1',
      'access-token',
      { keychainAccessible: 'device-only' },
    );
  });

  it('restaura la identidad desde el backend sin persistir datos personales', async () => {
    secureStore.getItemAsync.mockResolvedValue('access-token');
    getCurrentUserMock.mockResolvedValue({
      user: {
        ...session.user,
        blockedUntil: null,
        member: {
          ...session.user.member!,
          dni: 12345678,
          phone: 1112345678,
        },
      },
    });

    await expect(restorePersistedSession()).resolves.toMatchObject(session);
    expect(getCurrentUserMock).toHaveBeenCalledWith('access-token');
  });

  it('elimina un token rechazado por el backend', async () => {
    secureStore.getItemAsync.mockResolvedValue('expired-token');
    getCurrentUserMock.mockRejectedValue(
      new AuthServiceError('Sesion vencida.', 'api'),
    );

    await expect(restorePersistedSession()).resolves.toBeNull();
    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith(
      'deskly.session.access-token.v1',
    );
  });

  it('conserva el token ante un fallo transitorio de red', async () => {
    secureStore.getItemAsync.mockResolvedValue('access-token');
    getCurrentUserMock.mockRejectedValue(
      new AuthServiceError('Sin conexion.', 'network'),
    );

    await expect(restorePersistedSession()).rejects.toMatchObject({
      causeType: 'network',
    });
    expect(secureStore.deleteItemAsync).not.toHaveBeenCalled();
  });

  it('elimina el token al cerrar o cambiar de cuenta', async () => {
    await clearPersistedSession();

    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith(
      'deskly.session.access-token.v1',
    );
  });

  it('no informa persistencia exitosa si SecureStore no esta disponible', async () => {
    secureStore.isAvailableAsync.mockResolvedValue(false);

    await expect(persistSession(session)).rejects.toMatchObject({
      name: 'SessionPersistenceError',
    });
    expect(secureStore.setItemAsync).not.toHaveBeenCalled();
  });
});
